<!-- 菜单设置：菜单树 CRUD、图标选择、点击标签自动刷新开关 -->
<script setup lang="ts">
defineOptions({ name: 'MenuManage' })

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useDebounceFn } from '@vueuse/core'
import { getMenuList, createMenu, updateMenu, deleteMenu, translateText } from '@/api/system'
import { buildTree, type TreeNode } from '@/utils/tree'
import { useI18n } from 'vue-i18n'
import { MENU_ICON_OPTIONS, SUPPORTED_LOCALES } from '@/constants'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type { Menu, MenuFormModel } from '@/types'

const { t, locale } = useI18n()

/** 除主语言（zh-CN）外的其他语言，用于自动翻译填充 */
const otherLocales = SUPPORTED_LOCALES.filter((l) => l.code !== 'zh-CN')

const loading = ref(false)
const menus = ref<TreeNode<Menu>[]>([])
const keyword = ref('')

const filteredMenus = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return menus.value
  const filterRec = (nodes: TreeNode<Menu>[]): TreeNode<Menu>[] =>
    nodes
      .map((n) => {
        const children = filterRec(n.children || [])
        if (n.title.toLowerCase().includes(kw) || (n.perms || '').toLowerCase().includes(kw)) {
          return { ...n, children: children.length ? children : n.children }
        }
        return children.length ? { ...n, children } : null
      })
      .filter((x): x is TreeNode<Menu> => x !== null)
  return filterRec(menus.value)
})

/** 表格列配置 */
const columns: TableColumn[] = [
  { prop: 'name', label: t('menuManage.name'), minWidth: 220 },
  {
    prop: 'type',
    label: t('menuManage.type'),
    width: 100,
    align: 'center',
    statusMap: {
      directory: { label: t('menuManage.typeDirectory'), type: 'warning' },
      menu: { label: t('menuManage.typeMenu'), type: 'primary' },
      button: { label: t('menuManage.typeButton'), type: 'info' },
    },
  },
  { prop: 'path', label: t('menuManage.path'), minWidth: 150, showOverflowTooltip: true },
  { prop: 'component', label: t('menuManage.component'), minWidth: 180, showOverflowTooltip: true },
  { prop: 'perms', label: t('menuManage.perms'), minWidth: 160, showOverflowTooltip: true },
  { prop: 'sort', label: t('menuManage.sort'), width: 70, align: 'center' },
  { prop: 'autoRefresh', label: t('menuManage.autoRefresh'), width: 130, align: 'center' },
  {
    prop: 'visible',
    label: t('common.status'),
    width: 90,
    align: 'center',
    statusMap: {
      true: { label: t('common.enabled'), type: 'success' },
      false: { label: t('common.disabled'), type: 'danger' },
    },
  },
  { prop: 'action', label: t('common.action'), width: 230, fixed: 'right', hideable: false },
]

/** 筛选面板配置 */
const filters: FilterField[] = [{ prop: 'keyword', label: t('menuManage.name'), type: 'input' }]

/** 搜索：按名称/权限标识本地过滤 */
function handleSearch(condition: Record<string, unknown>): void {
  keyword.value = (condition.keyword as string) || ''
}

/** 重置搜索 */
function handleReset(): void {
  keyword.value = ''
}

const defaultButtons = ['add', 'edit', 'delete', 'view']

const dialogVisible = ref(false)
const dialogMode = ref('create')
const saving = ref(false)
const refreshingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<MenuFormModel>({
  id: null,
  parentId: 0,
  type: 'menu',
  name: '',
  path: '',
  component: '',
  perms: '',
  icon: '',
  sort: 1,
  visible: true,
  autoRefresh: false,
  buttons: [],
  i18n: {},
})

const formRules: FormRules = {
  name: [{ required: true, message: () => t('menuManage.name'), trigger: 'blur' }],
  path: [
    {
      validator: (_rule, value, callback) => {
        if (form.type !== 'button' && !value) callback(new Error(t('menuManage.pathPlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  component: [
    {
      validator: (_rule, value, callback) => {
        if (form.type === 'menu' && !value)
          callback(new Error(t('menuManage.componentPlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  perms: [
    {
      validator: (_rule, value, callback) => {
        if (form.type !== 'directory' && !value)
          callback(new Error(t('menuManage.permsPlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

/** 加载菜单并构建树形结构 */
async function loadMenus(): Promise<void> {
  loading.value = true
  try {
    const res = await getMenuList()
    menus.value = buildTree(res.data)
  } finally {
    loading.value = false
  }
}

/** 生成上级菜单下拉选项（含缩进层级） */
function parentOptions(): Array<{ id: number; title: string; depth: number }> {
  const options: Array<{ id: number; title: string; depth: number }> = [
    { id: 0, title: t('menuManage.root'), depth: 0 },
  ]
  const walk = (nodes: TreeNode<Menu>[], depth = 0): void => {
    nodes.forEach((n) => {
      if (n.type !== 'button') {
        options.push({ id: n.id, title: `${'　'.repeat(depth)}${n.title}`, depth })
        walk(n.children || [], depth + 1)
      }
    })
  }
  walk(menus.value)
  return options
}

/** 打开新增弹窗 */
function openCreate(parentId = 0): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    parentId,
    type: parentId ? 'menu' : 'menu',
    name: '',
    path: '',
    component: '',
    perms: '',
    icon: '',
    sort: 1,
    visible: true,
    autoRefresh: false,
    buttons: [],
    i18n: {},
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗并回显表单 */
function openEdit(row: TreeNode<Menu>): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    parentId: row.parentId,
    type: row.type,
    name: row.name,
    path: row.path || '',
    component: row.component || '',
    perms: row.perms || '',
    icon: row.icon || '',
    sort: row.sort ?? 1,
    visible: !!row.visible,
    autoRefresh: !!row.autoRefresh,
    buttons: (row.buttons || []).map((b) => (b.perm ? b.perm.split(':').pop() : '')),
    i18n: row.i18n ? { ...row.i18n } : {},
  })
  dialogVisible.value = true
}

/** 多语言自动翻译（输入名称后防抖触发） */
const translating = ref(false)
const autoTranslate = useDebounceFn(async () => {
  const name = form.name.trim()
  if (!name) return
  const targets = otherLocales.map((l) => l.code)
  if (!targets.length) return
  translating.value = true
  try {
    const res = await translateText({ text: name, targets })
    targets.forEach((code) => {
      const value = res.data.translations[code]
      if (value) form.i18n[code] = value
    })
  } catch {
    // 翻译失败不阻塞编辑
  } finally {
    translating.value = false
  }
}, 600)

/** 手动触发自动翻译 */
function handleTranslate(): void {
  autoTranslate()
}

watch(
  () => form.name,
  () => autoTranslate(),
)

/** 提取按钮权限的基础前缀（去掉末位的 list/操作后缀） */
function permBase(): string {
  if (!form.perms) return ''
  const parts = form.perms.split(':')
  if (parts[parts.length - 1] === 'list') return parts.slice(0, -1).join(':')
  return parts.join(':')
}

/** 菜单类型切换：按钮类型清空路由/图标/按钮权限字段 */
function handleTypeChange(): void {
  if (form.type === 'button') {
    form.path = ''
    form.component = ''
    form.icon = ''
    form.buttons = []
  }
}

/** 保存菜单：构建 payload 并新增/更新 */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    const payload: Partial<Menu> = {
      id: form.id ?? undefined,
      parentId: form.parentId,
      type: form.type,
      name: form.name,
      path: form.path,
      component: form.component,
      perms: form.perms,
      icon: form.icon,
      sort: form.sort,
      visible: form.visible,
      autoRefresh: form.autoRefresh,
      i18n: { ...form.i18n, 'zh-CN': form.name },
    }
    if (payload.type === 'menu') {
      const base = permBase()
      payload.buttons = (form.buttons || [])
        .map((suffix) => ({ label: suffix, perm: base ? `${base}:${suffix}` : '' }))
        .filter((b) => b.perm)
    } else {
      payload.buttons = []
    }
    if (dialogMode.value === 'create') {
      await createMenu(payload)
    } else {
      await updateMenu(payload.id as number, { ...payload, id: payload.id as number })
    }
    ElMessage.success(t('menuManage.saveSuccess'))
    dialogVisible.value = false
    loadMenus()
  } finally {
    saving.value = false
  }
}

/** 删除菜单（含确认与子菜单校验） */
async function handleDelete(row: TreeNode<Menu>): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteMenu(row.id)
    ElMessage.success(t('common.success'))
    loadMenus()
  } catch {
    // 取消
  }
}

/** 内联切换“点击标签自动刷新”，即时保存 */
async function handleAutoRefreshChange(row: TreeNode<Menu>, value: boolean): Promise<void> {
  refreshingId.value = row.id
  const prev = row.autoRefresh
  // 先同步本地状态，让开关立即切换
  row.autoRefresh = value
  try {
    await updateMenu(row.id, { ...row, autoRefresh: value, children: undefined })
    ElMessage.success(t('menuManage.saveSuccess'))
    loadMenus()
  } catch {
    row.autoRefresh = prev
  } finally {
    refreshingId.value = null
  }
}

onMounted(loadMenus)
</script>

<template>
  <div class="app-container">
    <el-card class="page-card">
      <SmartTable
        :columns="columns"
        :data="filteredMenus"
        :filters="filters"
        :loading="loading"
        :paginated="false"
        exportable
        row-key="id"
        :tree-props="{ children: 'children' }"
        default-expand-all
        @search="handleSearch"
        @reset="handleReset"
      >
        <template #toolbar>
          <el-button v-permission="['system:menu:add']" type="primary" @click="openCreate()">
            <el-icon><Plus /></el-icon>
            {{ $t('common.add') }}
          </el-button>
        </template>

        <template #col-name="{ row }">
          <span class="menu-name">
            <el-icon v-if="row.icon" class="menu-icon"><component :is="row.icon" /></el-icon>
            {{ row.i18n?.[locale] || (row.i18nKey ? t(row.i18nKey) : '') || row.title }}
          </span>
        </template>

        <template #col-autoRefresh="{ row }">
          <el-switch
            v-if="row.type === 'menu'"
            :model-value="!!row.autoRefresh"
            :loading="refreshingId === row.id"
            @change="handleAutoRefreshChange(row, $event)"
          />
          <span v-else>-</span>
        </template>

        <template #col-action="{ row }">
          <template v-if="row.type !== 'button'">
            <el-button
              v-permission="['system:menu:add']"
              size="small"
              type="primary"
              link
              @click="openCreate(row.id)"
            >
              {{ $t('menuManage.addChild') }}
            </el-button>
          </template>
          <el-button
            v-permission="['system:menu:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['system:menu:delete']"
            size="small"
            type="danger"
            link
            @click="handleDelete(row)"
          >
            {{ $t('common.delete') }}
          </el-button>
        </template>
      </SmartTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? $t('common.add') : $t('common.edit')"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('menuManage.parent')">
              <el-select v-model="form.parentId" style="width: 100%">
                <el-option
                  v-for="opt in parentOptions()"
                  :key="opt.id"
                  :label="opt.title"
                  :value="opt.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menuManage.type')">
              <el-select v-model="form.type" style="width: 100%" @change="handleTypeChange">
                <el-option :label="$t('menuManage.typeDirectory')" value="directory" />
                <el-option :label="$t('menuManage.typeMenu')" value="menu" />
                <el-option :label="$t('menuManage.typeButton')" value="button" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('menuManage.name')" prop="name">
          <div class="name-row">
            <el-input v-model="form.name" :placeholder="$t('menuManage.name')" />
            <el-button
              v-if="form.type !== 'button'"
              :loading="translating"
              @click="handleTranslate"
            >
              <el-icon><MagicStick /></el-icon>
              {{ $t('menuManage.translate') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item v-if="form.type !== 'button'" :label="$t('menuManage.i18nName')">
          <div class="i18n-fields">
            <div v-for="lang in otherLocales" :key="lang.code" class="i18n-field">
              <span class="i18n-label">{{ $t(lang.labelKey) }}</span>
              <el-input v-model="form.i18n[lang.code]" :placeholder="$t(lang.labelKey)" />
            </div>
            <p class="i18n-tip">{{ $t('menuManage.translateTip') }}</p>
          </div>
        </el-form-item>

        <el-form-item v-if="form.type !== 'button'" :label="$t('menuManage.path')" prop="path">
          <el-input v-model="form.path" :placeholder="$t('menuManage.pathPlaceholder')" />
        </el-form-item>

        <el-form-item
          v-if="form.type === 'menu'"
          :label="$t('menuManage.component')"
          prop="component"
        >
          <el-input v-model="form.component" :placeholder="$t('menuManage.componentPlaceholder')" />
        </el-form-item>

        <el-form-item v-if="form.type !== 'directory'" :label="$t('menuManage.perms')" prop="perms">
          <el-input v-model="form.perms" :placeholder="$t('menuManage.permsPlaceholder')" />
        </el-form-item>

        <el-form-item v-if="form.type !== 'button'" :label="$t('menuManage.icon')">
          <el-select v-model="form.icon" style="width: 100%" clearable filterable>
            <el-option v-for="icon in MENU_ICON_OPTIONS" :key="icon" :label="icon" :value="icon">
              <span class="icon-option">
                <el-icon><component :is="icon" /></el-icon>
                <span>{{ icon }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('menuManage.sort')">
              <el-input-number v-model="form.sort" :min="1" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menuManage.visible')">
              <el-switch v-model="form.visible" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="form.type === 'menu'" :label="$t('menuManage.autoRefresh')">
          <div class="auto-refresh-wrap">
            <el-switch v-model="form.autoRefresh" />
            <p class="auto-refresh-tip">{{ $t('menuManage.autoRefreshTip') }}</p>
          </div>
        </el-form-item>

        <el-form-item v-if="form.type === 'menu'" :label="$t('menuManage.buttonPerms')">
          <div class="button-perm-wrap">
            <el-checkbox-group v-model="form.buttons">
              <el-checkbox
                v-for="suffix in defaultButtons"
                :key="suffix"
                :value="suffix"
                :label="suffix"
              >
                {{ $t(`common.${suffix}`) }}
              </el-checkbox>
            </el-checkbox-group>
            <p class="button-perm-tip">{{ $t('menuManage.buttonPermsTip') }}</p>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.menu-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.menu-icon {
  color: #2f7bfe;
}

.icon-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.button-perm-wrap {
  width: 100%;
}

.button-perm-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}

.auto-refresh-wrap {
  width: 100%;
}

.auto-refresh-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}

.name-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.i18n-fields {
  width: 100%;
}

.i18n-field {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .i18n-label {
    flex-shrink: 0;
    width: 80px;
    font-size: 13px;
    color: #606266;
  }
}

.i18n-tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}
</style>

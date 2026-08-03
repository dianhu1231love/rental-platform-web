<script setup>
defineOptions({ name: 'MenuManage' })

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMenuList, createMenu, updateMenu, deleteMenu } from '@/api/system'
import { buildTree } from '@/utils/tree'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loading = ref(false)
const menus = ref([])
const keyword = ref('')

const filteredMenus = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return menus.value
  const filterRec = (nodes) =>
    nodes
      .map((n) => {
        const children = filterRec(n.children || [])
        if (n.title.toLowerCase().includes(kw) || (n.perms || '').toLowerCase().includes(kw)) {
          return { ...n, children: children.length ? children : n.children }
        }
        return children.length ? { ...n, children } : null
      })
      .filter(Boolean)
  return filterRec(menus.value)
})

const iconOptions = [
  'HomeFilled',
  'Odometer',
  'Setting',
  'User',
  'Menu',
  'OfficeBuilding',
  'DataAnalysis',
  'Money',
  'Coin',
  'Wallet',
  'Document',
  'Tickets',
  'CreditCard',
  'TrendCharts',
  'Files',
  'Grid',
  'Histogram',
  'Monitor',
  'List',
  'Operation',
  'Tools'
]

const defaultButtons = ['add', 'edit', 'delete', 'view']

const dialogVisible = ref(false)
const dialogMode = ref('create')
const saving = ref(false)
const refreshingId = ref(null)
const formRef = ref()

const form = reactive({
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
  buttons: []
})

const formRules = {
  name: [{ required: true, message: () => t('menuManage.name'), trigger: 'blur' }],
  path: [
    {
      validator: (_rule, value, callback) => {
        if (form.type !== 'button' && !value) callback(new Error(t('menuManage.pathPlaceholder')))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  component: [
    {
      validator: (_rule, value, callback) => {
        if (form.type === 'menu' && !value) callback(new Error(t('menuManage.componentPlaceholder')))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  perms: [
    {
      validator: (_rule, value, callback) => {
        if (form.type !== 'directory' && !value) callback(new Error(t('menuManage.permsPlaceholder')))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

async function loadMenus() {
  loading.value = true
  try {
    const res = await getMenuList()
    menus.value = buildTree(res.data)
  } finally {
    loading.value = false
  }
}

function parentOptions() {
  const options = [{ id: 0, title: t('menuManage.root') }]
  const walk = (nodes, depth = 0) => {
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

function openCreate(parentId = 0) {
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
    buttons: []
  })
  dialogVisible.value = true
}

function openEdit(row) {
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
    buttons: (row.buttons || []).map((b) => (b.perm ? b.perm.split(':').pop() : ''))
  })
  dialogVisible.value = true
}

function permBase() {
  if (!form.perms) return ''
  const parts = form.perms.split(':')
  if (parts[parts.length - 1] === 'list') return parts.slice(0, -1).join(':')
  return parts.join(':')
}

function handleTypeChange() {
  if (form.type === 'button') {
    form.path = ''
    form.component = ''
    form.icon = ''
    form.buttons = []
  }
}

async function handleSave() {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.type === 'menu') {
      const base = permBase()
      payload.buttons = (payload.buttons || [])
        .map((suffix) => ({ label: suffix, perm: base ? `${base}:${suffix}` : '' }))
        .filter((b) => b.perm)
    } else {
      payload.buttons = []
    }
    if (dialogMode.value === 'create') {
      await createMenu(payload)
    } else {
      await updateMenu(payload.id, payload)
    }
    ElMessage.success(t('menuManage.saveSuccess'))
    dialogVisible.value = false
    loadMenus()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    await deleteMenu(row.id)
    ElMessage.success(t('common.success'))
    loadMenus()
  } catch {
    // 取消
  }
}

async function handleAutoRefreshChange(row, value) {
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

function typeTag(row) {
  if (row.type === 'directory') return { label: t('menuManage.typeDirectory'), type: 'warning' }
  if (row.type === 'menu') return { label: t('menuManage.typeMenu'), type: 'primary' }
  return { label: t('menuManage.typeButton'), type: 'info' }
}

onMounted(loadMenus)
</script>

<template>
  <div class="app-container">
    <el-card class="page-card">
      <div class="table-toolbar">
        <el-input
          v-model="keyword"
          :placeholder="$t('menuManage.name')"
          clearable
          style="width: 260px"
          :prefix-icon="'Search'"
        />
        <el-button type="primary" v-permission="['system:menu:add']" @click="openCreate()">
          <el-icon><Plus /></el-icon>{{ $t('common.add') }}
        </el-button>
      </div>

      <el-table
        :data="filteredMenus"
        v-loading="loading"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column :label="$t('menuManage.name')" min-width="220">
          <template #default="{ row }">
            <span class="menu-name">
              <el-icon v-if="row.icon" class="menu-icon"><component :is="row.icon" /></el-icon>
              {{ row.title }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('menuManage.type')" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTag(row).type" size="small">{{ typeTag(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('menuManage.path')" prop="path" min-width="150" show-overflow-tooltip />
        <el-table-column :label="$t('menuManage.component')" prop="component" min-width="180" show-overflow-tooltip />
        <el-table-column :label="$t('menuManage.perms')" prop="perms" min-width="160" show-overflow-tooltip />
        <el-table-column :label="$t('menuManage.sort')" prop="sort" width="70" align="center" />
        <el-table-column :label="$t('menuManage.autoRefresh')" width="130" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="row.type === 'menu'"
              :model-value="!!row.autoRefresh"
              :loading="refreshingId === row.id"
              @change="handleAutoRefreshChange(row, $event)"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.visible" type="success" size="small">{{ $t('common.enabled') }}</el-tag>
            <el-tag v-else type="danger" size="small">{{ $t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.action')" width="230" fixed="right">
          <template #default="{ row }">
            <template v-if="row.type !== 'button'">
              <el-button
                size="small"
                type="primary"
                link
                v-permission="['system:menu:add']"
                @click="openCreate(row.id)"
              >
                {{ $t('menuManage.addChild') }}
              </el-button>
            </template>
            <el-button
              size="small"
              type="primary"
              link
              v-permission="['system:menu:edit']"
              @click="openEdit(row)"
            >
              {{ $t('common.edit') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              v-permission="['system:menu:delete']"
              @click="handleDelete(row)"
            >
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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
          <el-input v-model="form.name" :placeholder="$t('menuManage.name')" />
        </el-form-item>

        <el-form-item v-if="form.type !== 'button'" :label="$t('menuManage.path')" prop="path">
          <el-input v-model="form.path" :placeholder="$t('menuManage.pathPlaceholder')" />
        </el-form-item>

        <el-form-item v-if="form.type === 'menu'" :label="$t('menuManage.component')" prop="component">
          <el-input v-model="form.component" :placeholder="$t('menuManage.componentPlaceholder')" />
        </el-form-item>

        <el-form-item v-if="form.type !== 'directory'" :label="$t('menuManage.perms')" prop="perms">
          <el-input v-model="form.perms" :placeholder="$t('menuManage.permsPlaceholder')" />
        </el-form-item>

        <el-form-item v-if="form.type !== 'button'" :label="$t('menuManage.icon')">
          <el-select v-model="form.icon" style="width: 100%" clearable filterable>
            <el-option v-for="icon in iconOptions" :key="icon" :label="icon" :value="icon">
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
</style>

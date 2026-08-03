<!-- 权限设置：角色 CRUD + 菜单/按钮权限分配 -->
<script setup lang="ts">
defineOptions({ name: 'RoleManage' })

import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, ElTree, type FormInstance, type FormRules } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole, getMenuList } from '@/api/system'
import { buildTree, type TreeNode } from '@/utils/tree'
import { useI18n } from 'vue-i18n'
import type { Menu, Role, RoleFormModel } from '@/types'

const { t } = useI18n()

const loading = ref(false)
const roles = ref<Role[]>([])
const keyword = ref('')

const filteredRoles = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return roles.value
  return roles.value.filter(
    (r) => r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw),
  )
})

// 权限分配抽屉
const drawerVisible = ref(false)
const drawerMode = ref('create')
const saving = ref(false)
const menuTree = ref<TreeNode<Menu>[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()
const buttonChecked = reactive<Record<string, string[]>>({})

const roleFormRef = ref<FormInstance>()

const roleForm = reactive<RoleFormModel>({
  id: null,
  name: '',
  code: '',
  status: 1,
  remark: '',
  menuIds: [],
  perms: [],
})

const roleRules: FormRules = {
  name: [{ required: true, message: () => t('role.namePlaceholder'), trigger: 'blur' }],
  code: [{ required: true, message: () => t('role.codePlaceholder'), trigger: 'blur' }],
}

/** 按钮权限标识 → 中文文案（取冒号后一段） */
function buttonLabel(perm: string): string {
  const suffix = perm.split(':').pop()
  return t(`common.${suffix}`) || perm
}

/** 加载角色列表 */
async function loadRoles(): Promise<void> {
  loading.value = true
  try {
    const res = await getRoleList()
    roles.value = res.data
  } finally {
    loading.value = false
  }
}

/** 加载菜单树（用于权限分配） */
async function loadMenus(): Promise<void> {
  const res = await getMenuList()
  menuTree.value = buildTree(res.data)
}

/** 打开新增角色抽屉 */
function openCreate(): void {
  drawerMode.value = 'create'
  Object.assign(roleForm, {
    id: null,
    name: '',
    code: '',
    status: 1,
    remark: '',
    menuIds: [],
    perms: [],
  })
  for (const key of Object.keys(buttonChecked)) delete buttonChecked[key]
  drawerVisible.value = true
  // 新增角色：清空权限树勾选
  nextTick(() => {
    treeRef.value?.setCheckedKeys([])
  })
}

/** 打开编辑抽屉并回显权限 */
function openEdit(role: Role): void {
  drawerMode.value = 'edit'
  Object.assign(roleForm, {
    id: role.id,
    name: role.name,
    code: role.code,
    status: role.status,
    remark: role.remark,
    menuIds: [...(role.menuIds || [])],
    perms: [...(role.perms || [])],
  })
  // 回显按钮权限
  for (const key of Object.keys(buttonChecked)) delete buttonChecked[key]
  const menus: TreeNode<Menu>[] = []
  const collect = (nodes: TreeNode<Menu>[]): void => {
    nodes.forEach((n) => {
      menus.push(n)
      collect(n.children || [])
    })
  }
  collect(menuTree.value)
  const menuPerms = new Set(roleForm.perms)
  // 管理员持有通配权限 *:*:*，等价于全部按钮权限已勾选
  const isAdmin = menuPerms.has('*:*:*')
  menus.forEach((m) => {
    const buttons = m.buttons || []
    const checked = isAdmin
      ? buttons.map((b) => b.perm)
      : buttons.filter((b) => menuPerms.has(b.perm)).map((b) => b.perm)
    if (checked.length) buttonChecked[m.id] = checked
  })
  drawerVisible.value = true
  // 抽屉内容挂载后回显菜单勾选，避免打开时整棵树处于未勾选状态
  nextTick(() => {
    treeRef.value?.setCheckedKeys(roleForm.menuIds)
  })
}

/** 收集权限树勾选的菜单 id（含半选父级） */
function collectTreeIds(): number[] {
  if (!treeRef.value) return []
  const checked = treeRef.value.getCheckedKeys().map(Number)
  const half = treeRef.value.getHalfCheckedKeys().map(Number)
  return [...new Set([...checked, ...half])]
}

/** 汇总勾选菜单与按钮生成的权限标识 */
function collectPerms(): string[] {
  const perms = new Set<string>()
  const walk = (nodes: TreeNode<Menu>[]): void => {
    nodes.forEach((n) => {
      if (roleForm.menuIds.includes(n.id)) {
        if (n.perms) perms.add(n.perms)
        const buttons = buttonChecked[n.id] || []
        buttons.forEach((p) => perms.add(p))
      }
      walk(n.children || [])
    })
  }
  walk(menuTree.value)
  return [...perms]
}

/** 保存角色：管理员保留通配权限，其余按勾选生成 */
async function handleSave(): Promise<void> {
  if (!roleFormRef.value) return
  await roleFormRef.value.validate()
  saving.value = true
  try {
    roleForm.menuIds = collectTreeIds()
    // 超级管理员保留全部权限
    if (roleForm.code === 'admin' || roleForm.perms.includes('*:*:*')) {
      roleForm.perms = ['*:*:*']
    } else {
      roleForm.perms = collectPerms()
    }
    if (drawerMode.value === 'create') {
      await createRole({ ...roleForm, id: undefined })
    } else {
      await updateRole(roleForm.id as number, { ...roleForm, id: roleForm.id as number })
    }
    ElMessage.success(t('common.success'))
    drawerVisible.value = false
    loadRoles()
  } finally {
    saving.value = false
  }
}

/** 启停角色（失败时回滚开关状态） */
async function handleToggleStatus(role: Role): Promise<void> {
  try {
    await updateRole(role.id, { status: role.status })
    ElMessage.success(t('common.success'))
  } catch {
    role.status = role.status === 1 ? 0 : 1
  }
}

/** 删除角色（内置管理员不可删除） */
async function handleDelete(role: Role): Promise<void> {
  if (role.id === 1) {
    ElMessage.warning('内置管理员角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteRole(role.id)
    ElMessage.success(t('common.success'))
    loadRoles()
  } catch {
    // 取消
  }
}

onMounted(async () => {
  await Promise.all([loadRoles(), loadMenus()])
})
</script>

<template>
  <div class="app-container">
    <el-card class="page-card">
      <div class="table-toolbar">
        <el-input
          v-model="keyword"
          :placeholder="$t('role.namePlaceholder')"
          clearable
          style="width: 260px"
          :prefix-icon="'Search'"
        />
        <el-button v-permission="['system:role:add']" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          {{ $t('common.add') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="filteredRoles" border stripe>
        <el-table-column :label="$t('role.name')" prop="name" min-width="140" />
        <el-table-column :label="$t('role.code')" prop="code" min-width="110" />
        <el-table-column :label="$t('role.permissionScope')" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.perms.includes('*:*:*')" type="success">
              {{ $t('role.allPermissions') }}
            </el-tag>
            <el-tag v-else type="info">
              {{ $t('role.customPermissions') }} ({{ row.menuIds.length }})
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="90">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              v-permission="['system:role:edit']"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
            <el-tag v-if="row.status === 1" type="success" size="small">
              {{ $t('common.enabled') }}
            </el-tag>
            <el-tag v-else type="danger" size="small">{{ $t('common.disabled') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.remark')"
          prop="remark"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column :label="$t('common.createdAt')" prop="createdAt" width="170" />
        <el-table-column :label="$t('common.action')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="['system:role:edit']"
              size="small"
              type="primary"
              link
              @click="openEdit(row)"
            >
              {{ $t('role.assignPermission') }}
            </el-button>
            <el-button
              v-permission="['system:role:delete']"
              size="small"
              type="danger"
              link
              @click="handleDelete(row)"
            >
              {{ $t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerMode === 'create' ? $t('common.add') : $t('role.assignPermission')"
      size="520px"
      destroy-on-close
    >
      <el-alert
        :title="$t('role.assignTip')"
        type="info"
        :closable="false"
        show-icon
        class="assign-tip"
      />
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="90px"
        class="role-form"
      >
        <el-form-item :label="$t('role.name')" prop="name">
          <el-input v-model="roleForm.name" :placeholder="$t('role.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('role.code')" prop="code">
          <el-input v-model="roleForm.code" :placeholder="$t('role.codePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('common.status')">
          <el-switch v-model="roleForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="$t('common.remark')">
          <el-input v-model="roleForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <div class="tree-section">
        <p class="tree-title">{{ $t('role.menuTree') }}</p>
        <el-tree
          ref="treeRef"
          :data="menuTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ label: 'title', children: 'children' }"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span class="tree-label">{{ data.title }}</span>
              <span v-if="data.buttons && data.buttons.length" class="tree-buttons" @click.stop>
                <el-checkbox-group v-model="buttonChecked[data.id]" size="small">
                  <el-checkbox v-for="btn in data.buttons" :key="btn.perm" :value="btn.perm">
                    {{ buttonLabel(btn.perm) }}
                  </el-checkbox>
                </el-checkbox-group>
              </span>
            </span>
          </template>
        </el-tree>
      </div>

      <template #footer>
        <el-button @click="drawerVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.assign-tip {
  margin-bottom: 16px;
}

.role-form {
  margin-bottom: 8px;
}

.tree-section {
  border-top: 1px solid #ebeef5;
  padding-top: 14px;
}

.tree-title {
  margin: 0 0 10px;
  font-weight: 600;
  color: #303133;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.tree-label {
  min-width: 90px;
}

.tree-buttons {
  display: flex;
  align-items: center;
}
</style>

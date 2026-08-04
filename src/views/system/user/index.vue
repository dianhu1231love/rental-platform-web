<!-- 用户管理：分页搜索、CRUD、分配权限（角色）、分配租户 -->
<script setup lang="ts">
defineOptions({ name: 'UserManage' })

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  assignUserRole,
  assignUserTenant,
  createUser,
  deleteUser,
  getMenuList,
  getRoleList,
  getTenantList,
  getUserList,
  updateUser,
  updateUserStatus,
} from '@/api/system'
import { buildTree, type TreeNode } from '@/utils/tree'
import { isValidEmail, isValidPhone } from '@/utils/validate'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type { Menu, Role, SysUser, Tenant, UserFormModel } from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<SysUser[]>([])
const total = ref(0)
const roles = ref<Role[]>([])
const tenants = ref<Tenant[]>([])
const menuTree = ref<TreeNode<Menu>[]>([])

/** 分页参数（与 SmartTable 的 v-model 双向绑定） */
const query = reactive({
  page: 1,
  pageSize: 10,
})

/** 搜索条件（由 SmartTable 筛选面板驱动） */
const searchParams = reactive({
  keyword: '',
  roleId: '' as number | '',
  tenantId: '' as number | '',
  // 默认只查询未停用用户，管理员可通过状态筛选查看全部/已停用
  status: 1 as number | '',
})

/** 角色名称（id → 名称） */
function roleName(id: number): string {
  return roles.value.find((r) => r.id === id)?.name || '-'
}

/** 租户名称（id → 名称，null 表示平台级用户） */
function tenantName(id: number | null): string {
  if (id === null || id === undefined) return t('user.tenantNone')
  return tenants.value.find((tn) => tn.id === id)?.name || '-'
}

/** 角色标签颜色（内置角色区分色，其他角色用 info） */
const ROLE_TAG_TYPE: Record<number, 'danger' | 'warning' | 'primary'> = {
  1: 'danger',
  2: 'warning',
  3: 'primary',
}

/** 表格列配置（computed：语言切换时自动重建文案） */
const columns = computed<TableColumn[]>(() => [
  { prop: 'username', label: t('user.username'), width: 110 },
  { prop: 'name', label: t('user.name'), width: 120 },
  {
    prop: 'roleId',
    label: t('user.role'),
    width: 120,
    align: 'center',
    formatter: (_row, value) => roleName(value as number),
  },
  {
    prop: 'tenantId',
    label: t('user.tenant'),
    minWidth: 150,
    showOverflowTooltip: true,
    formatter: (_row, value) => tenantName(value as number | null),
  },
  { prop: 'phone', label: t('user.phone'), width: 125 },
  { prop: 'email', label: t('user.email'), minWidth: 150, showOverflowTooltip: true },
  {
    prop: 'status',
    label: t('common.status'),
    width: 90,
    align: 'center',
    statusMap: {
      1: { label: t('common.enabled'), type: 'success' },
      0: { label: t('common.disabled'), type: 'info' },
    },
  },
  { prop: 'remark', label: t('common.remark'), minWidth: 130, showOverflowTooltip: true },
  { prop: 'createdAt', label: t('common.createdAt'), width: 165 },
  { prop: 'action', label: t('common.action'), width: 220, fixed: 'right', hideable: false },
])

/** 筛选面板配置（角色/租户选项随数据加载后更新） */
const filters = computed<FilterField[]>(() => [
  { prop: 'keyword', label: t('user.usernamePlaceholder'), type: 'input' },
  {
    prop: 'roleId',
    label: t('user.role'),
    type: 'select',
    options: roles.value.map((r) => ({ label: r.name, value: r.id })),
  },
  {
    prop: 'tenantId',
    label: t('user.tenant'),
    type: 'select',
    options: tenants.value.map((tn) => ({ label: tn.name, value: tn.id })),
  },
  {
    prop: 'status',
    label: t('common.status'),
    type: 'select',
    options: [
      { label: t('common.enabled'), value: 1 },
      { label: t('common.disabled'), value: 0 },
    ],
  },
])

/** 按查询条件加载用户列表 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getUserList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: searchParams.keyword,
      roleId: searchParams.roleId,
      tenantId: searchParams.tenantId,
      status: searchParams.status,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

/** 搜索：同步筛选条件、回到第一页并刷新 */
function handleSearch(condition: Record<string, unknown>): void {
  searchParams.keyword = (condition.keyword as string) || ''
  searchParams.roleId = condition.roleId !== undefined ? (condition.roleId as number) : ''
  searchParams.tenantId = condition.tenantId !== undefined ? (condition.tenantId as number) : ''
  searchParams.status = condition.status !== undefined ? (condition.status as number) : ''
  query.page = 1
  loadList()
}

/** 重置搜索条件 */
function handleReset(): void {
  searchParams.keyword = ''
  searchParams.roleId = ''
  searchParams.tenantId = ''
  searchParams.status = 1
  query.page = 1
  loadList()
}

// ---------- 新增/编辑弹窗 ----------
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

const form = reactive<UserFormModel>({
  id: null,
  username: '',
  password: '',
  name: '',
  phone: '',
  email: '',
  roleId: null,
  tenantId: null,
  status: 1,
  remark: '',
})

const formRules: FormRules = {
  username: [{ required: true, message: () => t('user.usernamePlaceholder'), trigger: 'blur' }],
  name: [{ required: true, message: () => t('user.namePlaceholder'), trigger: 'blur' }],
  phone: [
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidPhone(value)) callback(new Error(t('user.phonePlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidEmail(value)) callback(new Error(t('user.emailPlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  roleId: [{ required: true, message: () => t('user.rolePlaceholder'), trigger: 'change' }],
}

/** 打开新增弹窗 */
function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    username: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    roleId: null,
    tenantId: null,
    status: 1,
    remark: '',
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗并回显（密码留空表示不修改） */
function openEdit(row: SysUser): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    username: row.username,
    password: '',
    name: row.name,
    phone: row.phone,
    email: row.email,
    roleId: row.roleId,
    tenantId: row.tenantId,
    status: row.status,
    remark: row.remark,
  })
  dialogVisible.value = true
}

/** 保存用户（新增/编辑） */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = {
      username: form.username,
      password: form.password,
      name: form.name,
      phone: form.phone,
      email: form.email,
      roleId: form.roleId as number,
      tenantId: form.tenantId,
      status: form.status,
      remark: form.remark,
    }
    if (dialogMode.value === 'create') {
      await createUser(payload)
    } else {
      await updateUser(form.id as number, payload)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

/** 停用/启用用户（含确认；停用后无法登录系统） */
async function handleToggleStatus(row: SysUser): Promise<void> {
  const disabling = row.status === 1
  try {
    await ElMessageBox.confirm(
      disabling ? t('user.disableConfirm') : t('user.enableConfirm'),
      t('common.confirmTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      },
    )
    await updateUserStatus(row.id, disabling ? 0 : 1)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消或失败
  }
}

/** 删除用户（含确认） */
async function handleDelete(row: SysUser): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteUser(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消
  }
}

// ---------- 分配权限（角色）弹窗 ----------
const assignVisible = ref(false)
const assignSaving = ref(false)
const assignTarget = ref<SysUser | null>(null)
const assignRoleId = ref<number | null>(null)

/** 打开分配权限弹窗（回显当前角色） */
function openAssignPermission(row: SysUser): void {
  assignTarget.value = row
  assignRoleId.value = row.roleId
  assignVisible.value = true
}

/** 按所选角色裁剪出权限预览树（含菜单与按钮权限） */
const roleMenuTree = computed<TreeNode<Menu>[]>(() => {
  const roleId = assignRoleId.value
  if (!roleId) return []
  const role = roles.value.find((r) => r.id === roleId)
  if (!role) return []
  const ids = new Set(role.menuIds || [])
  const perms = new Set(role.perms || [])
  const isAdmin = perms.has('*:*:*')
  const prune = (nodes: TreeNode<Menu>[]): TreeNode<Menu>[] =>
    nodes
      .filter((n) => ids.has(n.id))
      .map((n) => ({
        ...n,
        buttons: isAdmin ? n.buttons || [] : (n.buttons || []).filter((b) => perms.has(b.perm)),
        children: prune(n.children || []),
      }))
      .filter((n) => n.type !== 'button' && (n.type !== 'directory' || n.children.length > 0))
  return prune(menuTree.value)
})

/** 保存角色分配 */
async function handleAssignRole(): Promise<void> {
  if (!assignTarget.value || !assignRoleId.value) return
  assignSaving.value = true
  try {
    await assignUserRole(assignTarget.value.id, assignRoleId.value)
    ElMessage.success(t('common.success'))
    assignVisible.value = false
    loadList()
  } finally {
    assignSaving.value = false
  }
}

// ---------- 分配租户弹窗 ----------
const tenantAssignVisible = ref(false)
const tenantAssignSaving = ref(false)
const tenantAssignTarget = ref<SysUser | null>(null)
const tenantAssignId = ref<number | null>(null)

/** 打开分配租户弹窗（回显当前租户） */
function openAssignTenant(row: SysUser): void {
  tenantAssignTarget.value = row
  tenantAssignId.value = row.tenantId
  tenantAssignVisible.value = true
}

/** 保存租户分配（null 表示平台级） */
async function handleAssignTenant(): Promise<void> {
  if (!tenantAssignTarget.value) return
  tenantAssignSaving.value = true
  try {
    await assignUserTenant(tenantAssignTarget.value.id, tenantAssignId.value)
    ElMessage.success(t('common.success'))
    tenantAssignVisible.value = false
    loadList()
  } finally {
    tenantAssignSaving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadList(),
    getRoleList().then((res) => {
      roles.value = res.data
    }),
    getTenantList({ page: 1, pageSize: 100 }).then((res) => {
      tenants.value = res.data.list
    }),
    getMenuList().then((res) => {
      menuTree.value = buildTree(res.data)
    }),
  ])
})
</script>

<template>
  <div class="app-container">
    <el-card class="page-card">
      <SmartTable
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        :columns="columns"
        :data="list"
        :filters="filters"
        :loading="loading"
        :total="total"
        paginated
        exportable
        export-name="用户列表"
        row-key="id"
        show-index
        @search="handleSearch"
        @reset="handleReset"
        @page-change="loadList"
      >
        <template #toolbar>
          <el-button v-permission="['system:user:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('user.add') }}
          </el-button>
        </template>

        <template #col-roleId="{ row }">
          <el-tag :type="ROLE_TAG_TYPE[row.roleId] || 'info'" size="small">
            {{ roleName(row.roleId) }}
          </el-tag>
        </template>

        <template #col-tenantId="{ row }">
          <span v-if="row.tenantId === null || row.tenantId === undefined">
            {{ $t('user.tenantNone') }}
          </span>
          <span v-else>{{ tenantName(row.tenantId) }}</span>
        </template>

        <template #col-action="{ row }">
          <el-button
            v-permission="['system:user:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['system:user:assign']"
            size="small"
            type="warning"
            link
            @click="openAssignPermission(row)"
          >
            {{ $t('user.assignPermission') }}
          </el-button>
          <el-button
            v-permission="['system:user:edit']"
            size="small"
            type="success"
            link
            @click="openAssignTenant(row)"
          >
            {{ $t('user.assignTenant') }}
          </el-button>
          <el-button
            v-permission="['system:user:edit']"
            size="small"
            :type="row.status === 1 ? 'warning' : 'success'"
            link
            @click="handleToggleStatus(row)"
          >
            {{ row.status === 1 ? $t('user.disable') : $t('user.enable') }}
          </el-button>
          <el-button
            v-permission="['system:user:delete']"
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

    <!-- 新增/编辑用户 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? $t('user.add') : $t('user.edit')"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('user.username')" prop="username">
              <el-input v-model="form.username" :placeholder="$t('user.usernamePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('user.name')" prop="name">
              <el-input v-model="form.name" :placeholder="$t('user.namePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('user.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="$t('user.passwordPlaceholder')"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('user.phone')" prop="phone">
              <el-input v-model="form.phone" :placeholder="$t('user.phonePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('user.email')" prop="email">
              <el-input v-model="form.email" :placeholder="$t('user.emailPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('user.role')" prop="roleId">
              <el-select
                v-model="form.roleId"
                style="width: 100%"
                :placeholder="$t('user.rolePlaceholder')"
              >
                <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('user.tenant')" prop="tenantId">
              <el-select
                v-model="form.tenantId"
                style="width: 100%"
                clearable
                :placeholder="$t('user.tenantPlaceholder')"
              >
                <el-option :label="$t('user.tenantNone')" :value="null" />
                <el-option v-for="tn in tenants" :key="tn.id" :label="tn.name" :value="tn.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('common.status')">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="$t('common.remark')">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            :placeholder="$t('common.remark')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配权限（角色） -->
    <el-dialog
      v-model="assignVisible"
      :title="$t('user.assignPermission')"
      width="560px"
      destroy-on-close
    >
      <el-alert :title="$t('user.assignPermissionTip')" type="info" :closable="false" show-icon />
      <el-form label-width="90px" class="assign-form">
        <el-form-item :label="$t('user.role')" prop="roleId">
          <el-select
            v-model="assignRoleId"
            style="width: 100%"
            :placeholder="$t('user.rolePlaceholder')"
          >
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-if="roleMenuTree.length" class="perm-preview">
        <div class="perm-preview-title">{{ $t('user.permissionPreview') }}</div>
        <el-tree
          :data="roleMenuTree"
          node-key="id"
          default-expand-all
          :props="{ label: 'title', children: 'children' }"
        >
          <template #default="{ data }">
            <span class="perm-node">
              {{ data.title }}
              <el-tag
                v-for="b in data.buttons || []"
                :key="b.perm"
                size="small"
                type="primary"
                effect="plain"
                class="perm-tag"
              >
                {{ b.label }}
              </el-tag>
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="assignSaving" @click="handleAssignRole">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配租户 -->
    <el-dialog
      v-model="tenantAssignVisible"
      :title="$t('user.assignTenant')"
      width="480px"
      destroy-on-close
    >
      <el-alert :title="$t('user.assignTenantTip')" type="info" :closable="false" show-icon />
      <el-form label-width="90px" class="assign-form">
        <el-form-item :label="$t('user.tenant')" prop="tenantId">
          <el-select
            v-model="tenantAssignId"
            style="width: 100%"
            :placeholder="$t('user.tenantPlaceholder')"
          >
            <el-option :label="$t('user.tenantNone')" :value="null" />
            <el-option v-for="tn in tenants" :key="tn.id" :label="tn.name" :value="tn.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tenantAssignVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="tenantAssignSaving" @click="handleAssignTenant">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.assign-form {
  margin-top: 14px;
}

.perm-preview {
  margin-top: 8px;
  padding: 12px;
  max-height: 300px;
  overflow: auto;
  border: 1px solid #e6eefb;
  border-radius: 6px;
  background: #fafcff;
}

.perm-preview-title {
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #606266;
}

.perm-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.perm-tag {
  margin-left: 2px;
}
</style>

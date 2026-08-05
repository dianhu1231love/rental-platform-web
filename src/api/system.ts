/**
 * 系统管理相关接口（角色 / 菜单 / 租户 / 用户）
 */
import request from '@/utils/request'
import type {
  Menu,
  PageResult,
  Role,
  SysUser,
  Tenant,
  TenantQuery,
  UserFormModel,
  UserQuery,
} from '@/types'

/** 获取角色列表 */
export function getRoleList() {
  return request.get<Role[]>('/system/roles')
}

/** 新增角色 */
export function createRole(data: Partial<Role>) {
  return request.post<Role>('/system/roles', data)
}

/** 更新角色 */
export function updateRole(id: string, data: Partial<Role>) {
  return request.put<Role>(`/system/roles/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: string) {
  return request.delete<null>(`/system/roles/${id}`)
}

/** 获取菜单列表（扁平结构，页面内再构建树） */
export function getMenuList() {
  return request.get<Menu[]>('/system/menus')
}

/** 新增菜单 */
export function createMenu(data: Partial<Menu>) {
  return request.post<Menu>('/system/menus', data)
}

/** 更新菜单 */
export function updateMenu(id: string, data: Partial<Menu>) {
  return request.put<Menu>(`/system/menus/${id}`, data)
}

/** 删除菜单 */
export function deleteMenu(id: string) {
  return request.delete<null>(`/system/menus/${id}`)
}

/** 分页查询租户 */
export function getTenantList(params: TenantQuery) {
  return request.get<PageResult<Tenant>>('/system/tenants', { params })
}

/** 新增租户 */
export function createTenant(data: Omit<Tenant, 'id'>) {
  return request.post<Tenant>('/system/tenants', data)
}

/** 更新租户 */
export function updateTenant(id: string, data: Partial<Tenant>) {
  return request.put<Tenant>(`/system/tenants/${id}`, data)
}

/** 删除租户 */
export function deleteTenant(id: string) {
  return request.delete<null>(`/system/tenants/${id}`)
}

/** 启停租户 */
export function updateTenantStatus(id: string, status: number) {
  return request.put<{ id: string; status: number }>(`/system/tenants/${id}/status`, {
    status,
  })
}

/** 分页查询用户 */
export function getUserList(params: UserQuery) {
  return request.get<PageResult<SysUser>>('/system/users', { params })
}

/** 新增用户 */
export function createUser(data: Omit<UserFormModel, 'id'>) {
  return request.post<SysUser>('/system/users', data)
}

/** 更新用户（密码留空表示不修改） */
export function updateUser(id: string, data: Partial<SysUser> & { password?: string }) {
  return request.put<SysUser>(`/system/users/${id}`, data)
}

/** 删除用户 */
export function deleteUser(id: string) {
  return request.delete<null>(`/system/users/${id}`)
}

/** 启停用户 */
export function updateUserStatus(id: string, status: number) {
  return request.put<{ id: string; status: number }>(`/system/users/${id}/status`, { status })
}

/** 为用户分配角色（角色决定菜单与按钮权限） */
export function assignUserRole(id: string, roleId: string) {
  return request.put<{ id: string; roleId: string }>(`/system/users/${id}/role`, { roleId })
}

/** 为用户分配租户（null 表示平台级用户） */
export function assignUserTenant(id: string, tenantId: string | null) {
  return request.put<{ id: string; tenantId: string | null }>(`/system/users/${id}/tenant`, {
    tenantId,
  })
}

/**
 * 多语言自动翻译
 * 演示环境由 Mock 字典返回；接入真实后端后可替换为百度/DeepL 等翻译服务
 */
export function translateText(data: { text: string; targets: string[] }) {
  return request.post<{ text: string; translations: Record<string, string> }>(
    '/system/translate',
    data,
  )
}

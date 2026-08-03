/**
 * 系统管理相关接口（角色 / 菜单 / 租户）
 */
import request from '@/utils/request'
import type { Menu, PageResult, Role, Tenant, TenantQuery } from '@/types'

/** 获取角色列表 */
export function getRoleList() {
  return request.get<Role[]>('/system/roles')
}

/** 新增角色 */
export function createRole(data: Partial<Role>) {
  return request.post<Role>('/system/roles', data)
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<Role>) {
  return request.put<Role>(`/system/roles/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: number) {
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
export function updateMenu(id: number, data: Partial<Menu>) {
  return request.put<Menu>(`/system/menus/${id}`, data)
}

/** 删除菜单 */
export function deleteMenu(id: number) {
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
export function updateTenant(id: number, data: Partial<Tenant>) {
  return request.put<Tenant>(`/system/tenants/${id}`, data)
}

/** 删除租户 */
export function deleteTenant(id: number) {
  return request.delete<null>(`/system/tenants/${id}`)
}

/** 启停租户 */
export function updateTenantStatus(id: number, status: number) {
  return request.put<{ id: number; status: number }>(`/system/tenants/${id}/status`, {
    status,
  })
}

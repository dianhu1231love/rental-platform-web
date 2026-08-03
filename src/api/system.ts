import request from '@/utils/request'
import type { Menu, PageResult, Role, Tenant, TenantQuery } from '@/types'

export function getRoleList() {
  return request.get<Role[]>('/system/roles')
}

export function createRole(data: Partial<Role>) {
  return request.post<Role>('/system/roles', data)
}

export function updateRole(id: number, data: Partial<Role>) {
  return request.put<Role>(`/system/roles/${id}`, data)
}

export function deleteRole(id: number) {
  return request.delete<null>(`/system/roles/${id}`)
}

export function getMenuList() {
  return request.get<Menu[]>('/system/menus')
}

export function createMenu(data: Partial<Menu>) {
  return request.post<Menu>('/system/menus', data)
}

export function updateMenu(id: number, data: Partial<Menu>) {
  return request.put<Menu>(`/system/menus/${id}`, data)
}

export function deleteMenu(id: number) {
  return request.delete<null>(`/system/menus/${id}`)
}

export function getTenantList(params: TenantQuery) {
  return request.get<PageResult<Tenant>>('/system/tenants', { params })
}

export function createTenant(data: Omit<Tenant, 'id'>) {
  return request.post<Tenant>('/system/tenants', data)
}

export function updateTenant(id: number, data: Partial<Tenant>) {
  return request.put<Tenant>(`/system/tenants/${id}`, data)
}

export function deleteTenant(id: number) {
  return request.delete<null>(`/system/tenants/${id}`)
}

export function updateTenantStatus(id: number, status: number) {
  return request.put<{ id: number; status: number }>(`/system/tenants/${id}/status`, {
    status,
  })
}

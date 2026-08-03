import request from '@/utils/request'

export function getRoleList() {
  return request.get('/system/roles')
}

export function createRole(data) {
  return request.post('/system/roles', data)
}

export function updateRole(id, data) {
  return request.put(`/system/roles/${id}`, data)
}

export function deleteRole(id) {
  return request.delete(`/system/roles/${id}`)
}

export function getMenuList() {
  return request.get('/system/menus')
}

export function createMenu(data) {
  return request.post('/system/menus', data)
}

export function updateMenu(id, data) {
  return request.put(`/system/menus/${id}`, data)
}

export function deleteMenu(id) {
  return request.delete(`/system/menus/${id}`)
}

export function getTenantList(params) {
  return request.get('/system/tenants', { params })
}

export function createTenant(data) {
  return request.post('/system/tenants', data)
}

export function updateTenant(id, data) {
  return request.put(`/system/tenants/${id}`, data)
}

export function deleteTenant(id) {
  return request.delete(`/system/tenants/${id}`)
}

export function updateTenantStatus(id, status) {
  return request.put(`/system/tenants/${id}/status`, { status })
}

import request from '@/utils/request'

export function getDashboardStats() {
  return request.get('/dashboard/stats')
}

export function getPaymentTrend() {
  return request.get('/dashboard/trend')
}

export function getEquipmentBoard() {
  return request.get('/dashboard/equipment')
}

export function getHoursStat() {
  return request.get('/dashboard/hours')
}

export function getTodos() {
  return request.get('/dashboard/todos')
}

export function handleTodo(id, action) {
  return request.put(`/dashboard/todos/${id}`, { action })
}

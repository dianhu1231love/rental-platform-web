import request from '@/utils/request'
import type { DashboardStats, EquipmentBoard, HoursStat, PaymentTrend, TodoItem } from '@/types'

export function getDashboardStats() {
  return request.get<DashboardStats>('/dashboard/stats')
}

export function getPaymentTrend() {
  return request.get<PaymentTrend>('/dashboard/trend')
}

export function getEquipmentBoard() {
  return request.get<EquipmentBoard>('/dashboard/equipment')
}

export function getHoursStat() {
  return request.get<HoursStat>('/dashboard/hours')
}

export function getTodos() {
  return request.get<TodoItem[]>('/dashboard/todos')
}

export function handleTodo(id: number, action: 'approve' | 'reject') {
  return request.put(`/dashboard/todos/${id}`, { action })
}

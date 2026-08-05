/**
 * 数据看板相关接口
 */
import request from '@/utils/request'
import type { DashboardStats, EquipmentBoard, HoursStat, PaymentTrend, TodoItem } from '@/types'

/** 获取六大核心经营指标 */
export function getDashboardStats() {
  return request.get<DashboardStats>('/dashboard/stats')
}

/** 获取近六个月计划/实际回款趋势 */
export function getPaymentTrend() {
  return request.get<PaymentTrend>('/dashboard/trend')
}

/** 获取设备看板数据 */
export function getEquipmentBoard() {
  return request.get<EquipmentBoard>('/dashboard/equipment')
}

/** 获取设备工时统计 */
export function getHoursStat() {
  return request.get<HoursStat>('/dashboard/hours')
}

/** 获取待办事项列表 */
export function getTodos() {
  return request.get<TodoItem[]>('/dashboard/todos')
}

/** 处理待办（通过/驳回） */
export function handleTodo(id: string, action: 'approve' | 'reject') {
  return request.put(`/dashboard/todos/${id}`, { action })
}

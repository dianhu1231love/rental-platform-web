/**
 * 市场管理相关接口（客户等）
 */
import request from '@/utils/request'
import type { Customer, CustomerFormModel, CustomerQuery, PageResult } from '@/types'

/** 分页查询客户列表 */
export function getCustomerList(params: CustomerQuery) {
  return request.get<PageResult<Customer>>('/market/customers', { params })
}

/** 新增客户（客户编码由后端自动生成） */
export function createCustomer(data: Omit<CustomerFormModel, 'id'>) {
  return request.post<Customer>('/market/customers', data)
}

/** 更新客户 */
export function updateCustomer(id: number, data: Partial<Customer>) {
  return request.put<Customer>(`/market/customers/${id}`, data)
}

/** 删除客户 */
export function deleteCustomer(id: number) {
  return request.delete<null>(`/market/customers/${id}`)
}

/** 启停客户 */
export function updateCustomerStatus(id: number, status: number) {
  return request.put<{ id: number; status: number }>(`/market/customers/${id}/status`, {
    status,
  })
}

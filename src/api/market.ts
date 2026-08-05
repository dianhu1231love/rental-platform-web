/**
 * 市场管理相关接口（客户等）
 */
import request from '@/utils/request'
import type {
  Customer,
  CustomerFormModel,
  CustomerOption,
  CustomerQuery,
  PageResult,
} from '@/types'

/** 分页查询客户列表 */
export function getCustomerList(params: CustomerQuery) {
  return request.get<PageResult<Customer>>('/market/customers', { params })
}

/** 客户下拉选项（拜访记录新增时选择客户自动带出联系人与电话） */
export function getCustomerOptions() {
  return request.get<CustomerOption[]>('/market/customers/options')
}

/** 新增客户（客户编码由后端自动生成） */
export function createCustomer(data: Omit<CustomerFormModel, 'id'>) {
  return request.post<Customer>('/market/customers', data)
}

/** 更新客户 */
export function updateCustomer(id: string, data: Partial<Customer>) {
  return request.put<Customer>(`/market/customers/${id}`, data)
}

/** 删除客户 */
export function deleteCustomer(id: string) {
  return request.delete<null>(`/market/customers/${id}`)
}

/** 启停客户 */
export function updateCustomerStatus(id: string, status: number) {
  return request.put<{ id: string; status: number }>(`/market/customers/${id}/status`, {
    status,
  })
}

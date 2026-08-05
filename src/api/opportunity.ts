/**
 * 市场管理相关接口（商机管理）
 */
import request from '@/utils/request'
import type { Opportunity, OpportunityFormModel, OpportunityQuery, PageResult } from '@/types'

/** 分页查询商机列表 */
export function getOpportunityList(params: OpportunityQuery) {
  return request.get<PageResult<Opportunity>>('/market/opportunities', { params })
}

/** 新增商机（商机编号、创建人、创建时间由系统生成） */
export function createOpportunity(data: Omit<OpportunityFormModel, 'id' | 'code'>) {
  return request.post<Opportunity>('/market/opportunities', data)
}

/** 更新商机 */
export function updateOpportunity(id: string, data: Partial<Omit<OpportunityFormModel, 'code'>>) {
  return request.put<Opportunity>(`/market/opportunities/${id}`, data)
}

/** 删除商机 */
export function deleteOpportunity(id: string) {
  return request.delete<null>(`/market/opportunities/${id}`)
}

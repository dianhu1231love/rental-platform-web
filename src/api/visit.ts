/**
 * 市场管理相关接口（拜访记录等）
 */
import request from '@/utils/request'
import type { PageResult, VisitFormModel, VisitQuery, VisitRecord } from '@/types'

/** 分页查询拜访记录 */
export function getVisitList(params: VisitQuery) {
  return request.get<PageResult<VisitRecord>>('/market/visits', { params })
}

/** 新增拜访记录（商机编号、创建人、创建时间由系统生成/带出） */
export function createVisit(data: Omit<VisitFormModel, 'id'>) {
  return request.post<VisitRecord>('/market/visits', data)
}

/** 更新拜访记录（仅允许修改拜访结果与附件） */
export function updateVisit(id: string, data: Pick<VisitFormModel, 'visitResult' | 'attachments'>) {
  return request.put<VisitRecord>(`/market/visits/${id}`, data)
}

/** 删除拜访记录 */
export function deleteVisit(id: string) {
  return request.delete<null>(`/market/visits/${id}`)
}

/**
 * 设备管理相关接口（设备列表 / 品牌 / 产品组 / 产品型号 / 数据字典）
 */
import request from '@/utils/request'
import type {
  DictItem,
  EquipmentBrand,
  EquipmentGroup,
  EquipmentItem,
  EquipmentModel,
  PageResult,
} from '@/types'

export interface EquipmentQuery {
  page?: number
  pageSize?: number
  keyword?: string
  brandId?: number | ''
  status?: string
}

/** 分页查询设备列表 */
export function getEquipmentList(params: EquipmentQuery) {
  return request.get<PageResult<EquipmentItem>>('/equipment/list', { params })
}

/** 新增设备 */
export function createEquipment(data: Omit<EquipmentItem, 'id' | 'createdAt'>) {
  return request.post<EquipmentItem>('/equipment/list', data)
}

/** 更新设备 */
export function updateEquipment(id: number, data: Partial<EquipmentItem>) {
  return request.put<EquipmentItem>(`/equipment/list/${id}`, data)
}

/** 删除设备 */
export function deleteEquipment(id: number) {
  return request.delete<null>(`/equipment/list/${id}`)
}

/** 获取设备详情 */
export function getEquipmentDetail(id: number) {
  return request.get<EquipmentItem>(`/equipment/list/${id}`)
}

/** 获取设备位置（外部定位接口模拟） */
export function getEquipmentLocation(id: number) {
  return request.get<{ lng: number; lat: number; address: string }>(
    `/equipment/list/${id}/location`,
  )
}

/** 获取设备品牌列表 */
export function getBrandList() {
  return request.get<EquipmentBrand[]>('/equipment/brands')
}

/** 新增设备品牌 */
export function createBrand(data: Omit<EquipmentBrand, 'id' | 'createdAt' | 'code'>) {
  return request.post<EquipmentBrand>('/equipment/brands', data)
}

/** 更新设备品牌 */
export function updateBrand(id: number, data: Partial<Omit<EquipmentBrand, 'code'>>) {
  return request.put<EquipmentBrand>(`/equipment/brands/${id}`, data)
}

/** 删除设备品牌 */
export function deleteBrand(id: number) {
  return request.delete<null>(`/equipment/brands/${id}`)
}

/** 获取产品组列表 */
export function getGroupList() {
  return request.get<EquipmentGroup[]>('/equipment/groups')
}

/** 新增产品组 */
export function createGroup(data: Omit<EquipmentGroup, 'id' | 'createdAt' | 'code'>) {
  return request.post<EquipmentGroup>('/equipment/groups', data)
}

/** 更新产品组 */
export function updateGroup(id: number, data: Partial<Omit<EquipmentGroup, 'code'>>) {
  return request.put<EquipmentGroup>(`/equipment/groups/${id}`, data)
}

/** 删除产品组 */
export function deleteGroup(id: number) {
  return request.delete<null>(`/equipment/groups/${id}`)
}

/** 获取产品型号列表 */
export function getModelList() {
  return request.get<EquipmentModel[]>('/equipment/models')
}

/** 新增产品型号 */
export function createModel(data: Omit<EquipmentModel, 'id' | 'createdAt' | 'code'>) {
  return request.post<EquipmentModel>('/equipment/models', data)
}

/** 更新产品型号 */
export function updateModel(id: number, data: Partial<Omit<EquipmentModel, 'code'>>) {
  return request.put<EquipmentModel>(`/equipment/models/${id}`, data)
}

/** 删除产品型号 */
export function deleteModel(id: number) {
  return request.delete<null>(`/equipment/models/${id}`)
}

/** 按类型获取数据字典 */
export function getDictList(type: string) {
  return request.get<DictItem[]>('/system/dicts', { params: { type } })
}

/** 新增数据字典项（如自定义资产归属） */
export function createDictItem(data: { type: string; label: string }) {
  return request.post<DictItem>('/system/dicts', data)
}

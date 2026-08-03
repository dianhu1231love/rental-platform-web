// 接口统一响应结构
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

export interface PageResult<T> {
  list: T[]
  total: number
}

// 菜单与权限
export type MenuType = 'directory' | 'menu' | 'button'

export interface ButtonPerm {
  label: string
  perm: string
}

export interface Menu {
  id: number
  parentId: number
  type: MenuType
  name: string
  path: string
  component: string
  title: string
  i18nKey?: string
  icon?: string
  sort?: number
  visible?: boolean
  autoRefresh?: boolean
  perms?: string
  buttons?: ButtonPerm[]
  children?: Menu[]
}

export interface Role {
  id: number
  name: string
  code: string
  status: number
  remark: string
  createdAt: string
  menuIds: number[]
  perms: string[]
}

export interface UserInfo {
  name: string
  username: string
  avatar: string
  roles: string[]
  perms: string[]
  roleId: number | null
  menus: Menu[]
}

export interface LoginForm {
  username: string
  password: string
}

export interface SsoForm {
  username?: string
}

export interface ForgotForm {
  account: string
  code: string
}

// 租户
export interface Tenant {
  id: number
  name: string
  code: string
  contact: string
  phone: string
  plan: string
  expireAt: string
  status: number
  remark?: string
  createdAt?: string
}

export interface TenantQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number | ''
}

// 数据看板
export interface StatItem {
  value: number
  trend: number
}

export interface DashboardStats {
  totalRental: StatItem
  receivables: StatItem
  pendingDistribute: StatItem
  monthInvoicePending: StatItem
  monthDistribute: StatItem
  monthInvoice: StatItem
}

export interface StatCard {
  key: string
  icon: string
  color: string
  value: number
  unit: string
  trend: number
}

export interface PaymentTrend {
  months: string[]
  planned: number[]
  actual: number[]
}

export interface EquipmentCategory {
  name: string
  count: number
}

export interface EquipmentBoard {
  total: number
  renting: number
  idle: number
  maintenance: number
  occupancyRate: number
  onlineRate: number
  categories: EquipmentCategory[]
}

export interface HoursStat {
  categories: string[]
  plan: number[]
  actual: number[]
  utilization: number[]
}

export type TodoType = 'contract' | 'distribute' | 'invoice'
export type TodoPriority = 'high' | 'medium' | 'low'

export interface TodoItem {
  id: number
  type: TodoType
  title: string
  applicant: string
  time: string
  priority: TodoPriority
}

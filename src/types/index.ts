/**
 * 全局类型定义
 * 集中管理接口响应、业务实体与表单模型，保证前后端数据契约一致
 */

/** 接口统一响应结构 */
export interface ApiResponse<T = unknown> {
  /** 业务状态码，200 表示成功 */
  code: number
  /** 业务数据 */
  data: T
  /** 提示信息 */
  message: string
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
}

/** 菜单类型：目录 / 菜单 / 按钮 */
export type MenuType = 'directory' | 'menu' | 'button'

/** 按钮级权限 */
export interface ButtonPerm {
  label: string
  perm: string
}

/** 菜单节点（扁平数据；树形结构见 utils/tree 的 TreeNode） */
export interface Menu {
  id: number
  parentId: number
  type: MenuType
  /** 组件名，同时用于 keep-alive 缓存匹配 */
  name: string
  /** 路由地址 */
  path: string
  /** 组件路径，如 system/role/index */
  component: string
  title: string
  i18nKey?: string
  /** 多语言标题：语言代码 -> 译文（如 { 'zh-CN': '首页', 'en-US': 'Dashboard' }） */
  i18n?: Record<string, string>
  icon?: string
  sort?: number
  visible?: boolean
  /** 点击标签时是否自动刷新（开启则不缓存页面） */
  autoRefresh?: boolean
  perms?: string
  buttons?: ButtonPerm[]
  children?: Menu[]
}

/** 角色 */
export interface Role {
  id: number
  name: string
  code: string
  status: number
  remark: string
  createdAt: string
  /** 可见菜单 id 集合 */
  menuIds: number[]
  /** 按钮权限标识集合 */
  perms: string[]
}

/** 当前登录用户信息 */
export interface UserInfo {
  name: string
  username: string
  avatar: string
  phone?: string
  email?: string
  roles: string[]
  perms: string[]
  roleId: number | null
  menus: Menu[]
}

/** 账号密码登录参数 */
export interface LoginForm {
  username: string
  password: string
}

/** 密码登录表单（含“记住用户名”选项） */
export interface LoginFormModel {
  username: string
  password: string
  remember: boolean
}

/** SSO 登录参数 */
export interface SsoForm {
  username?: string
}

/** 找回账户表单 */
export interface ForgotFormModel {
  account: string
  code: string
}

/** 找回账户请求参数 */
export interface ForgotForm {
  account: string
  code: string
}

/** 角色编辑表单模型（权限分配抽屉） */
export interface RoleFormModel {
  id: number | null
  name: string
  code: string
  status: number
  remark: string
  menuIds: number[]
  perms: string[]
}

/** 租户新增/编辑表单模型 */
export interface TenantFormModel {
  id: number | null
  name: string
  code: string
  contact: string
  phone: string
  plan: string
  expireAt: string
  remark: string
  status: number
}

/** 菜单新增/编辑表单模型 */
export interface MenuFormModel {
  id: number | null
  parentId: number
  type: MenuType
  name: string
  path: string
  component: string
  perms: string
  icon: string
  sort: number
  visible: boolean
  autoRefresh: boolean
  buttons: string[]
  /** 多语言标题（各语言译文） */
  i18n: Record<string, string>
}

/** 租户 */
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

/** 租户分页查询参数 */
export interface TenantQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number | ''
}

/** 系统用户（用户管理） */
export interface SysUser {
  id: number
  /** 登录账号 */
  username: string
  /** 姓名 */
  name: string
  /** 手机号 */
  phone: string
  /** 邮箱 */
  email: string
  /** 头像地址 */
  avatar: string
  /** 角色 id（决定菜单与按钮权限） */
  roleId: number
  /** 关联租户 id，null 表示平台级用户 */
  tenantId: number | null
  /** 状态：1 启用 / 0 停用 */
  status: number
  /** 备注 */
  remark: string
  createdAt: string
}

/** 用户新增/编辑表单模型 */
export interface UserFormModel {
  id: number | null
  username: string
  /** 登录密码（编辑时留空表示不修改） */
  password: string
  name: string
  phone: string
  email: string
  roleId: number | null
  tenantId: number | null
  status: number
  remark: string
}

/** 用户分页查询参数 */
export interface UserQuery {
  page?: number
  pageSize?: number
  keyword?: string
  roleId?: number | ''
  tenantId?: number | ''
  status?: number | ''
}

/** 客户性质：个人 / 企业 */
export type CustomerType = 'individual' | 'enterprise'

/** 客户等级 */
export type CustomerLevel = 'key' | 'normal' | 'potential'

/** 客户来源 */
export type CustomerSource = 'referral' | 'exhibition' | 'online' | 'self'

/** 市场管理-客户 */
export interface Customer {
  id: number
  /** 客户编码（系统自动生成，全局唯一流水码） */
  code: string
  /** 客户名称 */
  name: string
  /** 客户性质 */
  type: CustomerType
  /** 社会信用代码（企业）/ 身份证号（个人） */
  idNumber: string
  /** SAP 编码 */
  sapCode: string
  /** 客户等级 */
  level: CustomerLevel
  /** 所属行业 */
  industry: string
  /** 客户来源 */
  source: CustomerSource
  /** 主要联系人 */
  contact: string
  /** 联系电话 */
  phone: string
  /** 邮箱 */
  email: string
  /** 联系地址 */
  address: string
  /** 开户银行 */
  bank: string
  /** 银行账号 */
  bankAccount: string
  /** 发票抬头 */
  invoiceTitle: string
  /** 状态：1 启用 / 0 停用 */
  status: number
  /** 是否进入黑名单：1 是 / 0 否（黑名单功能后续开发） */
  blacklisted: number
  /** 创建人 */
  creator: string
  createdAt: string
}

/** 客户新增/编辑表单模型 */
export interface CustomerFormModel {
  id: number | null
  name: string
  type: CustomerType
  idNumber: string
  sapCode: string
  level: CustomerLevel
  industry: string
  source: CustomerSource
  contact: string
  phone: string
  email: string
  address: string
  bank: string
  bankAccount: string
  invoiceTitle: string
  status: number
  blacklisted: number
}

/** 客户分页查询参数 */
export interface CustomerQuery {
  page?: number
  pageSize?: number
  keyword?: string
  type?: CustomerType | ''
  status?: number | ''
  blacklisted?: number | ''
}

/** 指标项（数值 + 环比） */
export interface StatItem {
  value: number
  trend: number
}

/** 六大核心经营指标 */
export interface DashboardStats {
  totalRental: StatItem
  receivables: StatItem
  pendingDistribute: StatItem
  monthInvoicePending: StatItem
  monthDistribute: StatItem
  monthInvoice: StatItem
}

/** 看板指标卡片渲染数据 */
export interface StatCard {
  key: string
  icon: string
  color: string
  value: number
  unit: string
  trend: number
}

/** 近六个月回款趋势 */
export interface PaymentTrend {
  months: string[]
  planned: number[]
  actual: number[]
}

/** 设备分类统计 */
export interface EquipmentCategory {
  name: string
  count: number
}

/** 设备看板数据 */
export interface EquipmentBoard {
  total: number
  renting: number
  idle: number
  maintenance: number
  occupancyRate: number
  onlineRate: number
  categories: EquipmentCategory[]
}

/** 设备工时统计 */
export interface HoursStat {
  categories: string[]
  plan: number[]
  actual: number[]
  utilization: number[]
}

/** 待办类型 */
export type TodoType = 'contract' | 'distribute' | 'invoice'
/** 待办优先级 */
export type TodoPriority = 'high' | 'medium' | 'low'

/** 待办事项 */
export interface TodoItem {
  id: number
  type: TodoType
  title: string
  applicant: string
  time: string
  priority: TodoPriority
}

/** 附件信息（证照/保险/随车备件清单等） */
export interface Attachment {
  name: string
  size: number
  type: string
}

/** 设备当前状态 */
export type EquipmentStatus = 'renting' | 'idle' | 'preparing' | 'maintenance'

/** 设备（整机） */
export interface EquipmentItem {
  id: number
  /** 整机编码 */
  code: string
  /** 品牌 id */
  brandId: number
  /** 产品型号 id */
  modelId: number
  /** 资产归属（来自数据字典，可自定义） */
  owner: string
  /** 设备是否完好（来自数据字典，如完好/不完好） */
  intact: string
  /** 采购金额 */
  purchaseAmount: number
  /** 当前状态 */
  status: EquipmentStatus
  /** 累计开票金额 */
  invoiceAmount: number
  /** 维保费用总价 */
  maintenanceCost: number
  /** 费用填报总价 */
  expenseTotal: number
  /** 证照附件 */
  certificates: Attachment[]
  /** 保险附件 */
  insurance: Attachment[]
  /** 随车备件清单附件 */
  spareParts: Attachment[]
  /** 备注 */
  remark: string
  createdAt: string
}

/** 设备品牌 */
export interface EquipmentBrand {
  id: number
  name: string
  remark: string
  createdAt: string
}

/** 产品组 */
export interface EquipmentGroup {
  id: number
  name: string
  remark: string
  createdAt: string
}

/** 产品型号 */
export interface EquipmentModel {
  id: number
  name: string
  /** 所属产品组 id */
  groupId: number
  remark: string
  createdAt: string
}

/** 数据字典项（如资产归属） */
export interface DictItem {
  id: number
  /** 字典类型 */
  type: string
  /** 字典标签 */
  label: string
}

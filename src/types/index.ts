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

/** 拜访记录附件（支持多文件上传与在线预览） */
export interface VisitAttachment extends Attachment {
  id: number
  /** 预览地址（Mock 下为 base64 Data URL，真实后端为文件访问地址） */
  url: string
  /** 本地上传时的临时标识（用于文件列表） */
  uid?: number
}

/** 拜访类型：现场拜访 / 电话拜访 */
export type VisitType = 'onsite' | 'phone'

/** 市场管理-拜访记录 */
export interface VisitRecord {
  id: number
  /** 商机编号（来自商机管理模块系统流水码，全局唯一，非必填；商机管理开发后自动带出） */
  opportunityCode: string
  /** 关联客户 id */
  customerId: number
  /** 客户名称 */
  customerName: string
  /** 拜访类型 */
  visitType: VisitType
  /** 拜访时间 */
  visitTime: string
  /** 拜访地点 */
  visitAddress: string
  /** 客户联系人（新增时选择客户自动带出） */
  contact: string
  /** 联系电话（新增时选择客户自动带出） */
  phone: string
  /** 工作要点（长文本） */
  workPoints: string
  /** 拜访结果（长文本，编辑时唯一可编辑字段之一） */
  visitResult: string
  /** 附件列表 */
  attachments: VisitAttachment[]
  /** 创建人 */
  creator: string
  createdAt: string
}

/** 拜访记录新增/编辑表单模型 */
export interface VisitFormModel {
  id: number | null
  opportunityCode: string
  customerId: number | null
  customerName: string
  visitType: VisitType
  visitTime: string
  visitAddress: string
  contact: string
  phone: string
  workPoints: string
  visitResult: string
  attachments: VisitAttachment[]
}

/** 拜访记录分页查询参数 */
export interface VisitQuery {
  page?: number
  pageSize?: number
  keyword?: string
  visitType?: VisitType | ''
  /** 拜访时间起（YYYY-MM-DD） */
  visitTimeStart?: string
  /** 拜访时间止（YYYY-MM-DD） */
  visitTimeEnd?: string
}

/** 客户下拉选项（拜访记录新增时自动带出联系人与电话） */
export interface CustomerOption {
  id: number
  name: string
  contact: string
  phone: string
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
  /** 品牌编码（系统生成，全局唯一） */
  code: string
  name: string
  remark: string
  createdAt: string
}

/** 产品组 */
export interface EquipmentGroup {
  id: number
  /** 产品组编码（系统生成，全局唯一） */
  code: string
  name: string
  remark: string
  createdAt: string
}

/** 产品型号 */
export interface EquipmentModel {
  id: number
  /** 型号编码（系统生成，全局唯一） */
  code: string
  name: string
  /** 所属品牌 id（需求明细选型号后自动带出品牌） */
  brandId: number
  /** 所属产品组 id */
  groupId: number
  /** 租期（数字，人工填写） */
  leaseTerm: number
  /** 租赁单位（年/月/日/台班/平方/立方，下拉选择） */
  leaseUnit: LeaseMode
  /** 单价（元/台，人工填写；商机需求明细选型号后自动带出） */
  unitPrice: number
  remark: string
  createdAt: string
}

/** 商机类型：租赁 / 试用 / 购买 / 维修 / 其他 */
export type OpportunityType = 'lease' | 'trial' | 'purchase' | 'maintenance' | 'other'

/** 信息状态：跟进中 / 赢单 / 丢单 / 流单 */
export type OpportunityStatus = 'following' | 'won' | 'lost' | 'dropped'

/** 租赁模式：包年 / 月 / 日 / 台班 / 平方 / 立方 */
export type LeaseMode = 'year' | 'month' | 'day' | 'shift' | 'square' | 'cube'

/** 商机需求明细（可新增/编辑） */
export interface OpportunityDetail {
  id: number
  /** 设备品牌编码（选择产品型号后自动带出并保存） */
  brandCode: string
  /** 设备品牌 id（选择产品型号后自动带出） */
  brandId: number | null
  /** 产品组编码（选择产品型号后自动带出并保存） */
  groupCode: string
  /** 产品组 id（选择产品型号后自动带出） */
  groupId: number | null
  /** 产品型号编码（选择产品型号后自动带出并保存） */
  modelCode: string
  /** 产品型号 id */
  modelId: number | null
  /** 需求台量 */
  quantity: number
  /** 预计单价（元/台），作为预计收入总额/预计合同金额自动计算基数 */
  unitPrice: number
  /** 预计开始时间（YYYY-MM-DD） */
  startAt: string
  remark: string
}

/** 市场管理-商机 */
export interface Opportunity {
  id: number
  /** 商机编号（系统流水码生成，全局唯一） */
  code: string
  /** 关联客户 id */
  customerId: number | null
  /** 客户名称 */
  customerName: string
  /** 商机类型 */
  type: OpportunityType
  /** 主要联系人（选择客户后自动带出） */
  contact: string
  /** 联系电话（选择客户后自动带出） */
  phone: string
  /** 联系地址-省市区编码（如 ['310000', '310100', '310101']） */
  region: string[]
  /** 联系地址-详细地址 */
  addressDetail: string
  /** 联系地址完整文本（省市区 + 详细地址） */
  address: string
  /** 信息状态 */
  status: OpportunityStatus
  /** 信息阶段：新增 20，赢单 100，丢单/流单 0 */
  stage: number
  /** 预计租期（手动填写，如 12个月） */
  leaseTerm: string
  /** 租赁模式 */
  leaseMode: LeaseMode
  /** 预计收入总额（系统自动填充） */
  estimatedIncome: number
  /** 预计合同金额（系统自动填充） */
  estimatedContract: number
  /** 备注 */
  remark: string
  /** 需求明细列表 */
  details: OpportunityDetail[]
  /** 创建人 */
  creator: string
  createdAt: string
}

/** 商机新增/编辑表单模型 */
export interface OpportunityFormModel {
  id: number | null
  /** 商机编号（新增时系统生成，编辑时回显） */
  code: string
  customerId: number | null
  customerName: string
  type: OpportunityType
  contact: string
  phone: string
  region: string[]
  addressDetail: string
  status: OpportunityStatus
  stage: number
  leaseTerm: string
  leaseMode: LeaseMode
  estimatedIncome: number
  estimatedContract: number
  remark: string
  details: OpportunityDetail[]
}

/** 商机分页查询参数 */
export interface OpportunityQuery {
  page?: number
  pageSize?: number
  keyword?: string
  type?: OpportunityType | ''
  status?: OpportunityStatus | ''
}

/** 数据字典项（如资产归属） */
export interface DictItem {
  id: number
  /** 字典类型 */
  type: string
  /** 字典标签 */
  label: string
}

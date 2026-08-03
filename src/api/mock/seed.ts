import type {
  DashboardStats,
  EquipmentBoard,
  HoursStat,
  Menu,
  PaymentTrend,
  Role,
  Tenant,
  TodoItem,
} from '@/types'

export interface SeedUser {
  id: number
  username: string
  password: string
  name: string
  roleId: number
  avatar: string
  phone?: string
}

// 种子数据：首次运行时写入 localStorage，之后系统内编辑会持久化保存
export const seedMenus: Menu[] = [
  {
    id: 1,
    parentId: 0,
    type: 'menu',
    name: 'Dashboard',
    path: '/dashboard',
    component: 'dashboard/index',
    title: '首页',
    i18nKey: 'menu.dashboard',
    icon: 'HomeFilled',
    sort: 1,
    visible: true,
    autoRefresh: false,
    perms: 'dashboard:view',
    buttons: [],
  },
  {
    id: 2,
    parentId: 0,
    type: 'directory',
    name: 'System',
    path: '/system',
    component: '',
    title: '系统设置',
    i18nKey: 'menu.system',
    icon: 'Setting',
    sort: 2,
    visible: true,
    perms: '',
    buttons: [],
  },
  {
    id: 3,
    parentId: 2,
    type: 'menu',
    name: 'RoleManage',
    path: '/system/role',
    component: 'system/role/index',
    title: '权限设置',
    i18nKey: 'menu.role',
    icon: 'User',
    sort: 1,
    visible: true,
    autoRefresh: false,
    perms: 'system:role:list',
    buttons: [
      { label: '新增', perm: 'system:role:add' },
      { label: '编辑', perm: 'system:role:edit' },
      { label: '删除', perm: 'system:role:delete' },
      { label: '查看', perm: 'system:role:view' },
    ],
  },
  {
    id: 4,
    parentId: 2,
    type: 'menu',
    name: 'MenuManage',
    path: '/system/menu',
    component: 'system/menu/index',
    title: '菜单设置',
    i18nKey: 'menu.menuManage',
    icon: 'Menu',
    sort: 2,
    visible: true,
    autoRefresh: false,
    perms: 'system:menu:list',
    buttons: [
      { label: '新增', perm: 'system:menu:add' },
      { label: '编辑', perm: 'system:menu:edit' },
      { label: '删除', perm: 'system:menu:delete' },
      { label: '查看', perm: 'system:menu:view' },
    ],
  },
  {
    id: 5,
    parentId: 2,
    type: 'menu',
    name: 'TenantManage',
    path: '/system/tenant',
    component: 'system/tenant/index',
    title: '租户管理',
    i18nKey: 'menu.tenant',
    icon: 'OfficeBuilding',
    sort: 3,
    visible: true,
    autoRefresh: false,
    perms: 'system:tenant:list',
    buttons: [
      { label: '新增', perm: 'system:tenant:add' },
      { label: '编辑', perm: 'system:tenant:edit' },
      { label: '删除', perm: 'system:tenant:delete' },
      { label: '查看', perm: 'system:tenant:view' },
    ],
  },
]

export const seedRoles: Role[] = [
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    menuIds: [1, 2, 3, 4, 5],
    perms: ['*:*:*'],
    status: 1,
    remark: '拥有系统全部权限',
    createdAt: '2026-01-01 10:00:00',
  },
  {
    id: 2,
    name: '财务专员',
    code: 'finance',
    menuIds: [1, 2, 3],
    perms: ['dashboard:view', 'system:role:list', 'system:role:view'],
    status: 1,
    remark: '负责分款、开票等财务业务',
    createdAt: '2026-01-02 10:00:00',
  },
  {
    id: 3,
    name: '运营专员',
    code: 'operator',
    menuIds: [1, 2, 5],
    perms: ['dashboard:view', 'system:tenant:list', 'system:tenant:view'],
    status: 1,
    remark: '负责日常运营与租户维护',
    createdAt: '2026-01-03 10:00:00',
  },
]

export const seedUsers: SeedUser[] = [
  { id: 1, username: 'admin', password: '123456', name: '系统管理员', roleId: 1, avatar: '' },
  { id: 2, username: 'finance', password: '123456', name: '财务专员-小李', roleId: 2, avatar: '' },
  { id: 3, username: 'operator', password: '123456', name: '运营专员-小王', roleId: 3, avatar: '' },
]

export const seedTenants: Tenant[] = [
  {
    id: 1,
    name: '上海华筑租赁有限公司',
    code: 'SH-HZ',
    contact: '王建国',
    phone: '13800001111',
    plan: '企业版',
    expireAt: '2027-06-30',
    status: 1,
    remark: '主营高空作业车租赁',
    createdAt: '2026-01-10 09:30:00',
  },
  {
    id: 2,
    name: '杭州远大设备租赁',
    code: 'HZ-YD',
    contact: '李慧',
    phone: '13900002222',
    plan: '专业版',
    expireAt: '2026-12-31',
    status: 1,
    remark: '',
    createdAt: '2026-02-05 14:20:00',
  },
  {
    id: 3,
    name: '苏州金穗机械租赁',
    code: 'SZ-JS',
    contact: '赵强',
    phone: '13700003333',
    plan: '标准版',
    expireAt: '2026-09-15',
    status: 1,
    remark: '叉车与铲车为主',
    createdAt: '2026-02-18 11:00:00',
  },
  {
    id: 4,
    name: '南京鼎力工程设备',
    code: 'NJ-DL',
    contact: '孙丽',
    phone: '13600004444',
    plan: '企业版',
    expireAt: '2026-08-20',
    status: 0,
    remark: '试用到期待续费',
    createdAt: '2026-03-02 16:45:00',
  },
  {
    id: 5,
    name: '宁波甬盛租赁',
    code: 'NB-YS',
    contact: '周涛',
    phone: '13500005555',
    plan: '专业版',
    expireAt: '2027-03-31',
    status: 1,
    remark: '',
    createdAt: '2026-03-20 10:10:00',
  },
  {
    id: 6,
    name: '无锡星辰设备租赁',
    code: 'WX-XC',
    contact: '吴敏',
    phone: '13400006666',
    plan: '标准版',
    expireAt: '2026-11-30',
    status: 1,
    remark: '',
    createdAt: '2026-04-12 13:35:00',
  },
]

export const seedDashboard: {
  stats: DashboardStats
  trend: PaymentTrend
  equipment: EquipmentBoard
  hours: HoursStat
} = {
  stats: {
    totalRental: { value: 128653000, trend: 12.5 },
    receivables: { value: 35680000, trend: -3.2 },
    pendingDistribute: { value: 8260000, trend: 5.1 },
    monthInvoicePending: { value: 46, trend: 2.4 },
    monthDistribute: { value: 15230000, trend: 8.4 },
    monthInvoice: { value: 21960000, trend: 11.2 },
  },
  trend: {
    months: ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'],
    planned: [1800, 2100, 1950, 2400, 2200, 2600],
    actual: [1650, 2280, 1880, 2510, 2050, 2430],
  },
  equipment: {
    total: 128,
    renting: 96,
    idle: 22,
    maintenance: 10,
    occupancyRate: 75,
    onlineRate: 96.5,
    categories: [
      { name: '高空作业车', count: 32 },
      { name: '叉车', count: 28 },
      { name: '挖掘机', count: 24 },
      { name: '吊车', count: 18 },
      { name: '发电机', count: 26 },
    ],
  },
  hours: {
    categories: ['高空作业车', '叉车', '挖掘机', '吊车', '发电机'],
    plan: [3260, 2840, 2130, 1560, 1880],
    actual: [3180, 2910, 2210, 1490, 1760],
    utilization: [92.4, 88.1, 90.6, 85.2, 83.7],
  },
}

export const seedTodos: TodoItem[] = [
  {
    id: 1,
    type: 'contract',
    title: 'B公司高空作业车租赁合同审批（10台/6个月）',
    applicant: '张伟',
    time: '2026-08-03 09:12',
    priority: 'high',
  },
  {
    id: 2,
    type: 'distribute',
    title: '分款审批：2026-07 分款单 #F20260718',
    applicant: '刘敏',
    time: '2026-08-03 08:40',
    priority: 'medium',
  },
  {
    id: 3,
    type: 'invoice',
    title: '开票申请：上海XX建筑工程有限公司 增值税专用发票',
    applicant: '陈晨',
    time: '2026-08-02 17:25',
    priority: 'medium',
  },
  {
    id: 4,
    type: 'contract',
    title: 'C公司叉车租赁补充协议审批',
    applicant: '张伟',
    time: '2026-08-02 15:03',
    priority: 'low',
  },
  {
    id: 5,
    type: 'distribute',
    title: '分款审批：2026-07 分款单 #F20260721',
    applicant: '刘敏',
    time: '2026-08-02 11:47',
    priority: 'high',
  },
]

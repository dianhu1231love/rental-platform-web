import type { DashboardStats, TodoPriority, TodoType } from '@/types'

/**
 * 系统支持的语言列表
 * zh-CN 作为主语言（菜单名称以中文为准），其余语言由自动翻译填充
 */
export const SUPPORTED_LOCALES: Array<{ code: string; labelKey: string }> = [
  { code: 'zh-CN', labelKey: 'common.zhCN' },
  { code: 'en-US', labelKey: 'common.enUS' },
]

/**
 * 菜单设置页可选的图标列表
 * 对应 @element-plus/icons-vue 中注册的全局图标组件名
 */
export const MENU_ICON_OPTIONS: string[] = [
  'HomeFilled',
  'Odometer',
  'Setting',
  'User',
  'Menu',
  'OfficeBuilding',
  'DataAnalysis',
  'Money',
  'Coin',
  'Wallet',
  'Document',
  'Tickets',
  'CreditCard',
  'TrendCharts',
  'Files',
  'Grid',
  'Histogram',
  'Monitor',
  'List',
  'Operation',
  'Tools',
]

/**
 * 待办事项类型对应的标签文案与 Element Plus 标签类型
 */
export const TODO_TYPE_MAP: Record<
  TodoType,
  { labelKey: string; type: 'primary' | 'warning' | 'success' }
> = {
  contract: { labelKey: 'dashboard.todoContract', type: 'primary' },
  distribute: { labelKey: 'dashboard.todoDistribute', type: 'warning' },
  invoice: { labelKey: 'dashboard.todoInvoice', type: 'success' },
}

/**
 * 待办事项优先级对应的圆点颜色
 */
export const TODO_PRIORITY_COLORS: Record<TodoPriority, string> = {
  high: '#f56c6c',
  medium: '#e6a23c',
  low: '#67c23a',
}

/**
 * 看板指标卡片的静态元信息（图标、主题色、单位）
 * 动态数值在首页加载接口数据后填充
 */
export const STAT_CARD_META: Array<{
  key: keyof DashboardStats
  icon: string
  color: string
  unit: string
}> = [
  { key: 'totalRental', icon: 'Coin', color: '#409eff', unit: 'dashboard.unitYuan' },
  { key: 'receivables', icon: 'Wallet', color: '#e6a23c', unit: 'dashboard.unitYuan' },
  { key: 'pendingDistribute', icon: 'Money', color: '#67c23a', unit: 'dashboard.unitYuan' },
  { key: 'monthInvoicePending', icon: 'Document', color: '#f56c6c', unit: 'dashboard.unitCount' },
  { key: 'monthDistribute', icon: 'CreditCard', color: '#9c27b0', unit: 'dashboard.unitYuan' },
  { key: 'monthInvoice', icon: 'Tickets', color: '#00bcd4', unit: 'dashboard.unitYuan' },
]

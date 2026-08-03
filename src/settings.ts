/**
 * 全局应用设置
 */
interface AppSettings {
  /** 系统标题 */
  title: string
  /** 是否显示侧边栏 Logo */
  sidebarLogo: boolean
  /** 是否启用多标签页 */
  tagsView: boolean
  /** 顶栏是否固定 */
  fixedHeader: boolean
}

const settings: AppSettings = {
  title: '租赁平台管理系统',
  sidebarLogo: true,
  tagsView: true,
  fixedHeader: true,
}

export default settings

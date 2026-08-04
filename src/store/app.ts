/**
 * 应用全局状态：侧边栏折叠、多语言、多标签页（visitedViews）与页面缓存
 * 首页固定在第一且不可关闭，标签支持拖拽排序
 */
import { defineStore } from 'pinia'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const LANG_KEY = 'rental_platform_lang'
export const HOME_PATH = '/dashboard'

function isHome(path: string): boolean {
  return path === HOME_PATH
}

export interface VisitedView {
  path: string
  fullPath: string
  name?: string
  title?: string
  i18nKey?: string
  /** 多语言标题（语言代码 -> 译文） */
  i18n?: Record<string, string>
  keepAlive: boolean
}

export const useAppStore = defineStore('app', {
  state: () => ({
    /** 侧边栏是否折叠 */
    sidebarCollapsed: false,
    /** 当前语言（zh-CN / en-US） */
    language: localStorage.getItem(LANG_KEY) || 'zh-CN',
    /** 已打开的标签页列表，首页恒在首位 */
    visitedViews: [] as VisitedView[],
    /** 启用缓存的组件名称列表（配合 keep-alive） */
    cachedViews: [] as string[],
  }),
  actions: {
    /** 折叠/展开侧边栏 */
    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    /** 切换语言并持久化 */
    setLanguage(lang: string): void {
      this.language = lang
      localStorage.setItem(LANG_KEY, lang)
    },
    /** 新增访问标签；首页固定插入到首位 */
    addVisitedView(view: RouteLocationNormalizedLoaded): void {
      if (this.visitedViews.some((v) => v.path === view.path)) return
      if (view.meta?.hidden) return
      const entry: VisitedView = {
        path: view.path,
        fullPath: view.fullPath,
        name: view.name as string | undefined,
        title: view.meta?.title as string | undefined,
        i18nKey: view.meta?.i18nKey as string | undefined,
        i18n: view.meta?.i18n as Record<string, string> | undefined,
        keepAlive: !!view.meta?.keepAlive,
      }
      // 首页固定在最前
      if (isHome(view.path)) {
        this.visitedViews.unshift(entry)
      } else {
        this.visitedViews.push(entry)
      }
      this.syncCachedViews()
    },
    /** 关闭标签（首页不允许关闭） */
    delVisitedView(path: string): void {
      if (isHome(path)) return
      const index = this.visitedViews.findIndex((v) => v.path === path)
      if (index > -1) this.visitedViews.splice(index, 1)
      this.syncCachedViews()
    },
    /** 关闭某标签左侧的标签（保留首页） */
    delViewsLeft(view: VisitedView): void {
      const index = this.visitedViews.findIndex((v) => v.path === view.path)
      // 首页固定在最前，不参与关闭
      if (index > 1) this.visitedViews.splice(1, index - 1)
      this.syncCachedViews()
    },
    /** 关闭某标签右侧的标签 */
    delViewsRight(view: VisitedView): void {
      const index = this.visitedViews.findIndex((v) => v.path === view.path)
      if (index > -1) this.visitedViews.splice(index + 1)
      this.syncCachedViews()
    },
    /** 仅保留首页与指定标签 */
    delOtherViews(view: VisitedView): void {
      this.visitedViews = this.visitedViews.filter((v) => isHome(v.path) || v.path === view.path)
      this.syncCachedViews()
    },
    /** 关闭全部标签，仅保留首页 */
    delAllViews(): void {
      this.visitedViews = this.visitedViews.filter((v) => isHome(v.path))
      this.syncCachedViews()
    },
    /** 拖拽调整标签顺序（首页固定第一位，不可移动） */
    moveVisitedView(fromIndex: number, toIndex: number): void {
      const views = this.visitedViews
      // 首页固定第一位，不允许拖动或移动到第一位
      if (fromIndex <= 0 || toIndex <= 0 || fromIndex === toIndex) return
      if (fromIndex >= views.length || toIndex >= views.length) return
      const [moved] = views.splice(fromIndex, 1)
      views.splice(toIndex, 0, moved)
    },
    /** 根据标签的缓存标记同步 keep-alive 组件名列表 */
    syncCachedViews(): void {
      this.cachedViews = this.visitedViews
        .filter((v): v is VisitedView & { name: string } => !!v.keepAlive && !!v.name)
        .map((v) => v.name)
    },
    /** 从缓存列表中移除组件（右键“刷新”时使用） */
    delCachedView(name: string): void {
      if (!name) return
      this.cachedViews = this.cachedViews.filter((n) => n !== name)
    },
    /** 将组件重新加入缓存列表 */
    addCachedView(name: string): void {
      if (!name || this.cachedViews.includes(name)) return
      this.cachedViews.push(name)
    },
  },
})

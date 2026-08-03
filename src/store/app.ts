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
  keepAlive: boolean
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    language: localStorage.getItem(LANG_KEY) || 'zh-CN',
    visitedViews: [] as VisitedView[],
    cachedViews: [] as string[],
  }),
  actions: {
    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setLanguage(lang: string): void {
      this.language = lang
      localStorage.setItem(LANG_KEY, lang)
    },
    addVisitedView(view: RouteLocationNormalizedLoaded): void {
      if (this.visitedViews.some((v) => v.path === view.path)) return
      if (view.meta?.hidden) return
      const entry: VisitedView = {
        path: view.path,
        fullPath: view.fullPath,
        name: view.name as string | undefined,
        title: view.meta?.title as string | undefined,
        i18nKey: view.meta?.i18nKey as string | undefined,
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
    delVisitedView(path: string): void {
      if (isHome(path)) return
      const index = this.visitedViews.findIndex((v) => v.path === path)
      if (index > -1) this.visitedViews.splice(index, 1)
      this.syncCachedViews()
    },
    delViewsLeft(view: VisitedView): void {
      const index = this.visitedViews.findIndex((v) => v.path === view.path)
      // 首页固定在最前，不参与关闭
      if (index > 1) this.visitedViews.splice(1, index - 1)
      this.syncCachedViews()
    },
    delViewsRight(view: VisitedView): void {
      const index = this.visitedViews.findIndex((v) => v.path === view.path)
      if (index > -1) this.visitedViews.splice(index + 1)
      this.syncCachedViews()
    },
    delOtherViews(view: VisitedView): void {
      this.visitedViews = this.visitedViews.filter((v) => isHome(v.path) || v.path === view.path)
      this.syncCachedViews()
    },
    delAllViews(): void {
      this.visitedViews = this.visitedViews.filter((v) => isHome(v.path))
      this.syncCachedViews()
    },
    moveVisitedView(fromIndex: number, toIndex: number): void {
      const views = this.visitedViews
      // 首页固定第一位，不允许拖动或移动到第一位
      if (fromIndex <= 0 || toIndex <= 0 || fromIndex === toIndex) return
      if (fromIndex >= views.length || toIndex >= views.length) return
      const [moved] = views.splice(fromIndex, 1)
      views.splice(toIndex, 0, moved)
    },
    syncCachedViews(): void {
      this.cachedViews = this.visitedViews
        .filter((v): v is VisitedView & { name: string } => !!v.keepAlive && !!v.name)
        .map((v) => v.name)
    },
    delCachedView(name: string): void {
      if (!name) return
      this.cachedViews = this.cachedViews.filter((n) => n !== name)
    },
    addCachedView(name: string): void {
      if (!name || this.cachedViews.includes(name)) return
      this.cachedViews.push(name)
    },
  },
})

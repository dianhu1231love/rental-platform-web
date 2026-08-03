/**
 * 权限状态：菜单树与动态路由
 * 登录后根据后端菜单数据生成路由并注册到 vue-router
 */
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'
import type { Menu } from '@/types'

const viewModules = import.meta.glob('/src/views/**/*.vue')

/** 将后端菜单节点转换为 vue-router 路由记录 */
function menuToRoute(menu: Menu): RouteRecordRaw {
  const route = {
    path: menu.path,
    name: menu.name || String(menu.path),
    meta: {
      title: menu.title || '',
      i18nKey: menu.i18nKey || '',
      icon: menu.icon || '',
      perms: menu.perms || '',
      buttons: menu.buttons || [],
      hidden: !menu.visible,
      type: menu.type,
      // 开启“点击标签自动刷新”则不缓存页面，每次进入重新加载
      keepAlive: !(menu.autoRefresh === true),
    },
  } as unknown as RouteRecordRaw
  if (menu.type === 'menu' && menu.component) {
    const loader = viewModules[`/src/views/${menu.component}.vue`] as
      (() => Promise<unknown>) | undefined
    route.component = (loader || Layout) as RouteRecordRaw['component']
  }
  return route
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    menus: [] as Menu[],
    routes: [] as RouteRecordRaw[],
  }),
  actions: {
    /** 根据菜单列表生成动态路由（含缓存标记 keepAlive） */
    generateRoutes(menus: Menu[]): RouteRecordRaw[] {
      this.menus = menus || []
      const children: RouteRecordRaw[] = []
      const walk = (nodes: Menu[]): void => {
        nodes.forEach((node) => {
          if (node.type === 'directory') {
            walk(node.children || [])
          } else if (node.type === 'menu' && node.component) {
            children.push(menuToRoute(node))
          }
        })
      }
      walk(this.menus)
      const rootRoute: RouteRecordRaw = {
        path: '/',
        component: Layout,
        redirect: children[0]?.path || '/dashboard',
        children,
      }
      this.routes = [rootRoute]
      return this.routes
    },
    /** 清空菜单与路由（登出时调用） */
    reset(): void {
      this.menus = []
      this.routes = []
    },
  },
})

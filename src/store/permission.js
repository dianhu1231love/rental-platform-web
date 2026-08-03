import { defineStore } from 'pinia'
import Layout from '@/layout/index.vue'

const viewModules = import.meta.glob('/src/views/**/*.vue')

function menuToRoute(menu) {
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
  }
  if (menu.type === 'menu' && menu.component) {
    const loader = viewModules[`/src/views/${menu.component}.vue`]
    route.component = loader || Layout
  }
  return route
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    menus: [],
    routes: [],
  }),
  actions: {
    generateRoutes(menus) {
      this.menus = menus || []
      const children = []
      const walk = (nodes) => {
        nodes.forEach((node) => {
          if (node.type === 'directory') {
            walk(node.children || [])
          } else if (node.type === 'menu' && node.component) {
            children.push(menuToRoute(node))
          }
        })
      }
      walk(this.menus)
      const rootRoute = {
        path: '/',
        component: Layout,
        redirect: children[0]?.path || '/dashboard',
        children,
      }
      this.routes = [rootRoute]
      return this.routes
    },
    reset() {
      this.menus = []
      this.routes = []
    },
  },
})

/**
 * 全局路由守卫
 * - 未登录跳转登录页
 * - 首次登录后拉取用户信息并动态注册路由
 */
import router from './router'
import { getToken } from '@/utils/auth'
import { useUserStore, usePermissionStore } from '@/store'
import NProgress from 'nprogress'
import { ElMessage } from 'element-plus'
import i18n from '@/locales'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

const whiteList = ['/login', '/404']

router.beforeEach(
  async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    NProgress.start()
    const hasToken = getToken()

    if (hasToken) {
      // 已登录访问登录页时直接回首页
      if (to.path === '/login') {
        next({ path: '/' })
        NProgress.done()
        return
      }

      const userStore = useUserStore()
      const permissionStore = usePermissionStore()

      // 首次进入：拉取用户信息并生成动态路由
      if (userStore.roles.length === 0) {
        try {
          const userInfo = await userStore.getUserInfo()
          const accessRoutes = permissionStore.generateRoutes(userInfo.menus)
          accessRoutes.forEach((route) => router.addRoute(route))
          router.addRoute({
            path: '/:pathMatch(.*)*',
            redirect: '/404',
            meta: { hidden: true },
          })
          next({ ...to, replace: true })
        } catch (error) {
          await userStore.logout()
          ElMessage.error(
            (error as Error | undefined)?.message || i18n.global.t('common.loadFailed'),
          )
          next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
          NProgress.done()
        }
      } else {
        next()
      }
    } else {
      // 未登录：白名单直接放行，其余跳转登录页
      if (whiteList.includes(to.path)) {
        next()
      } else {
        next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        NProgress.done()
      }
    }
  },
)

router.afterEach(() => {
  NProgress.done()
})

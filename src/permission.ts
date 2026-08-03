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
      if (to.path === '/login') {
        next({ path: '/' })
        NProgress.done()
        return
      }

      const userStore = useUserStore()
      const permissionStore = usePermissionStore()

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

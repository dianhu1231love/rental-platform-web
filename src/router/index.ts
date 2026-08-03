/**
 * 路由入口
 * constantRoutes 为静态路由（登录、404、重定向），业务路由由权限模块动态注册
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

/** 静态路由表 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true, title: '登录' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true, title: '404' },
  },
  {
    path: '/redirect/:path(.*)',
    name: 'Redirect',
    component: () => import('@/views/redirect/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/equipment/detail/:id',
    name: 'EquipmentDetail',
    component: Layout,
    meta: { hidden: true, title: '设备详情' },
    children: [
      {
        path: '',
        name: 'EquipmentDetailPage',
        component: () => import('@/views/equipment/detail/index.vue'),
        meta: { hidden: true, title: '设备详情' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  /** 切换路由后回到页面顶部 */
  scrollBehavior: () => ({ top: 0 }),
})

export default router

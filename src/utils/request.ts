/**
 * 统一的 Axios 请求封装
 * - 自动携带 Token
 * - 统一处理响应码与错误提示
 * - 401 自动登出并跳转登录页
 * - 拦截器将响应解包为 { code, data, message }，因此泛型返回类型为 ApiResponse<T>
 */

import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import { createMockAdapter } from '@/api/mock'
import i18n from '@/locales'
import router from '@/router'
import type { ApiResponse } from '@/types'

type GetDelete = <T = unknown>(
  _url: string,
  _config?: AxiosRequestConfig,
) => Promise<ApiResponse<T>>
type PostPut = <T = unknown>(
  _url: string,
  _data?: unknown,
  _config?: AxiosRequestConfig,
) => Promise<ApiResponse<T>>

interface RequestInstance {
  get: GetDelete
  delete: GetDelete
  post: PostPut
  put: PostPut
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

if (import.meta.env.VITE_USE_MOCK === 'true') {
  service.defaults.adapter = createMockAdapter()
}

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

/** 登录态失效：清除本地凭证并跳转登录页 */
function handleUnauthorized(): void {
  removeToken()
  import('../store').then(({ useUserStore }) => {
    useUserStore().resetState()
    ElMessage.error(i18n.global.t('common.sessionExpired'))
    const redirect = encodeURIComponent(router.currentRoute.value.fullPath)
    router.push(`/login?redirect=${redirect}`)
  })
}

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code === 200) {
      return res as unknown as AxiosResponse
    }
    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message))
    }
    ElMessage.error(res.message || i18n.global.t('common.requestError'))
    return Promise.reject(new Error(res.message))
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
    } else {
      ElMessage.error(error.message || i18n.global.t('common.networkError'))
    }
    return Promise.reject(error)
  },
)

// 拦截器已把响应解包为 { code, data, message }，这里按实际返回类型声明
export default service as unknown as RequestInstance

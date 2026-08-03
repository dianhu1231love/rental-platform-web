import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from './auth'
import { createMockAdapter } from '@/api/mock'
import i18n from '@/locales'
import router from '@/router'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
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
  (error) => Promise.reject(error)
)

function handleUnauthorized() {
  removeToken()
  import('../store').then(({ useUserStore }) => {
    useUserStore().resetState()
    ElMessage.error(i18n.global.t('common.sessionExpired'))
    const redirect = encodeURIComponent(router.currentRoute.value.fullPath)
    router.push(`/login?redirect=${redirect}`)
  })
}

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res
    }
    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message))
    }
    ElMessage.error(res.message || i18n.global.t('common.requestError'))
    return Promise.reject(new Error(res.message))
  },
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized()
    } else {
      ElMessage.error(error.message || i18n.global.t('common.networkError'))
    }
    return Promise.reject(error)
  }
)

export default service

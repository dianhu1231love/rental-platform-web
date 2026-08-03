import { defineStore } from 'pinia'
import {
  login as loginApi,
  ssoLogin as ssoApi,
  logout as logoutApi,
  getUserInfo as getUserInfoApi
} from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    username: '',
    avatar: '',
    roles: [],
    perms: [],
    roleId: null,
    menus: []
  }),
  actions: {
    async login(form) {
      const res = await loginApi(form)
      this.token = res.data.token
      setToken(res.data.token)
    },
    async ssoLogin(form) {
      const res = await ssoApi(form)
      this.token = res.data.token
      setToken(res.data.token)
    },
    async getUserInfo() {
      const res = await getUserInfoApi()
      const info = res.data
      this.name = info.name
      this.username = info.username
      this.avatar = info.avatar
      this.roles = info.roles
      this.perms = info.perms
      this.roleId = info.roleId
      this.menus = info.menus
      return info
    },
    async logout() {
      try {
        await logoutApi()
      } catch {
        // 忽略登出接口异常
      }
      this.resetState()
      removeToken()
    },
    resetState() {
      this.token = ''
      this.name = ''
      this.username = ''
      this.avatar = ''
      this.roles = []
      this.perms = []
      this.roleId = null
      this.menus = []
    }
  }
})

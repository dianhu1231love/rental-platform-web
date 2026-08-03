/**
 * 用户状态：Token、基础信息、角色与权限
 * 登录 / SSO / 登出 / 拉取用户信息都在此统一处理
 */
import { defineStore } from 'pinia'
import {
  login as loginApi,
  ssoLogin as ssoApi,
  logout as logoutApi,
  getUserInfo as getUserInfoApi,
} from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import type { LoginForm, Menu, SsoForm, UserInfo } from '@/types'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    username: '',
    avatar: '',
    roles: [] as string[],
    perms: [] as string[],
    roleId: null as number | null,
    menus: [] as Menu[],
  }),
  actions: {
    /** 账号密码登录并保存 Token */
    async login(form: LoginForm): Promise<void> {
      const res = await loginApi(form)
      this.token = res.data.token
      setToken(res.data.token)
    },
    /** SSO 登录并保存 Token */
    async ssoLogin(form: SsoForm): Promise<void> {
      const res = await ssoApi(form)
      this.token = res.data.token
      setToken(res.data.token)
    },
    /** 拉取当前用户信息（角色、权限、菜单） */
    async getUserInfo(): Promise<UserInfo> {
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
    /** 退出登录：调用接口并清理本地状态 */
    async logout(): Promise<void> {
      try {
        await logoutApi()
      } catch {
        // 忽略登出接口异常
      }
      this.resetState()
      removeToken()
    },
    /** 清空用户相关状态 */
    resetState(): void {
      this.token = ''
      this.name = ''
      this.username = ''
      this.avatar = ''
      this.roles = []
      this.perms = []
      this.roleId = null
      this.menus = []
    },
  },
})

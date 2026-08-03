/**
 * 认证相关接口
 */
import request from '@/utils/request'
import type { ForgotForm, LoginForm, SsoForm, UserInfo } from '@/types'

/** 账号密码登录 */
export function login(data: LoginForm) {
  return request.post<{ token: string }>('/auth/login', data)
}

/** SSO 单点登录 */
export function ssoLogin(data: SsoForm) {
  return request.post<{ token: string }>('/auth/sso', data)
}

/** 退出登录 */
export function logout() {
  return request.post<null>('/auth/logout')
}

/** 获取当前登录用户信息（含角色、权限与菜单） */
export function getUserInfo() {
  return request.get<UserInfo>('/auth/userinfo')
}

/** 找回账户（手机号/邮箱 + 验证码校验） */
export function forgotAccount(data: ForgotForm) {
  return request.post<{ username: string; name: string }[]>('/auth/forgot', data)
}

/**
 * 认证相关接口
 */
import request from '@/utils/request'
import type { ForgotForm, LoginForm, SsoForm, UserInfo } from '@/types'

/** 用户个人资料 */
export interface UserProfile {
  name: string
  username: string
  avatar: string
  phone: string
  email: string
}

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

/** 获取当前用户个人资料（头像/名称/手机号/邮箱） */
export function getProfile() {
  return request.get<UserProfile>('/auth/profile')
}

/** 发送验证码到手机/邮箱（演示环境固定为 123456） */
export function sendCode(target: string) {
  return request.post<{ sent: boolean; target: string }>('/auth/send-code', { target })
}

/** 提交个人资料变更（需验证码校验） */
export function updateProfile(data: {
  code: string
  name?: string
  avatar?: string
  phone?: string
  email?: string
}) {
  return request.post<UserProfile>('/auth/profile/update', data)
}

/** 找回账户（手机号/邮箱 + 验证码校验） */
export function forgotAccount(data: ForgotForm) {
  return request.post<{ username: string; name: string }[]>('/auth/forgot', data)
}

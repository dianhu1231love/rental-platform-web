import request from '@/utils/request'
import type { ForgotForm, LoginForm, SsoForm, UserInfo } from '@/types'

export function login(data: LoginForm) {
  return request.post<{ token: string }>('/auth/login', data)
}

export function ssoLogin(data: SsoForm) {
  return request.post<{ token: string }>('/auth/sso', data)
}

export function logout() {
  return request.post<null>('/auth/logout')
}

export function getUserInfo() {
  return request.get<UserInfo>('/auth/userinfo')
}

export function forgotAccount(data: ForgotForm) {
  return request.post<{ username: string; name: string }[]>('/auth/forgot', data)
}

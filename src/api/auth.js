import request from '@/utils/request'

export function login(data) {
  return request.post('/auth/login', data)
}

export function ssoLogin(data) {
  return request.post('/auth/sso', data)
}

export function logout() {
  return request.post('/auth/logout')
}

export function getUserInfo() {
  return request.get('/auth/userinfo')
}

export function forgotAccount(data) {
  return request.post('/auth/forgot', data)
}

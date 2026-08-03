/**
 * Token 与登录状态的本地存储工具
 * 统一管理 localStorage 中的访问令牌与记住的用户名
 */

const TOKEN_KEY = 'rental_platform_token'
const USERNAME_KEY = 'rental_platform_username'

/** 读取访问令牌，未登录时返回空字符串 */
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

/** 写入访问令牌 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 清除访问令牌（登出时调用） */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 读取记住的用户名（用于登录页回显） */
export function getRememberedUsername(): string {
  return localStorage.getItem(USERNAME_KEY) || ''
}

/** 记住用户名 */
export function setRememberedUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username)
}

/** 清除记住的用户名 */
export function clearRememberedUsername(): void {
  localStorage.removeItem(USERNAME_KEY)
}

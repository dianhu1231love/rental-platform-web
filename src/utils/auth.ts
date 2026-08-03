const TOKEN_KEY = 'rental_platform_token'
const USERNAME_KEY = 'rental_platform_username'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getRememberedUsername(): string {
  return localStorage.getItem(USERNAME_KEY) || ''
}

export function setRememberedUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearRememberedUsername(): void {
  localStorage.removeItem(USERNAME_KEY)
}

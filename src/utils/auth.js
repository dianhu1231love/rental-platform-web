const TOKEN_KEY = 'rental_platform_token'
const USERNAME_KEY = 'rental_platform_username'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getRememberedUsername() {
  return localStorage.getItem(USERNAME_KEY) || ''
}

export function setRememberedUsername(username) {
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearRememberedUsername() {
  localStorage.removeItem(USERNAME_KEY)
}

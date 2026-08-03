export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function isValidEmail(email: string): boolean {
  return /^[\w.%+-]+@[\w-]+(\.[\w-]+)+$/.test(email)
}

export function isValidAccount(value: string): boolean {
  return isValidPhone(value) || isValidEmail(value)
}

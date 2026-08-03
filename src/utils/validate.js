export function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function isValidEmail(email) {
  return /^[\w.%+-]+@[\w-]+(\.[\w-]+)+$/.test(email)
}

export function isValidAccount(value) {
  return isValidPhone(value) || isValidEmail(value)
}

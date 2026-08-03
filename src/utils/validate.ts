/**
 * 表单校验工具
 */

/** 校验中国大陆手机号（1 开头 11 位数字） */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/** 校验邮箱格式 */
export function isValidEmail(email: string): boolean {
  return /^[\w.%+-]+@[\w-]+(\.[\w-]+)+$/.test(email)
}

/** 校验手机号或邮箱（用于找回账户） */
export function isValidAccount(value: string): boolean {
  return isValidPhone(value) || isValidEmail(value)
}

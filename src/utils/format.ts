/**
 * 数值格式化工具
 */

/** 金额格式化：千分位 + 保留两位小数 */
export function formatMoney(value: number | string): string {
  const num = Number(value) || 0
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 以“万元”为单位格式化金额 */
export function formatWan(value: number | string): string {
  const num = Number(value) || 0
  return (num / 10000).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** 百分比格式化：保留一位小数并追加 % */
export function formatPercent(value: number | string): string {
  return `${(Number(value) || 0).toFixed(1)}%`
}

/** 返回今天日期字符串（YYYY-MM-DD） */
export function today(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

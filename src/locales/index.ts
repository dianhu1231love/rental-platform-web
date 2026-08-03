/**
 * vue-i18n 初始化：支持简体中文与英文，语言偏好持久化到 localStorage
 */
import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

const savedLang = localStorage.getItem('rental_platform_lang') || 'zh-CN'

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: savedLang,
  fallbackLocale: 'zh-CN',
  messages,
})

export default i18n

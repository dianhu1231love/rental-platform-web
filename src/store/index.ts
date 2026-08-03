/**
 * Pinia 入口：注册插件并统一导出各 store
 */
import { createPinia } from 'pinia'
import type { App } from 'vue'

const pinia = createPinia()

/** 在应用启动时挂载 Pinia */
export function setupStore(app: App): void {
  app.use(pinia)
}

export { useAppStore } from './app'
export { useUserStore } from './user'
export { usePermissionStore } from './permission'

export default pinia

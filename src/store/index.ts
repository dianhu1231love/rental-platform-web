import { createPinia } from 'pinia'
import type { App } from 'vue'

const pinia = createPinia()

export function setupStore(app: App): void {
  app.use(pinia)
}

export { useAppStore } from './app'
export { useUserStore } from './user'
export { usePermissionStore } from './permission'

export default pinia

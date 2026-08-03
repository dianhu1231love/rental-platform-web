import { createPinia } from 'pinia'

const pinia = createPinia()

export function setupStore(app) {
  app.use(pinia)
}

export { useAppStore } from './app'
export { useUserStore } from './user'
export { usePermissionStore } from './permission'

export default pinia

import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

import App from './App.vue'
import router from './router'
import { setupStore } from './store'
import i18n from './locales'
import permissionDirective from './directives/permission'
import '@/permission'
import '@/assets/styles/index.scss'

NProgress.configure({ showSpinner: false })

const app = createApp(App)

setupStore(app)

app.use(router)
app.use(i18n)
app.use(ElementPlus, { size: 'default' })
app.directive('permission', permissionDirective)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

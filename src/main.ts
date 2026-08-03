/**
 * 应用入口：创建 Vue 实例并挂载全局插件
 * Element Plus 全量引入 + 全局图标注册
 */
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
import SmartTable from './components/SmartTable.vue'
import '@/permission'
import '@/assets/styles/index.scss'

NProgress.configure({ showSpinner: false })

const app = createApp(App)

setupStore(app)

app.use(router)
app.use(i18n)
app.use(ElementPlus, { size: 'default' })
app.directive('permission', permissionDirective)
app.component('SmartTable', SmartTable)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

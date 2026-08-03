<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const { params, query } = route
const path = Array.isArray(params.path) ? params.path.join('/') : params.path || '/'
const targetPath = `/${path}`

// 刷新被缓存的页面时，先移除缓存再跳转，确保组件真正重新加载
const cachedView = appStore.visitedViews.find((v) => v.path === targetPath)
if (cachedView?.name) {
  appStore.delCachedView(cachedView.name)
}

router.replace({ path: targetPath, query }).then(() => {
  // 只有原本就启用缓存的页面，刷新后才恢复缓存
  if (cachedView?.name && cachedView.keepAlive) {
    appStore.addCachedView(cachedView.name)
  }
})
</script>

<template>
  <div />
</template>

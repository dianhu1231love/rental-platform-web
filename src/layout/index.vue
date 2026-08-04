<!-- 主布局：侧边栏 + 顶栏/标签页 + 内容区 -->
<script setup lang="ts">
import { useAppStore } from '@/store/app'
import { onBeforeUnmount, onMounted } from 'vue'
import settings from '@/settings'
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar.vue'
import TagsView from './components/TagsView.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()

/** 低分辨率断点：视口宽度 <= 1024px 时自动收起侧边栏 */
const LOW_RES_MEDIA = '(max-width: 1024px)'
let mediaQuery: MediaQueryList | null = null

function applyCollapsed(matches: boolean): void {
  appStore.sidebarCollapsed = matches
}

function handleLowResChange(event: MediaQueryListEvent): void {
  applyCollapsed(event.matches)
}

onMounted(() => {
  mediaQuery = window.matchMedia(LOW_RES_MEDIA)
  // 进入页面时按当前视口宽度同步一次
  applyCollapsed(mediaQuery.matches)
  mediaQuery.addEventListener('change', handleLowResChange)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', handleLowResChange)
})
</script>

<template>
  <div class="app-wrapper" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="sidebar-container">
      <Sidebar />
    </div>
    <div class="main-container">
      <div class="fixed-header">
        <Navbar />
        <TagsView v-if="settings.tagsView" />
      </div>
      <AppMain />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;

  .sidebar-container {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    width: $sidebar-width;
    background-color: #fff;
    border-right: 1px solid #e6eefb;
    transition: width 0.28s;
    overflow: hidden;
  }

  .main-container {
    min-height: 100%;
    margin-left: $sidebar-width;
    transition: margin-left 0.28s;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    left: $sidebar-width;
    z-index: 9;
    transition: left 0.28s;
  }

  &.collapsed {
    .sidebar-container {
      width: $sidebar-collapsed-width;
    }

    .main-container {
      margin-left: $sidebar-collapsed-width;
    }

    .fixed-header {
      left: $sidebar-collapsed-width;
    }
  }
}
</style>

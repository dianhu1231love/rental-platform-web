<script setup>
import { useAppStore } from '@/store/app'
import settings from '@/settings'
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar.vue'
import TagsView from './components/TagsView.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()
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

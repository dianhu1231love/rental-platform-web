<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { usePermissionStore } from '@/store/permission'
import settings from '@/settings'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const activeMenu = computed(() => route.path)
</script>

<template>
  <div class="sidebar-wrapper">
    <div
      v-if="settings.sidebarLogo"
      class="sidebar-logo"
      :class="{ collapsed: appStore.sidebarCollapsed }"
    >
      <el-icon :size="26" color="#2f7bfe"><Platform /></el-icon>
      <span v-show="!appStore.sidebarCollapsed" class="logo-title">
        {{ $t('layout.platformName') }}
      </span>
    </div>
    <el-scrollbar class="sidebar-scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        router
        unique-opened
        background-color="#ffffff"
        text-color="#4b5872"
        active-text-color="#2f7bfe"
      >
        <sidebar-item
          v-for="item in permissionStore.menus.filter(
            (m) => m.visible !== false && m.type !== 'button',
          )"
          :key="item.id"
          :item="item"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.sidebar-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;

  .sidebar-logo {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    border-bottom: 1px solid #eef3fb;
    overflow: hidden;
    white-space: nowrap;

    .logo-title {
      color: #2b5c9e;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .sidebar-scroll {
    flex: 1;
  }

  :deep(.el-menu) {
    border-right: none;
    padding: 8px;

    .el-menu-item {
      height: 44px;
      line-height: 44px;
      margin-bottom: 4px;
      border-radius: 8px;
      color: $menu-text;

      &:hover {
        background-color: $menu-hover !important;
        color: $menu-active-text;
      }
    }

    .el-sub-menu__title {
      height: 44px;
      line-height: 44px;
      border-radius: 8px;
      color: $menu-text;

      &:hover {
        background-color: $menu-hover !important;
        color: $menu-active-text;
      }
    }
  }

  :deep(.el-menu--collapse) {
    padding: 8px 0;

    .el-menu-item,
    .el-sub-menu__title {
      padding: 0 !important;
      justify-content: center;
    }
  }

  :deep(.el-menu-item.is-active) {
    background-color: $menu-active-bg !important;
    color: $menu-active-text;
    font-weight: 600;
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: $menu-active-text;
    font-weight: 600;
  }
}
</style>

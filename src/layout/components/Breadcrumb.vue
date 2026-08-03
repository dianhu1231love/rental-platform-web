<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, type RouteMeta } from 'vue-router'

const route = useRoute()

const levelList = computed(() => {
  const matched = route.matched.filter((r) => r.meta?.title)
  return [{ path: '/dashboard', meta: { title: '', i18nKey: 'menu.dashboard' } }, ...matched]
})

function itemLabel(meta: RouteMeta): string {
  if (meta.i18nKey) return meta.i18nKey as string
  return (meta.title as string) || ''
}
</script>

<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <el-breadcrumb-item v-for="(item, index) in levelList" :key="index">
      <router-link v-if="index < levelList.length - 1" :to="item.path">
        {{ $t(itemLabel(item.meta)) }}
      </router-link>
      <span v-else>{{ $t(itemLabel(item.meta)) }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped>
.app-breadcrumb {
  font-size: 14px;

  :deep(.el-breadcrumb__separator) {
    color: rgb(255 255 255 / 55%);
  }

  :deep(.el-breadcrumb__inner),
  :deep(.el-breadcrumb__inner a) {
    color: rgb(255 255 255 / 85%);
    font-weight: 400;

    &:hover {
      color: #fff;
    }
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: #fff;
    font-weight: 600;
  }
}
</style>

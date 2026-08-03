<!-- 侧边菜单项：递归渲染目录/菜单 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Menu } from '@/types'

const props = defineProps<{ item: Menu }>()

const { t } = useI18n()

const visibleChildren = computed<Menu[]>(() =>
  (props.item.children || []).filter((c) => c.type !== 'button' && c.visible !== false),
)

const isDirectory = computed(
  () => props.item.type === 'directory' && visibleChildren.value.length > 0,
)

const label = computed(() => {
  if (props.item.i18nKey) return t(props.item.i18nKey)
  return props.item.title
})
</script>

<template>
  <el-sub-menu v-if="isDirectory" :index="item.path">
    <template #title>
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <span>{{ label }}</span>
    </template>
    <sidebar-item v-for="child in visibleChildren" :key="child.id" :item="child" />
  </el-sub-menu>

  <el-menu-item v-else-if="item.type === 'menu' && item.path" :index="item.path">
    <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
    <template #title>{{ label }}</template>
  </el-menu-item>
</template>

<!-- 应用根组件：配置 Element Plus 全局语言 -->
<script setup lang="ts">
import { computed } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

const elementLocale = computed(() => (appStore.language === 'zh-CN' ? zhCn : en))
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

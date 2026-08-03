<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'

const { locale } = useI18n()
const appStore = useAppStore()

function changeLang(lang: string): void {
  appStore.setLanguage(lang)
  locale.value = lang
}
</script>

<template>
  <el-dropdown trigger="click" @command="changeLang">
    <span class="lang-trigger">
      <el-icon :size="16"><Flag /></el-icon>
      <span class="lang-text">{{ appStore.language === 'zh-CN' ? '中文' : 'EN' }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN" :disabled="appStore.language === 'zh-CN'">
          简体中文
        </el-dropdown-item>
        <el-dropdown-item command="en-US" :disabled="appStore.language === 'en-US'">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #fff;
  outline: none;
}

.lang-text {
  font-size: 14px;
}
</style>

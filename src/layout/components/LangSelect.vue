<!-- 语言切换下拉 -->
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
/** 语言切换按钮：按钮化样式，保证在顶栏中清晰可见、易于点击 */
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  cursor: pointer;
  color: #fff;
  outline: none;
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 16px;
  background: rgb(255 255 255 / 14%);
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.lang-trigger:hover {
  border-color: rgb(255 255 255 / 75%);
  background: rgb(255 255 255 / 26%);
}

.lang-text {
  font-size: 14px;
  line-height: 1;
}
</style>

<!-- 语言切换下拉 -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app'

const { locale } = useI18n()
const appStore = useAppStore()

/** 浅色模式：用于浅色背景（如登录页），默认深色模式用于蓝色顶栏 */
const props = withDefaults(defineProps<{ light?: boolean }>(), { light: false })

function changeLang(lang: string): void {
  appStore.setLanguage(lang)
  locale.value = lang
}
</script>

<template>
  <el-dropdown trigger="click" @command="changeLang">
    <span class="lang-trigger" :class="{ 'is-light': props.light }">
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

.lang-trigger.is-light {
  color: #2f7bfe;
  border-color: #cfe0fc;
  background: #fff;
}

.lang-trigger.is-light:hover {
  color: #1f5fd0;
  border-color: #9cc1fb;
  background: #ecf5ff;
}

.lang-text {
  font-size: 14px;
  line-height: 1;
}
</style>

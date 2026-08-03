<!-- SSO 单点登录面板 -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

/** 执行 SSO 登录（支持 URL 携带 ticket 自动登录） */
async function doSsoLogin(username = 'admin'): Promise<void> {
  loading.value = true
  try {
    await userStore.ssoLogin({ username })
    ElMessage.success(t('login.loginSuccess'))
    const redirect = (route.query.redirect as string | undefined) || '/'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 兼容 SSO 中心跳转回带 ticket 的地址，自动完成登录
  const ticket = route.query.ticket
  if (ticket) {
    doSsoLogin()
  }
})
</script>

<template>
  <div class="sso-panel">
    <el-alert
      :title="$t('login.ssoDesc')"
      type="info"
      :closable="false"
      show-icon
      class="sso-alert"
    />
    <el-button
      type="primary"
      size="large"
      class="sso-button"
      :loading="loading"
      @click="doSsoLogin()"
    >
      <el-icon v-if="!loading" class="sso-icon"><Key /></el-icon>
      {{ $t('login.ssoLogin') }}
    </el-button>
    <p class="sso-tip">{{ $t('login.ssoRedirecting') }}</p>
  </div>
</template>

<style scoped>
.sso-panel {
  padding-top: 8px;
}

.sso-alert {
  margin-bottom: 20px;
}

.sso-button {
  width: 100%;
}

.sso-icon {
  margin-right: 6px;
}

.sso-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}
</style>

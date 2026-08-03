<!-- 密码登录表单 -->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getRememberedUsername, setRememberedUsername } from '@/utils/auth'
import { useI18n } from 'vue-i18n'
import type { LoginFormModel } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<LoginFormModel>({
  username: getRememberedUsername(),
  password: '',
  remember: !!getRememberedUsername(),
})

const rules: FormRules = {
  username: [{ required: true, message: () => t('login.usernamePlaceholder'), trigger: 'blur' }],
  password: [{ required: true, message: () => t('login.passwordPlaceholder'), trigger: 'blur' }],
}

/** 校验表单并登录，成功后跳转回来源页 */
async function handleLogin(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login({ username: form.username, password: form.password })
    if (form.remember) {
      setRememberedUsername(form.username)
    }
    ElMessage.success(t('login.loginSuccess'))
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
    <el-form-item prop="username">
      <el-input
        v-model="form.username"
        :placeholder="$t('login.usernamePlaceholder')"
        :prefix-icon="'User'"
        clearable
      />
    </el-form-item>
    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        :placeholder="$t('login.passwordPlaceholder')"
        :prefix-icon="'Lock'"
      />
    </el-form-item>
    <el-form-item>
      <el-checkbox v-model="form.remember">{{ $t('login.remember') }}</el-checkbox>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">
        {{ loading ? $t('login.loggingIn') : $t('login.login') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.login-button {
  width: 100%;
}
</style>

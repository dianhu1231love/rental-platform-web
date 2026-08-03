<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { forgotAccount } from '@/api/auth'
import { isValidAccount } from '@/utils/validate'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const formRef = ref()
const loading = ref(false)
const countdown = ref(0)
const resultVisible = ref(false)
const matchedAccounts = ref([])

const form = reactive({
  account: '',
  code: '',
})

const rules = {
  account: [
    {
      validator: (_rule, value, callback) => {
        if (!value) callback(new Error(t('login.accountPlaceholder')))
        else if (!isValidAccount(value)) callback(new Error(t('login.accountPlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: () => t('login.codePlaceholder'), trigger: 'blur' }],
}

const codeButtonText = computed(() =>
  countdown.value > 0 ? `${countdown.value}${t('login.resend')}` : t('login.getCode'),
)

function startCountdown() {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

function handleGetCode() {
  if (!form.account || !isValidAccount(form.account)) {
    ElMessage.warning(t('login.accountPlaceholder'))
    return
  }
  ElMessage.success(t('login.captchaSent'))
  startCountdown()
}

async function handleFind() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await forgotAccount({ account: form.account, code: form.code })
    matchedAccounts.value = res.data
    resultVisible.value = true
  } finally {
    loading.value = false
  }
}

function handleSendReset() {
  ElMessage.success(t('login.sentSuccess'))
  resultVisible.value = false
}
</script>

<template>
  <div class="forgot-panel">
    <el-alert
      :title="$t('login.forgotDesc')"
      type="warning"
      :closable="false"
      show-icon
      class="forgot-alert"
    />
    <el-form ref="formRef" :model="form" :rules="rules" size="large">
      <el-form-item prop="account">
        <el-input
          v-model="form.account"
          :placeholder="$t('login.accountPlaceholder')"
          :prefix-icon="'Message'"
          clearable
        />
      </el-form-item>
      <el-form-item prop="code">
        <div class="code-row">
          <el-input
            v-model="form.code"
            :placeholder="$t('login.codePlaceholder')"
            :prefix-icon="'ChatDotRound'"
          />
          <el-button :disabled="countdown > 0" @click="handleGetCode">
            {{ codeButtonText }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" class="find-button" :loading="loading" @click="handleFind">
          {{ $t('login.findAccount') }}
        </el-button>
      </el-form-item>
    </el-form>

    <el-dialog v-model="resultVisible" :title="$t('login.foundTitle')" width="420px" append-to-body>
      <p>{{ $t('login.foundDesc') }}</p>
      <el-table :data="matchedAccounts" size="small" border>
        <el-table-column prop="name" :label="$t('layout.profile')" width="160" />
        <el-table-column prop="username" :label="$t('login.username')" />
      </el-table>
      <template #footer>
        <el-button @click="resultVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleSendReset">
          {{ $t('login.sendReset') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.forgot-panel {
  padding-top: 8px;
}

.forgot-alert {
  margin-bottom: 18px;
}

.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.find-button {
  width: 100%;
}
</style>

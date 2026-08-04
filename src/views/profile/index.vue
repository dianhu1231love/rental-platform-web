<!-- 个人中心：头像/名称/手机号/邮箱变更，需手机或邮箱验证码校验后生效 -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { getProfile, sendCode } from '@/api/auth'
import { useUserStore } from '@/store/user'
import { isValidEmail, isValidPhone } from '@/utils/validate'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'Profile' })

const { t } = useI18n()
const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const sending = ref(false)
const formRef = ref<FormInstance>()

interface ProfileForm {
  username: string
  name: string
  phone: string
  email: string
  avatar: string
  code: string
  channel: 'phone' | 'email'
}

const form = reactive<ProfileForm>({
  username: '',
  name: '',
  phone: '',
  email: '',
  avatar: '',
  code: '',
  channel: 'phone',
})

/** 初始资料快照，用于判断是否有变更 */
const original = reactive({
  name: '',
  phone: '',
  email: '',
  avatar: '',
})

const changed = computed(
  () =>
    original.name !== form.name ||
    original.phone !== form.phone ||
    original.email !== form.email ||
    original.avatar !== form.avatar,
)

const rules: FormRules = {
  name: [{ required: true, message: () => t('profile.namePlaceholder'), trigger: 'blur' }],
  phone: [
    { required: true, message: () => t('profile.phonePlaceholder'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidPhone(value)) callback(new Error(t('profile.phoneInvalid')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: () => t('profile.emailPlaceholder'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidEmail(value)) callback(new Error(t('profile.emailInvalid')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: () => t('profile.codePlaceholder'), trigger: 'blur' }],
}

/** 加载当前用户资料 */
async function loadProfile(): Promise<void> {
  loading.value = true
  try {
    const res = await getProfile()
    const profile = res.data
    Object.assign(form, {
      username: profile.username,
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      avatar: profile.avatar,
      code: '',
      channel: 'phone',
    })
    Object.assign(original, {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      avatar: profile.avatar,
    })
  } finally {
    loading.value = false
  }
}

/** 选择头像：转成 base64 预览并随保存提交 */
function onAvatarChange(uploadFile: UploadFile): void {
  const raw = uploadFile.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) {
    ElMessage.warning(t('profile.avatarType'))
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    form.avatar = String(reader.result || '')
  }
  reader.readAsDataURL(raw)
}

/** 发送验证码到所选验证渠道 */
async function handleSendCode(): Promise<void> {
  const target = form.channel === 'phone' ? form.phone : form.email
  if (form.channel === 'phone' && !isValidPhone(target)) {
    ElMessage.warning(t('profile.phoneInvalid'))
    return
  }
  if (form.channel === 'email' && !isValidEmail(target)) {
    ElMessage.warning(t('profile.emailInvalid'))
    return
  }
  sending.value = true
  try {
    await sendCode(`${form.channel}:${target}`)
    ElMessage.success(t('profile.codeSent', { target }))
  } finally {
    sending.value = false
  }
}

/** 保存变更（验证码通过后后端才生效） */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    await userStore.updateProfile({
      code: form.code,
      name: form.name,
      phone: form.phone,
      email: form.email,
      avatar: form.avatar,
    })
    ElMessage.success(t('profile.updated'))
    Object.assign(original, {
      name: form.name,
      phone: form.phone,
      email: form.email,
      avatar: form.avatar,
    })
    form.code = ''
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div v-loading="loading" class="app-container profile-page">
    <el-card class="page-card">
      <template #header>
        <span class="card-title">{{ $t('layout.profile') }}</span>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="profile-form">
        <el-form-item :label="$t('profile.avatar')">
          <div class="avatar-wrap">
            <el-avatar :size="72" :src="form.avatar" class="avatar-preview">
              {{ form.name ? form.name.slice(0, 1) : 'U' }}
            </el-avatar>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="onAvatarChange"
            >
              <el-button>
                <el-icon><Upload /></el-icon>
                {{ $t('profile.uploadAvatar') }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item :label="$t('profile.username')">
          <el-input :model-value="form.username" disabled />
        </el-form-item>
        <el-form-item :label="$t('profile.name')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('profile.phone')" prop="phone">
          <el-input v-model="form.phone" maxlength="11" />
        </el-form-item>
        <el-form-item :label="$t('profile.email')" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>

        <el-form-item :label="$t('profile.verifyChannel')">
          <el-radio-group v-model="form.channel">
            <el-radio value="phone">{{ $t('profile.phone') }}</el-radio>
            <el-radio value="email">{{ $t('profile.email') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('profile.code')" prop="code">
          <div class="code-row">
            <el-input
              v-model="form.code"
              :placeholder="$t('profile.codePlaceholder')"
              maxlength="6"
            />
            <el-button :loading="sending" @click="handleSendCode">
              {{ $t('profile.getCode') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <div class="save-area">
            <el-alert
              v-if="changed"
              :title="$t('profile.changeTip')"
              type="info"
              :closable="false"
              show-icon
              class="change-tip"
            />
            <el-button type="primary" :loading="saving" :disabled="!changed" @click="handleSave">
              {{ $t('common.save') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  max-width: 720px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.profile-form {
  padding-top: 8px;
}

.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.save-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.change-tip {
  width: 100%;
}
</style>

<!-- 登录页：左侧品牌区 + 右侧登录面板（密码/SSO/找回） -->
<script setup lang="ts">
import { ref } from 'vue'
import PasswordLogin from './components/PasswordLogin.vue'
import SsoLogin from './components/SsoLogin.vue'
import ForgotAccount from './components/ForgotAccount.vue'
import LangSelect from '@/layout/components/LangSelect.vue'

const activeTab = ref('password')
</script>

<template>
  <div class="login-page">
    <div class="login-lang">
      <LangSelect light />
    </div>
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <el-icon :size="40" color="#fff"><Platform /></el-icon>
        </div>
        <h1 class="brand-title">{{ $t('layout.platformName') }}</h1>
        <p class="brand-subtitle">{{ $t('login.subtitle') }}</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据看板 · 实时掌握租赁经营</span>
          </div>
          <div class="feature-item">
            <el-icon><Lock /></el-icon>
            <span>动态权限 · 菜单按钮精细控制</span>
          </div>
          <div class="feature-item">
            <el-icon><Connection /></el-icon>
            <span>SSO 单点登录 · 企业级身份认证</span>
          </div>
        </div>
      </div>
    </div>

    <div class="login-panel">
      <div class="login-card">
        <h2 class="login-title">{{ $t('login.title') }}</h2>
        <el-tabs v-model="activeTab" stretch>
          <el-tab-pane :label="$t('login.passwordTab')" name="password">
            <PasswordLogin />
          </el-tab-pane>
          <el-tab-pane :label="$t('login.ssoTab')" name="sso">
            <SsoLogin />
          </el-tab-pane>
          <el-tab-pane :label="$t('login.forgotTab')" name="forgot">
            <ForgotAccount />
          </el-tab-pane>
        </el-tabs>

        <el-divider>
          <span class="demo-divider">{{ $t('login.demoTitle') }}</span>
        </el-divider>
        <div class="demo-accounts">
          <div class="demo-account">
            <span class="demo-role">{{ $t('login.demoAdmin') }}</span>
            <code>admin / 123456</code>
          </div>
          <div class="demo-account">
            <span class="demo-role">{{ $t('login.demoFinance') }}</span>
            <code>finance / 123456</code>
          </div>
          <div class="demo-account">
            <span class="demo-role">{{ $t('login.demoOperator') }}</span>
            <code>operator / 123456</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  position: relative;
  height: 100vh;
  display: flex;
  background: #f6f9fd;
}

.login-lang {
  position: absolute;
  top: 20px;
  right: 24px;
  z-index: 10;
}

.login-brand {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f3a6e 0%, #2b5aa0 50%, #409eff 100%);
  color: #fff;
}

.brand-content {
  max-width: 480px;
  padding: 40px;
}

.brand-logo {
  margin-bottom: 24px;
}

.brand-title {
  font-size: 30px;
  margin: 0 0 12px;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  opacity: 0.92;
}

.login-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 36px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgb(0 21 41 / 12%);
}

.login-title {
  margin: 0 0 20px;
  font-size: 22px;
  color: #303133;
  text-align: center;
}

.demo-divider {
  font-size: 12px;
  color: #909399;
}

.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;

  .demo-role {
    color: #606266;
  }

  code {
    color: #2f7bfe;
    background: #ecf5ff;
    border-radius: 3px;
    padding: 2px 6px;
  }
}

@media (width <= 900px) {
  .login-brand {
    display: none;
  }
}
</style>

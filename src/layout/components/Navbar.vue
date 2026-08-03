<script setup>
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import Breadcrumb from './Breadcrumb.vue'
import LangSelect from './LangSelect.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 取消操作
    }
  } else if (command === 'profile') {
    ElMessage.info('个人中心开发中')
  }
}
</script>

<template>
  <div class="navbar">
    <div class="navbar-left">
      <el-icon class="hamburger" :size="20" @click="appStore.toggleSidebar()">
        <Expand v-if="appStore.sidebarCollapsed" />
        <Fold v-else />
      </el-icon>
      <Breadcrumb />
    </div>
    <div class="navbar-right">
      <LangSelect />
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="user-trigger">
          <el-avatar :size="30" class="user-avatar">
            {{ userStore.name ? userStore.name.slice(0, 1) : 'U' }}
          </el-avatar>
          <span class="user-name">{{ userStore.name }}</span>
          <el-icon><CaretBottom /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              {{ $t('layout.profile') }}
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              {{ $t('common.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(90deg, #4b9bff 0%, #2f7bfe 100%);
  box-shadow: 0 2px 8px rgb(47 123 254 / 25%);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hamburger {
  cursor: pointer;
  color: #fff;
  opacity: 0.92;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #fff;
  outline: none;
}

.user-avatar {
  background: rgb(255 255 255 / 28%);
  color: #fff;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  color: rgb(255 255 255 / 92%);
}
</style>

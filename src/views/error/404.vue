<!-- 404 错误页 -->
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="code">404</div>
    <p class="desc">{{ $t('common.pageNotFound') }}</p>
    <el-button type="primary" @click="router.push('/')">{{ $t('common.backHome') }}</el-button>
  </div>
</template>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f6f9fd;
}

.code {
  font-size: 96px;
  font-weight: 700;
  color: #2f7bfe;
}

.desc {
  margin: 12px 0 24px;
  color: #909399;
  font-size: 16px;
}
</style>

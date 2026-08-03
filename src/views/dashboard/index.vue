<!-- 首页数据看板：指标卡片、设备看板、回款趋势、工时统计、待办 -->
<script setup lang="ts">
defineOptions({ name: 'Dashboard' })

import { onMounted, ref } from 'vue'
import {
  getDashboardStats,
  getPaymentTrend,
  getEquipmentBoard,
  getHoursStat,
  getTodos,
} from '@/api/dashboard'
import { STAT_CARD_META } from '@/constants'
import { useUserStore } from '@/store/user'
import type {
  EquipmentBoard as EquipmentBoardData,
  HoursStat,
  PaymentTrend,
  StatCard,
  TodoItem,
} from '@/types'
import StatCards from './components/StatCards.vue'
import EquipmentBoard from './components/EquipmentBoard.vue'
import PaymentTrendChart from './components/PaymentTrendChart.vue'
import HoursChart from './components/HoursChart.vue'
import TodoList from './components/TodoList.vue'

const userStore = useUserStore()
const loading = ref(true)

const stats = ref<StatCard[]>([])
const equipment = ref<EquipmentBoardData | null>(null)
const trend = ref<PaymentTrend | null>(null)
const hours = ref<HoursStat | null>(null)
const todos = ref<TodoItem[]>([])

const errorMessage = ref('')

/** 并行加载看板全部数据 */
async function loadAll(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const [statsRes, equipmentRes, trendRes, hoursRes, todosRes] = await Promise.all([
      getDashboardStats(),
      getEquipmentBoard(),
      getPaymentTrend(),
      getHoursStat(),
      getTodos(),
    ])
    const s = statsRes.data
    stats.value = STAT_CARD_META.map((meta) => ({
      ...meta,
      value: s[meta.key].value,
      trend: s[meta.key].trend,
    }))
    equipment.value = equipmentRes.data
    trend.value = trendRes.data
    hours.value = hoursRes.data
    todos.value = todosRes.data
  } catch (error) {
    errorMessage.value = (error as Error | undefined)?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

/** 待办处理完成后从列表移除 */
function handleTodoHandled(id: number): void {
  todos.value = todos.value.filter((t) => t.id !== id)
}

onMounted(loadAll)
</script>

<template>
  <div v-loading="loading" class="app-container dashboard">
    <div class="welcome-bar">
      <h2>{{ $t('dashboard.title') }}</h2>
      <span class="welcome-text">{{ $t('dashboard.welcome') }}，{{ userStore.name }} 👋</span>
    </div>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
      class="load-error"
    />

    <template v-if="!errorMessage">
      <StatCards :stats="stats" />

      <el-row :gutter="16" class="dashboard-row">
        <el-col :xs="24" :lg="14" class="dashboard-col">
          <el-card class="page-card dashboard-card">
            <template #header>
              <span class="card-title">{{ $t('dashboard.equipmentBoard') }}</span>
            </template>
            <EquipmentBoard v-if="equipment" :data="equipment" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="10" class="dashboard-col">
          <el-card class="page-card dashboard-card">
            <template #header>
              <span class="card-title">{{ $t('dashboard.todos') }}</span>
            </template>
            <TodoList :todos="todos" @handled="handleTodoHandled" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="dashboard-row">
        <el-col :xs="24" :lg="12">
          <el-card class="page-card">
            <template #header>
              <span class="card-title">{{ $t('dashboard.paymentTrend') }}</span>
            </template>
            <PaymentTrendChart v-if="trend" :data="trend" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="page-card">
            <template #header>
              <span class="card-title">{{ $t('dashboard.hoursStat') }}</span>
            </template>
            <HoursChart v-if="hours" :data="hours" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.welcome-bar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 21px;
  }

  .welcome-text {
    color: #909399;
    font-size: 14px;
  }
}

.dashboard-row {
  margin-top: 16px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.load-error {
  margin-top: 12px;
}

/* 设备看板与待办卡片等高，内容区弹性填满 */
.dashboard-col {
  display: flex;

  .dashboard-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
  }
}
</style>

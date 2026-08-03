<script setup>
defineOptions({ name: 'Dashboard' })

import { onMounted, reactive, ref } from 'vue'
import {
  getDashboardStats,
  getPaymentTrend,
  getEquipmentBoard,
  getHoursStat,
  getTodos
} from '@/api/dashboard'
import { useUserStore } from '@/store/user'
import StatCards from './components/StatCards.vue'
import EquipmentBoard from './components/EquipmentBoard.vue'
import PaymentTrendChart from './components/PaymentTrendChart.vue'
import HoursChart from './components/HoursChart.vue'
import TodoList from './components/TodoList.vue'

const userStore = useUserStore()
const loading = ref(true)

const stats = ref([])
const equipment = ref(null)
const trend = ref(null)
const hours = ref(null)
const todos = ref([])

const errorMessage = ref('')

async function loadAll() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [statsRes, equipmentRes, trendRes, hoursRes, todosRes] = await Promise.all([
      getDashboardStats(),
      getEquipmentBoard(),
      getPaymentTrend(),
      getHoursStat(),
      getTodos()
    ])
    const s = statsRes.data
    stats.value = [
      { key: 'totalRental', icon: 'Coin', color: '#409eff', value: s.totalRental.value, unit: 'dashboard.unitYuan', trend: s.totalRental.trend },
      { key: 'receivables', icon: 'Wallet', color: '#e6a23c', value: s.receivables.value, unit: 'dashboard.unitYuan', trend: s.receivables.trend },
      { key: 'pendingDistribute', icon: 'Money', color: '#67c23a', value: s.pendingDistribute.value, unit: 'dashboard.unitYuan', trend: s.pendingDistribute.trend },
      { key: 'monthInvoicePending', icon: 'Document', color: '#f56c6c', value: s.monthInvoicePending.value, unit: 'dashboard.unitCount', trend: s.monthInvoicePending.trend },
      { key: 'monthDistribute', icon: 'CreditCard', color: '#9c27b0', value: s.monthDistribute.value, unit: 'dashboard.unitYuan', trend: s.monthDistribute.trend },
      { key: 'monthInvoice', icon: 'Tickets', color: '#00bcd4', value: s.monthInvoice.value, unit: 'dashboard.unitYuan', trend: s.monthInvoice.trend }
    ]
    equipment.value = equipmentRes.data
    trend.value = trendRes.data
    hours.value = hoursRes.data
    todos.value = todosRes.data
  } catch (error) {
    errorMessage.value = error?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function handleTodoHandled(id) {
  todos.value = todos.value.filter((t) => t.id !== id)
}

onMounted(loadAll)
</script>

<template>
  <div class="app-container dashboard" v-loading="loading">
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
        <el-col :xs="24" :lg="14">
          <el-card class="page-card">
            <template #header>
              <span class="card-title">{{ $t('dashboard.equipmentBoard') }}</span>
            </template>
            <EquipmentBoard v-if="equipment" :data="equipment" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="10">
          <el-card class="page-card">
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
</style>

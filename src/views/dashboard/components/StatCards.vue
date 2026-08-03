<!-- 六大核心指标卡片 -->
<script setup lang="ts">
import { formatMoney } from '@/utils/format'
import TextEllipsis from '@/components/TextEllipsis.vue'
import type { StatCard } from '@/types'

defineProps<{ stats: StatCard[] }>()
</script>

<template>
  <el-row :gutter="16">
    <el-col v-for="item in stats" :key="item.key" :xs="12" :sm="12" :md="8" :lg="4">
      <div class="stat-card">
        <div class="stat-icon" :style="{ background: `${item.color}1a`, color: item.color }">
          <el-icon :size="24"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <TextEllipsis class="stat-label" :content="$t(`dashboard.${item.key}`)" />
          <div class="stat-value" :title="`${formatMoney(item.value)} ${$t(item.unit)}`">
            {{ formatMoney(item.value) }}
            <span class="stat-unit">{{ $t(item.unit) }}</span>
          </div>
          <div
            class="stat-trend"
            :class="item.trend >= 0 ? 'up' : 'down'"
            :style="{
              background: `${item.color}14`,
              color: item.trend >= 0 ? item.color : '#ef4444',
            }"
          >
            <el-icon :size="12">
              <CaretTop v-if="item.trend >= 0" />
              <CaretBottom v-else />
            </el-icon>
            {{ Math.abs(item.trend) }}%
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e6eefb;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgb(31 60 120 / 6%);
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgb(31 60 120 / 12%);
  }
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
}

.stat-body {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #7a8699;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 19px;
  font-weight: 700;
  color: #2b3a55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-unit {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.85;
  margin-left: 2px;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
  border-radius: 10px;
  padding: 0 6px;
}
</style>

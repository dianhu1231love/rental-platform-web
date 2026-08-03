<!-- 设备看板：设备统计 + 状态分布环形图 -->
<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import { formatPercent } from '@/utils/format'
import BaseChart from '@/components/BaseChart.vue'
import type { EquipmentBoard } from '@/types'

const props = defineProps<{ data: EquipmentBoard }>()

const pieOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 台 ({d}%)' },
  legend: { bottom: 0 },
  color: ['#67c23a', '#909399', '#f56c6c'],
  series: [
    {
      name: '设备状态',
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '46%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontWeight: 'bold' } },
      data: [
        { name: '在租', value: props.data.renting },
        { name: '空闲', value: props.data.idle },
        { name: '维修中', value: props.data.maintenance },
      ],
    },
  ],
}))
</script>

<template>
  <div class="equipment-board">
    <div class="equipment-left">
      <div class="equip-item">
        <span class="equip-label">{{ $t('dashboard.equipmentTotal') }}</span>
        <span class="equip-value">{{ data.total }}</span>
      </div>
      <div class="equip-item">
        <span class="equip-label">{{ $t('dashboard.renting') }}</span>
        <span class="equip-value renting">{{ data.renting }}</span>
      </div>
      <div class="equip-item">
        <span class="equip-label">{{ $t('dashboard.idle') }}</span>
        <span class="equip-value idle">{{ data.idle }}</span>
      </div>
      <div class="equip-item">
        <span class="equip-label">{{ $t('dashboard.maintenance') }}</span>
        <span class="equip-value maintenance">{{ data.maintenance }}</span>
      </div>
      <div class="rate-block">
        <div class="rate-label">
          <span>{{ $t('dashboard.occupancyRate') }}</span>
          <b>{{ formatPercent(data.occupancyRate) }}</b>
        </div>
        <el-progress
          :percentage="data.occupancyRate"
          :stroke-width="10"
          :show-text="false"
          color="#2f7bfe"
        />
      </div>
      <div class="rate-block">
        <div class="rate-label">
          <span>{{ $t('dashboard.onlineRate') }}</span>
          <b>{{ formatPercent(data.onlineRate) }}</b>
        </div>
        <el-progress
          :percentage="data.onlineRate"
          :stroke-width="10"
          :show-text="false"
          color="#67c23a"
        />
      </div>
    </div>
    <div class="equipment-right">
      <p class="chart-title">{{ $t('dashboard.statusDistribute') }}</p>
      <BaseChart :option="pieOption" height="220px" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.equipment-board {
  display: flex;
  gap: 20px;
}

.equipment-left {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.equip-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;

  .equip-label {
    font-size: 12px;
    color: #909399;
  }

  .equip-value {
    font-size: 22px;
    font-weight: 700;

    &.renting {
      color: #67c23a;
    }

    &.idle {
      color: #909399;
    }

    &.maintenance {
      color: #f56c6c;
    }
  }
}

.rate-block {
  grid-column: span 1;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;

  .rate-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #606266;
    margin-bottom: 8px;

    b {
      color: #303133;
    }
  }
}

.equipment-right {
  flex: 1;

  .chart-title {
    margin: 0 0 4px;
    font-size: 13px;
    color: #606266;
    text-align: center;
  }
}
</style>

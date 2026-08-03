<!-- 近六个月计划/实际回款对比柱状图 -->
<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/BaseChart.vue'
import type { PaymentTrend } from '@/types'

const props = defineProps<{ data: PaymentTrend }>()

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    valueFormatter: (v) => `${v} 万`,
  },
  legend: { data: ['计划回款', '实际回款'] },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: props.data.months.map((m) => `${Number(m.slice(5, 7))}月`),
    axisTick: { alignWithLabel: true },
  },
  yAxis: {
    type: 'value',
    name: '万元',
    splitLine: { lineStyle: { type: 'dashed' } },
  },
  series: [
    {
      name: '计划回款',
      type: 'bar',
      barWidth: 18,
      itemStyle: { color: '#bcd6ff', borderRadius: [4, 4, 0, 0] },
      data: props.data.planned,
    },
    {
      name: '实际回款',
      type: 'bar',
      barWidth: 18,
      itemStyle: { color: '#2f7bfe', borderRadius: [4, 4, 0, 0] },
      data: props.data.actual,
    },
  ],
}))
</script>

<template>
  <BaseChart :option="option" height="320px" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/BaseChart.vue'
import type { HoursStat } from '@/types'

const props = defineProps<{ data: HoursStat }>()

const option = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['计划工时', '实际工时', '工时利用率'] },
  grid: { left: 60, right: 60, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: props.data.categories,
    axisTick: { alignWithLabel: true },
  },
  yAxis: [
    {
      type: 'value',
      name: '小时',
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    {
      type: 'value',
      name: '%',
      min: 0,
      max: 100,
      splitLine: { show: false },
      axisLabel: { formatter: '{value}%' },
    },
  ],
  series: [
    {
      name: '计划工时',
      type: 'bar',
      barWidth: 14,
      itemStyle: { color: '#c7d8f2', borderRadius: [4, 4, 0, 0] },
      data: props.data.plan,
    },
    {
      name: '实际工时',
      type: 'bar',
      barWidth: 14,
      itemStyle: { color: '#2f7bfe', borderRadius: [4, 4, 0, 0] },
      data: props.data.actual,
    },
    {
      name: '工时利用率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbolSize: 7,
      itemStyle: { color: '#e6a23c' },
      data: props.data.utilization,
    },
  ],
}))
</script>

<template>
  <BaseChart :option="option" height="320px" />
</template>

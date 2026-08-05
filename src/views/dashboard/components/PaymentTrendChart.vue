<!-- 近六个月计划/实际回款对比柱状图 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/BaseChart.vue'
import type { PaymentTrend } from '@/types'

const props = defineProps<{ data: PaymentTrend }>()
const { t, locale } = useI18n()

/** 月份轴标签：中文显示「1月」，英文显示「Jan」 */
const monthLabels = computed(() =>
  props.data.months.map((m) => {
    const date = new Date(`${m}-01T00:00:00`)
    const isZh = locale.value === 'zh-CN'
    const label = new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', {
      month: isZh ? 'numeric' : 'short',
    }).format(date)
    return `${label}${t('dashboard.monthSuffix')}`
  }),
)

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    valueFormatter: (v) => `${v}${t('dashboard.unitWan')}`,
  },
  legend: { data: [t('dashboard.planned'), t('dashboard.actual')] },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: monthLabels.value,
    axisTick: { alignWithLabel: true },
  },
  yAxis: {
    type: 'value',
    name: t('dashboard.unitWan'),
    splitLine: { lineStyle: { type: 'dashed' } },
  },
  series: [
    {
      name: t('dashboard.planned'),
      type: 'bar',
      barWidth: 18,
      itemStyle: { color: '#bcd6ff', borderRadius: [4, 4, 0, 0] },
      data: props.data.planned,
    },
    {
      name: t('dashboard.actual'),
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

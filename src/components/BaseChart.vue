<script setup lang="ts">
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: string
    autoresize?: boolean
  }>(),
  {
    height: '320px',
    autoresize: true,
  },
)

const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function render(): void {
  if (chart) {
    chart.setOption(props.option, true)
  }
}

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  render()
  if (props.autoresize && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => chart && chart.resize())
    resizeObserver.observe(el.value)
  }
})

watch(() => props.option, render, { deep: true })

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<template>
  <div ref="el" class="base-chart" :style="{ height }" />
</template>

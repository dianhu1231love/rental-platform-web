<script setup>
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '320px' },
  autoresize: { type: Boolean, default: true }
})

const el = ref(null)
let chart = null
let resizeObserver = null

function render() {
  if (chart) {
    chart.setOption(props.option, true)
  }
}

onMounted(() => {
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

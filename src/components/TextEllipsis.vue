<!-- 文本省略组件：单行/多行省略，文本溢出时显示 tooltip 展示完整内容 -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 完整文本内容 */
    content: string
    /** 最大显示行数（大于 1 时为多行省略） */
    lines?: number
  }>(),
  { lines: 1 },
)

const el = ref<HTMLElement>()
const overflow = ref(false)
let observer: ResizeObserver | null = null

/** 检测文本是否溢出容器 */
function checkOverflow(): void {
  const node = el.value
  if (!node) return
  if (props.lines > 1) {
    overflow.value = node.scrollHeight > node.clientHeight + 1
  } else {
    overflow.value = node.scrollWidth > node.clientWidth + 1
  }
}

onMounted(() => {
  nextTick(checkOverflow)
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(checkOverflow)
    observer.observe(el.value as HTMLElement)
  }
})

watch(
  () => props.content,
  () => nextTick(checkOverflow),
)

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <el-tooltip :disabled="!overflow" :content="content" placement="top" :show-after="150">
    <span
      ref="el"
      class="text-ellipsis"
      :class="{ multiline: lines > 1 }"
      :style="lines > 1 ? { WebkitLineClamp: lines } : null"
    >
      {{ content }}
    </span>
  </el-tooltip>
</template>

<style scoped>
.text-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.multiline {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  white-space: normal;
  word-break: break-all;
}
</style>

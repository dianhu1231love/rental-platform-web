<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { handleTodo } from '@/api/dashboard'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  todos: { type: Array, default: () => [] },
})

const emit = defineEmits(['handled'])
const { t } = useI18n()
const loadingId = ref(null)

const typeMap = {
  contract: { labelKey: 'dashboard.todoContract', type: 'primary' },
  distribute: { labelKey: 'dashboard.todoDistribute', type: 'warning' },
  invoice: { labelKey: 'dashboard.todoInvoice', type: 'success' },
}

const priorityMap = {
  high: '#f56c6c',
  medium: '#e6a23c',
  low: '#67c23a',
}

async function handle(todo, action) {
  loadingId.value = todo.id
  try {
    await handleTodo(todo.id, action)
    ElMessage.success(t('dashboard.todoHandled', { title: todo.title }))
    emit('handled', todo.id)
  } finally {
    loadingId.value = null
  }
}
</script>

<template>
  <div v-if="todos.length" class="todo-list">
    <div v-for="todo in todos" :key="todo.id" class="todo-item">
      <div class="todo-main">
        <div class="todo-head">
          <el-tag :type="typeMap[todo.type]?.type || 'info'" size="small">
            {{ $t(typeMap[todo.type]?.labelKey || '') }}
          </el-tag>
          <span class="todo-time">{{ todo.time }}</span>
        </div>
        <p class="todo-title" :title="todo.title">{{ todo.title }}</p>
        <div class="todo-meta">
          <span class="todo-applicant">{{ todo.applicant }}</span>
          <span class="priority-dot" :style="{ background: priorityMap[todo.priority] }" />
        </div>
      </div>
      <div class="todo-actions">
        <el-button
          size="small"
          type="primary"
          plain
          :loading="loadingId === todo.id"
          @click="handle(todo, 'approve')"
        >
          {{ $t('dashboard.approve') }}
        </el-button>
        <el-button
          size="small"
          type="danger"
          plain
          :disabled="loadingId === todo.id"
          @click="handle(todo, 'reject')"
        >
          {{ $t('dashboard.reject') }}
        </el-button>
      </div>
    </div>
  </div>
  <el-empty v-else :description="$t('dashboard.todoEmpty')" :image-size="90" />
</template>

<style lang="scss" scoped>
.todo-list {
  max-height: 330px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;

  &:last-child {
    border-bottom: none;
  }
}

.todo-main {
  flex: 1;
  min-width: 0;
}

.todo-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.todo-time {
  font-size: 13px;
  color: #c0c4cc;
}

.todo-title {
  margin: 0 0 6px;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.todo-applicant {
  font-size: 13px;
  color: #909399;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.todo-actions {
  flex-shrink: 0;
}
</style>

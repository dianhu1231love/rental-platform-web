<!-- 产品型号管理：CRUD + 多功能表格 -->
<script setup lang="ts">
defineOptions({ name: 'EquipmentModel' })

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createModel, deleteModel, getGroupList, getModelList, updateModel } from '@/api/equipment'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type { EquipmentGroup, EquipmentModel } from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<EquipmentModel[]>([])
const groups = ref<EquipmentGroup[]>([])
const keyword = ref('')

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (item) =>
      item.name.toLowerCase().includes(kw) || (item.remark || '').toLowerCase().includes(kw),
  )
})

const columns: TableColumn[] = [
  { prop: 'name', label: t('equipment.modelName'), minWidth: 180 },
  { prop: 'group', label: t('equipment.group'), width: 150 },
  { prop: 'remark', label: t('common.remark'), minWidth: 200, showOverflowTooltip: true },
  { prop: 'createdAt', label: t('common.createdAt'), width: 170 },
  { prop: 'action', label: t('common.action'), width: 130, fixed: 'right', hideable: false },
]

const filters: FilterField[] = [{ prop: 'keyword', label: t('equipment.modelName'), type: 'input' }]

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const form = reactive({
  id: null as number | null,
  name: '',
  groupId: null as number | null,
  remark: '',
})
const formRules: FormRules = {
  name: [{ required: true, message: () => t('equipment.modelName'), trigger: 'blur' }],
  groupId: [{ required: true, message: () => t('equipment.group'), trigger: 'change' }],
}

function groupName(id: number): string {
  return groups.value.find((g) => g.id === id)?.name || '-'
}

async function loadList(): Promise<void> {
  loading.value = true
  try {
    list.value = (await getModelList()).data
  } finally {
    loading.value = false
  }
}

function handleSearch(condition: Record<string, unknown>): void {
  keyword.value = (condition.keyword as string) || ''
}

function handleReset(): void {
  keyword.value = ''
}

function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, { id: null, name: '', groupId: null, remark: '' })
  dialogVisible.value = true
}

function openEdit(row: EquipmentModel): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    groupId: row.groupId,
    remark: row.remark,
  })
  dialogVisible.value = true
}

async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createModel({ name: form.name, groupId: form.groupId as number, remark: form.remark })
    } else {
      await updateModel(form.id as number, {
        name: form.name,
        groupId: form.groupId as number,
        remark: form.remark,
      })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: EquipmentModel): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteModel(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消
  }
}

onMounted(async () => {
  groups.value = (await getGroupList()).data
  loadList()
})
</script>

<template>
  <div class="app-container">
    <el-card class="page-card">
      <SmartTable
        :columns="columns"
        :data="filteredList"
        :filters="filters"
        :loading="loading"
        exportable
        export-name="产品型号"
        row-key="id"
        @search="handleSearch"
        @reset="handleReset"
      >
        <template #toolbar>
          <el-button v-permission="['equipment:model:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('common.add') }}
          </el-button>
        </template>
        <template #col-group="{ row }">
          {{ groupName(row.groupId) }}
        </template>
        <template #col-action="{ row }">
          <el-button
            v-permission="['equipment:model:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['equipment:model:delete']"
            size="small"
            type="danger"
            link
            @click="handleDelete(row)"
          >
            {{ $t('common.delete') }}
          </el-button>
        </template>
      </SmartTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? $t('common.add') : $t('common.edit')"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('equipment.modelName')" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('equipment.group')" prop="groupId">
          <el-select v-model="form.groupId" style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

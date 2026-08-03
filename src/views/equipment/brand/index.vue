<!-- 设备品牌管理：CRUD + 多功能表格 -->
<script setup lang="ts">
defineOptions({ name: 'EquipmentBrand' })

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { createBrand, deleteBrand, getBrandList, updateBrand } from '@/api/equipment'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type { EquipmentBrand } from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<EquipmentBrand[]>([])
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
  { prop: 'name', label: t('equipment.brandName'), minWidth: 180 },
  { prop: 'remark', label: t('common.remark'), minWidth: 220, showOverflowTooltip: true },
  { prop: 'createdAt', label: t('common.createdAt'), width: 170 },
  { prop: 'action', label: t('common.action'), width: 130, fixed: 'right', hideable: false },
]

const filters: FilterField[] = [{ prop: 'keyword', label: t('equipment.brandName'), type: 'input' }]

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const form = reactive({ id: null as number | null, name: '', remark: '' })
const formRules: FormRules = {
  name: [{ required: true, message: () => t('equipment.brandName'), trigger: 'blur' }],
}

async function loadList(): Promise<void> {
  loading.value = true
  try {
    list.value = (await getBrandList()).data
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
  Object.assign(form, { id: null, name: '', remark: '' })
  dialogVisible.value = true
}

function openEdit(row: EquipmentBrand): void {
  dialogMode.value = 'edit'
  Object.assign(form, { id: row.id, name: row.name, remark: row.remark })
  dialogVisible.value = true
}

async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createBrand({ name: form.name, remark: form.remark })
    } else {
      await updateBrand(form.id as number, { name: form.name, remark: form.remark })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: EquipmentBrand): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteBrand(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消
  }
}

onMounted(loadList)
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
        export-name="设备品牌"
        row-key="id"
        @search="handleSearch"
        @reset="handleReset"
      >
        <template #toolbar>
          <el-button v-permission="['equipment:brand:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('common.add') }}
          </el-button>
        </template>
        <template #col-action="{ row }">
          <el-button
            v-permission="['equipment:brand:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['equipment:brand:delete']"
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
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item :label="$t('equipment.brandName')" prop="name">
          <el-input v-model="form.name" />
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

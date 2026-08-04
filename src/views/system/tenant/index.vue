<!-- 租户管理：分页搜索、CRUD、启停用 -->
<script setup lang="ts">
defineOptions({ name: 'TenantManage' })

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getTenantList,
  createTenant,
  updateTenant,
  deleteTenant,
  updateTenantStatus,
} from '@/api/system'
import { isValidPhone } from '@/utils/validate'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type { Tenant, TenantFormModel } from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<Tenant[]>([])
const total = ref(0)

/** 分页参数（与 SmartTable 的 v-model 双向绑定） */
const query = reactive({
  page: 1,
  pageSize: 10,
})

/** 搜索条件（由 SmartTable 筛选面板驱动） */
const searchParams = reactive({
  keyword: '',
  status: '' as number | '',
})

/** 表格列配置（computed：语言切换时自动重建文案） */
const columns = computed<TableColumn[]>(() => [
  { prop: 'name', label: t('tenant.name'), minWidth: 200, showOverflowTooltip: true },
  { prop: 'code', label: t('tenant.code'), width: 110 },
  { prop: 'contact', label: t('tenant.contact'), width: 110 },
  { prop: 'phone', label: t('tenant.phone'), width: 130 },
  {
    prop: 'plan',
    label: t('tenant.plan'),
    width: 100,
    align: 'center',
    statusMap: {
      企业版: { type: 'danger' },
      专业版: { type: 'warning' },
      标准版: { type: 'info' },
    },
  },
  { prop: 'expireAt', label: t('tenant.expireAt'), width: 120, align: 'center' },
  { prop: 'status', label: t('common.status'), width: 110, align: 'center' },
  { prop: 'remark', label: t('common.remark'), minWidth: 140, showOverflowTooltip: true },
  { prop: 'createdAt', label: t('common.createdAt'), width: 165 },
  { prop: 'action', label: t('common.action'), width: 140, fixed: 'right', hideable: false },
])

/** 筛选面板配置 */
const filters = computed<FilterField[]>(() => [
  { prop: 'keyword', label: t('tenant.namePlaceholder'), type: 'input' },
  {
    prop: 'status',
    label: t('common.status'),
    type: 'select',
    options: [
      { label: t('common.enabled'), value: 1 },
      { label: t('common.disabled'), value: 0 },
    ],
  },
])

const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref<FormInstance>()

const form = reactive<TenantFormModel>({
  id: null,
  name: '',
  code: '',
  contact: '',
  phone: '',
  plan: '标准版',
  expireAt: '',
  remark: '',
  status: 1,
})

const formRules: FormRules = {
  name: [{ required: true, message: () => t('tenant.namePlaceholder'), trigger: 'blur' }],
  code: [{ required: true, message: () => t('tenant.codePlaceholder'), trigger: 'blur' }],
  contact: [{ required: true, message: () => t('tenant.contactPlaceholder'), trigger: 'blur' }],
  phone: [
    { required: true, message: () => t('tenant.phonePlaceholder'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidPhone(value)) callback(new Error(t('tenant.phonePlaceholder')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  plan: [{ required: true, message: () => t('tenant.planPlaceholder'), trigger: 'change' }],
  expireAt: [{ required: true, message: () => t('tenant.expireAtPlaceholder'), trigger: 'change' }],
}

/** 按查询条件加载租户列表 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getTenantList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: searchParams.keyword,
      status: searchParams.status,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

/** 搜索：同步筛选条件、回到第一页并刷新 */
function handleSearch(condition: Record<string, unknown>): void {
  searchParams.keyword = (condition.keyword as string) || ''
  searchParams.status = condition.status !== undefined ? (condition.status as number) : ''
  query.page = 1
  loadList()
}

/** 重置搜索条件 */
function handleReset(): void {
  searchParams.keyword = ''
  searchParams.status = ''
  query.page = 1
  loadList()
}

/** 打开新增弹窗 */
function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    contact: '',
    phone: '',
    plan: '标准版',
    expireAt: '',
    remark: '',
    status: 1,
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗并回显 */
function openEdit(row: Tenant): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    contact: row.contact,
    phone: row.phone,
    plan: row.plan,
    expireAt: row.expireAt,
    remark: row.remark,
    status: row.status,
  })
  dialogVisible.value = true
}

/** 保存租户（新增/更新） */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createTenant({
        name: form.name,
        code: form.code,
        contact: form.contact,
        phone: form.phone,
        plan: form.plan,
        expireAt: form.expireAt,
        remark: form.remark,
        status: form.status,
      })
    } else {
      await updateTenant(form.id as number, { ...form, id: form.id as number })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

/** 启停租户（失败时回滚开关状态） */
async function handleToggleStatus(row: Tenant): Promise<void> {
  try {
    await updateTenantStatus(row.id, row.status)
    ElMessage.success(t('common.success'))
  } catch {
    row.status = row.status === 1 ? 0 : 1
  }
}

/** 删除租户（含确认） */
async function handleDelete(row: Tenant): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteTenant(row.id)
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
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        :columns="columns"
        :data="list"
        :filters="filters"
        :loading="loading"
        :total="total"
        paginated
        exportable
        export-name="租户列表"
        row-key="id"
        show-index
        @search="handleSearch"
        @reset="handleReset"
        @page-change="loadList"
      >
        <template #toolbar>
          <el-button v-permission="['system:tenant:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('tenant.add') }}
          </el-button>
        </template>

        <template #col-status="{ row }">
          <div class="status-cell">
            <el-switch
              v-model="row.status"
              v-permission="['system:tenant:edit']"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
          </div>
        </template>

        <template #col-action="{ row }">
          <el-button
            v-permission="['system:tenant:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['system:tenant:delete']"
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
      :title="dialogMode === 'create' ? $t('tenant.add') : $t('tenant.edit')"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('tenant.name')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('tenant.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('tenant.code')" prop="code">
          <el-input v-model="form.code" :placeholder="$t('tenant.codePlaceholder')" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('tenant.contact')" prop="contact">
              <el-input v-model="form.contact" :placeholder="$t('tenant.contactPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('tenant.phone')" prop="phone">
              <el-input v-model="form.phone" :placeholder="$t('tenant.phonePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('tenant.plan')" prop="plan">
              <el-select v-model="form.plan" style="width: 100%">
                <el-option :label="$t('tenant.planStandard')" value="标准版" />
                <el-option :label="$t('tenant.planProfessional')" value="专业版" />
                <el-option :label="$t('tenant.planEnterprise')" value="企业版" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('tenant.expireAt')" prop="expireAt">
              <el-date-picker
                v-model="form.expireAt"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :placeholder="$t('tenant.expireAtPlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('common.status')">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="$t('common.remark')">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            :placeholder="$t('common.remark')"
          />
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

<style lang="scss" scoped>
.status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

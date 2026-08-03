<script setup lang="ts">
defineOptions({ name: 'TenantManage' })

import { onMounted, reactive, ref } from 'vue'
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
import type { Tenant } from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<Tenant[]>([])
const total = ref(0)

const query = reactive<{
  page: number
  pageSize: number
  keyword: string
  status: number | ''
}>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
})

const dialogVisible = ref(false)
const dialogMode = ref('create')
const formRef = ref<FormInstance>()

interface TenantFormModel {
  id: number | null
  name: string
  code: string
  contact: string
  phone: string
  plan: string
  expireAt: string
  remark: string
  status: number
}

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

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getTenantList({ ...query })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  query.page = 1
  loadList()
}

function handleReset(): void {
  query.keyword = ''
  query.status = ''
  query.page = 1
  loadList()
}

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

async function handleToggleStatus(row: Tenant): Promise<void> {
  try {
    await updateTenantStatus(row.id, row.status)
    ElMessage.success(t('common.success'))
  } catch {
    row.status = row.status === 1 ? 0 : 1
  }
}

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

function planTag(plan: string): 'danger' | 'warning' | 'info' {
  if (plan === '企业版') return 'danger'
  if (plan === '专业版') return 'warning'
  return 'info'
}

onMounted(loadList)
</script>

<template>
  <div class="app-container">
    <el-card class="page-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.keyword"
            :placeholder="$t('tenant.namePlaceholder')"
            clearable
            style="width: 240px"
            :prefix-icon="'Search'"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select
            v-model="query.status"
            :placeholder="$t('common.all')"
            clearable
            style="width: 130px"
            @change="handleSearch"
          >
            <el-option :label="$t('common.enabled')" :value="1" />
            <el-option :label="$t('common.disabled')" :value="0" />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            {{ $t('common.search') }}
          </el-button>
          <el-button @click="handleReset">{{ $t('common.reset') }}</el-button>
        </div>
        <el-button v-permission="['system:tenant:add']" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>
          {{ $t('tenant.add') }}
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column
          :label="$t('tenant.name')"
          prop="name"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column :label="$t('tenant.code')" prop="code" width="110" />
        <el-table-column :label="$t('tenant.contact')" prop="contact" width="110" />
        <el-table-column :label="$t('tenant.phone')" prop="phone" width="130" />
        <el-table-column :label="$t('tenant.plan')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="planTag(row.plan)" size="small">{{ row.plan }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('tenant.expireAt')"
          prop="expireAt"
          width="120"
          align="center"
        />
        <el-table-column :label="$t('common.status')" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              v-permission="['system:tenant:edit']"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.remark')"
          prop="remark"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column :label="$t('common.createdAt')" prop="createdAt" width="165" />
        <el-table-column :label="$t('common.action')" width="140" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @change="loadList"
        />
      </div>
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

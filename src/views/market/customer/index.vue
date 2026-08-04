<!-- 客户管理：分页搜索、CRUD；点击客户编码跳转详情（详情页开发中） -->
<script setup lang="ts">
defineOptions({ name: 'CustomerManage' })

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  createCustomer,
  deleteCustomer,
  getCustomerList,
  updateCustomer,
  updateCustomerStatus,
} from '@/api/market'
import { isValidEmail, isValidPhone } from '@/utils/validate'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type {
  Customer,
  CustomerFormModel,
  CustomerLevel,
  CustomerSource,
  CustomerType,
} from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<Customer[]>([])
const total = ref(0)

/** 分页参数（与 SmartTable 的 v-model 双向绑定） */
const query = reactive({
  page: 1,
  pageSize: 10,
})

/** 搜索条件（由 SmartTable 筛选面板驱动） */
const searchParams = reactive({
  keyword: '',
  type: '' as CustomerType | '',
  status: '' as number | '',
})

/** 客户性质选项（computed：语言切换时自动重建文案） */
const TYPE_OPTIONS = computed<
  Array<{ value: CustomerType; label: string; type: 'success' | 'warning' }>
>(() => [
  { value: 'enterprise', label: t('customer.typeEnterprise'), type: 'warning' },
  { value: 'individual', label: t('customer.typeIndividual'), type: 'success' },
])

/** 客户等级选项（computed：语言切换时自动重建文案） */
const LEVEL_OPTIONS = computed<
  Array<{ value: CustomerLevel; label: string; type: 'danger' | 'primary' | 'info' }>
>(() => [
  { value: 'key', label: t('customer.levelKey'), type: 'danger' },
  { value: 'normal', label: t('customer.levelNormal'), type: 'primary' },
  { value: 'potential', label: t('customer.levelPotential'), type: 'info' },
])

/** 客户来源选项（computed：语言切换时自动重建文案） */
const SOURCE_OPTIONS = computed<Array<{ value: CustomerSource; label: string }>>(() => [
  { value: 'referral', label: t('customer.sourceReferral') },
  { value: 'exhibition', label: t('customer.sourceExhibition') },
  { value: 'online', label: t('customer.sourceOnline') },
  { value: 'self', label: t('customer.sourceSelf') },
])

function typeLabel(type: CustomerType): string {
  return TYPE_OPTIONS.value.find((o) => o.value === type)?.label || '-'
}

function levelLabel(level: CustomerLevel): string {
  return LEVEL_OPTIONS.value.find((o) => o.value === level)?.label || '-'
}

/** 表格列配置（computed：语言切换时自动重建文案） */
const columns = computed<TableColumn[]>(() => [
  { prop: 'code', label: t('customer.code'), width: 130, fixed: 'left' },
  { prop: 'name', label: t('customer.name'), minWidth: 180, showOverflowTooltip: true },
  { prop: 'type', label: t('customer.type'), width: 90, align: 'center' },
  { prop: 'contact', label: t('customer.contact'), width: 100 },
  { prop: 'phone', label: t('customer.phone'), width: 130 },
  { prop: 'status', label: t('common.status'), width: 90, align: 'center' },
  { prop: 'level', label: t('customer.level'), width: 100, align: 'center' },
  { prop: 'blacklisted', label: t('customer.blacklisted'), width: 100, align: 'center' },
  { prop: 'creator', label: t('customer.creator'), width: 110 },
  { prop: 'createdAt', label: t('common.createdAt'), width: 165 },
  { prop: 'action', label: t('common.action'), width: 120, fixed: 'right', hideable: false },
])

/** 筛选面板配置 */
const filters = computed<FilterField[]>(() => [
  { prop: 'keyword', label: t('customer.namePlaceholder'), type: 'input' },
  {
    prop: 'type',
    label: t('customer.type'),
    type: 'select',
    options: TYPE_OPTIONS.value.map((o) => ({ label: o.label, value: o.value })),
  },
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

/** 按查询条件加载客户列表 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getCustomerList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: searchParams.keyword,
      type: searchParams.type,
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
  searchParams.type = condition.type !== undefined ? (condition.type as CustomerType) : ''
  searchParams.status = condition.status !== undefined ? (condition.status as number) : ''
  query.page = 1
  loadList()
}

/** 重置搜索条件 */
function handleReset(): void {
  searchParams.keyword = ''
  searchParams.type = ''
  searchParams.status = ''
  query.page = 1
  loadList()
}

/** 点击客户编码：详情页尚未开发，弹出提示并记录在开发待办 */
function handleCodeClick(row: Customer): void {
  ElMessage.warning(`${t('customer.detailWarning')}（${row.code}）`)
}

// ---------- 新增/编辑弹窗 ----------
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
/** 客户编码（编辑时只读回显，新增时展示自动生成提示） */
const editCode = ref('')

const form = reactive<CustomerFormModel>({
  id: null,
  name: '',
  type: 'enterprise',
  idNumber: '',
  sapCode: '',
  level: 'normal',
  industry: '',
  source: 'self',
  contact: '',
  phone: '',
  email: '',
  address: '',
  bank: '',
  bankAccount: '',
  invoiceTitle: '',
  status: 1,
  blacklisted: 0,
})

/** 社会信用代码（企业 18 位）/ 身份证号（个人 18 位）校验 */
function validateIdNumber(_rule: unknown, value: string, callback: (_err?: Error) => void): void {
  if (!value) {
    callback(new Error(t('customer.idNumberRequired')))
    return
  }
  const isEnterprise = form.type === 'enterprise'
  const ok = isEnterprise ? /^[0-9A-Z]{18}$/i.test(value) : /^\d{17}[\dXx]$/.test(value)
  callback(ok ? undefined : new Error(t('customer.idNumberInvalid')))
}

const formRules: FormRules = {
  name: [{ required: true, message: () => t('customer.namePlaceholder'), trigger: 'blur' }],
  type: [{ required: true, message: () => t('customer.typePlaceholder'), trigger: 'change' }],
  idNumber: [{ validator: validateIdNumber, trigger: 'blur' }],
  phone: [
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidPhone(value)) callback(new Error(t('customer.phoneInvalid')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_rule, value, callback) => {
        if (value && !isValidEmail(value)) callback(new Error(t('customer.emailInvalid')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

/** 打开新增弹窗 */
function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    name: '',
    type: 'enterprise',
    idNumber: '',
    sapCode: '',
    level: 'normal',
    industry: '',
    source: 'self',
    contact: '',
    phone: '',
    email: '',
    address: '',
    bank: '',
    bankAccount: '',
    invoiceTitle: '',
    status: 1,
    blacklisted: 0,
  })
  editCode.value = ''
  dialogVisible.value = true
}

/** 打开编辑弹窗并回显（客户编码不可修改） */
function openEdit(row: Customer): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    type: row.type,
    idNumber: row.idNumber,
    sapCode: row.sapCode,
    level: row.level,
    industry: row.industry,
    source: row.source,
    contact: row.contact,
    phone: row.phone,
    email: row.email,
    address: row.address,
    bank: row.bank,
    bankAccount: row.bankAccount,
    invoiceTitle: row.invoiceTitle,
    status: row.status,
    blacklisted: row.blacklisted,
  })
  editCode.value = row.code
  dialogVisible.value = true
}

/** 保存客户（新增/编辑；客户编码与创建人由系统生成） */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = {
      name: form.name,
      type: form.type,
      idNumber: form.idNumber,
      sapCode: form.sapCode,
      level: form.level,
      industry: form.industry,
      source: form.source,
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      address: form.address,
      bank: form.bank,
      bankAccount: form.bankAccount,
      invoiceTitle: form.invoiceTitle,
      status: form.status,
      blacklisted: form.blacklisted,
    }
    if (dialogMode.value === 'create') {
      await createCustomer(payload)
    } else {
      await updateCustomer(form.id as number, payload)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

/** 启停客户（失败时回滚开关状态） */
async function handleToggleStatus(row: Customer): Promise<void> {
  try {
    await updateCustomerStatus(row.id, row.status)
    ElMessage.success(t('common.success'))
  } catch {
    row.status = row.status === 1 ? 0 : 1
  }
}

/** 删除客户（含确认） */
async function handleDelete(row: Customer): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteCustomer(row.id)
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
        export-name="客户列表"
        row-key="id"
        show-index
        @search="handleSearch"
        @reset="handleReset"
        @page-change="loadList"
      >
        <template #toolbar>
          <el-button v-permission="['market:customer:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('customer.add') }}
          </el-button>
        </template>

        <template #col-code="{ row }">
          <el-link type="primary" @click="handleCodeClick(row)">{{ row.code }}</el-link>
        </template>

        <template #col-type="{ row }">
          <el-tag
            :type="TYPE_OPTIONS.find((o) => o.value === row.type)?.type || 'info'"
            size="small"
          >
            {{ typeLabel(row.type) }}
          </el-tag>
        </template>

        <template #col-status="{ row }">
          <div class="status-cell">
            <el-switch
              v-model="row.status"
              v-permission="['market:customer:edit']"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggleStatus(row)"
            />
          </div>
        </template>

        <template #col-level="{ row }">
          <el-tag
            :type="LEVEL_OPTIONS.find((o) => o.value === row.level)?.type || 'info'"
            size="small"
          >
            {{ levelLabel(row.level) }}
          </el-tag>
        </template>

        <template #col-blacklisted="{ row }">
          <el-tag :type="row.blacklisted === 1 ? 'danger' : 'success'" size="small">
            {{ row.blacklisted === 1 ? $t('customer.blacklistYes') : $t('customer.blacklistNo') }}
          </el-tag>
        </template>

        <template #col-action="{ row }">
          <el-button
            v-permission="['market:customer:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['market:customer:delete']"
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

    <!-- 新增/编辑客户 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? $t('customer.add') : $t('customer.edit')"
      width="760px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('customer.code')">
              <el-input :model-value="editCode" disabled :placeholder="$t('customer.codeHint')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('customer.name')" prop="name">
              <el-input v-model="form.name" :placeholder="$t('customer.namePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('customer.type')" prop="type">
              <el-select v-model="form.type" style="width: 100%">
                <el-option
                  v-for="o in TYPE_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('customer.idNumber')" prop="idNumber">
              <el-input v-model="form.idNumber" :placeholder="$t('customer.idNumberPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('customer.level')">
              <el-select v-model="form.level" style="width: 100%">
                <el-option
                  v-for="o in LEVEL_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('customer.industry')">
              <el-input v-model="form.industry" :placeholder="$t('customer.industryPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('customer.source')">
              <el-select v-model="form.source" style="width: 100%">
                <el-option
                  v-for="o in SOURCE_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('customer.sapCode')">
              <el-input v-model="form.sapCode" :placeholder="$t('customer.sapCodePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('customer.contact')">
              <el-input v-model="form.contact" :placeholder="$t('customer.contactPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('customer.phone')" prop="phone">
              <el-input v-model="form.phone" :placeholder="$t('customer.phonePlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('customer.email')" prop="email">
          <el-input v-model="form.email" :placeholder="$t('customer.emailPlaceholder')" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('customer.bank')">
              <el-input v-model="form.bank" :placeholder="$t('customer.bankPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('customer.bankAccount')">
              <el-input
                v-model="form.bankAccount"
                :placeholder="$t('customer.bankAccountPlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('customer.invoiceTitle')">
          <el-input
            v-model="form.invoiceTitle"
            :placeholder="$t('customer.invoiceTitlePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('customer.address')">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="2"
            :placeholder="$t('customer.addressPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('common.status')">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="$t('customer.blacklisted')">
          <el-switch v-model="form.blacklisted" :active-value="1" :inactive-value="0" />
          <span class="blacklist-tip">{{ $t('customer.blacklistTip') }}</span>
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

.blacklist-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>

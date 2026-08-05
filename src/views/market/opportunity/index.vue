<!-- 商机管理：分页 CRUD；新增/编辑弹窗，需求明细子表弹窗操作 -->
<script setup lang="ts">
defineOptions({ name: 'OpportunityManage' })

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { codeToText, regionData } from 'element-china-area-data'
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunityList,
  updateOpportunity,
} from '@/api/opportunity'
import { getCustomerOptions } from '@/api/market'
import { getBrandList, getGroupList, getModelList } from '@/api/equipment'
import { formatMoney } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type {
  CustomerOption,
  EquipmentBrand,
  EquipmentGroup,
  EquipmentModel,
  LeaseMode,
  Opportunity,
  OpportunityDetail,
  OpportunityFormModel,
  OpportunityStatus,
  OpportunityType,
} from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<Opportunity[]>([])
const total = ref(0)
const customerOptions = ref<CustomerOption[]>([])
const brands = ref<EquipmentBrand[]>([])
const groups = ref<EquipmentGroup[]>([])
const models = ref<EquipmentModel[]>([])

/** 分页参数（与 SmartTable 的 v-model 双向绑定） */
const query = reactive({
  page: 1,
  pageSize: 10,
})

/** 搜索条件（由 SmartTable 筛选面板驱动） */
const searchParams = reactive({
  keyword: '',
  type: '' as OpportunityType | '',
  status: '' as OpportunityStatus | '',
})

/** 商机类型标签映射（computed：语言切换时自动重建文案） */
const TYPE_META = computed<
  Record<
    OpportunityType,
    { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }
  >
>(() => ({
  lease: { label: t('opportunity.typeLease'), type: 'primary' },
  trial: { label: t('opportunity.typeTrial'), type: 'success' },
  purchase: { label: t('opportunity.typePurchase'), type: 'warning' },
  maintenance: { label: t('opportunity.typeMaintenance'), type: 'danger' },
  other: { label: t('opportunity.typeOther'), type: 'info' },
}))

/** 商机类型选项 */
const TYPE_OPTIONS = computed<Array<{ value: OpportunityType; label: string }>>(() =>
  Object.entries(TYPE_META.value).map(([value, meta]) => ({
    value: value as OpportunityType,
    label: meta.label,
  })),
)

/** 信息状态标签映射（computed） */
const STATUS_META = computed<
  Record<OpportunityStatus, { label: string; type: 'warning' | 'success' | 'danger' | 'info' }>
>(() => ({
  following: { label: t('opportunity.statusFollowing'), type: 'warning' },
  won: { label: t('opportunity.statusWon'), type: 'success' },
  lost: { label: t('opportunity.statusLost'), type: 'danger' },
  dropped: { label: t('opportunity.statusDropped'), type: 'info' },
}))

/** 信息状态选项 */
const STATUS_OPTIONS = computed<Array<{ value: OpportunityStatus; label: string }>>(() =>
  Object.entries(STATUS_META.value).map(([value, meta]) => ({
    value: value as OpportunityStatus,
    label: meta.label,
  })),
)

/** 租赁模式选项（computed） */
const MODE_OPTIONS = computed<Array<{ value: LeaseMode; label: string }>>(() => [
  { value: 'year', label: t('opportunity.modeYear') },
  { value: 'month', label: t('opportunity.modeMonth') },
  { value: 'day', label: t('opportunity.modeDay') },
  { value: 'shift', label: t('opportunity.modeShift') },
  { value: 'square', label: t('opportunity.modeSquare') },
  { value: 'cube', label: t('opportunity.modeCube') },
])

function typeLabel(type: OpportunityType): string {
  return TYPE_META.value[type]?.label || '-'
}

function typeTagType(type: OpportunityType): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  return TYPE_META.value[type]?.type || 'info'
}

function statusLabel(status: OpportunityStatus): string {
  return STATUS_META.value[status]?.label || '-'
}

function statusTagType(status: OpportunityStatus): 'warning' | 'success' | 'danger' | 'info' {
  return STATUS_META.value[status]?.type || 'info'
}

function leaseModeLabel(mode: LeaseMode): string {
  return MODE_OPTIONS.value.find((m) => m.value === mode)?.label || '-'
}

/** 表格列配置（computed：语言切换时自动重建文案） */
const columns = computed<TableColumn[]>(() => [
  { prop: 'code', label: t('opportunity.code'), width: 140, showOverflowTooltip: true },
  {
    prop: 'customerName',
    label: t('opportunity.customerName'),
    minWidth: 170,
    showOverflowTooltip: true,
  },
  { prop: 'type', label: t('opportunity.type'), width: 100, align: 'center' },
  { prop: 'status', label: t('opportunity.status'), width: 100, align: 'center' },
  { prop: 'stage', label: t('opportunity.stage'), width: 80, align: 'center' },
  { prop: 'leaseMode', label: t('opportunity.leaseMode'), width: 90, align: 'center' },
  { prop: 'leaseTerm', label: t('opportunity.leaseTerm'), width: 110, showOverflowTooltip: true },
  { prop: 'contact', label: t('opportunity.contact'), width: 100 },
  { prop: 'phone', label: t('opportunity.phone'), width: 130 },
  { prop: 'estimatedIncome', label: t('opportunity.estimatedIncome'), width: 130, align: 'right' },
  {
    prop: 'estimatedContract',
    label: t('opportunity.estimatedContract'),
    width: 140,
    align: 'right',
  },
  { prop: 'createdAt', label: t('common.createdAt'), width: 165 },
  { prop: 'action', label: t('common.action'), width: 130, fixed: 'right', hideable: false },
])

/** 筛选面板配置 */
const filters = computed<FilterField[]>(() => [
  { prop: 'keyword', label: t('opportunity.customerName'), type: 'input' },
  { prop: 'type', label: t('opportunity.type'), type: 'select', options: TYPE_OPTIONS.value },
  { prop: 'status', label: t('opportunity.status'), type: 'select', options: STATUS_OPTIONS.value },
])

/** 按查询条件加载商机列表 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getOpportunityList({
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

/** 加载客户下拉与设备品牌/产品组/产品型号 */
async function loadOptions(): Promise<void> {
  const [customerRes, brandRes, groupRes, modelRes] = await Promise.all([
    getCustomerOptions(),
    getBrandList(),
    getGroupList(),
    getModelList(),
  ])
  customerOptions.value = customerRes.data
  brands.value = brandRes.data
  groups.value = groupRes.data
  models.value = modelRes.data
}

/** 搜索：同步筛选条件、回到第一页并刷新 */
function handleSearch(condition: Record<string, unknown>): void {
  searchParams.keyword = (condition.keyword as string) || ''
  searchParams.type = condition.type !== undefined ? (condition.type as OpportunityType) : ''
  searchParams.status =
    condition.status !== undefined ? (condition.status as OpportunityStatus) : ''
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

// ---------- 新增/编辑弹窗 ----------
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

const form = reactive<OpportunityFormModel>({
  id: null,
  code: '',
  customerId: null,
  customerName: '',
  type: 'lease',
  contact: '',
  phone: '',
  region: [],
  addressDetail: '',
  status: 'following',
  stage: 20,
  leaseTerm: '',
  leaseMode: 'month',
  estimatedIncome: 0,
  estimatedContract: 0,
  remark: '',
  details: [],
})

/** 联系地址完整文本（省市区 + 详细地址） */
const addressText = computed(
  () => form.region.map((code) => codeToText[code] || '').join('') + form.addressDetail,
)

/** 预计收入总额/预计合同金额：按需求明细台量 × 单价自动汇总 */
const estimatedTotal = computed(() =>
  form.details.reduce((sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0), 0),
)

/** 信息阶段随状态联动：新增 20，赢单 100，丢单/流单 0 */
function stageByStatus(status: OpportunityStatus): number {
  if (status === 'won') return 100
  if (status === 'lost' || status === 'dropped') return 0
  return 20
}

watch(
  () => form.status,
  (status) => {
    form.stage = stageByStatus(status)
  },
)

/** 选择客户后自动带出客户名称、主要联系人与联系电话 */
function handleCustomerChange(id: number): void {
  const customer = customerOptions.value.find((c) => c.id === id)
  form.customerName = customer?.name || ''
  form.contact = customer?.contact || ''
  form.phone = customer?.phone || ''
}

const formRules: FormRules = {
  customerId: [
    { required: true, message: () => t('opportunity.customerRequired'), trigger: 'change' },
  ],
  type: [{ required: true, message: () => t('opportunity.typeRequired'), trigger: 'change' }],
  status: [{ required: true, message: () => t('opportunity.statusRequired'), trigger: 'change' }],
  leaseMode: [
    { required: true, message: () => t('opportunity.leaseModeRequired'), trigger: 'change' },
  ],
}

/** 打开新增弹窗 */
function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    code: '',
    customerId: null,
    customerName: '',
    type: 'lease',
    contact: '',
    phone: '',
    region: [],
    addressDetail: '',
    status: 'following',
    stage: 20,
    leaseTerm: '',
    leaseMode: 'month',
    estimatedIncome: 0,
    estimatedContract: 0,
    remark: '',
    details: [],
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗并回显 */
function openEdit(row: Opportunity): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    customerName: row.customerName,
    type: row.type,
    contact: row.contact,
    phone: row.phone,
    region: [...(row.region || [])],
    addressDetail: row.addressDetail || '',
    status: row.status,
    stage: row.stage,
    leaseTerm: row.leaseTerm || '',
    leaseMode: row.leaseMode,
    estimatedIncome: row.estimatedIncome,
    estimatedContract: row.estimatedContract,
    remark: row.remark || '',
    details: (row.details || []).map((d) => ({ ...d })),
  })
  dialogVisible.value = true
}

/** 保存商机 */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  const payload = {
    customerId: form.customerId,
    customerName: form.customerName,
    type: form.type,
    contact: form.contact,
    phone: form.phone,
    region: form.region,
    addressDetail: form.addressDetail,
    address: addressText.value,
    status: form.status,
    stage: form.stage,
    leaseTerm: form.leaseTerm,
    leaseMode: form.leaseMode,
    estimatedIncome: estimatedTotal.value,
    estimatedContract: estimatedTotal.value,
    remark: form.remark,
    details: form.details,
  }
  try {
    if (dialogMode.value === 'create') {
      await createOpportunity(payload)
    } else {
      await updateOpportunity(form.id as number, payload)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

/** 删除商机（含确认） */
async function handleDelete(row: Opportunity): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteOpportunity(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消
  }
}

// ---------- 需求明细子弹窗 ----------
const detailVisible = ref(false)
const detailEditIndex = ref(-1)
const detailFormRef = ref<FormInstance>()

const detailForm = reactive<OpportunityDetail>({
  id: 0,
  brandId: null,
  groupId: null,
  modelId: null,
  quantity: 1,
  unitPrice: 0,
  startAt: '',
  remark: '',
})

/** 按品牌/产品组过滤可选型号 */
const filteredModels = computed(() =>
  models.value.filter(
    (m) =>
      (!detailForm.brandId || m.brandId === detailForm.brandId) &&
      (!detailForm.groupId || m.groupId === detailForm.groupId),
  ),
)

function brandName(id: number | null): string {
  return brands.value.find((b) => b.id === id)?.name || '-'
}

function groupName(id: number | null): string {
  return groups.value.find((g) => g.id === id)?.name || '-'
}

function modelName(id: number | null): string {
  return models.value.find((m) => m.id === id)?.name || '-'
}

/** 选择产品型号后自动带出设备品牌与产品组 */
function handleModelChange(id: number | null): void {
  const model = models.value.find((m) => m.id === id)
  if (model) {
    detailForm.brandId = model.brandId
    detailForm.groupId = model.groupId
  }
}

/** 手动调整品牌/产品组时，清除不匹配的型号 */
function handleBrandGroupChange(): void {
  if (detailForm.modelId && !filteredModels.value.some((m) => m.id === detailForm.modelId)) {
    detailForm.modelId = null
  }
}

const detailFormRules: FormRules = {
  modelId: [{ required: true, message: () => t('opportunity.modelRequired'), trigger: 'change' }],
  quantity: [
    { required: true, message: () => t('opportunity.quantityRequired'), trigger: 'change' },
  ],
}

/** 需求明细表格列（computed） */
const detailColumns = computed<TableColumn[]>(() => [
  { prop: 'brandId', label: t('opportunity.brand'), width: 120 },
  { prop: 'groupId', label: t('opportunity.group'), width: 130 },
  { prop: 'modelId', label: t('opportunity.model'), minWidth: 150 },
  { prop: 'quantity', label: t('opportunity.quantity'), width: 80, align: 'center' },
  { prop: 'unitPrice', label: t('opportunity.unitPrice'), width: 130, align: 'right' },
  { prop: 'startAt', label: t('opportunity.startAt'), width: 120 },
  { prop: 'remark', label: t('common.remark'), minWidth: 120, showOverflowTooltip: true },
  { prop: 'action', label: t('common.action'), width: 100, fixed: 'right', hideable: false },
])

/** 打开新增需求明细弹窗 */
function openDetailAdd(): void {
  detailEditIndex.value = -1
  Object.assign(detailForm, {
    id: 0,
    brandId: null,
    groupId: null,
    modelId: null,
    quantity: 1,
    unitPrice: 0,
    startAt: '',
    remark: '',
  })
  detailVisible.value = true
}

/** 打开编辑需求明细弹窗 */
function openDetailEdit(row: OpportunityDetail, index: number): void {
  detailEditIndex.value = index
  Object.assign(detailForm, { ...row })
  detailVisible.value = true
}

/** 保存需求明细（新增或更新） */
async function saveDetail(): Promise<void> {
  if (!detailFormRef.value) return
  await detailFormRef.value.validate()
  const item: OpportunityDetail = { ...detailForm }
  if (detailEditIndex.value === -1) {
    form.details.push({ ...item, id: Date.now() })
  } else {
    form.details[detailEditIndex.value] = { ...item }
  }
  detailVisible.value = false
}

/** 删除需求明细 */
function removeDetail(index: number): void {
  form.details.splice(index, 1)
}

onMounted(async () => {
  await Promise.all([loadList(), loadOptions()])
})
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
        export-name="商机管理"
        row-key="id"
        show-index
        @search="handleSearch"
        @reset="handleReset"
        @page-change="loadList"
      >
        <template #toolbar>
          <el-button v-permission="['market:opportunity:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('opportunity.add') }}
          </el-button>
        </template>

        <template #col-type="{ row }">
          <el-tag :type="typeTagType(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
        </template>

        <template #col-status="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>

        <template #col-stage="{ row }">
          <span>{{ row.stage }}</span>
        </template>

        <template #col-leaseMode="{ row }">
          {{ leaseModeLabel(row.leaseMode) }}
        </template>

        <template #col-estimatedIncome="{ row }">
          {{ formatMoney(row.estimatedIncome) }}
        </template>

        <template #col-estimatedContract="{ row }">
          {{ formatMoney(row.estimatedContract) }}
        </template>

        <template #col-action="{ row }">
          <el-button
            v-permission="['market:opportunity:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['market:opportunity:delete']"
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

    <!-- 新增/编辑商机 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? $t('opportunity.add') : $t('opportunity.edit')"
      width="1040px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px">
        <el-divider content-position="left">{{ $t('opportunity.basicInfo') }}</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.code')">
              <el-input
                :model-value="form.code"
                :placeholder="$t('opportunity.codePlaceholder')"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.customerName')" prop="customerId">
              <el-select
                v-model="form.customerId"
                filterable
                :placeholder="$t('opportunity.customerNamePlaceholder')"
                style="width: 100%"
                @change="handleCustomerChange"
              >
                <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.type')" prop="type">
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
            <el-form-item :label="$t('opportunity.status')" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option
                  v-for="o in STATUS_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.stage')">
              <el-input :model-value="form.stage" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.leaseMode')" prop="leaseMode">
              <el-select v-model="form.leaseMode" style="width: 100%">
                <el-option
                  v-for="o in MODE_OPTIONS"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.contact')">
              <el-input :model-value="form.contact" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.phone')">
              <el-input :model-value="form.phone" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.leaseTerm')">
              <el-input
                v-model="form.leaseTerm"
                :placeholder="$t('opportunity.leaseTermPlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.estimatedIncome')">
              <el-input :model-value="formatMoney(estimatedTotal)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.estimatedContract')">
              <el-input :model-value="formatMoney(estimatedTotal)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="">
              <span class="form-tip">{{ $t('opportunity.estimatedTip') }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('opportunity.address')">
          <div class="address-row">
            <el-cascader
              v-model="form.region"
              :options="regionData"
              :placeholder="$t('opportunity.regionPlaceholder')"
              style="width: 360px"
            />
            <el-input
              v-model="form.addressDetail"
              :placeholder="$t('opportunity.addressDetailPlaceholder')"
              style="flex: 1"
            />
          </div>
        </el-form-item>
        <el-form-item :label="$t('opportunity.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider content-position="left">{{ $t('opportunity.details') }}</el-divider>
        <div class="detail-header">
          <el-button type="primary" plain size="small" @click="openDetailAdd">
            <el-icon><Plus /></el-icon>
            {{ $t('opportunity.detailAdd') }}
          </el-button>
        </div>
        <el-table :data="form.details" size="small" border row-key="id">
          <el-table-column
            v-for="col in detailColumns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align"
            :fixed="col.fixed"
            :show-overflow-tooltip="col.showOverflowTooltip"
          >
            <template v-if="col.prop === 'brandId'" #default="{ row }">
              {{ brandName(row.brandId) }}
            </template>
            <template v-else-if="col.prop === 'groupId'" #default="{ row }">
              {{ groupName(row.groupId) }}
            </template>
            <template v-else-if="col.prop === 'modelId'" #default="{ row }">
              {{ modelName(row.modelId) }}
            </template>
            <template v-else-if="col.prop === 'unitPrice'" #default="{ row }">
              {{ formatMoney(row.unitPrice) }}
            </template>
            <template v-else-if="col.prop === 'action'" #default="{ row, $index }">
              <el-button size="small" type="primary" link @click="openDetailEdit(row, $index)">
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" type="danger" link @click="removeDetail($index)">
                {{ $t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 需求明细新增/编辑 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailEditIndex === -1 ? $t('opportunity.detailAdd') : $t('opportunity.detailEdit')"
      width="720px"
      destroy-on-close
    >
      <el-form ref="detailFormRef" :model="detailForm" :rules="detailFormRules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.brand')">
              <el-select
                v-model="detailForm.brandId"
                style="width: 100%"
                @change="handleBrandGroupChange"
              >
                <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.group')">
              <el-select
                v-model="detailForm.groupId"
                style="width: 100%"
                @change="handleBrandGroupChange"
              >
                <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.model')" prop="modelId">
              <el-select
                v-model="detailForm.modelId"
                filterable
                :placeholder="$t('opportunity.modelPlaceholder')"
                style="width: 100%"
                @change="handleModelChange"
              >
                <el-option v-for="m in filteredModels" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.quantity')" prop="quantity">
              <el-input-number
                v-model="detailForm.quantity"
                :min="1"
                :max="9999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.unitPrice')">
              <el-input-number
                v-model="detailForm.unitPrice"
                :min="0"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('opportunity.startAt')">
              <el-date-picker
                v-model="detailForm.startAt"
                type="date"
                value-format="YYYY-MM-DD"
                :placeholder="$t('opportunity.startAt')"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('common.remark')">
          <el-input v-model="detailForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="detailVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveDetail">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
}

.address-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.detail-header {
  margin-bottom: 10px;
}
</style>

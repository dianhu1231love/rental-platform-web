<!-- 设备列表：多功能表格 + 筛选 + 附件上传 + 字典自定义资产归属 -->
<script setup lang="ts">
defineOptions({ name: 'EquipmentList' })

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type UploadFile,
} from 'element-plus'
import {
  createDictItem,
  createEquipment,
  deleteEquipment,
  getBrandList,
  getDictList,
  getEquipmentList,
  getModelList,
  updateEquipment,
} from '@/api/equipment'
import { formatMoney } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField, TableRow } from '@/components/SmartTable.vue'
import type {
  Attachment,
  DictItem,
  EquipmentBrand,
  EquipmentItem,
  EquipmentModel,
  EquipmentStatus,
} from '@/types'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const list = ref<EquipmentItem[]>([])
const total = ref(0)
const brands = ref<EquipmentBrand[]>([])
const models = ref<EquipmentModel[]>([])
const owners = ref<DictItem[]>([])
const intactOptions = ref<DictItem[]>([])

const query = reactive({ page: 1, pageSize: 10 })
const searchParams = reactive({
  keyword: '',
  brandId: '' as number | '',
  status: '' as EquipmentStatus | '',
})

/** 设备状态元信息（标签文案 + 颜色） */
const STATUS_META: Record<
  EquipmentStatus,
  { label: string; type: 'success' | 'info' | 'warning' | 'danger' }
> = {
  renting: { label: t('equipment.statusRenting'), type: 'success' },
  idle: { label: t('equipment.statusIdle'), type: 'info' },
  preparing: { label: t('equipment.statusPreparing'), type: 'warning' },
  maintenance: { label: t('equipment.statusMaintenance'), type: 'danger' },
}

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

/** 设备是否完好标签颜色映射（值即字典标签） */
const INTACT_META: Record<string, { type: 'success' | 'danger' }> = {
  完好: { type: 'success' },
  不完好: { type: 'danger' },
}

const columns: TableColumn[] = [
  { prop: 'code', label: t('equipment.code'), width: 180, fixed: 'left' },
  { prop: 'brand', label: t('equipment.brand'), width: 110 },
  { prop: 'model', label: t('equipment.model'), width: 160 },
  { prop: 'owner', label: t('equipment.owner'), minWidth: 170, showOverflowTooltip: true },
  {
    prop: 'purchaseAmount',
    label: t('equipment.purchaseAmount'),
    width: 120,
    align: 'right',
    formatter: (_row, value) => formatMoney(value as number),
  },
  {
    prop: 'status',
    label: t('equipment.status'),
    width: 100,
    align: 'center',
    statusMap: {
      renting: STATUS_META.renting,
      idle: STATUS_META.idle,
      preparing: STATUS_META.preparing,
      maintenance: STATUS_META.maintenance,
    },
  },
  {
    prop: 'intact',
    label: t('equipment.intact'),
    width: 110,
    align: 'center',
    statusMap: {
      完好: { label: t('equipment.intactOk'), type: INTACT_META.完好.type },
      不完好: { label: t('equipment.intactBroken'), type: INTACT_META.不完好.type },
    },
  },
  {
    prop: 'invoiceAmount',
    label: t('equipment.invoiceAmount'),
    width: 130,
    align: 'right',
    formatter: (_row, value) => formatMoney(value as number),
  },
  {
    prop: 'maintenanceCost',
    label: t('equipment.maintenanceCost'),
    width: 130,
    align: 'right',
    formatter: (_row, value) => formatMoney(value as number),
  },
  {
    prop: 'expenseTotal',
    label: t('equipment.expenseTotal'),
    width: 130,
    align: 'right',
    formatter: (_row, value) => formatMoney(value as number),
  },
  { prop: 'certificates', label: t('equipment.certificates'), width: 90, align: 'center' },
  { prop: 'insurance', label: t('equipment.insurance'), width: 90, align: 'center' },
  { prop: 'spareParts', label: t('equipment.spareParts'), width: 130, align: 'center' },
  { prop: 'remark', label: t('equipment.remark'), minWidth: 140, showOverflowTooltip: true },
  { prop: 'action', label: t('common.action'), width: 130, fixed: 'right', hideable: false },
]

/** 筛选面板配置（品牌选项随字典异步加载后更新） */
const filters = computed<FilterField[]>(() => [
  { prop: 'keyword', label: t('equipment.code'), type: 'input' },
  {
    prop: 'brandId',
    label: t('equipment.brand'),
    type: 'select',
    options: brands.value.map((b) => ({ label: b.name, value: b.id })),
  },
  { prop: 'status', label: t('equipment.status'), type: 'select', options: STATUS_OPTIONS },
])

function brandName(id: number): string {
  return brands.value.find((b) => b.id === id)?.name || '-'
}

function modelName(id: number): string {
  return models.value.find((m) => m.id === id)?.name || '-'
}

/** 附件数量展示 */
function attachmentSummary(files: Attachment[]): string {
  if (!files || files.length === 0) return '-'
  return files.map((f) => f.name).join('、')
}

/** 加载设备列表 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getEquipmentList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: searchParams.keyword,
      brandId: searchParams.brandId,
      status: searchParams.status,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(condition: Record<string, unknown>): void {
  searchParams.keyword = (condition.keyword as string) || ''
  searchParams.brandId = condition.brandId !== undefined ? (condition.brandId as number) : ''
  searchParams.status = condition.status !== undefined ? (condition.status as EquipmentStatus) : ''
  query.page = 1
  loadList()
}

function handleReset(): void {
  searchParams.keyword = ''
  searchParams.brandId = ''
  searchParams.status = ''
  query.page = 1
  loadList()
}

/** 打开详情页 */
function goDetail(row: TableRow): void {
  router.push(`/equipment/detail/${row.id}`)
}

// ---------- 新增/编辑弹窗 ----------
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const certificateFiles = ref<Attachment[]>([])
const insuranceFiles = ref<Attachment[]>([])
const sparePartFiles = ref<Attachment[]>([])

const form = reactive({
  id: null as number | null,
  code: '',
  brandId: null as number | null,
  modelId: null as number | null,
  owner: '',
  intact: '',
  purchaseAmount: 0,
  status: 'idle' as EquipmentStatus,
  invoiceAmount: 0,
  maintenanceCost: 0,
  expenseTotal: 0,
  remark: '',
})

const formRules: FormRules = {
  code: [{ required: true, message: () => t('equipment.code'), trigger: 'blur' }],
  brandId: [{ required: true, message: () => t('equipment.brand'), trigger: 'change' }],
  modelId: [{ required: true, message: () => t('equipment.model'), trigger: 'change' }],
  owner: [{ required: true, message: () => t('equipment.owner'), trigger: 'change' }],
}

/** 上传组件文件变化时收集元数据 */
function collectFiles(fileList: UploadFile[]): Attachment[] {
  return fileList
    .filter((item) => !!item.raw)
    .map((item) => item.raw as File)
    .map((raw) => ({ name: raw.name, size: raw.size, type: raw.type }))
}

function onCertificateChange(_file: UploadFile, fileList: UploadFile[]): void {
  certificateFiles.value = collectFiles(fileList)
}

function onInsuranceChange(_file: UploadFile, fileList: UploadFile[]): void {
  insuranceFiles.value = collectFiles(fileList)
}

function onSparePartsChange(_file: UploadFile, fileList: UploadFile[]): void {
  sparePartFiles.value = collectFiles(fileList)
}

function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    code: '',
    brandId: null,
    modelId: null,
    owner: '',
    intact: '',
    purchaseAmount: 0,
    status: 'idle',
    invoiceAmount: 0,
    maintenanceCost: 0,
    expenseTotal: 0,
    remark: '',
  })
  certificateFiles.value = []
  insuranceFiles.value = []
  sparePartFiles.value = []
  dialogVisible.value = true
}

function openEdit(row: EquipmentItem): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    code: row.code,
    brandId: row.brandId,
    modelId: row.modelId,
    owner: row.owner,
    intact: row.intact,
    purchaseAmount: row.purchaseAmount,
    status: row.status,
    invoiceAmount: row.invoiceAmount,
    maintenanceCost: row.maintenanceCost,
    expenseTotal: row.expenseTotal,
    remark: row.remark,
  })
  certificateFiles.value = row.certificates || []
  insuranceFiles.value = row.insurance || []
  sparePartFiles.value = row.spareParts || []
  dialogVisible.value = true
}

/** 保存设备；资产归属若为自定义新值则同步写入数据字典 */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    const payload = {
      code: form.code,
      brandId: form.brandId as number,
      modelId: form.modelId as number,
      owner: form.owner,
      intact: form.intact,
      purchaseAmount: form.purchaseAmount,
      status: form.status,
      invoiceAmount: form.invoiceAmount,
      maintenanceCost: form.maintenanceCost,
      expenseTotal: form.expenseTotal,
      remark: form.remark,
      certificates: certificateFiles.value,
      insurance: insuranceFiles.value,
      spareParts: sparePartFiles.value,
    }
    if (!owners.value.some((o) => o.label === form.owner)) {
      await createDictItem({ type: 'asset_owner', label: form.owner })
      owners.value = (await getDictList('asset_owner')).data
    }
    if (dialogMode.value === 'create') {
      await createEquipment(payload)
    } else {
      await updateEquipment(form.id as number, payload)
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

/** 删除设备（含确认） */
async function handleDelete(row: EquipmentItem): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteEquipment(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消
  }
}

onMounted(async () => {
  await Promise.all([
    loadList(),
    getBrandList().then((res) => {
      brands.value = res.data
    }),
    getModelList().then((res) => {
      models.value = res.data
    }),
    getDictList('asset_owner').then((res) => {
      owners.value = res.data
    }),
    getDictList('equipment_intact').then((res) => {
      intactOptions.value = res.data
    }),
  ])
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
        export-name="设备列表"
        row-key="id"
        @search="handleSearch"
        @reset="handleReset"
        @page-change="loadList"
      >
        <template #toolbar>
          <el-button v-permission="['equipment:list:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('equipment.add') }}
          </el-button>
        </template>

        <template #col-code="{ row }">
          <el-link type="primary" @click="goDetail(row)">{{ row.code }}</el-link>
        </template>
        <template #col-brand="{ row }">
          {{ brandName(row.brandId) }}
        </template>
        <template #col-model="{ row }">
          {{ modelName(row.modelId) }}
        </template>
        <template #col-certificates="{ row }">
          <el-tooltip
            :disabled="!row.certificates || !row.certificates.length"
            :content="attachmentSummary(row.certificates)"
            placement="top"
          >
            <el-tag v-if="row.certificates && row.certificates.length" type="primary" size="small">
              {{ row.certificates.length }}
            </el-tag>
            <span v-else>-</span>
          </el-tooltip>
        </template>
        <template #col-insurance="{ row }">
          <el-tooltip
            :disabled="!row.insurance || !row.insurance.length"
            :content="attachmentSummary(row.insurance)"
            placement="top"
          >
            <el-tag v-if="row.insurance && row.insurance.length" type="success" size="small">
              {{ row.insurance.length }}
            </el-tag>
            <span v-else>-</span>
          </el-tooltip>
        </template>
        <template #col-spareParts="{ row }">
          <el-tooltip
            :disabled="!row.spareParts || !row.spareParts.length"
            :content="attachmentSummary(row.spareParts)"
            placement="top"
          >
            <el-tag v-if="row.spareParts && row.spareParts.length" type="warning" size="small">
              {{ row.spareParts.length }}
            </el-tag>
            <span v-else>-</span>
          </el-tooltip>
        </template>

        <template #col-action="{ row }">
          <el-button
            v-permission="['equipment:list:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['equipment:list:delete']"
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
      :title="dialogMode === 'create' ? $t('equipment.add') : $t('equipment.edit')"
      width="720px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('equipment.code')" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('equipment.brand')" prop="brandId">
              <el-select v-model="form.brandId" style="width: 100%">
                <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('equipment.model')" prop="modelId">
              <el-select v-model="form.modelId" style="width: 100%">
                <el-option v-for="m in models" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('equipment.owner')" prop="owner">
              <el-select
                v-model="form.owner"
                style="width: 100%"
                filterable
                allow-create
                default-first-option
                :placeholder="$t('equipment.ownerCustom')"
              >
                <el-option v-for="o in owners" :key="o.id" :label="o.label" :value="o.label" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('equipment.purchaseAmount')">
              <el-input-number
                v-model="form.purchaseAmount"
                :min="0"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('equipment.status')" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option
                  v-for="opt in STATUS_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('equipment.intact')" prop="intact">
              <el-select
                v-model="form.intact"
                style="width: 100%"
                clearable
                :placeholder="$t('equipment.intactPlaceholder')"
              >
                <el-option
                  v-for="o in intactOptions"
                  :key="o.id"
                  :label="o.label"
                  :value="o.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="$t('equipment.invoiceAmount')">
              <el-input-number
                v-model="form.invoiceAmount"
                :min="0"
                :step="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('equipment.maintenanceCost')">
              <el-input-number
                v-model="form.maintenanceCost"
                :min="0"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('equipment.expenseTotal')">
              <el-input-number
                v-model="form.expenseTotal"
                :min="0"
                :step="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="$t('equipment.certificates')">
          <el-upload
            multiple
            :auto-upload="false"
            :file-list="certificateFiles"
            :on-change="onCertificateChange"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              上传证照
            </el-button>
          </el-upload>
        </el-form-item>
        <el-form-item :label="$t('equipment.insurance')">
          <el-upload
            multiple
            :auto-upload="false"
            :file-list="insuranceFiles"
            :on-change="onInsuranceChange"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              上传保险
            </el-button>
          </el-upload>
        </el-form-item>
        <el-form-item :label="$t('equipment.spareParts')">
          <el-upload
            multiple
            :auto-upload="false"
            :file-list="sparePartFiles"
            :on-change="onSparePartsChange"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              上传随车备件清单
            </el-button>
          </el-upload>
        </el-form-item>

        <el-form-item :label="$t('equipment.remark')">
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

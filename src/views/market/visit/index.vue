<!-- 拜访管理：分页搜索、CRUD；新增弹窗选择客户自动带出联系人与电话，编辑仅开放拜访结果与附件 -->
<script setup lang="ts">
defineOptions({ name: 'VisitManage' })

import { computed, onMounted, reactive, ref } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type UploadFile,
} from 'element-plus'
import { createVisit, deleteVisit, getVisitList, updateVisit } from '@/api/visit'
import { getCustomerOptions } from '@/api/market'
import { useI18n } from 'vue-i18n'
import type { TableColumn, FilterField } from '@/components/SmartTable.vue'
import type {
  CustomerOption,
  VisitAttachment,
  VisitFormModel,
  VisitRecord,
  VisitType,
} from '@/types'

const { t } = useI18n()

const loading = ref(false)
const saving = ref(false)
const list = ref<VisitRecord[]>([])
const total = ref(0)
const customerOptions = ref<CustomerOption[]>([])

/** 分页参数（与 SmartTable 的 v-model 双向绑定） */
const query = reactive({
  page: 1,
  pageSize: 10,
})

/** 搜索条件（由 SmartTable 筛选面板驱动） */
const searchParams = reactive({
  keyword: '',
  visitType: '' as VisitType | '',
  visitTimeStart: '',
  visitTimeEnd: '',
})

/** 拜访类型标签颜色映射（computed：语言切换时自动重建文案） */
const TYPE_META = computed<Record<VisitType, { label: string; type: 'success' | 'info' }>>(() => ({
  onsite: { label: t('visit.typeOnsite'), type: 'success' },
  phone: { label: t('visit.typePhone'), type: 'info' },
}))

/** 拜访类型选项（computed：语言切换时自动重建文案） */
const TYPE_OPTIONS = computed<Array<{ value: VisitType; label: string }>>(() =>
  Object.entries(TYPE_META.value).map(([value, meta]) => ({
    value: value as VisitType,
    label: meta.label,
  })),
)

function typeLabel(type: VisitType): string {
  return TYPE_META.value[type]?.label || '-'
}

function typeTagType(type: VisitType): 'success' | 'info' {
  return TYPE_META.value[type]?.type || 'info'
}

/** 文件大小格式化 */
function fileSizeText(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${size} B`
}

/** 表格列配置（computed：语言切换时自动重建文案） */
const columns = computed<TableColumn[]>(() => [
  {
    prop: 'opportunityCode',
    label: t('visit.opportunityCode'),
    width: 130,
    showOverflowTooltip: true,
  },
  {
    prop: 'customerName',
    label: t('visit.customerName'),
    minWidth: 170,
    showOverflowTooltip: true,
  },
  { prop: 'visitType', label: t('visit.visitType'), width: 100, align: 'center' },
  { prop: 'visitTime', label: t('visit.visitTime'), width: 160 },
  {
    prop: 'visitAddress',
    label: t('visit.visitAddress'),
    minWidth: 150,
    showOverflowTooltip: true,
  },
  { prop: 'contact', label: t('visit.contact'), width: 100 },
  { prop: 'phone', label: t('visit.phone'), width: 130 },
  { prop: 'workPoints', label: t('visit.workPoints'), minWidth: 160, showOverflowTooltip: true },
  { prop: 'visitResult', label: t('visit.visitResult'), minWidth: 160, showOverflowTooltip: true },
  { prop: 'attachments', label: t('visit.attachments'), width: 110, align: 'center' },
  { prop: 'creator', label: t('visit.creator'), width: 110 },
  { prop: 'createdAt', label: t('common.createdAt'), width: 165 },
  { prop: 'action', label: t('common.action'), width: 120, fixed: 'right', hideable: false },
])

/** 筛选面板配置 */
const filters = computed<FilterField[]>(() => [
  { prop: 'keyword', label: t('visit.customerName'), type: 'input' },
  { prop: 'visitType', label: t('visit.visitType'), type: 'select', options: TYPE_OPTIONS.value },
  { prop: 'visitTimeRange', label: t('visit.visitTime'), type: 'daterange' },
])

/** 按查询条件加载拜访记录列表 */
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const res = await getVisitList({
      page: query.page,
      pageSize: query.pageSize,
      keyword: searchParams.keyword,
      visitType: searchParams.visitType,
      visitTimeStart: searchParams.visitTimeStart,
      visitTimeEnd: searchParams.visitTimeEnd,
    })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

/** 加载客户下拉选项（新增时自动带出联系人与电话） */
async function loadCustomerOptions(): Promise<void> {
  const res = await getCustomerOptions()
  customerOptions.value = res.data
}

/** 搜索：同步筛选条件、回到第一页并刷新 */
function handleSearch(condition: Record<string, unknown>): void {
  searchParams.keyword = (condition.keyword as string) || ''
  searchParams.visitType =
    condition.visitType !== undefined ? (condition.visitType as VisitType) : ''
  const range = condition.visitTimeRange as [string, string] | undefined
  searchParams.visitTimeStart = range?.[0] || ''
  searchParams.visitTimeEnd = range?.[1] || ''
  query.page = 1
  loadList()
}

/** 重置搜索条件 */
function handleReset(): void {
  searchParams.keyword = ''
  searchParams.visitType = ''
  searchParams.visitTimeStart = ''
  searchParams.visitTimeEnd = ''
  query.page = 1
  loadList()
}

// ---------- 新增/编辑弹窗 ----------
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

const form = reactive<VisitFormModel>({
  id: null,
  opportunityCode: '',
  customerId: null,
  customerName: '',
  visitType: 'onsite',
  visitTime: '',
  visitAddress: '',
  contact: '',
  phone: '',
  workPoints: '',
  visitResult: '',
  attachments: [],
})

/** 选择客户后自动带出客户名称、联系人与电话 */
function handleCustomerChange(id: number): void {
  const customer = customerOptions.value.find((c) => c.id === id)
  form.customerName = customer?.name || ''
  form.contact = customer?.contact || ''
  form.phone = customer?.phone || ''
}

const formRules: FormRules = {
  customerId: [{ required: true, message: () => t('visit.customerRequired'), trigger: 'change' }],
  visitType: [{ required: true, message: () => t('visit.visitType'), trigger: 'change' }],
  visitTime: [{ required: true, message: () => t('visit.visitTimeRequired'), trigger: 'change' }],
}

/** 打开新增弹窗 */
function openCreate(): void {
  dialogMode.value = 'create'
  Object.assign(form, {
    id: null,
    opportunityCode: '',
    customerId: null,
    customerName: '',
    visitType: 'onsite',
    visitTime: '',
    visitAddress: '',
    contact: '',
    phone: '',
    workPoints: '',
    visitResult: '',
    attachments: [],
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗并回显（仅拜访结果与附件可编辑） */
function openEdit(row: VisitRecord): void {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    opportunityCode: row.opportunityCode,
    customerId: row.customerId,
    customerName: row.customerName,
    visitType: row.visitType,
    visitTime: row.visitTime,
    visitAddress: row.visitAddress,
    contact: row.contact,
    phone: row.phone,
    workPoints: row.workPoints,
    visitResult: row.visitResult,
    attachments: row.attachments.map((a) => ({ ...a })),
  })
  dialogVisible.value = true
}

/** 保存拜访记录（新增全字段；编辑仅提交拜访结果与附件） */
async function handleSave(): Promise<void> {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createVisit({
        opportunityCode: form.opportunityCode,
        customerId: form.customerId,
        customerName: form.customerName,
        visitType: form.visitType,
        visitTime: form.visitTime,
        visitAddress: form.visitAddress,
        contact: form.contact,
        phone: form.phone,
        workPoints: form.workPoints,
        visitResult: form.visitResult,
        attachments: form.attachments,
      })
    } else {
      await updateVisit(form.id as number, {
        visitResult: form.visitResult,
        attachments: form.attachments,
      })
    }
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

/** 删除拜访记录（含确认） */
async function handleDelete(row: VisitRecord): Promise<void> {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.confirmTitle'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await deleteVisit(row.id)
    ElMessage.success(t('common.success'))
    loadList()
  } catch {
    // 取消
  }
}

// ---------- 附件上传（多文件、拖拽；Mock 下转为 Data URL 存储） ----------
/** 本地文件转 Data URL（真实后端接入后改为 multipart 上传返回文件地址） */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function handleAttachmentChange(uploadFile: UploadFile, _files: UploadFile[]): Promise<void> {
  const raw = uploadFile.raw
  if (!raw) return
  try {
    const url = await fileToDataUrl(raw)
    form.attachments.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      uid: uploadFile.uid,
      name: raw.name,
      size: raw.size,
      type: raw.type || '',
      url,
    })
  } catch {
    ElMessage.error(t('common.requestError'))
  }
}

function removeAttachment(att: VisitAttachment): void {
  form.attachments = form.attachments.filter((a) => a !== att)
}

// ---------- 附件预览弹窗 ----------
const previewVisible = ref(false)
const previewList = ref<VisitAttachment[]>([])
const previewIndex = ref(0)

const currentPreview = computed<VisitAttachment | null>(
  () => previewList.value[previewIndex.value] || null,
)

function openPreview(list: VisitAttachment[], index = 0): void {
  previewList.value = list
  previewIndex.value = index
  previewVisible.value = true
}

function isImage(att: VisitAttachment | null): boolean {
  return (
    !!att && (att.type.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(att.name))
  )
}

function isPdf(att: VisitAttachment | null): boolean {
  return !!att && (att.type === 'application/pdf' || /\.pdf$/i.test(att.name))
}

function isText(att: VisitAttachment | null): boolean {
  return (
    !!att &&
    (att.type.startsWith('text/') || /\.(txt|md|json|js|ts|vue|html|css|log|csv)$/i.test(att.name))
  )
}

/** 解码 Data URL 文本内容（仅文本类附件） */
function textContent(url: string): string {
  const [, body] = url.split(',')
  if (!body) return ''
  if (url.startsWith('data:text')) {
    try {
      return decodeURIComponent(body)
    } catch {
      return body
    }
  }
  if (url.includes('base64')) {
    try {
      const binary = atob(body)
      const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
      return new TextDecoder('utf-8').decode(bytes)
    } catch {
      return body
    }
  }
  return body
}

/** 下载当前预览附件 */
function downloadCurrent(): void {
  const att = currentPreview.value
  if (!att || !att.url) return
  const a = document.createElement('a')
  a.href = att.url
  a.download = att.name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

onMounted(async () => {
  await Promise.all([loadList(), loadCustomerOptions()])
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
        export-name="拜访记录"
        row-key="id"
        show-index
        @search="handleSearch"
        @reset="handleReset"
        @page-change="loadList"
      >
        <template #toolbar>
          <el-button v-permission="['market:visit:add']" type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            {{ $t('visit.add') }}
          </el-button>
        </template>

        <template #col-opportunityCode="{ row }">
          <span>{{ row.opportunityCode || '-' }}</span>
        </template>

        <template #col-visitType="{ row }">
          <el-tag :type="typeTagType(row.visitType)" size="small">
            {{ typeLabel(row.visitType) }}
          </el-tag>
        </template>

        <template #col-attachments="{ row }">
          <el-link
            v-if="row.attachments?.length"
            type="primary"
            @click="openPreview(row.attachments)"
          >
            {{ $t('visit.attachmentsCount', { count: row.attachments.length }) }}
          </el-link>
          <span v-else>-</span>
        </template>

        <template #col-action="{ row }">
          <el-button
            v-permission="['market:visit:edit']"
            size="small"
            type="primary"
            link
            @click="openEdit(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          <el-button
            v-permission="['market:visit:delete']"
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

    <!-- 新增/编辑拜访记录 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? $t('visit.add') : $t('visit.edit')"
      width="820px"
      destroy-on-close
    >
      <el-alert
        v-if="dialogMode === 'edit'"
        :title="$t('visit.editTip')"
        type="info"
        :closable="false"
        show-icon
        class="edit-tip"
      />
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('visit.opportunityCode')">
              <el-tooltip :content="$t('visit.opportunityCodeTip')" placement="top">
                <el-input
                  :model-value="form.opportunityCode"
                  disabled
                  :placeholder="$t('visit.opportunityCodePlaceholder')"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('visit.customerName')" prop="customerId">
              <el-select
                v-model="form.customerId"
                :disabled="dialogMode === 'edit'"
                filterable
                :placeholder="$t('visit.customerNamePlaceholder')"
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
            <el-form-item :label="$t('visit.visitType')" prop="visitType">
              <el-radio-group v-model="form.visitType" :disabled="dialogMode === 'edit'">
                <el-radio-button v-for="o in TYPE_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('visit.visitTime')" prop="visitTime">
              <el-date-picker
                v-model="form.visitTime"
                :disabled="dialogMode === 'edit'"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                :placeholder="$t('visit.visitTimePlaceholder')"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('visit.visitAddress')">
          <el-input
            v-model="form.visitAddress"
            :disabled="dialogMode === 'edit'"
            :placeholder="$t('visit.visitAddressPlaceholder')"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('visit.contact')">
              <el-input
                v-model="form.contact"
                :disabled="dialogMode === 'edit'"
                :placeholder="$t('visit.contactPlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('visit.phone')">
              <el-input
                v-model="form.phone"
                :disabled="dialogMode === 'edit'"
                :placeholder="$t('visit.phonePlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('visit.workPoints')">
          <el-input
            v-model="form.workPoints"
            :disabled="dialogMode === 'edit'"
            type="textarea"
            :rows="3"
            :placeholder="$t('visit.workPointsPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('visit.visitResult')">
          <el-input
            v-model="form.visitResult"
            type="textarea"
            :rows="3"
            :placeholder="$t('visit.visitResultPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('visit.attachments')">
          <div class="attach-area">
            <el-upload
              drag
              multiple
              :auto-upload="false"
              :show-file-list="false"
              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.log,.json,.zip,.rar,.7z"
              :on-change="handleAttachmentChange"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或
                <em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">{{ $t('visit.attachmentTip') }}</div>
              </template>
            </el-upload>
            <div v-if="form.attachments.length" class="attach-list">
              <div v-for="att in form.attachments" :key="att.id || att.uid" class="attach-item">
                <el-icon><Document /></el-icon>
                <span class="attach-name" :title="att.name">{{ att.name }}</span>
                <span class="attach-size">{{ fileSizeText(att.size) }}</span>
                <el-button
                  link
                  type="primary"
                  @click="openPreview(form.attachments, form.attachments.indexOf(att))"
                >
                  {{ $t('visit.preview') }}
                </el-button>
                <el-button link type="danger" @click="removeAttachment(att)">
                  {{ $t('visit.remove') }}
                </el-button>
              </div>
            </div>
            <div v-else class="attach-empty">{{ $t('visit.noAttachment') }}</div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 附件预览 -->
    <el-dialog v-model="previewVisible" :title="$t('visit.preview')" width="860px" destroy-on-close>
      <div class="preview-body">
        <div v-if="previewList.length > 1" class="preview-sidebar">
          <div
            v-for="(att, index) in previewList"
            :key="att.id || att.uid"
            class="preview-file"
            :class="{ active: index === previewIndex }"
            @click="previewIndex = index"
          >
            <el-icon><Document /></el-icon>
            <span class="preview-file-name" :title="att.name">{{ att.name }}</span>
          </div>
        </div>
        <div class="preview-main">
          <div v-if="currentPreview" class="preview-file-title">
            <el-icon><Document /></el-icon>
            <span>{{ currentPreview.name }}</span>
          </div>
          <img
            v-if="currentPreview && isImage(currentPreview) && currentPreview.url"
            :src="currentPreview.url"
            class="preview-image"
            :alt="currentPreview.name"
          />
          <iframe
            v-else-if="currentPreview && isPdf(currentPreview) && currentPreview.url"
            :src="currentPreview.url"
            class="preview-frame"
            :title="currentPreview.name"
          />
          <pre
            v-else-if="currentPreview && isText(currentPreview) && currentPreview.url"
            class="preview-text"
          >
            {{ textContent(currentPreview.url) }}
          </pre>
          <el-empty v-else :description="$t('visit.previewUnsupported')" :image-size="80" />
          <div class="preview-footer">
            <el-button
              type="primary"
              plain
              :disabled="!currentPreview?.url"
              @click="downloadCurrent"
            >
              <el-icon><Download /></el-icon>
              {{ $t('visit.download') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.edit-tip {
  margin-bottom: 16px;
}

.attach-area {
  width: 100%;
}

.attach-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;

  .attach-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #303133;
    cursor: pointer;
  }

  .attach-size {
    flex-shrink: 0;
    font-size: 12px;
    color: #909399;
  }
}

.attach-empty {
  margin-top: 10px;
  font-size: 13px;
  color: #909399;
}

.preview-body {
  display: flex;
  gap: 14px;
  min-height: 420px;
}

.preview-sidebar {
  flex-shrink: 0;
  width: 180px;
  max-height: 460px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid #ebeef5;
  padding-right: 10px;
}

.preview-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #ecf5ff;
    color: #409eff;
  }
}

.preview-file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.preview-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.preview-file-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 14px;
}

.preview-image {
  max-width: 100%;
  max-height: 380px;
  object-fit: contain;
  margin: 0 auto;
}

.preview-frame {
  flex: 1;
  width: 100%;
  height: 420px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.preview-text {
  flex: 1;
  min-height: 300px;
  max-height: 420px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

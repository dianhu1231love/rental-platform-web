<!-- 设备详情：基本信息 + 附件 + 地图定位（外部接口）+ 当前状态（外部接口） -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getBrandList,
  getEquipmentDetail,
  getEquipmentLocation,
  getModelList,
} from '@/api/equipment'
import { formatMoney } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import type {
  Attachment,
  EquipmentBrand,
  EquipmentItem,
  EquipmentModel,
  EquipmentStatus,
} from '@/types'

defineOptions({ name: 'EquipmentDetail' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const detail = ref<EquipmentItem | null>(null)
const brands = ref<EquipmentBrand[]>([])
const models = ref<EquipmentModel[]>([])
const location = ref<{ lng: number; lat: number; address: string } | null>(null)

/** 设备状态元信息（computed：语言切换时自动重建文案） */
const STATUS_META = computed<
  Record<EquipmentStatus, { label: string; type: 'success' | 'info' | 'warning' | 'danger' }>
>(() => ({
  renting: { label: t('equipment.statusRenting'), type: 'success' },
  idle: { label: t('equipment.statusIdle'), type: 'info' },
  preparing: { label: t('equipment.statusPreparing'), type: 'warning' },
  maintenance: { label: t('equipment.statusMaintenance'), type: 'danger' },
}))

/** 设备是否完好标签颜色映射（值即字典标签） */
const INTACT_META: Record<string, { type: 'success' | 'danger' }> = {
  完好: { type: 'success' },
  不完好: { type: 'danger' },
}

const mapUrl = computed(() => {
  if (!location.value) return ''
  const { lng, lat } = location.value
  const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
})

function brandName(id: number): string {
  return brands.value.find((b) => b.id === id)?.name || '-'
}

function modelName(id: number): string {
  return models.value.find((m) => m.id === id)?.name || '-'
}

function fileSizeText(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${size} B`
}

function renderAttachments(files: Attachment[]): string {
  if (!files || files.length === 0) return '-'
  return files.map((f) => `${f.name}（${fileSizeText(f.size)}）`).join('；')
}

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const [detailRes, brandsRes, modelsRes, locationRes] = await Promise.all([
      getEquipmentDetail(id),
      getBrandList(),
      getModelList(),
      getEquipmentLocation(id),
    ])
    detail.value = detailRes.data
    brands.value = brandsRes.data
    models.value = modelsRes.data
    location.value = locationRes.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading" class="app-container equipment-detail">
    <el-page-header :content="$t('equipment.detail')" @back="router.back()" />

    <template v-if="detail">
      <el-row :gutter="16" class="detail-row">
        <el-col :xs="24" :lg="14">
          <el-card class="page-card">
            <template #header>
              <span class="card-title">{{ $t('equipment.detail') }}</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item :label="$t('equipment.code')">
                <b>{{ detail.code }}</b>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.status')">
                <el-tag :type="STATUS_META[detail.status].type" size="small">
                  {{ STATUS_META[detail.status].label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.intact')">
                <el-tag
                  v-if="detail.intact"
                  :type="INTACT_META[detail.intact]?.type || 'info'"
                  size="small"
                >
                  {{ detail.intact }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.brand')">
                {{ brandName(detail.brandId) }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.model')">
                {{ modelName(detail.modelId) }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.owner')">
                {{ detail.owner }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.purchaseAmount')">
                {{ formatMoney(detail.purchaseAmount) }} 元
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.invoiceAmount')">
                {{ formatMoney(detail.invoiceAmount) }} 元
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.maintenanceCost')">
                {{ formatMoney(detail.maintenanceCost) }} 元
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.expenseTotal')">
                {{ formatMoney(detail.expenseTotal) }} 元
              </el-descriptions-item>
              <el-descriptions-item :label="$t('equipment.remark')">
                {{ detail.remark || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="10">
          <el-card class="page-card">
            <template #header>
              <span class="card-title">{{ $t('equipment.location') }}</span>
            </template>
            <div v-if="mapUrl" class="map-wrap">
              <iframe
                :src="mapUrl"
                class="map-frame"
                :title="$t('equipment.location')"
                loading="lazy"
              />
            </div>
            <p class="map-address">
              <el-icon><Location /></el-icon>
              {{ location?.address || '-' }}
            </p>
            <el-alert
              :title="$t('equipment.locationTip')"
              type="info"
              :closable="false"
              show-icon
            />
          </el-card>
        </el-col>
      </el-row>

      <el-card class="page-card detail-row">
        <template #header>
          <span class="card-title">{{ $t('equipment.attachments') }}</span>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('equipment.certificates')">
            {{ renderAttachments(detail.certificates) }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('equipment.insurance')">
            {{ renderAttachments(detail.insurance) }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('equipment.spareParts')">
            {{ renderAttachments(detail.spareParts) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.detail-row {
  margin-top: 16px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.map-wrap {
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e6eefb;
}

.map-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.map-address {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 10px 0;
  color: #606266;
  font-size: 13px;
}
</style>

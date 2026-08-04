<script lang="ts">
/**
 * 表格列配置
 */
export interface TableColumn {
  /** 字段名，对应行数据的 key */
  prop: string
  /** 表头文案 */
  label: string
  /** 列宽（px），可拖拽调整 */
  width?: number
  /** 最小列宽（px） */
  minWidth?: number
  /** 固定列：true / 'left' / 'right'，默认不固定 */
  fixed?: boolean | 'left' | 'right'
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否可排序（支持 el-table 原生排序） */
  sortable?: boolean | 'custom'
  /** 是否启用列筛选（配合 filters 使用） */
  filterable?: boolean
  /** 列筛选选项 */
  filters?: Array<{ text: string; value: string | number | boolean }>
  /** 文本超长是否省略并提示，默认 true */
  showOverflowTooltip?: boolean
  /** 状态颜色映射：值 -> 标签与颜色类型 */
  statusMap?: Record<
    string | number,
    { label?: string; type?: 'success' | 'info' | 'warning' | 'danger' | 'primary' }
  >
  /** 单元格文本格式化 */
  formatter?: (_row: Record<string, any>, _value: any) => string
  /** 是否允许在“列设置”中隐藏，默认 true */
  hideable?: boolean
}

/**
 * 筛选字段配置
 */
export interface FilterField {
  /** 字段名 */
  prop: string
  /** 字段标签 */
  label: string
  /** 控件类型：input / select / date / daterange / number */
  type?: 'input' | 'select' | 'date' | 'daterange' | 'number'
  /** select 类型的选项 */
  options?: Array<{ label: string; value: string | number }>
  /** 占位文案 */
  placeholder?: string
}

/** 表格行数据类型 */
export type TableRow = Record<string, any>
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { Directive, DirectiveBinding } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as XLSX from 'xlsx'
import { useI18n } from 'vue-i18n'
import { animate } from 'motion-v'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** 列配置 */
    columns: TableColumn[]
    /** 表格数据 */
    data: TableRow[]
    /** 筛选字段配置 */
    filters?: FilterField[]
    /** 加载状态 */
    loading?: boolean
    /** 是否分页，默认 false（树形表格等无需分页） */
    paginated?: boolean
    /** 数据总数 */
    total?: number
    /** 是否显示多选列 */
    selectable?: boolean
    /** 是否显示序号列 */
    showIndex?: boolean
    /** 是否可导出 xlsx */
    exportable?: boolean
    /** 导出文件名（不含扩展名） */
    exportName?: string
    /** 行唯一键（树形表格必填） */
    rowKey?: string
    /** 树形表格子节点字段配置 */
    treeProps?: Record<string, string>
    /** 树形表格是否默认展开全部 */
    defaultExpandAll?: boolean
    /** 表头是否固定，默认 true */
    headerFixed?: boolean
    /** 表格最大高度（表头固定时生效） */
    maxHeight?: number
    /** 选择列是否固定左侧 */
    selectionFixed?: boolean
    /** 表格尺寸 */
    size?: 'large' | 'default' | 'small'
    /** 输入筛选条件后是否自动搜索（防抖），默认 true */
    autoSearch?: boolean
    /** 自动搜索防抖延迟（毫秒），默认 400 */
    debounce?: number
  }>(),
  {
    filters: () => [],
    loading: false,
    paginated: true,
    total: 0,
    selectable: false,
    showIndex: false,
    exportable: false,
    exportName: '导出数据',
    rowKey: 'id',
    treeProps: () => ({ children: 'children' }),
    defaultExpandAll: false,
    headerFixed: true,
    maxHeight: 560,
    selectionFixed: false,
    size: 'default',
    autoSearch: true,
    debounce: 400,
  },
)

const emit = defineEmits<{
  /** 点击搜索，携带筛选条件 */
  search: [query: Record<string, unknown>]
  /** 点击重置 */
  reset: []
  /** 多选变化 */
  'selection-change': [rows: TableRow[]]
  /** 行点击 */
  'row-click': [row: TableRow, column: unknown, event: Event]
  /** 单元格点击 */
  'cell-click': [row: TableRow, column: unknown, cell: unknown, event: Event]
  /** 排序变化 */
  'sort-change': [data: { prop: string; order: 'ascending' | 'descending' | null }]
  /** 分页变化（页码或每页条数） */
  'page-change': []
}>()

/** 当前页码 / 每页条数，支持 v-model:page / v-model:page-size */
const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

// ---------- 列宽拖拽 ----------
const colWidths = reactive<Record<string, number>>({})

// ---------- 列显隐 ----------
const visibleProps = ref<string[]>(props.columns.map((c) => c.prop))
watch(
  () => props.columns,
  (cols) => {
    visibleProps.value = cols.map((c) => c.prop)
    initColWidths(cols)
  },
  { immediate: true },
)

const displayColumns = computed(() =>
  props.columns.filter((c) => visibleProps.value.includes(c.prop)),
)

function initColWidths(cols: TableColumn[]): void {
  cols.forEach((c) => {
    if (c.width && colWidths[c.prop] === undefined) colWidths[c.prop] = c.width
  })
}

/** 拖拽结束回调：将索引映射回列定义并更新宽度 */
function handleColumnResize(index: number, width: number): void {
  const leading = (props.selectable ? 1 : 0) + (props.showIndex ? 1 : 0)
  const col = displayColumns.value[index - leading]
  if (col) colWidths[col.prop] = width
}

// ---------- 表头列宽拖拽指令 ----------
interface ResizeBinding {
  onResize: (index: number, width: number) => void
}

function startColumnDrag(
  event: MouseEvent,
  th: Element,
  index: number,
  onResize: (i: number, w: number) => void,
): void {
  event.preventDefault()
  event.stopPropagation()
  const startX = event.clientX
  const startWidth = (th as HTMLElement).offsetWidth
  const onMove = (e: MouseEvent): void => {
    onResize(index, Math.max(60, startWidth + e.clientX - startX))
  }
  const onUp = (): void => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function setupColumnResize(el: HTMLElement, binding: DirectiveBinding<ResizeBinding>): void {
  const wrapper = el.querySelector('.el-table__header-wrapper')
  if (!wrapper) return
  wrapper.querySelectorAll('th').forEach((th, index) => {
    if (th.querySelector('.col-resize-handle')) return
    const handle = document.createElement('div')
    handle.className = 'col-resize-handle'
    th.appendChild(handle)
    handle.addEventListener('mousedown', (e) =>
      startColumnDrag(e as MouseEvent, th, index, binding.value.onResize),
    )
  })
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const columnResize: Directive<HTMLElement, ResizeBinding> = {
  mounted(el, binding) {
    setupColumnResize(el, binding)
  },
  updated(el, binding) {
    setupColumnResize(el, binding)
  },
}

// ---------- 筛选面板 ----------
const query = reactive<Record<string, unknown>>({})
const filterWrap = ref<HTMLElement>()
const filterExpanded = ref(false)
const needExpand = ref(false)
let lastEmittedSignature = ''

/** 展开/收起：用 Motion 在 40px 与内容实际高度（auto）之间平滑过渡 */
watch(filterExpanded, (expanded) => {
  const el = filterWrap.value
  if (!el) return
  animate(el, { height: expanded ? 'auto' : 40 }, { duration: 0.25, ease: 'easeInOut' })
})

watch(
  () => props.filters,
  (fields) => {
    fields.forEach((f) => {
      if (query[f.prop] === undefined) query[f.prop] = undefined
    })
  },
  { immediate: true },
)

/** 检测筛选项是否超过一行（与固定的收起高度 40px 比较，避免动画过程中按钮闪烁） */
function checkFilterOverflow(): void {
  const el = filterWrap.value
  if (!el) return
  needExpand.value = el.scrollHeight > 42
}

/** 防抖后的溢出检测（窗口/内容尺寸变化时高频触发） */
const debouncedCheckOverflow = useDebounceFn(checkFilterOverflow, 150)

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  nextTick(checkFilterOverflow)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(debouncedCheckOverflow)
    if (filterWrap.value) resizeObserver.observe(filterWrap.value)
  }
})

/** 组装筛选条件（过滤空值） */
function collectQuery(): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  Object.entries(query).forEach(([key, value]) => {
    const empty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    if (!empty) result[key] = value
  })
  return result
}

/** 组装并发送搜索事件（相同条件的重复搜索自动去重） */
function emitSearch(): void {
  const queryData = collectQuery()
  const signature = JSON.stringify(queryData)
  if (signature === lastEmittedSignature) return
  lastEmittedSignature = signature
  emit('search', queryData)
}

/** 筛选条件变化时触发防抖自动搜索 */
function onFilterChange(): void {
  if (props.autoSearch) debouncedSearch()
}

const debouncedSearch = useDebounceFn(emitSearch, props.debounce)

function handleSearch(): void {
  emitSearch()
}

function handleReset(): void {
  Object.keys(query).forEach((key) => {
    query[key] = undefined
  })
  // 更新签名，避免重置前挂起的防抖回调重复触发
  lastEmittedSignature = JSON.stringify(collectQuery())
  emit('reset')
}

// ---------- 导出 ----------
function exportExcel(): void {
  const exportColumns = props.columns.filter((c) => c.prop && visibleProps.value.includes(c.prop))
  const rows = props.data.map((row) => {
    const out: Record<string, any> = {}
    exportColumns.forEach((col) => {
      let value: any = row[col.prop]
      if (col.statusMap) {
        const mapped = col.statusMap[String(value)]
        if (mapped?.label !== undefined) value = mapped.label
      } else if (col.formatter) {
        value = col.formatter(row, row[col.prop])
      }
      out[col.label] = value ?? ''
    })
    return out
  })
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, t('common.dataSheet'))
  XLSX.writeFile(workbook, `${props.exportName}.xlsx`)
}

function handleSelectionChange(rows: TableRow[]): void {
  emit('selection-change', rows)
}

function onRowClick(row: TableRow, column: unknown, event: Event): void {
  emit('row-click', row, column, event)
}

function onCellClick(row: TableRow, column: unknown, cell: unknown, event: Event): void {
  emit('cell-click', row, column, cell, event)
}

function onSortChange(data: { prop: string; order: 'ascending' | 'descending' | null }): void {
  emit('sort-change', data)
}

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div class="smart-table">
    <!-- 筛选面板：默认一行，超出显示展开按钮 -->
    <div v-if="filters.length" class="smart-filter">
      <div ref="filterWrap" class="filter-fields">
        <div v-for="field in filters" :key="field.prop" class="filter-field">
          <el-input
            v-if="field.type === 'input' || !field.type"
            v-model="query[field.prop]"
            :placeholder="field.placeholder || field.label"
            clearable
            @input="onFilterChange"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="query[field.prop]"
            :placeholder="field.placeholder || field.label"
            clearable
            @change="onFilterChange"
          >
            <el-option
              v-for="opt in field.options || []"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="query[field.prop]"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="field.placeholder || field.label"
            @change="onFilterChange"
          />
          <el-date-picker
            v-else-if="field.type === 'daterange'"
            v-model="query[field.prop]"
            type="daterange"
            value-format="YYYY-MM-DD"
            :start-placeholder="$t('common.startDate')"
            :end-placeholder="$t('common.endDate')"
            @change="onFilterChange"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="query[field.prop]"
            :placeholder="field.placeholder || field.label"
            @change="onFilterChange"
          />
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          {{ $t('common.search') }}
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshLeft /></el-icon>
          {{ $t('common.reset') }}
        </el-button>
        <el-button
          v-if="needExpand || filterExpanded"
          link
          type="primary"
          @click="filterExpanded = !filterExpanded"
        >
          {{ filterExpanded ? $t('common.collapse') : $t('common.expand') }}
          <el-icon>
            <ArrowDown v-if="!filterExpanded" />
            <ArrowUp v-else />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 工具栏：扩展按钮 + 列设置 + 导出 -->
    <div class="smart-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar" />
      </div>
      <div class="toolbar-right">
        <el-popover width="190" trigger="click">
          <template #reference>
            <el-button plain>
              <el-icon><Setting /></el-icon>
              {{ $t('common.columns') }}
            </el-button>
          </template>
          <el-checkbox-group v-model="visibleProps" class="column-options">
            <el-checkbox
              v-for="col in columns"
              v-show="col.hideable !== false"
              :key="col.prop"
              :value="col.prop"
            >
              {{ col.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-popover>
        <el-button v-if="exportable" type="primary" plain @click="exportExcel">
          <el-icon><Download /></el-icon>
          {{ $t('common.export') }}
        </el-button>
      </div>
    </div>

    <!-- 表格主体 -->
    <el-table
      v-column-resize="{ onResize: handleColumnResize }"
      v-loading="loading"
      :data="data"
      border
      stripe
      :row-key="rowKey"
      :tree-props="treeProps"
      :default-expand-all="defaultExpandAll"
      :max-height="headerFixed ? maxHeight : undefined"
      :size="size"
      @selection-change="handleSelectionChange"
      @row-click="onRowClick"
      @cell-click="onCellClick"
      @sort-change="onSortChange"
    >
      <el-table-column
        v-if="selectable"
        type="selection"
        width="50"
        :fixed="selectionFixed ? 'left' : false"
      />
      <el-table-column v-if="showIndex" type="index" label="#" width="55" align="center" />
      <el-table-column
        v-for="col in displayColumns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="colWidths[col.prop]"
        :min-width="col.minWidth"
        :fixed="col.fixed"
        :align="col.align || 'left'"
        :sortable="col.sortable || false"
        :filterable="col.filterable || false"
        :filters="col.filters"
        :show-overflow-tooltip="col.showOverflowTooltip !== false"
      >
        <template v-if="col.statusMap" #default="{ row }">
          <el-tag :type="col.statusMap[String(row[col.prop])]?.type || 'info'" size="small">
            {{ col.statusMap[String(row[col.prop])]?.label ?? row[col.prop] }}
          </el-tag>
        </template>
        <template v-else-if="$slots[`col-${col.prop}`]" #default="{ row }">
          <slot :name="`col-${col.prop}`" :row="row" />
        </template>
        <template v-else-if="col.formatter" #default="{ row }">
          {{ col.formatter(row, row[col.prop]) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div v-if="paginated" class="smart-pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @change="emit('page-change')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.smart-table {
  width: 100%;
}

/* 筛选面板 */
.smart-filter {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.filter-fields {
  flex: 1;
  min-width: 0;

  /* 收起时固定显示一行，展开时由 Motion 动画过渡到内容实际高度 */
  height: 40px;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* 工具栏 */
.smart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.column-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 列宽拖拽手柄 */
:deep(.el-table th) {
  position: relative;
}

:deep(.col-resize-handle) {
  position: absolute;
  top: 0;
  right: -2px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 4;
  user-select: none;
}

/* 分页 */
.smart-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

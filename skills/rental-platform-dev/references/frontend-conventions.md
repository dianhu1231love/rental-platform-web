# 前端代码规范与示例

## 页面统一格式

- Vue 3 组合式 API：`<script setup lang="ts">` + `defineOptions({ name: 'XxxManage' })`。
- 主参考页面：`src/views/market/customer/index.vue`（客户管理）、`src/views/market/visit/index.vue`（拜访管理），新页面保持同风格。
- 列表页使用通用组件 `SmartTable`（`src/components/SmartTable.vue`）：`columns` / `filters` 配置 + `page/pageSize` 双向绑定分页。
- 新增/编辑统一用 `el-dialog` 弹窗 + `reactive` 表单 + `FormRules` 校验；编辑受限时仅开放允许编辑的字段。

## 多语言 i18n 规范（重点）

- 文案集中在 `src/locales/zh-CN.ts` / `en-US.ts`，key 按模块分组（如 `visit.*`、`common.*`）。
- **所有含 `t()` 的映射必须放在 `computed` 中**，保证切换语言时重建：

```ts
const TYPE_META = computed<Record<VisitType, { label: string; type: 'success' | 'info' }>>(() => ({
  onsite: { label: t('visit.typeOnsite'), type: 'success' },
  phone: { label: t('visit.typePhone'), type: 'info' },
}))

const TYPE_OPTIONS = computed<Array<{ value: VisitType; label: string }>>(() =>
  Object.entries(TYPE_META.value).map(([value, meta]) => ({
    value: value as VisitType,
    label: meta.label,
  })),
)

const columns = computed<TableColumn[]>(() => [{ prop: 'visitType', label: t('visit.visitType') }])
const filters = computed<FilterField[]>(() => [{ prop: 'visitType', type: 'select', options: TYPE_OPTIONS.value }])
```

- `FormRules` 的 message 用函数形式延迟取文案：`{ required: true, message: () => t('visit.customerRequired'), trigger: 'change' }`。
- 禁止在 setup 顶层用静态数组/对象直接调 `t()`（语言切换后不会刷新）。

## 类型与接口分层

- 业务/接口类型集中在 `src/types/index.ts`（如 `VisitRecord`、`VisitFormModel`、`VisitAttachment`、`CustomerOption`），新增/修改接口先更新类型，保证前后端契约一致。
- 接口层集中在 `src/api/*`：`request.get<T>()` 直接返回 `ApiResponse<T>`，无需手动解包。
- Mock：`src/api/mock/index.ts` 加路由匹配，`src/api/mock/seed.ts` 加种子数据。

## 权限

- 按钮级权限用 `v-permission="['market:visit:add']"` 控制显隐。
- 菜单权限标识示例：市场-拜访管理 `market:visit:add / edit / delete / view`（菜单 id=14）。

## 列表 / 筛选 / 分页

- `query = reactive({ page: 1, pageSize: 10 })` 与 SmartTable `v-model` 双向绑定。
- `searchParams` 存搜索条件；`handleSearch` 同步条件并回第一页；`handleReset` 清空条件并刷新；`loadList` 统一加载。

## 弹窗表单

- `dialogVisible` + `dialogMode: 'create' | 'edit'`；`openCreate` 用 `Object.assign(form, { ...默认值 })` 重置；`openEdit` 回显，仅开放允许编辑字段（如拜访管理编辑只开放拜访结果与附件）。
- 保存成功后 `ElMessage.success` + 关闭弹窗 + 刷新列表。

## 附件上传与预览

- `el-upload` 支持 `drag` 拖拽、`multiple` 多文件；文件列表展示名称/大小，支持删除。
- 预览：附件为 HTTP 地址且已配置 KKFileView 时，弹窗内嵌 iframe 指向 KKFileView；否则回退浏览器内置预览/下载（详见 `file-preview.md`）。
- 后端接入后改用 multipart 上传，附件记录返回契约 `{ id, name, size, type, url }`（url 为 HTTP 地址）。

## 通用工程实践

- 2 空格缩进、单引号、无分号、单行 100 字符、LF（Prettier/ESLint/Stylelint 强制）。
- 本地编辑用 `apply_patch`；检索优先 `rg`；工具调用尽量并行。
- 改代码先 `npm run type-check`，发布/合并前 `npm run build`。
- 提交走 Conventional Commits，husky + lint-staged 自动修复并检查，不绕过。

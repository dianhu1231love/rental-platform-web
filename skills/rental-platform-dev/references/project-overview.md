# 项目结构速览

## 技术栈与版本

| 分类 | 技术 |
| ---- | ---- |
| 框架 | Vue ^3.5 |
| 构建工具 | Vite ^5.4 |
| 语言 | TypeScript ^6.0 |
| UI 组件库 | Element Plus ^2.9 |
| 状态管理 | Pinia ^2.3 |
| 路由 | Vue Router ^4.5 |
| 图表 | ECharts ^5.6 |
| 国际化 | Vue I18n ^9.14 |
| 请求 | Axios ^1.7 |
| 样式 | SCSS（Dart Sass 1.83） |

## 目录结构

```
src/
├── api/                  # 接口层（全量 TS 类型化）
│   ├── auth.ts           # 登录/SSO/找回/用户信息
│   ├── dashboard.ts      # 看板数据
│   ├── system.ts         # 角色/菜单/租户
│   ├── market.ts         # 客户下拉等市场模块接口
│   ├── visit.ts          # 拜访管理接口
│   └── mock/             # Mock 数据服务（seed.ts + index.ts 路由适配器）
├── assets/styles/        # 全局样式与 SCSS 变量
├── components/           # 通用组件（SmartTable、BaseChart 等）
├── constants/            # 全局常量配置
├── directives/           # v-permission 按钮权限指令
├── layout/               # 主布局（侧边栏/导航/标签页）
├── locales/              # vue-i18n 多语言（zh-CN / en-US）
├── router/               # 静态路由 + 动态路由挂载
├── store/                # Pinia：app / user / permission
├── types/                # 全局类型定义（接口响应、业务实体、表单模型）
├── utils/                # 请求封装、token、校验、格式化、预览（preview.ts）
├── views/                # 页面（login/dashboard/system/market 等）
├── main.ts               # 应用入口
├── permission.ts         # 路由守卫（登录态 + 动态路由加载）
└── settings.ts           # 全局应用设置
```

## 常用命令

| 命令 | 作用 |
| ---- | ---- |
| `npm run dev` | 启动开发服务器（本机建议改用 8081 端口） |
| `npm run type-check` | TypeScript 类型检查（vue-tsc） |
| `npm run lint` | ESLint 检查并自动修复 |
| `npm run lint:check` | ESLint 只检查不修改 |
| `npm run stylelint` | Stylelint 检查并自动修复 |
| `npm run format` | Prettier 格式化全部文件 |
| `npm run build` | 类型检查 + 生产构建 |

## Mock 数据

- 默认启用 Mock（`.env.development` 中 `VITE_USE_MOCK=true`），数据持久化在浏览器 localStorage（键名 `rp_mock_` 前缀）。
- 种子数据在 `src/api/mock/seed.ts` 维护，Mock 路由在 `src/api/mock/index.ts`。
- 新增业务模块套路：`src/types/index.ts` 加类型 → `src/api/<模块>.ts` 加接口 → `src/api/mock/` 加路由与种子 → `src/views/<模块>/` 建页面。

## 权限与菜单模型

- 菜单权限决定侧边栏显示与路由可达性（`role.menuIds`）；按钮权限决定页面内增删改查按钮是否渲染（`v-permission` 指令 + `role.perms`）。
- 管理员角色持有 `*:*:*` 通配权限。
- 菜单/角色修改后，对应角色用户重新登录才生效（动态路由登录时生成）。
- 菜单树节点字段：`id, parentId, type(directory|menu|button), path, component, title, i18nKey, icon, sort, visible, autoRefresh, perms, buttons[]`。

## 演示账号

| 账号 | 密码 | 角色 |
| ---- | ---- | ---- |
| admin | 123456 | 超级管理员（全部权限） |
| finance | 123456 | 财务专员（看板 + 权限设置只读） |
| operator | 123456 | 运营专员（看板 + 租户管理只读） |

找回账户演示：验证码固定为 `123456`。

## 环境变量

- `VITE_APP_TITLE`：应用标题
- `VITE_USE_MOCK`：是否启用 Mock（true/false）
- `VITE_API_BASE_URL`：后端接口前缀（默认 /api）
- `VITE_KKFILEVIEW_URL`：KKFileView 在线预览服务地址（未配置时附件预览回退浏览器内置）

## 后端接口契约

```json
{ "code": 200, "data": {}, "message": "success" }
```

主要接口：`POST /auth/login`、`GET /auth/userinfo`、`/dashboard/stats|trend|equipment|hours|todos`、`/system/roles|menus|tenants`。真实后端模式：`VITE_USE_MOCK=false`，并在 `vite.config.ts` 把 `/api` 代理到后端。

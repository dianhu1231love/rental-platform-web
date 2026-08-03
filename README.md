# 租赁平台管理系统（前端）

基于 **Vue 3 + Vite + TypeScript + Element Plus + Pinia + ECharts + Vue I18n** 的租赁业务管理系统前端。

项目内置 Mock 数据层，**无需后端即可完整运行**；同时支持通过开关一键切换到真实后端接口。

## 技术栈

| 分类 | 技术 | 版本 |
| ---- | ---- | ---- |
| 框架 | Vue | ^3.5 |
| 构建工具 | Vite | ^5.4 |
| 语言 | TypeScript | ^6.0 |
| UI 组件库 | Element Plus | ^2.9 |
| 状态管理 | Pinia | ^2.3 |
| 路由 | Vue Router | ^4.5 |
| 图表 | ECharts | ^5.6 |
| 国际化 | Vue I18n | ^9.14 |
| 请求 | Axios | ^1.7 |
| 样式 | SCSS（Dart Sass） | 1.83 |

### 开发工具链

| 工具 | 用途 | 版本 |
| ---- | ---- | ---- |
| TypeScript / vue-tsc | 类型检查 | ^6.0 / ^3.3 |
| ESLint | JS/TS/Vue 代码规范检查 | ^10.8 |
| Prettier | 代码格式化 | ^3.9 |
| Stylelint | CSS/SCSS 规范检查 | ^17.14 |
| Husky + lint-staged | git 提交前自动检查与修复 | ^9 / ^17 |
| commitlint | git 提交信息规范校验 | ^21 |
| EditorConfig | 跨编辑器统一风格 | - |

## 环境要求

- Node.js **≥ 20.19**，推荐使用 Node 24（当前开发环境为 v24.18.1）
- npm（随 Node 自带）
- Git（用于提交与版本管理）

> 注意：本项目代码质量工具链（ESLint 10 / Stylelint 17 / lint-staged 17 等）要求 Node 20.19+，低于该版本会出现兼容性警告或无法运行。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 3. 生产构建（构建前自动执行类型检查）
npm run build

# 4. 本地预览生产构建产物
npm run preview
```

### 国内网络安装依赖

如果公司/默认 npm 源不可达，可使用国内镜像源：

```bash
npm install --registry=https://registry.npmmirror.com
```

### 演示账号

| 账号 | 密码 | 角色 | 权限范围 |
| ---- | ---- | ---- | -------- |
| admin | 123456 | 超级管理员 | 全部权限 |
| finance | 123456 | 财务专员 | 看板 + 权限设置（只读） |
| operator | 123456 | 运营专员 | 看板 + 租户管理（只读） |

找回账户演示：验证码固定为 `123456`。

## 功能总览

### 登录

- 常规账号密码登录（记住用户名）
- SSO 单点登录：支持认证中心跳转回调 `?ticket=xxx` 自动登录
- 找回账户：手机号/邮箱 + 验证码验证

### 主页数据看板

- 六大核心指标卡片：当前租赁总金额、应收账款、待分款、待开票、分款总额、开票总额
- 设备看板：设备总数/在租/空闲/维修中、出租率、在线率、状态分布图
- 近六个月计划回款与实际回款对比柱状图
- 设备工时统计（计划/实际工时 + 利用率）
- 待办事项：合同/分款/开票审批，支持通过、驳回

### 系统设置

- **权限设置**：角色 CRUD + 菜单权限树 + 按钮级权限分配
- **菜单设置**：菜单树管理（目录/菜单/按钮）、路由地址、组件路径、权限标识、图标、排序、显示状态、按钮权限、"点击标签自动刷新"开关
- **动态路由**：登录后根据后端菜单数据 `router.addRoute` 动态生成，侧边栏随权限变化
- **租户管理**：租户 CRUD、套餐、到期时间、启停用、分页搜索

### 平台能力

- 多语言：简体中文 / English（含 Element Plus 组件语言切换）
- 按钮级权限指令 `v-permission`
- 请求封装（axios 拦截器、统一错误提示、401 自动登出）
- Mock 数据层：无后端可完整运行，编辑数据持久化在浏览器 localStorage
- 多标签页：拖拽排序、右键菜单（刷新/关闭/关闭左右侧/关闭其他/全部）、拖到顶部关闭、首页固定不可关闭
- 页面缓存：菜单可配置"点击标签自动刷新"，开启则每次进入重新加载，关闭则保留页面状态

## 目录结构

```
src/
├── api/                  # 接口层（全量 TS 类型化）
│   ├── auth.ts           # 登录/SSO/找回/用户信息
│   ├── dashboard.ts      # 看板数据
│   ├── system.ts         # 角色/菜单/租户
│   └── mock/             # Mock 数据服务（seed.ts + index.ts 路由适配器）
├── assets/styles/        # 全局样式与 SCSS 变量
├── components/           # 通用组件（BaseChart 等）
├── constants/            # 全局常量配置（图标列表、卡片元信息、待办映射等）
├── directives/           # v-permission 按钮权限指令
├── layout/               # 主布局（侧边栏/导航/标签页）
├── locales/              # vue-i18n 多语言（zh-CN / en-US）
├── router/               # 静态路由 + 动态路由挂载
├── store/                # Pinia：app / user / permission
├── types/                # 全局类型定义（接口响应、业务实体、表单模型）
├── utils/                # 请求封装、token、校验、格式化、树工具
├── views/                # 页面（login/dashboard/system）
├── main.ts               # 应用入口
├── permission.ts         # 路由守卫（登录态 + 动态路由加载）
└── settings.ts           # 全局应用设置
```

## 开发规范与工具链

项目遵循主流大厂前端规范（2 空格缩进、单引号、无分号、单行 100 字符、LF 换行），所有代码在提交前自动经过格式化与检查。

### 常用命令

| 命令 | 作用 |
| ---- | ---- |
| `npm run dev` | 启动开发服务器 |
| `npm run type-check` | TypeScript 类型检查（vue-tsc） |
| `npm run lint` | ESLint 检查并自动修复 |
| `npm run lint:check` | ESLint 只检查不修改 |
| `npm run stylelint` | Stylelint 检查并自动修复 |
| `npm run stylelint:check` | Stylelint 只检查不修改 |
| `npm run format` | Prettier 格式化全部文件 |
| `npm run format:check` | Prettier 只检查不修改 |
| `npm run build` | 类型检查 + 生产构建 |

### 提交前自动检查（Husky + lint-staged）

执行 `git commit` 时，Husky 会自动触发：

1. **pre-commit**：对暂存文件运行 ESLint、Stylelint、Prettier 自动修复，检查不通过则提交失败；
2. **commit-msg**：commitlint 校验提交信息是否符合 Conventional Commits 格式，不符合则提交失败。

### Git 提交信息规范

提交信息格式为 `类型: 描述`，描述可以使用中文：

```
feat: 新增租户导出功能
fix: 修复标签页拖拽排序错乱的问题
style: 调整看板卡片样式
refactor: 提取公共类型定义
chore: 升级依赖版本
docs: 更新 README 文档
```

常用类型：`feat`（新功能）、`fix`（修复）、`style`（样式/格式）、`refactor`（重构）、`docs`（文档）、`chore`（杂项/依赖）。

## 开发注意事项

### Mock 数据

- 项目默认启用 Mock（`.env.development` 中 `VITE_USE_MOCK=true`），数据存储在浏览器 localStorage（键名以 `rp_mock_` 开头）。
- 菜单、角色、租户等在页面中的编辑会持久化保存；如需恢复初始种子数据，清除对应 localStorage 键或使用无痕窗口。
- 种子数据在 `src/api/mock/seed.ts` 中维护。

### 多标签页与页面缓存

- 首页固定第一位，**不允许关闭、不允许拖动**。
- 标签支持拖拽排序、右键菜单（刷新/关闭/关闭左右侧/关闭其他/关闭全部）、拖拽到页面顶部悬浮框关闭。
- 菜单设置中的"点击标签自动刷新"控制页面是否缓存：**开启**时每次点击标签重新加载页面，**关闭**（默认）时保留页面状态（表单、滚动位置等）。
- 修改菜单的自动刷新开关后，**重新登录**才生效（动态路由在登录时生成）。

### 菜单与权限

- 新增页面步骤：在 `src/views` 下创建组件 → 在"菜单设置"中新增菜单（填写路由地址、组件路径、图标等）→ 保存后重新登录。
- 菜单/角色修改后需重新登录，动态路由与权限才会重新生成。
- 按钮级权限使用 `v-permission="['system:role:add']"` 指令控制显隐。

### 类型与接口契约

- 所有接口返回类型集中在 `src/types/index.ts`，新增/修改接口时先更新类型定义，保证前后端契约一致。
- 请求层已泛型化：`request.get<T>()` 直接返回 `ApiResponse<T>`，无需手动解包。
- 菜单树节点字段：`id, parentId, type(directory|menu|button), path, component, title, i18nKey, icon, sort, visible, autoRefresh, perms, buttons[]`。

### 接入真实后端

1. 修改 `.env.development`：`VITE_USE_MOCK=false`；
2. 确认 `VITE_API_BASE_URL=/api`，并在 `vite.config.ts` 中把 `/api` 代理到后端地址；
3. 后端统一按以下契约返回：

```json
{ "code": 200, "data": {}, "message": "success" }
```

主要接口：

- `POST /auth/login` → `{ token }`
- `GET /auth/userinfo` → `{ name, username, avatar, roles, perms, roleId, menus }`
- 看板接口：`/dashboard/stats|trend|equipment|hours|todos`
- 系统接口：`/system/roles|menus|tenants`

### 其他

- Node 版本通过 nvm4w 管理（`C:\nvm4w\nodejs`），升级 Node 后建议重新执行 `npm install`。
- 默认 npm 源可能指向公司内网仓库（如 `tsd.xcmg.com`），在外网环境请使用 `--registry=https://registry.npmmirror.com`。
- 图标使用 `@element-plus/icons-vue`，已在入口全量注册，模板中直接用组件名即可（如 `<HomeFilled />` 或 `icon: 'HomeFilled'`）。

## 权限模型

- **菜单权限**：决定侧边栏显示与路由可达性（`role.menuIds`）
- **按钮权限**：决定页面内新增/编辑/删除/查看按钮是否渲染（`v-permission` 指令 + `role.perms`）
- 管理员角色持有 `*:*:*` 通配权限
- 菜单/角色修改后，对应角色用户**重新登录**即生效

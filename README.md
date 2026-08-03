# 租赁平台管理系统（前端）

基于 **Vue 3 + Vite 5 + Element Plus + Pinia + Vue Router + ECharts + Vue I18n** 的前端框架，开箱即用的租赁业务管理系统骨架。

## 功能总览

### 登录
- 常规账号密码登录（记住用户名）
- SSO 单点登录：支持认证中心跳转回调 `?ticket=xxx` 自动登录
- 找回账户：手机号/邮箱 + 验证码验证，找回并重置

### 主页数据看板
- 六大核心指标卡片：当前租赁总金额、当前应收账款、当前待分款、当月待开票、当月分款总金额、当月开票总金额
- 设备看板：设备总数/在租/空闲/维修中、出租率、在线率、状态分布图
- 近六个月计划回款与实际回款对比柱状图
- 设备工时统计（计划/实际工时 + 利用率）
- 待办事项（待审批）：合同/分款/开票审批，支持通过、驳回

### 系统设置
- **权限设置**：角色 CRUD + 菜单权限树 + 新增/编辑/删除/查看等按钮级权限分配
- **菜单设置**：菜单树管理（目录/菜单/按钮）、路由地址、组件路径、权限标识、图标、排序、显示状态、按钮权限配置
- **动态路由**：登录后根据后端菜单数据 `router.addRoute` 动态生成，侧边栏随权限变化
- **租户管理**：租户 CRUD、套餐、到期时间、启停用、分页搜索

### 平台能力
- 多语言：简体中文 / English（含 Element Plus 组件语言切换）
- 按钮级权限指令 `v-permission`
- 请求封装（axios 拦截器、统一错误提示、401 自动登出）
- Mock 数据层：无后端可完整运行，编辑数据持久化在浏览器 localStorage
- 布局：侧边栏折叠、面包屑、多标签页、页面切换进度条

## 快速开始

环境要求：Node.js ≥ 18（当前开发环境为 Node v20.12.0）

```bash
npm install          # 安装依赖（国内网络可加 --registry=https://registry.npmmirror.com）
npm run dev          # 启动开发服务器 http://localhost:5173
npm run build        # 生产构建
npm run preview      # 预览生产构建
```

### 演示账号

| 账号 | 密码 | 角色 | 权限范围 |
| ---- | ---- | ---- | -------- |
| admin | 123456 | 超级管理员 | 全部权限 |
| finance | 123456 | 财务专员 | 看板 + 权限设置（只读） |
| operator | 123456 | 运营专员 | 看板 + 租户管理（只读） |

找回账户演示：验证码固定为 `123456`。

## 目录结构

```
src/
├── api/                  # 接口层
│   ├── auth.js           # 登录/SSO/找回/用户信息
│   ├── dashboard.js      # 看板数据
│   ├── system.js         # 角色/菜单/租户
│   └── mock/             # Mock 数据服务（seed + 路由适配器）
├── assets/styles/        # 全局样式与 SCSS 变量
├── components/           # 通用组件（BaseChart 等）
├── directives/           # v-permission 按钮权限指令
├── layout/               # 主布局（侧边栏/导航/标签页）
├── locales/              # vue-i18n 多语言（zh-CN / en-US）
├── router/               # 静态路由 + 动态路由挂载
├── store/                # Pinia：app / user / permission
├── utils/                # 请求封装、token、校验、格式化
├── views/                # 页面（login/dashboard/system）
├── permission.js         # 路由守卫（登录态 + 动态路由加载）
├── settings.js           # 全局配置
└── main.js
```

## 接入真实后端

1. 在 `.env.development` 将 `VITE_USE_MOCK` 改为 `false`；
2. 确认 `VITE_API_BASE_URL=/api`，并在 `vite.config.js` 中把 `/api` 代理到后端地址；
3. 后端按以下契约返回即可无缝对接：

```json
{ "code": 200, "data": {}, "message": "success" }
```

- `POST /auth/login` → `{ token }`
- `GET /auth/userinfo` → `{ name, avatar, roles, perms, menus }`
- `menus` 树节点字段：`id, parentId, type(directory|menu|button), path, component, title, i18nKey, icon, sort, visible, perms, buttons[]`
- 看板接口：`/dashboard/stats|trend|equipment|hours|todos`
- 系统接口：`/system/roles|menus|tenants`

## 权限模型

- **菜单权限**：决定侧边栏显示与路由可达性（`role.menuIds`）
- **按钮权限**：决定页面内新增/编辑/删除/查看按钮是否渲染（`v-permission` 指令 + `role.perms`）
- 管理员角色持有 `*:*:*` 通配权限
- 菜单/角色修改后，对应角色用户**重新登录**即生效

## 技术栈版本

| 依赖 | 版本 |
| ---- | ---- |
| Vue | ^3.5 |
| Vite | ^5.4 |
| Element Plus | ^2.9 |
| Pinia | ^2.3 |
| Vue Router | ^4.5 |
| ECharts | ^5.6 |
| Vue I18n | ^9.14 |
| Axios | ^1.7 |

---
name: rental-platform-dev
description: 租赁平台管理系统（rental-platform-web 仓库）的开发规范与常规开发约定。适用于该仓库内的一切任务：需求分析、编码、修改、审查、多语言（i18n）、Mock、权限、附件预览（KKFileView/MinIO）、Git 提交与 PR、文档更新。每次在本仓库开始任何工作前，必须先完整读取本 SKILL.md，并按需加载 references/ 中的细分规范。
---

# Rental Platform 开发规范

本技能汇总 rental-platform-web 仓库的开发规范与常规开发约定，供每个会话/窗口开工前读取，保证风格统一、避免返工。

## 必读流程

1. 完整读取本 SKILL.md。
2. 读取仓库根目录 AGENTS.md（如存在）。
3. 按当前任务加载 references/ 对应细分文档：
   - 项目结构 / 技术栈 / Mock / 权限模型 → `references/project-overview.md`
   - 前端代码规范与示例（i18n、SmartTable、弹窗、上传）→ `references/frontend-conventions.md`
   - Git / 环境 / PR 流程 → `references/git-workflow.md`
   - 附件在线预览与下载（KKFileView + MinIO + Spring Boot）→ `references/file-preview.md`
   - 待办与路线图（商机管理、客户详情）→ `references/roadmap.md`

## 硬性规则（违反会返工）

1. **多语言文案必须放 computed**：所有展示文案走 vue-i18n；凡含 `t()` 的数组/对象/映射（表格列、筛选项、下拉选项、标签映射、枚举映射）必须放在 `computed` 中，禁止静态数组/对象在 setup 顶层直接调 `t()`。语言切换后文案必须即时更新。
2. **统一格式**：新页面按现有模块统一格式（主参考 `src/views/market/customer/index.vue`、`src/views/market/visit/index.vue`）。2 空格缩进、单引号、无分号、单行 100 字符、LF 换行。
3. **分层约定**：业务/接口类型集中在 `src/types/index.ts`；接口集中在 `src/api/*`（Mock 在 `src/api/mock/`）；页面集中在 `src/views/<模块>/`。
4. **不提交无关改动**：提交前检查 `git status`，只暂存本次任务相关文件（本项目存在易误提交的 `yarn.lock` 脏改动，禁止顺手提交）。
5. **收尾验证**：改代码先跑 `npm run type-check`；发布/合并前跑 `npm run build`。
6. **文档同步**：新增/变更功能后按需更新 `docs/` 对应文档并在 README「相关文档」挂链；新待办写入 `docs/todo.md`。
7. **提交规范**：Conventional Commits（`feat:` / `fix:` / `docs:` / `style:` / `refactor:` / `chore:`，描述可用中文）；husky + lint-staged 自动检查，禁止用 `--no-verify` 绕过。

## 环境事实（Windows + Codex 沙箱）

- 沙箱不继承 Windows 用户级 PATH：`gh` 实际位于 `C:\Program Files\GitHub CLI\gh.exe`，用 `& 'C:\Program Files\GitHub CLI\gh.exe' ...` 或先 `$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH` 再调用。
- git 写操作（add/commit/push）、npm/npx、网络下载通常需要提权（`require_escalated`）。
- 本机 5173 处于 Windows 保留端口段（5118–5217），直接 `npm run dev` 会报 EACCES；开发服务器用 8081 等非保留端口（如 `npm run dev -- --host 127.0.0.1 --port 8081`）。
- 当前开发地址：http://127.0.0.1:8081/，演示账号 admin/123456。

## 技术栈速览

Vue 3.5 + Vite 5 + TypeScript 6 + Element Plus 2.9 + Pinia + Vue Router 4 + Vue I18n 9 + ECharts + Axios + SCSS。默认 Mock 模式（`VITE_USE_MOCK=true`），数据存浏览器 localStorage（键名 `rp_mock_` 前缀），无后端可完整运行；改为 `false` 后走 `/api` 真实接口。

## 核心业务约定

- 动态路由：登录后由后端菜单数据 `router.addRoute` 动态生成；新增页面 = `src/views` 建组件 + 菜单设置新增菜单 + 重新登录。
- 按钮级权限：`v-permission="['market:visit:add']"`；管理员角色持有 `*:*:*` 通配权限。
- 拜访管理：商机编号 `opportunityCode` 非必填，商机管理模块开发完成后自动带出（见 `references/roadmap.md`）。
- 附件预览：KKFileView，前端已封装 `src/utils/preview.ts`，配置 `VITE_KKFILEVIEW_URL`（详见 `references/file-preview.md`）。

## 常规开发通用约定

- 检索优先 `rg` / `rg --files`；工具调用尽量并行；不输出 `echo ====` 类噪音分隔。
- 本地文件编辑用 `apply_patch`，不要用 shell 写文件技巧。
- 保持 diff 最小、聚焦单一任务；不删除/覆盖用户既有无关改动。
- 不把密钥、token、内网地址写进代码或提交；敏感配置走环境变量。
- 功能收尾时自测关键路径：页面刷新、语言切换、无权限场景、Mock 与真实接口切换。

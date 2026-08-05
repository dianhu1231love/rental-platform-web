# Git 与环境工作流

## 分支模型（Git Flow 简化版）

| 分支 | 用途 |
| ---- | ---- |
| main | 生产分支，仅通过合并 release / hotfix 更新 |
| develop | 日常开发集成分支（即用户所说的 dev），功能完成后合并到此 |
| feature/* | 功能分支，从 develop 检出 |
| release/* | 发布分支，从 develop 检出，验收后合并 main 并打 tag |
| hotfix | 紧急修复分支，从 main 检出 |

## 提交规范

- 提交信息遵循 Conventional Commits：`feat:` / `fix:` / `docs:` / `style:` / `refactor:` / `chore:` 等，描述可用中文。
- pre-commit 自动跑 ESLint / Stylelint / Prettier 修复；commit-msg 校验 commitlint，不通过则提交失败，禁止 `--no-verify`。
- 提交前 `git status` 检查：只暂存本次任务相关文件；仓库存在易误提交的 `yarn.lock` 脏改动，不属于任务时不要提交。

## gh 与 PR 流程

- 沙箱 PATH 不含 gh：`& 'C:\Program Files\GitHub CLI\gh.exe' pr view 4` 或先 `$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH`。
- 功能完成后：推分支 → `gh pr create --base develop --head feature/xxx --title ... --body ...` 创建 PR（未验收可先 Draft）→ 验收后转 Ready 合并。
- 合并后：删除本地功能分支并切回 develop、拉取最新。

## 沙箱环境提示

- git 写操作（add/commit/push）、npm/npx、网络下载通常需要提权（`require_escalated`）。
- 本机 5173 处于 Windows 保留端口段（5118–5217），开发服务器改用 8081 等非保留端口。

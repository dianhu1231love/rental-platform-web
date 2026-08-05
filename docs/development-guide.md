# 开发规范

> 本文件为本仓库的开发约定。所有新的会话/窗口开始工作时，**必须先读取本文档**，再开始任务。

## 1. 沙箱环境与工具链

当前开发环境为 Codex 桌面应用（沙箱），沙箱会话**不会继承 Windows 用户级环境变量（PATH 等）**。
因此 `gh` 等已安装但不在沙箱 PATH 中的工具，无法直接通过命令名调用。

gh 实际安装位置：`$env:LOCALAPPDATA\Microsoft\WinGet\Links\gh.exe`（WinGet 安装；不同电脑用户名不同，必须用环境变量定位，勿写死 `C:\Users\...` 前缀；旧文档的 `C:\Program Files\GitHub CLI\gh.exe` 已失效），两种调用方式：

```powershell
# 方式一：直接使用绝对路径
& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\gh.exe" auth status

# 方式二：每次命令前临时加入 PATH（只对当前命令生效）
$env:PATH = "$env:LOCALAPPDATA\Microsoft\WinGet\Links;" + $env:PATH
gh auth status
```

其他不在沙箱 PATH 中的工具同理：先确认实际安装路径（`Get-Command` 或常见安装目录），
再使用绝对路径调用，不要假定沙箱环境变量与用户环境一致。

### rg（ripgrep）不可用与本地安装

Codex 自带的 rg 位于 WindowsApps 包内（`C:\Program Files\WindowsApps\OpenAI.Codex_*\app\resources\rg.exe`），
受 WindowsApps ACL 限制，沙箱内外直接执行均报「拒绝访问」，提权也无法运行。
因此项目内检索必须使用独立安装的 ripgrep，推荐以下任一方式：

```powershell
# 方式一：通过 gh 下载官方 release（已验证，版本号以实际下载为准）
$rgDir = "$env:TEMP\rg"
gh release download --repo BurntSushi/ripgrep --pattern '*x86_64-pc-windows-msvc.zip' --dir $rgDir
Expand-Archive -Path (Get-ChildItem "$rgDir\*.zip").FullName -DestinationPath "$rgDir\extracted" -Force

# 解压路径含版本号，先定位实际 rg.exe，再全路径调用
Get-ChildItem "$rgDir\extracted" -Recurse -Filter rg.exe | Select-Object -ExpandProperty FullName
& '上述定位到的完整路径\rg.exe' -n "关键词" src
```

```powershell
# 方式二：winget 安装（winget 可用时）
winget install BurntSushi.ripgrep.MSVC

# 方式三：scoop 安装
scoop install ripgrep
```

注意：ripgrep 是独立工具，与项目依赖无关；沙箱内执行检索同样需要提权（`require_escalated`）。
版本号与临时目录名不要写死，换电脑后按上述步骤重新安装/定位即可。

## 2. 分支与提交规范

- 功能分支统一 `feature/*`，从 `develop` 检出（本仓库的 dev 集成分支名为 `develop`）
- 提交信息遵循 Conventional Commits：`feat:` / `fix:` / `refactor:` / `docs:` / `style:` / `chore:` 等，描述可用中文
- 提交前自动执行 husky + lint-staged（ESLint / Stylelint / Prettier / commitlint）

## 3. 代码规范

- 前端：Vue 3 + TypeScript + Element Plus + Pinia + Vue I18n；2 空格缩进、单引号、无分号、单行 100 字符
- 新页面按现有模块统一格式开发（参考 `src/views/market/customer/index.vue`）
- 多语言：所有展示文案走 vue-i18n；语言相关文案必须放在 `computed` 中，确保切换语言时重建，不要用静态数组/对象直接取 `t()`
- 类型与接口契约集中在 `src/types/index.ts`；接口层集中在 `src/api/*`

## 4. 文档

- 新增/变更功能后，如需后端协作或部署说明，更新 `docs/` 下对应文档，并在 README「相关文档」挂链

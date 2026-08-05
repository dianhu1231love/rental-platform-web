# 仓库开发约定（Agent 必读）

开始任何工作前，**必须先完整阅读 [skills/rental-platform-dev/SKILL.md](skills/rental-platform-dev/SKILL.md)**（项目开发规范技能，已安装到 Codex 本地 skills 目录，内容涵盖本文件与开发规范），再阅读 [docs/development-guide.md](docs/development-guide.md)。

重点提醒：

- 沙箱会话不继承 Windows 用户级 PATH，`gh` 等工具无法直接用命令名调用
- `gh` 实际路径（WinGet 安装）：`$env:LOCALAPPDATA\Microsoft\WinGet\Links\gh.exe`（不同电脑用户名不同，用环境变量定位，勿写死路径前缀）
- `rg`（ripgrep）不可用：Codex 自带 rg 在 WindowsApps 包内，沙箱内外均拒绝访问；需本地安装独立 ripgrep（安装方式见 [skills/rental-platform-dev/SKILL.md](skills/rental-platform-dev/SKILL.md)「环境事实」）
- gh 调用方式：

```powershell
& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\gh.exe" --version
```

或每次命令前临时加入 PATH：

```powershell
$env:PATH = "$env:LOCALAPPDATA\Microsoft\WinGet\Links;" + $env:PATH
```

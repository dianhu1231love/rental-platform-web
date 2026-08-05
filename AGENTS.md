# 仓库开发约定（Agent 必读）

开始任何工作前，**必须先完整阅读 [skills/rental-platform-dev/SKILL.md](skills/rental-platform-dev/SKILL.md)**（项目开发规范技能，已安装到 Codex 本地 skills 目录，内容涵盖本文件与开发规范），再阅读 [docs/development-guide.md](docs/development-guide.md)。

重点提醒：

- 沙箱会话不继承 Windows 用户级 PATH，`gh` 等工具无法直接用命令名调用
- gh 调用方式：

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' --version
```

或每次命令前临时加入 PATH：

```powershell
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH
```

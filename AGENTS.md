# 仓库开发约定（Agent 必读）

开始任何工作前，**必须先完整阅读 [docs/development-guide.md](docs/development-guide.md)**，其中包含沙箱工具调用、分支/提交与代码规范。

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

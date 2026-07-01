# Windows 冒烟测试说明

[English](windows-smoke-test.md) | [한국어](windows-smoke-test.ko.md) | [日本語](windows-smoke-test.ja.md) | [中文](windows-smoke-test.zh.md)

安装 Node.js 20 或更高版本后，在 PowerShell 中运行:

```powershell
npx -y aigate-cli --version
npx -y aigate-cli doctor --language zh
npx -y aigate-cli check --format json
```

在本地 checkout 中运行:

```powershell
npm ci
npm run ci
node .\src\cli.mjs demo --language zh
```

预期结果: 命令成功，`doctor` 报告仓库状态，JSON 输出没有 shell quoting 错误。

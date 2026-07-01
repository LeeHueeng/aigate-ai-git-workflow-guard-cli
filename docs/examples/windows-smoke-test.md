# Windows Smoke Test Notes

[English](windows-smoke-test.md) | [한국어](windows-smoke-test.ko.md) | [日本語](windows-smoke-test.ja.md) | [中文](windows-smoke-test.zh.md)

Run these commands in PowerShell after installing Node.js 20 or newer:

```powershell
npx -y aigate-cli --version
npx -y aigate-cli doctor --language en
npx -y aigate-cli check --format json
```

For a local checkout:

```powershell
npm ci
npm run ci
node .\src\cli.mjs demo --language en
```

Expected result: commands exit successfully, `doctor` reports the repository
state, and no shell quoting errors appear in JSON output.

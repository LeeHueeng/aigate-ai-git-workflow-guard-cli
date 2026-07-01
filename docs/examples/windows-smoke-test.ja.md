# Windows スモークテストメモ

[English](windows-smoke-test.md) | [한국어](windows-smoke-test.ko.md) | [日本語](windows-smoke-test.ja.md) | [中文](windows-smoke-test.zh.md)

Node.js 20 以上をインストールした後、PowerShell で実行します。

```powershell
npx -y aigate-cli --version
npx -y aigate-cli doctor --language ja
npx -y aigate-cli check --format json
```

ローカル checkout では次を実行します。

```powershell
npm ci
npm run ci
node .\src\cli.mjs demo --language ja
```

期待結果: コマンドが成功し、`doctor` がリポジトリ状態を報告し、JSON 出力で
shell quoting エラーが出ないこと。

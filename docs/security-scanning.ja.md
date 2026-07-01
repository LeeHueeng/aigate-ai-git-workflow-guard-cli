# セキュリティスキャン

[English](security-scanning.md) | [한국어](security-scanning.ko.md) | [日本語](security-scanning.ja.md) | [中文](security-scanning.zh.md)

AIGate には、変更ファイルを対象にした軽量なローカル scanner が含まれます。

## チェック内容

scanner は Git で変更されたファイルに対して次の pattern を探します。

- AWS access key ID
- GitHub token
- Slack token
- private key block
- `api_key = "..."` のような generic secret assignment

大きなファイルと一般的な binary format は skip されます。

## コマンド

```sh
aigate check
aigate git-ready
aigate report --format sarif
```

`aigate git-ready` は、secret の可能性があるものを検出すると block します。

## 現在の制限

この scanner は local かつ dependency-free であることを意図しています。
GitHub secret scanning、GitGuardian、専用の enterprise secret detection
service を完全に置き換えるものではありません。

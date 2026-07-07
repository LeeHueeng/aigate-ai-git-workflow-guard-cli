# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate はリポジトリルートに再利用可能な GitHub Action を提供します。
安定運用では現在のリリースタグを使い、未リリースの最新動作を意図的に確認
したい場合だけ `@main` を使ってください。

```yaml
name: AIGate
on:
  pull_request:
  push:
    branches: [main]

jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: ja
```

PR レポートを生成する場合:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## 入力

| 入力 | 既定値 | 説明 |
| --- | --- | --- |
| `command` | `git-ready` | `git-ready`, `check`, `test`, `aitest`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, `release-check-npm`, `branch-strategy`, `branch-strategy-compare` をサポートします。 |
| `report-format` | `markdown` | レポート生成コマンドで使います。 |
| `output` | 空 | レポート生成コマンドの任意の出力先です。 |
| `language` | 空 | `en`, `ko`, `ja`, `zh` を指定できます。 |
| `package` | `aigate-cli@latest` | `npx` で実行する npm パッケージ指定です。 |

同じ action metadata は、このリポジトリ内の workflow テスト用に
`.github/actions/aigate` にも複製されています。

ブランチ戦略比較:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
  with:
    command: branch-strategy-compare
    report-format: json
    output: .aigate/reports/branch-strategy.json
```

## GitHub Marketplace

現在の `v0.1.6` Action 状態と Marketplace metadata です。

| 項目 | 値 |
| --- | --- |
| 安定 Action 参照 | `LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6` |
| Marketplace 公開 | GitHub Release 画面で手動で有効にする手順 |
| Action name | `AIGate Git Workflow Guard` |
| Primary category | `Code quality` |
| Secondary category | `Security` |
| Release tag | `v0.1.6` |
| Release title | `AIGate AI Git Workflow Guard CLI v0.1.6` |

Marketplace 掲載を有効にする前でも、Action は release tag から利用できます。
安定 patch release では `Set as the latest release` を有効にし、pre-release
にはしません。

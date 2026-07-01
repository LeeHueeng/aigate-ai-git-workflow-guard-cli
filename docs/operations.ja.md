# AIGate 運用ドキュメント

[English](operations.en.md) | [한국어](operations.ko.md) | [日本語](operations.ja.md) | [中文](operations.zh.md)

このドキュメントは、GitHub 上でソースコードではなく文書として読める
運用ガイドです。ビジュアル版 HTML は、ローカルで
`docs/aigate-overview.ja.html` を開くと確認できます。

## 全体の運用プロセス

```mermaid
flowchart LR
  A["Git 変更を検出"] --> B["ローカルゲートを実行"]
  B --> C["範囲を絞って commit"]
  C --> D["検証付き push"]
  D --> E["PR 作成"]
  E --> F["CI 確認"]
  F --> G["main に merge"]
  G --> H["release check"]
  H --> I["tag release"]
  I --> J["npm publish"]
```

## リリースプロセス

```mermaid
flowchart LR
  A["package version bump"] --> B["npm run ci"]
  B --> C["vX.Y.Z tag 作成"]
  C --> D["GitHub Actions release workflow"]
  D --> E["npm Trusted Publishing"]
  E --> F["GitHub Release notes"]
```

## コマンドマップ

| 領域 | コマンド |
| --- | --- |
| Setup | `init`, `setup`, `settings`, `integrate` |
| First run | `doctor`, `demo`, `install-hook --pre-push` |
| Guard gates | `check`, `git-ready`, `push`, `pr` |
| Reports | `pr-check`, `report`, `evaluate-project`, `audit-report` |
| Release | `release-check`, `release-check --npm`, `branch-strategy`, `notify` |

## 代表的な実行手順

```sh
npm install -g aigate-cli
aigate setup --language ja
git switch -c feature/my-change
aigate doctor
aigate install-hook --pre-push
aigate git-ready
git add <files>
git commit -m "feat: short summary"
aigate push -u origin feature/my-change
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
aigate github comment --pr <number>
aigate github check --output .aigate/reports/github-check.md
aigate trends record
aigate github setup --owner @your-org/team --dry-run
aigate release-check --npm
```

## 現在実装済み

- npm package `aigate-cli` の公開配布と `npx` 実行
- `aigate doctor` による初回実行 diagnostics
- `aigate demo` によるガイド付き CLI demo
- `aigate install-hook --pre-push` による pre-push hook installation
- Git changed-file と untracked-file の readiness check
- secret pattern detection と SARIF output
- `git-ready`、guarded push、guarded PR creation
- `aigate github` による GitHub PR コメントと Checks サマリー
- `aigate github setup` による PR テンプレートと CODEOWNERS 設定
- Markdown, HTML, JSON, SARIF reports
- project score と deep Git signal evaluation
- `aigate trends` によるプロジェクト状態トレンド履歴
- branch strategy recommendation と policy draft generation
- Codex/Gemini integration file generation
- 英語、韓国語、日本語、中国語の CLI settings
- release-check と npm Trusted Publishing workflow
- Terminal, Slack BLOCK, Discord, Teams webhook notifications

## 今後の予定

- 公開 Docker image
- Homebrew formula
- standalone binary
- Linear/Jira integrations
- hosted dashboard と enterprise governance packs

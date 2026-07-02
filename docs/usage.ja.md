# AIGate 使い方ガイド

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

このガイドは現在の `aigate-cli` 構成に合わせています。既存リポジトリで
AIGate を実行する、GitHub と接続する、Codex/Gemini/Claude Code に同じ workflow を
渡すときに使います。

## インストールまたは直接実行

インストールせずに実行:

```sh
npx -y aigate-cli check
```

グローバルインストール:

```sh
npm install -g aigate-cli
aigate --help
```

リポジトリごとの CLI 言語設定:

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## リポジトリでの初回実行

Git リポジトリのルートで実行します。

```sh
aigate start
aigate start --route ai --provider codex
aigate start --route full --provider all
aigate init
aigate doctor
aigate demo
aigate install-hook --pre-push
```

各コマンドの役割:

| コマンド | 目的 |
| --- | --- |
| `aigate start` | TTY では矢印キーのルート選択を開き、非対話 shell では quickstart ルートを実行します。 |
| `aigate start --route ai --provider codex` | AIGate 設定と Codex 指示ファイルを作成します。 |
| `aigate start --route full --provider all` | 設定、AI ファイル、pre-push hook、release checks を一つの flow で実行します。 |
| `aigate setup --language ja` | CLI 出力言語を保存します。 |
| `aigate init` | `.aigate.yml` と reports ディレクトリを作成します。 |
| `aigate doctor` | Node、Git、npm package metadata、GitHub workflow、AIGate 設定を確認します。 |
| `aigate demo` | プロジェクトファイルを変更せずに主な流れを表示します。 |
| `aigate install-hook --pre-push` | push 前に AIGate を実行する pre-push hook をインストールします。 |

## 日常の Git workflow

```sh
git switch -c feature/my-work
aigate check
aigate test
aigate git-ready
git add .
git commit -m "feat: short summary"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

実際に push する前に確認したい場合は `aigate push --dry-run origin <branch>`
を使います。`aigate push` は Git の置き換えではなく、`git push` の前に
AIGate checks を追加する guarded wrapper です。

## テストと AI 自動修正フロー

```sh
aigate test
aigate test --script test
aigate test --command "npm run ci"
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate test` は `aigate git-ready` と検出した npm script を実行します。
検出順は `ci`, `test:ci`, `test` です。独自の検証コマンドを使う場合は
`--script` または `--command` で指定します。

`aigate aitest` は失敗サマリー、テスト出力、AI 修正指示を
`.aigate/reports/ai-test.md` に書き込みます。既定ではコードを変更しません。
Codex、Claude、Gemini CLI または独自 agent を実行する場合だけ `--apply`
を付けます。

## レポートと出力形式

```sh
aigate report --format markdown --output .aigate/reports/report.md
aigate report --format html --output .aigate/reports/report.html
aigate report --format json --output .aigate/reports/report.json
aigate report --format sarif --output .aigate/reports/aigate.sarif
aigate evaluate-project --deep --report
aigate audit-report
aigate compliance-report
aigate dashboard --output .aigate/reports/dashboard.html
```

Pull request には Markdown、ローカル確認には HTML、自動化には JSON、
GitHub code scanning には SARIF を使います。

## GitHub 設定と Actions

GitHub 補助ファイルの生成:

```sh
aigate github setup --owner @your-org/team --dry-run
aigate github setup --owner @your-org/team
```

PR comment または check summary の作成:

```sh
aigate github comment --pr 123
aigate github check --format markdown
```

再利用可能な GitHub Action 例:

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
      - uses: actions/checkout@v4
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.5
        with:
          command: git-ready
          language: ja
```

## AI エージェント連携

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate claude
aigate integrate all --output-dir . --force
```

このコマンドは `AGENTS.md`、`GEMINI.md`、`CLAUDE.md`、
`.aigate/integrations/*` を作成します。Codex、Gemini、Claude Code に、
範囲の明確な branch、validation command、`aigate push` のルールを伝えます。

## ブランチ戦略とリリース

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
```

`branch-strategy` は branch rule を推薦し、policy pack を生成できます。
`release-check --npm` は package metadata、release tag、workflow provenance、
npm 公開状態が準備できているか確認します。

## 通知

```sh
aigate notify setup --channel terminal
aigate notify test --channel terminal
aigate notify send --event BLOCK --channel terminal
aigate git-ready --notify-channel terminal
```

外部システムには必要な環境変数を設定し、対応する channel を使います。

| Channel | 環境変数 |
| --- | --- |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` |
| `linear` | `AIGATE_LINEAR_WEBHOOK_URL` |
| `jira` | `AIGATE_JIRA_WEBHOOK_URL` |
| `webhook` | `AIGATE_WEBHOOK_URL` |

## コマンド一覧

| コマンド | 使う場面 |
| --- | --- |
| `aigate init` | 初期 AIGate 設定を作成します。 |
| `aigate start` | ガイド付き設定ルートを選択して実行します。 |
| `aigate check` | local Git 変更と secret findings を確認します。 |
| `aigate test` | Git 準備状態と検出した project test command を実行します。 |
| `aigate aitest` | AI 修正プロンプトを書き、必要なら Codex、Claude、Gemini を実行します。 |
| `aigate git-ready` | commit または push 前の readiness gate を実行します。 |
| `aigate push` | checks 後に `git push` を呼び出します。 |
| `aigate pr` | 役立つ本文付きの pull request を作成します。 |
| `aigate pr-check` | PR readiness と risk 情報を生成します。 |
| `aigate github <comment\|check\|setup>` | PR comment、check summary、GitHub 補助ファイルを扱います。 |
| `aigate doctor` | local setup と repository foundation を診断します。 |
| `aigate demo` | ファイルを変更せず workflow を表示します。 |
| `aigate install-hook` | Git hook をインストールします。 |
| `aigate setup` | config、settings、reports、AI guide files を作成します。 |
| `aigate settings` | 言語などの AIGate 設定を確認または変更します。 |
| `aigate integrate <provider>` | Codex/Gemini/Claude integration files を生成します。 |
| `aigate report` | Markdown、HTML、JSON、SARIF reports を書き出します。 |
| `aigate evaluate-project` | repository foundation と Git signals を score 化します。 |
| `aigate score` | 現在の project score を表示します。 |
| `aigate trends <record\|show>` | score history を記録または表示します。 |
| `aigate branch-strategy` | branch policy docs を推薦または生成します。 |
| `aigate release-check` | release と npm readiness を確認します。 |
| `aigate audit-report` | audit 向け report を生成します。 |
| `aigate compliance-report` | compliance 向け report を生成します。 |
| `aigate dashboard` | local HTML status dashboard を作成します。 |
| `aigate notify <setup\|test\|send>` | 通知を設定して送信します。 |
| `aigate help` | command help を表示します。 |

## まだ公開インストール経路ではないもの

リポジトリには Docker と Homebrew の準備ファイルがありますが、現時点の
公式インストール経路は公開 npm package です。Docker または Homebrew channel
が公開されるまでは、user quickstart にインストール command として載せません。

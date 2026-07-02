# AI 連携

[English](ai-integrations.md) | [한국어](ai-integrations.ko.md) | [日本語](ai-integrations.ja.md) | [中文](ai-integrations.zh.md)

AIGate は、Codex、Gemini、Claude Code などの AI assistant がリポジトリ内で同じ
ルールに従うためのローカル指示ファイルを生成できます。

## 連携ファイルを生成

```sh
aigate integrate all
```

Provider ごとの生成:

```sh
aigate integrate codex
aigate integrate gemini
aigate integrate claude
```

別ディレクトリにプレビュー:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

既存ファイルを再生成:

```sh
aigate integrate all --force
```

## AI プロジェクトレポート

```sh
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate ai report --apply --provider claude
```

`aigate ai report` は現在の問題、良い点、方向性、推奨コマンド、リリース準備、
ブランチ戦略をまとめ、AI 引き継ぎプロンプトも生成します。既定ではファイルを
変更しません。`--apply` を渡した場合だけ、インストール済みのローカル AI CLI を
実行します。

## AI テスト修正フロー

```sh
aigate test
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate aitest` は失敗したコマンド、取得した出力、Git readiness summary、
修正指示を `.aigate/reports/ai-test.md` に書き込みます。既定ではファイルを
変更しません。`--apply` を渡した場合だけ、利用可能なローカル CLI を実行します。
Codex は `codex exec`、Claude は `claude --print`、Gemini は `gemini -p`
を使います。

## 生成されるファイル

| ファイル | 目的 |
| --- | --- |
| `AGENTS.md` | Codex 向けリポジトリ指示 |
| `GEMINI.md` | Gemini 向けリポジトリ指示 |
| `CLAUDE.md` | Claude Code 向けリポジトリ指示 |
| `.aigate/integrations.json` | machine-readable integration manifest |
| `.aigate/integrations/README.md` | 共通の連携概要 |
| `.aigate/integrations/codex.md` | Codex 固有の連携メモ |
| `.aigate/integrations/gemini.md` | Gemini 固有の連携メモ |
| `.aigate/integrations/claude.md` | Claude Code 固有の連携メモ |

## Assistant ルール

生成される指示は assistant に次を求めます。

- `README.md`、`.aigate.yml`、`docs/branch-strategy.md`、
  `docs/git-upload-workflow.md` を先に読む
- `main` へ直接 push しない
- 目的が明確な branch と Conventional Commits を使う
- `npm run ci` と `aigate git-ready` を実行する
- `aigate push -u origin <branch>` を使う
- `main` に pull request を開く
- merge 前に `test (20)` と `test (22)` の成功を待つ

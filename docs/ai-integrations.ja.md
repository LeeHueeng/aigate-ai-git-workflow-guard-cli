# AI 連携

[English](ai-integrations.md) | [한국어](ai-integrations.ko.md) | [日本語](ai-integrations.ja.md) | [中文](ai-integrations.zh.md)

AIGate は、Codex や Gemini などの AI assistant がリポジトリ内で同じ
ルールに従うためのローカル指示ファイルを生成できます。

## 連携ファイルを生成

```sh
aigate integrate all
```

Provider ごとの生成:

```sh
aigate integrate codex
aigate integrate gemini
```

別ディレクトリにプレビュー:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

既存ファイルを再生成:

```sh
aigate integrate all --force
```

## 生成されるファイル

| ファイル | 目的 |
| --- | --- |
| `AGENTS.md` | Codex 向けリポジトリ指示 |
| `GEMINI.md` | Gemini 向けリポジトリ指示 |
| `.aigate/integrations.json` | machine-readable integration manifest |
| `.aigate/integrations/README.md` | 共通の連携概要 |
| `.aigate/integrations/codex.md` | Codex 固有の連携メモ |
| `.aigate/integrations/gemini.md` | Gemini 固有の連携メモ |

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

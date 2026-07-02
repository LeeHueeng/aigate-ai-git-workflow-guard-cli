# ブランチ戦略

[English](branch-strategy.md) | [한국어](branch-strategy.ko.md) | [日本語](branch-strategy.ja.md) | [中文](branch-strategy.zh.md)

AIGate は GitHub Flow を基本の開発モデルにし、package publish のために
release branch と npm dist-tag 戦略を組み合わせます。

## 目標

- `main` を安定して releasable な状態に保つ
- 重要な変更は pull request で review 可能にする
- Conventional Commits で履歴を読みやすくする
- AI-assisted work でも unrelated changes を混ぜない
- `latest`、`next`、`beta`、`canary` の public package channel を支える

## 永続ブランチ

| Branch | 目的 | ルール |
| --- | --- | --- |
| `main` | stable source of truth | protected、bootstrap 後は direct push 禁止、すべて PR 経由 |
| `release/*` | release stabilization | versioned release の準備時だけ作成 |
| `hotfix/*` | urgent production fix | latest stable tag または `main` から分岐し PR で戻す |

## 作業ブランチ prefix

| Prefix | 用途 |
| --- | --- |
| `codex/*` | AI-assisted implementation または repository maintenance |
| `feature/*` | user-facing feature |
| `fix/*` | bug fix |
| `docs/*` | documentation-only changes |
| `chore/*` | tooling, metadata, release, maintenance |
| `test/*` | test-only improvements |
| `experiment/*` | merge せず閉じられる short-lived spike |

## Pull request ルール

- PR は 1 つの関心事に絞る
- branch name は `feature/report-generator` のように意図を示す
- summary、validation steps、release/documentation impact を含める
- merge 前に review conversation を解決する
- review 依頼前に `npm run git:ready` を実行する
- maintainer 確定後は CODEOWNERS review を要求する

## Commit 戦略

Conventional Commits を使います。

```text
feat: add branch strategy recommendation command
fix: handle repositories without commits
docs: explain public release channels
test: cover report output formats
chore: initialize public repository metadata
```

## GitHub protection rules

`main` には次の branch protection を設定します。

- merge 前の pull request 必須
- デフォルトでは必須 approval を要求しない
- リポジトリポリシーで必要な場合に maintainer または CODEOWNER review を有効化
- required status checks の成功
- conversation resolution 必須
- force push を block
- deletion を block
- release automation と合う場合は linear history を要求

初期 required status checks:

- `test (20)`
- `test (22)`
- local: `npm run lint`
- local: `npm run typecheck`

## 提案比較

`aigate branch-strategy --compare` は、リリースチャンネル付き GitHub Flow、
Trunk-Based Development、Hybrid Flow、Git Flow を比較します。各提案には
適合スコア、ブランチルール、適した状況、強み、リスク、移行手順、
ポリシー適合が含まれます。

リポジトリに複数のブランチモデルを検討するだけのシグナルがある場合に使います。

```sh
aigate branch-strategy --compare --team-size 8 --release weekly
aigate branch-strategy --compare --team-size 14 --release monthly --language ja
```

## 生成されるポリシーパック

`aigate branch-strategy --apply` は `.aigate/policy-packs/` に再利用可能な
ポリシーパックを生成します。

- `branch-protection.json`: 保護ブランチ、レビュー、status check、force push ルール
- `pr-quality.json`: PR セクション、検証コマンド、リスクラベル、品質ゲート
- `release-channels.json`: npm dist-tag、リリースタグ、タグ前検証ルール
- `ai-collaboration.json`: AI 支援ブランチ prefix、必須リポジトリ文脈、保護コマンド

## Release branch flow

1. 完了した作業を `main` に merge する
2. 必要な場合だけ `release/vX.Y.Z` を作って stabilization する
3. release candidate を `next`、`beta`、`canary` dist-tag で publish する
4. stable release に `vX.Y.Z` tag を付ける
5. stable package を `latest` dist-tag で publish する
6. release fix を `main` に戻す

## AI-assisted work ルール

- assistant-generated implementation は `codex/*` branch を使う
- 生成物は意図された docs、template、reproducible fixture の場合だけ source に置く
- unrelated work がある場合は file を明示的に stage する
- mixed commit 1 つより小さな commit 複数を優先する
- PR body に validation command を含める
- push 前に `npm run git:ready` を実行する

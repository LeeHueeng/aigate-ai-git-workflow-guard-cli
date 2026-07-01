# Git upload workflow

[English](git-upload-workflow.md) | [한국어](git-upload-workflow.ko.md) | [日本語](git-upload-workflow.ja.md) | [中文](git-upload-workflow.zh.md)

GitHub に push するすべての AIGate 変更でこの workflow を使います。

## 1. 正しい branch から開始

```sh
git switch main
git pull --ff-only
git switch -c feature/<short-name>
```

Prefix:

- `feature/*`: new user-facing behavior
- `fix/*`: bug fix
- `docs/*`: documentation
- `chore/*`: maintenance
- `codex/*`: AI-assisted repository work

## 2. Commit 前に確認

CLI language を一度選びます。対応値は `en`、`ko`、`ja`、`zh` です。

```sh
aigate setup --language ja
```

```sh
npm run git:ready
git status --short --branch
```

`npm run git:ready` は syntax check、test suite、before-push gate、
package dry-run validation を実行します。

Gate は次の場合に block します。

- secret の可能性がある file name
- repository foundation の欠落
- project foundation score が 80 未満

## 3. 明確な境界で commit

```sh
git add <files>
git commit -m "type: short summary"
```

Conventional Commits の例:

- `feat: add report command`
- `fix: handle empty repositories`
- `docs: document branch protection`
- `chore: update repository metadata`
- `test: cover git-ready output`

## 4. Push と PR 作成

```sh
aigate push -u origin <branch>
```

`aigate push` は先に AIGate readiness gate を実行します。通過すると残りの
引数を `git push` に渡します。remote を変更せず確認するには
`aigate push --dry-run origin <branch>` を使います。

PR には次を含めます。

- what changed
- why it changed
- PR readiness report findings
- validation commands
- release or documentation impact

```sh
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

## 5. Merge ルール

次を満たすまで merge しません。

- `test (20)` と `test (22)` CI job が成功
- 少なくとも 1 approval
- review conversation が解決済み
- branch に unrelated changes がない

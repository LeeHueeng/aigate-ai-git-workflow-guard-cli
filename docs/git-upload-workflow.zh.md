# Git 上传 workflow

[English](git-upload-workflow.md) | [한국어](git-upload-workflow.ko.md) | [日本語](git-upload-workflow.ja.md) | [中文](git-upload-workflow.zh.md)

所有会 push 到 GitHub 的 AIGate 变更都使用这个 workflow。

## 1. 从正确 branch 开始

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

## 2. Commit 前检查

先选择一次 CLI language。支持值为 `en`、`ko`、`ja`、`zh`。

```sh
aigate setup --language zh
```

```sh
npm run git:ready
git status --short --branch
```

`npm run git:ready` 会运行 syntax check、test suite、before-push gate 和
package dry-run validation。

Gate 会在以下情况 block:

- 可能包含 secret 的 file name
- 缺少 repository foundation
- project foundation score 低于 80

## 3. 用清晰边界 commit

```sh
git add <files>
git commit -m "type: short summary"
```

Conventional Commits 示例:

- `feat: add report command`
- `fix: handle empty repositories`
- `docs: document branch protection`
- `chore: update repository metadata`
- `test: cover git-ready output`

## 4. Push 和创建 PR

```sh
aigate push -u origin <branch>
```

`aigate push` 会先运行 AIGate readiness gate。通过后，它会把剩余参数转发给
`git push`。如果只想预览而不修改 remote，请使用
`aigate push --dry-run origin <branch>`。

PR 中包含:

- what changed
- why it changed
- PR readiness report findings
- validation commands
- release or documentation impact

```sh
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

## 5. Merge 规则

满足以下条件前不要 merge:

- `GitHub CI workflow` 或 `GitLab CI pipeline` 等已配置 CI check 通过
- `aigate git-ready` 已在本地或 CI 中通过
- 遵循仓库当前 review policy
- 如果使用了 review，则 review conversation 已解决
- branch 没有 unrelated changes

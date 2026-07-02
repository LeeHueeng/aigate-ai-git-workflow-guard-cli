# AIGate 与 Husky、Lefthook、pre-commit、Gitleaks 对比

[English](comparison.md) | [한국어](comparison.ko.md) | [日本語](comparison.ja.md) | [中文](comparison.zh.md)

AIGate 不是为了替代所有 Git hook runner 或 secret scanner。它位于更高一层，
把 AI-assisted changes、PR readiness、repository health、branch strategy 和
release confidence 放在同一个 workflow guard 中。

## 快速对比

| 工具 | 最擅长 | 继续使用的场景 | AIGate 的位置 |
| --- | --- | --- | --- |
| Husky | JavaScript Git hook 配线 | 只需要 npm script hook 时 | AIGate 可以成为 pre-push hook 运行的 readiness gate。 |
| Lefthook | 快速多语言 hook 编排 | 需要跨语言运行很多 hook 时 | AIGate 增加 PR readiness、repository scoring、branch strategy 和 reports。 |
| pre-commit | hook 生态和可重复 local checks | 团队已经标准化 pre-commit hooks 时 | AIGate 补充 AI workflow、GitHub 和 release checks。 |
| Gitleaks | 深度 secret scanning | 需要专用高覆盖 secret scanner 时 | AIGate 提供 changed-file 级轻量 secret checks 和 SARIF output。 |
| AIGate | AI-assisted Git workflow guard | push 或 PR 前需要 zero-config gate 时 | 汇总 readiness、risk、reports、notifications、branch policy 和 AI agent instructions。 |

## 推荐组合

| 场景 | 命令路径 |
| --- | --- |
| 小型 AI-assisted project | `aigate doctor` -> `aigate install-hook --pre-push` -> `aigate git-ready` |
| 已使用 Husky 的 JavaScript project | 在现有 Husky pre-push hook 中运行 `aigate git-ready` |
| 使用 Lefthook 或 pre-commit 的团队 | 保留 test/lint hooks，并在 PR 前加入 `aigate pr-check` |
| 安全敏感 repository | 在 CI 中运行 Gitleaks，并用 `aigate report --format sarif` 补充 changed-file context |
| 公开 open source package | 使用 `aigate release-check --npm`、GitHub Action 和 `aigate branch-strategy --compare` |

## AIGate 适合的情况

- 你使用 Codex、Gemini、Claude Code、Cursor 或其他 AI coding assistant。
- 你希望在 `git push` 前有一个能解释变更的 local gate。
- 你想在一个 CLI 中查看 PR readiness、project score、release readiness 和 branch strategy。
- 你需要 Markdown、HTML、JSON、SARIF output 同时用于 local 和 CI。
- 你希望 AI agent 遵循与人类贡献者相同的 repository workflow。

## 其他工具应优先的情况

- 如果核心需求是 hook orchestration，优先使用 Husky 或 Lefthook。
- 如果团队已经标准化 pre-commit ecosystem，优先使用 pre-commit。
- 如果核心需求是 deep secret scanning coverage，优先使用 Gitleaks。

AIGate 最强的位置，是把这些 checks 连接到 push safety、PR quality 和 repository
governance 的 human-readable workflow layer。

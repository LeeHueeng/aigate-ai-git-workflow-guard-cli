# 分支策略

[English](branch-strategy.md) | [한국어](branch-strategy.ko.md) | [日本語](branch-strategy.ja.md) | [中文](branch-strategy.zh.md)

AIGate 以 GitHub Flow 作为默认开发模型，并结合 release branch 和 npm
dist-tag 来支持 package publish。

## 目标

- 保持 `main` 稳定且随时可发布
- 所有有意义的变更都通过 pull request review
- 用 Conventional Commits 保持清晰历史
- 支持快速 AI-assisted work，同时避免 unrelated changes 混入
- 支持 `latest`、`next`、`beta`、`canary` public package channel

## 永久分支

| Branch | 用途 | 规则 |
| --- | --- | --- |
| `main` | stable source of truth | protected，bootstrap 后禁止 direct push，所有变更通过 PR |
| `release/*` | release stabilization | 仅在准备 versioned release 时创建 |
| `hotfix/*` | urgent production fix | 从 latest stable tag 或 `main` 分支，之后通过 PR 合回 |

## 工作分支 prefix

| Prefix | 用途 |
| --- | --- |
| `codex/*` | AI-assisted implementation 或 repository maintenance |
| `feature/*` | user-facing feature |
| `feat/*` | 许多团队使用的短 feature branch alias |
| `fix/*` | bug fix |
| `docs/*` | documentation-only changes |
| `chore/*` | tooling, metadata, release, maintenance |
| `test/*` | test-only improvements |
| `experiment/*` | 可关闭不 merge 的 short-lived spike |

## Pull request 规则

- 一个 PR 只处理一个关注点
- branch name 应表达意图，例如 `feature/report-generator`
- 包含 summary、validation steps、release/documentation impact
- merge 前解决所有 review conversations
- 请求 review 前运行 `npm run git:ready`
- maintainer 确定后要求 CODEOWNERS review

## Commit 策略

使用 Conventional Commits。

```text
feat: add branch strategy recommendation command
fix: handle repositories without commits
docs: explain public release channels
test: cover report output formats
chore: initialize public repository metadata
```

## GitHub protection rules

在 `main` 上启用:

- merge 前必须有 pull request
- 默认不要求强制 approval
- 仓库政策需要时再启用 maintainer 或 CODEOWNER review
- required status checks 通过
- conversation resolution 必须完成
- block force pushes
- block deletions
- 如果适合 release automation，则要求 linear history

初始 required status checks:

- GitHub 仓库使用 `GitHub CI workflow`，GitLab 仓库使用 `GitLab CI pipeline`
- `aigate git-ready`
- local: `npm run lint`
- local: `npm run typecheck`

## 提案比较

`aigate branch-strategy --compare` 会比较带发布频道的 GitHub Flow、
Trunk-Based Development、Hybrid Flow 和 Git Flow。每个提案都会包含适配分数、
分支规则、适用场景、优势、风险、迁移步骤和政策适配。

当仓库信号足够、需要比较多个分支模型时使用。

```sh
aigate branch-strategy --compare --team-size 8 --release weekly
aigate branch-strategy --compare --team-size 14 --release monthly --language zh
```

## 生成的政策包

`aigate branch-strategy --apply` 会在 `.aigate/policy-packs/` 下生成可复用的
政策包。

- `branch-protection.json`: 保护分支、评审、状态检查和 force push 规则
- `pr-quality.json`: PR 区块、验证命令、风险标签和质量门禁
- `release-channels.json`: npm dist-tag、发布标签和打标签前验证规则
- `ai-collaboration.json`: AI 协作分支 prefix、必需仓库上下文和保护命令

## Release branch flow

1. 将完成的工作 merge 到 `main`
2. 仅在需要时创建 `release/vX.Y.Z` 做 stabilization
3. 用 `next`、`beta`、`canary` dist-tag 发布 release candidate
4. stable release 使用 `vX.Y.Z` tag
5. stable package 使用 `latest` dist-tag publish
6. 将 release fix 合回 `main`

## AI-assisted work 规则

- assistant-generated implementation 使用 `codex/*` branch
- 只有 intentional docs、template、reproducible fixture 才提交生成物
- 存在 unrelated work 时显式 stage 文件
- 优先多个小 commit，避免一个 mixed commit
- 在 PR body 中写 validation command
- push 前运行 `npm run git:ready`

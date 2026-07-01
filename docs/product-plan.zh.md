# AIGate 产品计划

[English](product-plan.md) | [한국어](product-plan.ko.md) | [日本語](product-plan.ja.md) | [中文](product-plan.zh.md)

本文档把 AIGate v1.1 planning expansion 整理为适合 public repository 的格式。

## Product message

AIGate 是 AI Git Workflow Guard CLI。它帮助开发者在 push 前检查 local
changes，准备更好的 pull request，生成 workflow report，评估 repository
health，并设计适合团队的 branch strategy。

## Distribution strategy

主要 package target 是 npm 上的 `aigate-cli`。npm 支持 fast MVP iteration、
global install 和 `npx` execution，同时兼容 yarn、pnpm 和 bun。

| Channel | Command | Phase |
| --- | --- | --- |
| npm | `npm install -g aigate-cli` | MVP |
| npx | `npx aigate-cli check` | MVP |
| yarn | `yarn global add aigate-cli` | MVP |
| pnpm | `pnpm add -g aigate-cli` | MVP |
| bun | `bun add -g aigate-cli` | MVP |
| Homebrew | `brew install aigate` | V1.5 |
| Docker | `docker run --rm -v "$PWD:/repo" aigate/cli check` | V1.5 |
| GitHub Releases | standalone binary download | V2 |

Release channels:

| npm tag | Meaning |
| --- | --- |
| `latest` | stable production release |
| `next` | next release candidate |
| `beta` | beta testing release |
| `canary` | fast experimental release |

## Package architecture

MVP 从单一 public CLI package 开始。

- `aigate-cli`: user-facing command line interface

未来 package split:

- `@aigate/core`: Git analysis, policy engine, risk scoring
- `@aigate/providers`: Claude, Gemini, Codex, OpenAI, local LLM adapter
- `@aigate/github`: GitHub API, pull request, GitHub Actions, GitHub App integration
- `@aigate/policies`: branch strategy, pull request policy, security template
- `@aigate/reporters`: Markdown, HTML, JSON, SARIF, GitHub Check reporter

## Feature pillars

### Package distribution manager

管理 npm、yarn、pnpm、bun、Homebrew、Docker、GitHub Actions、GitHub Releases 的
install channel、version tag 和 release documentation。

### Notification center

把 `BLOCK`、`WARN`、`PR_ONLY`、`SECRET_DETECTED` 等重要 event 路由到 terminal、
Slack、Discord、Teams、email、GitHub PR comment、GitHub Checks、Linear 或 Jira。

当前 CLI 支持 terminal、Slack、Discord、Teams、custom webhook payload、
GitHub PR comment 和 GitHub Checks summary payload。email、Linear、Jira
仍是 staged integration。

### Report generator

以 Markdown、HTML、JSON、SARIF、GitHub-native format 生成 local change report、
pull request readiness report、weekly team report、项目状态趋势历史和
audit/compliance report。

### Project evaluator

从 Git workflow、PR quality、tests、CI/CD、security、documentation、
branch strategy、maintainability 等维度为 repository 打分。

### AI branch strategy designer

根据 team size、release frequency、hotfix needs、CI maturity、compliance needs、
branch history 推荐 GitHub Flow、Git Flow、trunk-based development 或 hybrid strategy。

## MVP definition

- 通过 npm 和 `npx` 安装/执行
- 通过 `aigate init` 初始化 project
- local `check`、`report`、`evaluate-project`、`branch-strategy`、
  `github setup` commands
- 通过 `aigate pr-check` 提供 pull request readiness
- Markdown、HTML、JSON、SARIF reports
- basic branch strategy recommendation
- blocking event 的 Slack webhook path
- Discord/Teams webhook payload foundation
- 通过 `aigate release-check` 检查 release readiness
- 通过 `aigate audit-report` 生成 governance snapshot
- public documentation 和 contribution process

## Business model direction

| Plan | Intended value |
| --- | --- |
| Free | local CLI checks, basic reports, project evaluation, branch strategy recommendation |
| Pro | HTML reports, detailed AI evaluation, generated branch strategy docs, personal Slack alerts |
| Team | team notifications, weekly reports, health trends, PR comments, standard branch strategy templates |
| Enterprise | audit/compliance reports, central policies, self-hosting, SSO/SAML, organization-wide governance |

## Success metrics

- npm、npx、yarn、pnpm、bun install success rate
- 从 install 到 first useful report 的时间
- remote push 前被 block 的 risky push 比例
- pull request readiness score 提升
- 使用 generated branch strategy guidance 的 repository 数量
- weekly reports 和 notification routing 的 team adoption

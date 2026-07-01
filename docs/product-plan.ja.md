# AIGate product plan

[English](product-plan.md) | [한국어](product-plan.ko.md) | [日本語](product-plan.ja.md) | [中文](product-plan.zh.md)

この文書は、AIGate v1.1 の planning expansion を public repository 向けに
整理したものです。

## Product message

AIGate は AI Git Workflow Guard CLI です。開発者が push 前に local changes を
確認し、より良い pull request を準備し、workflow report を生成し、
repository health を評価し、team に合う branch strategy を設計できるようにします。

## Distribution strategy

主要 package target は npm の `aigate-cli` です。npm は fast MVP iteration、
global install、`npx` execution を提供し、yarn、pnpm、bun とも互換です。

| Channel | Command | Phase |
| --- | --- | --- |
| npm | `npm install -g aigate-cli` | MVP |
| npx | `npx aigate-cli check` | MVP |
| yarn | `yarn global add aigate-cli` | MVP |
| pnpm | `pnpm add -g aigate-cli` | MVP |
| bun | `bun add -g aigate-cli` | MVP |
| Homebrew | `packaging/homebrew/` に formula draft を準備 | prepared |
| Docker | GHCR workflow を準備、public image は tagged release 待ち | prepared |
| GitHub Releases | standalone binary download | V2 |

Release channels:

| npm tag | Meaning |
| --- | --- |
| `latest` | stable production release |
| `next` | next release candidate |
| `beta` | beta testing release |
| `canary` | fast experimental release |

## Package architecture

MVP は単一の public CLI package から始めます。

- `aigate-cli`: user-facing command line interface

将来の package split:

- `@aigate/core`: Git analysis, policy engine, risk scoring
- `@aigate/providers`: Claude, Gemini, Codex, OpenAI, local LLM adapter
- `@aigate/github`: GitHub API, pull request, GitHub Actions, GitHub App integration
- `@aigate/policies`: branch strategy, pull request policy, security template
- `@aigate/reporters`: Markdown, HTML, JSON, SARIF, GitHub Check reporter

## Feature pillars

### Package distribution manager

npm、yarn、pnpm、bun、Homebrew、Docker、GitHub Actions、GitHub Releases に
またがる install channel、version tag、release documentation を管理します。

### Notification center

`BLOCK`、`WARN`、`PR_ONLY`、`SECRET_DETECTED` などの重要 event を terminal、
Slack、Discord、Teams、email、GitHub PR comment、GitHub Checks、Linear、Jira に
送れるようにします。

現在の CLI は terminal、Slack、Discord、Teams、email webhook payload、
GitHub PR comment、GitHub Checks summary payload、credential 設定済みの
Linear/Jira issue notification をサポートします。

### Report generator

local change report、pull request readiness report、weekly team report、
プロジェクト状態トレンド履歴、audit/compliance report を Markdown、HTML、JSON、
SARIF、GitHub-native format で生成します。

### Project evaluator

Git workflow、PR quality、tests、CI/CD、security、documentation、branch strategy、
maintainability を基準に repository を score します。

### AI branch strategy designer

team size、release frequency、hotfix needs、CI maturity、compliance needs、
branch history をもとに GitHub Flow、Git Flow、trunk-based development、
hybrid strategy を推薦します。

## MVP definition

- npm と `npx` による installability
- `aigate init` による project initialization
- local `check`、`report`、`evaluate-project`、`branch-strategy`、
  `github setup` commands
- `aigate pr-check` による pull request readiness
- Markdown、HTML、JSON、SARIF reports
- basic branch strategy recommendation
- blocking event 向け Slack webhook path
- Discord/Teams webhook payload foundation
- `aigate release-check` による release readiness
- `aigate audit-report` による governance snapshot
- public documentation と contribution process

## Business model direction

| Plan | Intended value |
| --- | --- |
| Free | local CLI checks, basic reports, project evaluation, branch strategy recommendation |
| Pro | HTML reports, detailed AI evaluation, generated branch strategy docs, personal Slack alerts |
| Team | team notifications, weekly reports, health trends, PR comments, standard branch strategy templates |
| Enterprise | audit/compliance reports, central policies, self-hosting, SSO/SAML, organization-wide governance |

## Success metrics

- npm、npx、yarn、pnpm、bun の install success rate
- install から first useful report までの時間
- remote push 前に block された risky push の割合
- pull request readiness score の改善
- generated branch strategy guidance を使う repository 数
- weekly reports と notification routing の team adoption

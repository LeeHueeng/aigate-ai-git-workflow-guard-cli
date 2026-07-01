# AIGate 제품 계획

[English](product-plan.md) | [한국어](product-plan.ko.md) | [日本語](product-plan.ja.md) | [中文](product-plan.zh.md)

이 문서는 AIGate v1.1 기획 확장안을 공개 repository에 맞게 정리한 버전입니다.

## 제품 메시지

AIGate는 AI Git Workflow Guard CLI입니다. 개발자가 push 전 local changes를
점검하고, 더 나은 pull request를 준비하며, workflow report를 만들고,
repository health를 평가하고, 팀에 맞는 branch strategy를 설계하도록 돕습니다.

## 배포 전략

주요 package target은 npm의 `aigate-cli`입니다. npm은 빠른 MVP iteration,
global install, `npx` 실행을 제공하면서 yarn, pnpm, bun과도 함께 사용할 수 있습니다.

| Channel | Command | Phase |
| --- | --- | --- |
| npm | `npm install -g aigate-cli` | MVP |
| npx | `npx aigate-cli check` | MVP |
| yarn | `yarn global add aigate-cli` | MVP |
| pnpm | `pnpm add -g aigate-cli` | MVP |
| bun | `bun add -g aigate-cli` | MVP |
| Homebrew | `packaging/homebrew/`에 formula 초안 준비 | prepared |
| Docker | GHCR workflow 준비, public image는 tagged release 대기 | prepared |
| GitHub Releases | standalone binary download | V2 |

Release channel:

| npm tag | 의미 |
| --- | --- |
| `latest` | stable production release |
| `next` | next release candidate |
| `beta` | beta testing release |
| `canary` | fast experimental release |

## Package architecture

MVP는 단일 공개 CLI package로 시작합니다.

- `aigate-cli`: user-facing command line interface

미래 package split:

- `@aigate/core`: Git analysis, policy engine, risk scoring
- `@aigate/providers`: Claude, Gemini, Codex, OpenAI, local LLM adapter
- `@aigate/github`: GitHub API, pull request, GitHub Actions, GitHub App integration
- `@aigate/policies`: branch strategy, pull request policy, security template
- `@aigate/reporters`: Markdown, HTML, JSON, SARIF, GitHub Check reporter

## Feature pillars

### Package distribution manager

npm, yarn, pnpm, bun, Homebrew, Docker, GitHub Actions, GitHub Releases의
install channel, version tag, release documentation을 관리합니다.

### Notification center

`BLOCK`, `WARN`, `PR_ONLY`, `SECRET_DETECTED` 같은 중요 event를 terminal,
Slack, Discord, Teams, email, GitHub PR comment, GitHub Checks, Linear, Jira로
보낼 수 있게 확장합니다.

현재 CLI는 terminal, Slack, Discord, Teams, email webhook payload,
GitHub PR comment, GitHub Checks summary payload, credential이 설정된
Linear/Jira issue notification을 지원합니다.

### Report generator

local change report, pull request readiness report, weekly team report,
프로젝트 상태 추세 기록, audit/compliance report를 Markdown, HTML, JSON, SARIF,
GitHub-native format으로 생성합니다.

### Project evaluator

Git workflow, PR quality, tests, CI/CD, security, documentation, branch strategy,
maintainability를 기준으로 repository를 점수화합니다.

### AI branch strategy designer

team size, release frequency, hotfix needs, CI maturity, compliance needs,
branch history를 바탕으로 GitHub Flow, Git Flow, trunk-based development,
hybrid strategy를 추천합니다.

## MVP 정의

- npm과 `npx`로 설치/실행 가능
- `aigate init` 기반 project initialization
- local `check`, `report`, `evaluate-project`, `branch-strategy`, `github setup`
  command
- `aigate pr-check` 기반 pull request readiness
- Markdown, HTML, JSON, SARIF report
- basic branch strategy recommendation
- blocking event용 Slack webhook path
- Discord/Teams webhook payload foundation
- `aigate release-check` 기반 release readiness
- `aigate audit-report` 기반 governance snapshot
- public documentation과 contribution process

## Business model direction

| Plan | Intended value |
| --- | --- |
| Free | local CLI checks, basic reports, project evaluation, branch strategy recommendation |
| Pro | HTML reports, detailed AI evaluation, generated branch strategy docs, personal Slack alerts |
| Team | team notifications, weekly reports, health trends, PR comments, standard branch strategy templates |
| Enterprise | audit/compliance reports, central policies, self-hosting, SSO/SAML, organization-wide governance |

## 성공 지표

- npm, npx, yarn, pnpm, bun install success rate
- install 이후 첫 useful report까지 걸리는 시간
- remote push 전에 차단된 risky push 비율
- pull request readiness score 개선
- generated branch strategy guidance를 쓰는 repository 수
- weekly report와 notification routing의 team adoption

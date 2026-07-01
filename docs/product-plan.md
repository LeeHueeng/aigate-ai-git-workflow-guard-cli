# AIGate Product Plan

This document summarizes the AIGate v1.1 planning expansion into a public
repository friendly format.

## Product Message

AIGate is an AI Git Workflow Guard CLI. It helps developers inspect local
changes before push, prepare better pull requests, generate workflow reports,
evaluate repository health, and design branch strategies that match the team.

## Distribution Strategy

The primary package target is `aigate-cli` on npm. npm gives the project fast
MVP iteration, global installs, and `npx` execution while remaining compatible
with yarn, pnpm, and bun.

Supported and planned channels:

| Channel | Command | Phase |
| --- | --- | --- |
| npm | `npm install -g aigate-cli` | MVP |
| npx | `npx aigate-cli check` | MVP |
| yarn | `yarn global add aigate-cli` | MVP |
| yarn dlx | `yarn dlx aigate-cli check` | MVP |
| pnpm | `pnpm add -g aigate-cli` | MVP |
| pnpm dlx | `pnpm dlx aigate-cli check` | MVP |
| bun | `bun add -g aigate-cli` | MVP |
| bunx | `bunx aigate-cli check` | MVP |
| Homebrew | `brew install aigate` | V1.5 |
| Docker | `docker run --rm -v "$PWD:/repo" aigate/cli check` | V1.5 |
| GitHub Releases | standalone binary download | V2 |

Release channels:

| npm tag | Meaning |
| --- | --- |
| `latest` | Stable production release. |
| `next` | Next release candidate. |
| `beta` | Beta testing release. |
| `canary` | Fast experimental release. |

## Package Architecture

The MVP starts as a single public CLI package:

- `aigate-cli`: user-facing command line interface.

Future package split:

- `@aigate/core`: Git analysis, policy engine, and risk scoring.
- `@aigate/providers`: Claude, Gemini, Codex, OpenAI, and local LLM adapters.
- `@aigate/github`: GitHub API, pull request, GitHub Actions, and GitHub App
  integrations.
- `@aigate/policies`: branch strategy, pull request policy, and security
  templates.
- `@aigate/reporters`: Markdown, HTML, JSON, SARIF, and GitHub Check reporters.

## Feature Pillars

### Package Distribution Manager

Manage install channels, version tags, and release documentation across npm,
yarn, pnpm, bun, Homebrew, Docker, GitHub Actions, and GitHub Releases.

### Notification Center

Route important events such as `BLOCK`, `WARN`, `PR_ONLY`, and
`SECRET_DETECTED` to terminal, desktop notifications, Slack, Discord, Teams,
email, GitHub pull request comments, GitHub Checks, Linear, or Jira.

Current CLI support includes terminal notifications, Slack, Discord, Teams,
custom webhook payloads, GitHub pull request comments, and GitHub Checks
summary payloads. Email, Linear, and Jira remain staged integrations.

### Report Generator

Generate local change reports, pull request readiness reports, weekly team
reports, project health trend history, and audit or compliance reports in
Markdown, HTML, JSON, SARIF, and GitHub-native formats.

### Project Evaluator

Score a repository across Git workflow, pull request quality, tests, CI/CD,
security, documentation, branch strategy, and maintainability.

### AI Branch Strategy Designer

Recommend GitHub Flow, Git Flow, trunk-based development, or a hybrid strategy
based on repository signals such as team size, release frequency, hotfix needs,
CI maturity, compliance needs, and branch history.

## MVP Definition

The first public MVP should prove:

- Installability through npm and `npx` after the first package publish.
- Project initialization through `aigate init`.
- Local `check`, `report`, `evaluate-project`, and `branch-strategy` commands.
- Pull request readiness through `aigate pr-check`.
- Clear Markdown, HTML, JSON, and SARIF reports.
- Basic branch strategy recommendation.
- Basic Slack webhook notification path for blocking events.
- Discord and Teams webhook payload foundations.
- Release readiness checks through `aigate release-check`.
- Governance snapshots through `aigate audit-report`.
- Public documentation and contribution process.

## Business Model Direction

| Plan | Intended value |
| --- | --- |
| Free | Local CLI checks, basic reports, basic project evaluation, and branch strategy recommendation. |
| Pro | HTML reports, detailed AI evaluation, generated branch strategy docs, PR templates, personal Slack alerts, and report history. |
| Team | Team notifications, weekly reports, health trends, CODEOWNERS suggestions, PR comments, and standard branch strategy templates. |
| Enterprise | Audit/compliance reports, central policies, self-hosting, SSO/SAML, and organization-wide branch strategy governance. |

## Success Metrics

- Install success rate across npm, npx, yarn, pnpm, and bun.
- Time from install to first useful report.
- Percentage of risky pushes blocked before remote push.
- Pull request readiness score improvement over time.
- Number of repositories using generated branch strategy guidance.
- Team adoption of weekly reports and notification routing.

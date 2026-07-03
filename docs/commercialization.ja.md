# 商用化

[English](commercialization.md) | [한국어](commercialization.ko.md) | [日本語](commercialization.ja.md) | [中文](commercialization.zh.md)

AIGate は open source first です。CLI core は individual developer と open
source maintainer が paid service なしでも有用に使えるべきです。

## Positioning

AIGate は、開発者と team が push と PR review の前により安全な Git change を作るのを助けます。

Primary users:

- local guardrail が欲しい solo developer
- より安全な contribution を求める open source maintainer
- repeatable Git workflow rules が必要な small team
- reporting、policy、integration support が必要な organization

## Open source core

open source CLI に含めるもの:

- local checks
- guarded push and PR creation
- lightweight secret scanning
- Markdown, HTML, JSON, SARIF reports
- branch strategy recommendations
- Codex, Gemini, Claude Code assistant instructions
- terminal and webhook notification basics

## Paid product direction

| Plan | Target | Value |
| --- | --- | --- |
| Free | individuals and OSS maintainers | local CLI, reports, guarded Git workflow |
| Pro | professional developers | richer AI analysis, report history, personal integrations |
| Team | small engineering teams | Slack/Discord/Teams routing, shared policy packs, team reports |
| Enterprise | organizations | audit reports, SSO/SAML, self-hosting, compliance, governance |

## 無料のままにするもの

- CLI の local 実行
- basic branch strategy guidance
- local report generation
- basic secret finding warnings
- open contribution workflow

## 商用化できるもの

- hosted dashboard
- team report history
- managed policy packs
- organization-wide workflow governance
- private support and onboarding
- Jira、Linear、GitHub Enterprise、SSO、SIEM integration

## Distribution strategy

1. `aigate-cli` を npm で最新に保つ
2. GitHub Actions と npm Trusted Publishing で provenance を提供する
3. tagged version ごとに release notes を追加する
4. Homebrew と Docker release を tagged npm release と同期して維持する
5. public roadmap を明確で issue-driven に保つ

## Adoption goals

- first run が 2 分未満で有用であること
- install command を copy-paste しやすくすること
- common failure を actionable message に変えること
- docs で examples と generated reports を使うこと
- beginner-friendly work に `good first issue` を付けること

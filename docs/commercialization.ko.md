# 상용화

[English](commercialization.md) | [한국어](commercialization.ko.md) | [日本語](commercialization.ja.md) | [中文](commercialization.zh.md)

AIGate는 open source first입니다. CLI core는 individual developer와 open
source maintainer가 paid service 없이도 유용하게 쓸 수 있어야 합니다.

## Positioning

AIGate는 개발자와 팀이 push와 PR review 전에 더 안전한 Git change를 만들도록 돕습니다.

주요 사용자:

- local guardrail이 필요한 solo developer
- 더 안전한 contribution을 원하는 open source maintainer
- 반복 가능한 Git workflow rule이 필요한 small team
- reporting, policy, integration support가 필요한 organization

## Open source core

open source CLI에는 다음이 포함되어야 합니다.

- local checks
- guarded push와 PR creation
- lightweight secret scanning
- Markdown, HTML, JSON, SARIF reports
- branch strategy recommendations
- Codex, Gemini, Claude Code assistant instructions
- terminal과 webhook notification basics

## Paid product direction

| Plan | Target | Value |
| --- | --- | --- |
| Free | individuals and OSS maintainers | local CLI, reports, guarded Git workflow |
| Pro | professional developers | richer AI analysis, report history, personal integrations |
| Team | small engineering teams | Slack/Discord/Teams routing, shared policy packs, team reports |
| Enterprise | organizations | audit reports, SSO/SAML, self-hosting, compliance, governance |

## 계속 무료여야 하는 것

- CLI local 실행
- basic branch strategy guidance
- local report generation
- basic secret finding warnings
- open contribution workflow

## 상용화 가능한 것

- hosted dashboard
- team report history
- managed policy packs
- organization-wide workflow governance
- private support와 onboarding
- Jira, Linear, GitHub Enterprise, SSO, SIEM integration

## 배포 전략

1. `aigate-cli`를 npm에서 최신 상태로 유지합니다.
2. GitHub Actions와 npm Trusted Publishing으로 provenance를 제공합니다.
3. tagged version마다 release note를 추가합니다.
4. npm package에 실제 사용자가 생기면 Homebrew와 Docker를 추가합니다.
5. public roadmap을 명확하고 issue-driven하게 유지합니다.

## Adoption goals

- 첫 실행이 2분 안에 유용해야 합니다.
- 설치 명령은 copy-paste하기 쉬워야 합니다.
- common failure는 actionable message로 바꿉니다.
- docs에 example과 generated report를 사용합니다.
- beginner-friendly work는 `good first issue`로 label합니다.

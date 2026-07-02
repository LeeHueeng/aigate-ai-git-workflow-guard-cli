# 商业化

[English](commercialization.md) | [한국어](commercialization.ko.md) | [日本語](commercialization.ja.md) | [中文](commercialization.zh.md)

AIGate 是 open source first。CLI core 应该让 individual developers 和 open
source maintainers 在不依赖 paid services 的情况下也能获得价值。

## Positioning

AIGate 帮助开发者和团队在 push 和 PR review 前做出更安全的 Git changes。

Primary users:

- 想要 local guardrails 的 solo developers
- 想要更安全 contribution 的 open source maintainers
- 需要 repeatable Git workflow rules 的 small teams
- 需要 reporting、policy、integration support 的 organizations

## Open source core

open source CLI 应包含:

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

## 应保持免费的部分

- 本地运行 CLI
- basic branch strategy guidance
- local report generation
- basic secret finding warnings
- open contribution workflow

## 可商业化部分

- hosted dashboard
- team report history
- managed policy packs
- organization-wide workflow governance
- private support and onboarding
- Jira、Linear、GitHub Enterprise、SSO、SIEM integration

## Distribution strategy

1. 保持 `aigate-cli` 在 npm 上更新
2. 使用 GitHub Actions 和 npm Trusted Publishing 提供 provenance
3. 为每个 tagged version 添加 release notes
4. npm package 有真实用户后添加 Homebrew 和 Docker
5. 保持 public roadmap 清晰并由 issue 驱动

## Adoption goals

- first run 在 2 分钟内产生价值
- install command 易于 copy-paste
- 将 common failure 转为 actionable message
- 在 docs 中使用 examples 和 generated reports
- 将 beginner-friendly work 标记为 `good first issue`

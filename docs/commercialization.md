# Commercialization

AIGate is open source first. The CLI core should stay useful for individual
developers and open source maintainers without requiring paid services.

## Positioning

AIGate helps developers and teams make safer Git changes before push and pull
request review.

Primary users:

- solo developers who want local guardrails
- open source maintainers who want safer contributions
- small teams that need repeatable Git workflow rules
- organizations that need reporting, policy, and integration support

## Open Source Core

The open source CLI should include:

- local checks
- guarded push and PR creation
- lightweight secret scanning
- Markdown, HTML, JSON, and SARIF reports
- branch strategy recommendations
- Codex and Gemini assistant instructions
- terminal and webhook notification basics

## Paid Product Direction

Paid offerings can build around team and organization needs:

| Plan | Target | Value |
| --- | --- | --- |
| Free | individuals and OSS maintainers | local CLI, reports, guarded Git workflow |
| Pro | professional developers | richer AI analysis, report history, personal integrations |
| Team | small engineering teams | Slack/Discord/Teams routing, shared policy packs, team reports |
| Enterprise | organizations | audit reports, SSO/SAML, self-hosting, compliance, governance |

## What Should Stay Free

- Running the CLI locally.
- Basic branch strategy guidance.
- Local report generation.
- Basic secret finding warnings.
- Open contribution workflow.

## What Can Be Commercial

- Hosted dashboard.
- Team report history.
- Managed policy packs.
- Organization-wide workflow governance.
- Private support and onboarding.
- Enterprise integrations with Jira, Linear, GitHub Enterprise, SSO, and SIEM.

## Distribution Strategy

1. Publish `@aigate/cli` on npm.
2. Use GitHub Actions and npm Trusted Publishing for provenance.
3. Add release notes for every tagged version.
4. Add Homebrew and Docker once the npm package has real users.
5. Keep the public roadmap clear and issue-driven.

## Adoption Goals

- Make first run useful in less than two minutes.
- Keep installation copy-paste simple.
- Convert every common failure into an actionable message.
- Use examples and generated reports in docs.
- Label beginner-friendly work as `good first issue`.

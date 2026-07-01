# Changelog

All notable changes to AIGate are documented here.

## 0.1.2 - Unreleased

- Expanded CLI localization across help, reports, release checks, audit output,
  notifications, and generated assistant instructions.
- Added Slack BLOCK webhook notifications for readiness gate failures.
- Added Discord and Teams webhook payload support for notification tests and
  sends.
- Reworked the GitHub landing README around a 60-second quickstart, demo output,
  shipped features, and planned channels.
- Added demo assets and a basic Node.js usage example.
- Added Korean, Japanese, and Chinese README files plus GitHub-rendered
  operations guides in English, Korean, Japanese, and Chinese.
- Added multilingual documentation versions and a locale coverage check for
  repository docs.
- Added first-run UX commands: `doctor`, `demo`, and
  `install-hook --pre-push`.
- Split first-run command logic into command, core, and renderer modules.
- Added GitHub reporting commands for PR comments and Checks/Actions summary
  payloads through `aigate github comment` and `aigate github check`.
- Added project health trend history through `aigate trends record` and
  `aigate trends show`.
- Added guided GitHub repository setup through `aigate github setup` for pull
  request templates and CODEOWNERS.
- Improved tests for multilingual output and webhook notification payloads.

## 0.1.0 - 2026-07-01

- Published the first public `aigate-cli` npm package.
- Added local Git readiness checks, guarded push, pull request readiness
  reports, project scoring, branch strategy recommendations, release checks,
  audit reports, and AI assistant integration file generation.
- Added public repository foundations including CI, OpenSSF Scorecard,
  Dependabot, security policy, governance, support, and contribution docs.

# Changelog

All notable changes to AIGate are documented here.

## 0.1.6 - 2026-07-02

- Added `aigate ai report` and `aigate ai-report` to summarize current
  problems, strengths, direction, suggested commands, release readiness, branch
  strategy, and AI handoff guidance.
- Added optional `aigate ai report --apply --provider <codex|claude|gemini>`
  execution for explicit AI agent handoff.
- Added the `aigate start --route oss` guided route for open-source starter
  README, contribution docs, issue templates, PR template, CODEOWNERS, and
  starter operations docs.
- Added the `aigate start --route default` setup flow with step-by-step
  yes/no prompts through `--ask-steps` and deterministic step selection through
  `--steps init,repo-files`.
- Updated multilingual README, usage, AI integration, and generated HTML docs
  for the AI report and open-source starter flow.

## 0.1.5 - 2026-07-02

- Added `aigate start` with guided setup routes for quickstart, AI agent
  setup, pre-push hooks, release readiness, and full project guard setup.
- Added `aigate test` to run Git readiness plus the detected project test
  command, with support for custom npm scripts and shell commands.
- Added `aigate aitest` to write AI remediation prompts and optionally invoke
  Codex, Claude, Gemini, or a custom agent command with `--apply`.
- Updated multilingual README, usage, operations, AI integration, roadmap,
  GitHub Action, example, and generated HTML docs for the new automation flow.
- Extended the reusable GitHub Action to support `test` and safe `aitest`
  prompt generation.

## 0.1.4 - 2026-07-02

- Added Claude Code integration through `aigate integrate claude`.
- Expanded `aigate integrate all` to generate `CLAUDE.md` and
  `.aigate/integrations/claude.md` alongside Codex and Gemini files.
- Updated multilingual integration documentation for Codex, Gemini, and
  Claude Code.

## 0.1.3 - 2026-07-02

- Prepared GitHub Marketplace metadata with a unique searchable action name and
  clearer Action description.
- Added multilingual usage guides and linked them from README and docs indexes.
- Aligned generated branch protection policy output with the current zero
  mandatory approval repository policy.
- Added email, Linear, and Jira notification dry-run payloads and issue
  creation routes.
- Added `aigate compliance-report` and `aigate dashboard` for compliance
  controls and local self-hosted HTML reporting.
- Added release and hotfix process docs in English, Korean, Japanese, and
  Chinese.
- Added JSON output and Windows smoke-test examples.
- Added lint/typecheck npm scripts to the CI gate.
- Added GHCR Docker publishing workflow and Homebrew formula draft.
- Added `aigate branch-strategy --compare` for scored branch strategy proposal
  comparison across GitHub Flow, Trunk-Based Development, Hybrid Flow, and
  Git Flow.
- Expanded generated branch strategy output into reusable policy packs for
  branch protection, pull request quality, release channels, and AI collaboration.

## 0.1.2 - 2026-07-01

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
- Added reusable public GitHub Action metadata at `action.yml`, mirrored at
  `.github/actions/aigate`.
- Improved tests for multilingual output and webhook notification payloads.

## 0.1.0 - 2026-07-01

- Published the first public `aigate-cli` npm package.
- Added local Git readiness checks, guarded push, pull request readiness
  reports, project scoring, branch strategy recommendations, release checks,
  audit reports, and AI assistant integration file generation.
- Added public repository foundations including CI, OpenSSF Scorecard,
  Dependabot, security policy, governance, support, and contribution docs.

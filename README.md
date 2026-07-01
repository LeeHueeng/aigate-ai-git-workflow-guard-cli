# AIGate AI Git Workflow Guard CLI

[![CI](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/scorecard.yml/badge.svg)](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/scorecard.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AIGate is an AI Git Workflow Guard CLI for safer local changes, cleaner pull
requests, project health reporting, and repository-specific branch strategy
design.

Search keywords: AI Git CLI, Git workflow guard, pull request readiness,
repository health report, branch strategy designer, developer workflow
automation.

Status: open source MVP. npm distribution and commercial team features are in
preparation.

## What AIGate Does

- Checks local Git changes before push or pull request creation.
- Produces Markdown, HTML, JSON, and SARIF reports.
- Scores repository workflow quality across Git, tests, CI, security, and docs.
- Recommends branch strategies based on team size, release cadence, and risk.
- Routes important workflow events to terminal, Slack, Discord, Teams, email,
  pull request comments, and GitHub Checks as the product matures.

## Planned Install Channels

These channels define the public distribution target. Until the first npm
release is published, clone the repository and use `npm link` for local use.

```sh
npm install -g @aigate/cli
npx @aigate/cli check
yarn global add @aigate/cli
yarn dlx @aigate/cli check
pnpm add -g @aigate/cli
pnpm dlx @aigate/cli check
bun add -g @aigate/cli
bunx @aigate/cli check
brew install aigate
docker run --rm -v "$PWD:/repo" aigate/cli check
```

## Local Development

```sh
npm install
npm test
npm run git:ready
node src/cli.mjs --help
node src/cli.mjs init --output-dir /tmp/aigate-demo
node src/cli.mjs branch-strategy
```

Set the CLI output language:

```sh
aigate setup --language ko
aigate settings
```

## Initial Commands

| Command | Purpose |
| --- | --- |
| `aigate init` | Create starter AIGate configuration for a project. |
| `aigate check` | Summarize current Git readiness. |
| `aigate git-ready` | Run the before-push readiness gate. |
| `aigate push` | Run AIGate checks, then run `git push`. |
| `aigate pr` | Run AIGate checks, then create a GitHub pull request with `gh`. |
| `aigate pr-check` | Generate a pull request readiness report. |
| `aigate setup --language ko` | Save local AIGate settings. |
| `aigate settings` | Show current AIGate settings. |
| `aigate integrate all` | Generate Codex and Gemini assistant integration files. |
| `aigate report --output .aigate/reports/local.md` | Write a local workflow report. |
| `aigate report --format sarif` | Print a SARIF report for secret findings. |
| `aigate evaluate-project` | Score project workflow foundations. |
| `aigate evaluate-project --deep --report` | Generate a project health report with Git signals. |
| `aigate score` | Print only the project score. |
| `aigate branch-strategy` | Recommend a repository branch strategy. |
| `aigate branch-strategy --apply` | Generate branch policy, release, hotfix, PR, and CODEOWNERS drafts. |
| `aigate release-check` | Validate package release readiness before tagging. |
| `aigate audit-report` | Generate a policy and governance audit report. |
| `aigate notify send --channel terminal` | Send a local notification event. |

## Roadmap Snapshot

- V1: npm distribution, local reports, Slack BLOCK notifications, basic project
  evaluation, and branch strategy recommendations.
- V1.5: Docker and GitHub Action foundations, Homebrew distribution,
  Discord and Teams notifications, and richer policy packs.
- V2: GitHub PR comments, GitHub Checks, weekly team reports, health trends,
  Linear/Jira integrations, and standalone binaries.
- V3: Enterprise governance, audit/compliance reports, central policies,
  self-hosted reporting, SSO/SAML, and organization-wide strategy evaluation.

## Branch Strategy

This repository uses GitHub Flow with release-channel extensions:

- `main` is protected, always releasable, and receives changes through pull
  requests.
- `codex/*` is used for AI-assisted implementation branches.
- `feature/*`, `fix/*`, `docs/*`, and `chore/*` are normal contributor branch
  prefixes.
- `release/*` and `hotfix/*` are reserved for package release stabilization.
- npm dist-tags map to product channels: `latest`, `next`, `beta`, `canary`.

Read the full strategy in [docs/branch-strategy.md](docs/branch-strategy.md).

## Before Pushing To Git

Use the local AIGate gate before every push:

```sh
npm run git:ready
git status --short --branch
git add <files>
git commit -m "type: short summary"
aigate push -u origin <branch>
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

Read the full workflow in [docs/git-upload-workflow.md](docs/git-upload-workflow.md).

## AI Assistant Integrations

Generate assistant instructions for Codex and Gemini:

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
```

This creates `AGENTS.md`, `GEMINI.md`, and `.aigate/integrations/*` so AI
assistants can follow the same branch, validation, and guarded push workflow.

Read the full guide in [docs/ai-integrations.md](docs/ai-integrations.md).

## Public Repository Standards

- Use Conventional Commits.
- Keep pull requests focused and reviewable.
- Update docs when commands, configuration, or behavior changes.
- Run `npm test` before requesting review.
- Treat generated reports as artifacts, not source files, unless explicitly
  checked in for documentation.

## Open Source And Commercial Roadmap

AIGate is open source first. The CLI core stays useful for individual
developers and maintainers, while paid team and enterprise offerings can build
around hosted reports, policy packs, integrations, and governance.

- [Open source readiness](docs/open-source-readiness.md)
- [Commercialization plan](docs/commercialization.md)
- [Distribution guide](docs/distribution.md)
- [Roadmap](docs/roadmap.md)

## License

MIT

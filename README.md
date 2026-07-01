# AIGate AI Git Workflow Guard CLI

AIGate is an AI Git Workflow Guard CLI for safer local changes, cleaner pull
requests, project health reporting, and repository-specific branch strategy
design.

Search keywords: AI Git CLI, Git workflow guard, pull request readiness,
repository health report, branch strategy designer, developer workflow
automation.

Status: early public repository bootstrap. The CLI scaffold is available in
this repo, while package registry distribution is still planned.

## What AIGate Does

- Checks local Git changes before push or pull request creation.
- Produces Markdown, HTML, JSON, and future GitHub-native reports.
- Scores repository workflow quality across Git, tests, CI, security, and docs.
- Recommends branch strategies based on team size, release cadence, and risk.
- Routes important workflow events to terminal, Slack, Discord, Teams, email,
  pull request comments, and GitHub Checks as the product matures.

## Planned Install Channels

These channels define the public distribution target:

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
| `aigate check` | Summarize current Git readiness. |
| `aigate git-ready` | Run the before-push readiness gate. |
| `aigate push` | Run AIGate checks, then run `git push`. |
| `aigate setup --language ko` | Save local AIGate settings. |
| `aigate settings` | Show current AIGate settings. |
| `aigate integrate all` | Generate Codex and Gemini assistant integration files. |
| `aigate report` | Print a local workflow report. |
| `aigate evaluate-project` | Score project workflow foundations. |
| `aigate score` | Print only the project score. |
| `aigate branch-strategy` | Recommend a repository branch strategy. |
| `aigate notify test` | Preview a notification event. |

## Roadmap Snapshot

- V1: npm distribution, local reports, Slack BLOCK notifications, basic project
  evaluation, and branch strategy recommendations.
- V1.5: PR readiness reports, HTML reports, Homebrew and Docker distribution,
  Discord and Teams notifications, PR templates, and CODEOWNERS generation.
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

## License

MIT

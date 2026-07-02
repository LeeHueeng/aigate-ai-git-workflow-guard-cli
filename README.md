# AIGate

Stop risky AI-generated Git changes before push.

[![CI](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/scorecard.yml/badge.svg)](https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli/actions/workflows/scorecard.yml)
[![npm version](https://img.shields.io/npm/v/aigate-cli.svg)](https://www.npmjs.com/package/aigate-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Languages

- README: [English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)
- Operations guide: [English](docs/operations.en.md) | [한국어](docs/operations.ko.md) | [日本語](docs/operations.ja.md) | [中文](docs/operations.zh.md)

AIGate is a zero-config pre-push safety CLI for AI-assisted coding. It checks
changed files, possible secrets, repository readiness, PR risk, and branch
strategy before changes reach your remote branch or pull request review.

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

![AIGate demo](assets/demo.gif)

## Use AIGate When

- Your AI coding assistant changed files faster than you can review them.
- You want one command that explains readiness before `git push`.
- You maintain an open source package and need PR, release, and repository health signals.
- You want Markdown, HTML, JSON, and SARIF outputs that work locally and in CI.
- You want Codex and Gemini to follow the same branch and validation workflow as humans.

## 60-Second Quickstart

Run it without installing:

```sh
npx -y aigate-cli check
npx -y aigate-cli doctor
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

Or install it globally:

```sh
npm install -g aigate-cli
aigate check
aigate git-ready
aigate install-hook --pre-push
aigate pr-check
```

Try it from source:

```sh
git clone https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli.git
cd aigate-ai-git-workflow-guard-cli
npm install
npm test
node src/cli.mjs check
```

## What You Get

```text
AIGate git-ready: READY
Branch: feature/my-work
Changed files: 4
Secret findings: 0
Project score: 92/100
Blockers: none
Warnings: none
Recommendation: Run npm test, commit focused changes, push the branch, and open a pull request.
```

AIGate is useful when AI coding assistants move quickly and you need one
repeatable local gate before `git push` or PR creation.

## Works Today

| Capability | Command |
| --- | --- |
| Local Git readiness check | `aigate check` |
| First-run diagnostics | `aigate doctor` |
| Guided CLI demo | `aigate demo` |
| Pre-push safety gate | `aigate git-ready` |
| Pre-push hook installer | `aigate install-hook --pre-push` |
| Guarded push wrapper | `aigate push -u origin <branch>` |
| Pull request readiness report | `aigate pr-check` |
| GitHub PR summary comment | `aigate github comment --pr <number>` |
| GitHub Checks summary payload | `aigate github check --format json` |
| GitHub PR template and CODEOWNERS setup | `aigate github setup` |
| Markdown, HTML, JSON, SARIF reports | `aigate report --format <format>` |
| Changed-file secret scan | `aigate report --format sarif` |
| Repository health score | `aigate evaluate-project` |
| Deep project report | `aigate evaluate-project --deep --report` |
| Compliance control report | `aigate compliance-report` |
| Local HTML health dashboard | `aigate dashboard` |
| Project health trend history | `aigate trends record` |
| Branch strategy policy packs | `aigate branch-strategy --apply` |
| Branch strategy proposal comparison | `aigate branch-strategy --compare` |
| Release readiness check | `aigate release-check --npm` |
| Slack BLOCK notifications | `aigate git-ready --notify-channel slack` |
| Discord and Teams webhook payloads | `aigate notify test --channel discord` |
| Codex and Gemini instructions | `aigate integrate all` |

## Why Not Just Husky, Lefthook, pre-commit, Or Gitleaks?

| Tool | Main job | How AIGate is different |
| --- | --- | --- |
| Husky | Git hook setup for JavaScript projects | AIGate is a runnable readiness gate, not only hook wiring. |
| Lefthook | Fast multi-language hook runner | AIGate focuses on PR readiness, repo health, and branch strategy. |
| pre-commit | Hook framework and hook ecosystem | AIGate is zero-config and Git/PR workflow focused. |
| Gitleaks | Deep secret scanning | AIGate includes lightweight changed-file checks and SARIF output, and can complement Gitleaks. |

Read the full [tool comparison](docs/comparison.md) for recommended combinations
with Husky, Lefthook, pre-commit, and Gitleaks.

## Typical Workflow

```sh
git switch -c feature/my-work
aigate doctor
aigate install-hook --pre-push
aigate git-ready
git add <files>
git commit -m "feat: my focused change"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: my focused change"
aigate github comment --pr <number>
aigate github check --output .aigate/reports/github-check.md
aigate trends record
aigate github setup --owner @your-org/team --dry-run
```

Send a Slack notification when a blocker appears:

```sh
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate git-ready --notify-channel slack
```

## GitHub Actions

Use AIGate as a reusable public GitHub Action:

```yaml
name: AIGate
on:
  pull_request:
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.3
        with:
          command: git-ready
          language: en
```

Use the current release tag for stable runs, or `@main` only when you
intentionally want unreleased behavior. Full inputs are documented in
[GitHub Action](docs/github-action.md). The same action metadata is mirrored at
`.github/actions/aigate` for local workflow testing.

Marketplace listing:

- Action name: `AIGate AI Git Workflow Guard CLI`
- Primary category: `Code quality`
- Secondary category: `Security`
- Release title: `AIGate AI Git Workflow Guard CLI v0.1.3`

## AI Agent Integration

Generate repository instructions for Codex and Gemini:

```sh
aigate integrate all
```

This creates `AGENTS.md`, `GEMINI.md`, and `.aigate/integrations/*` so AI
assistants follow the same branch, validation, and guarded push workflow as
human contributors.

## Output Languages

AIGate supports English, Korean, Japanese, and Chinese CLI output:

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## Planned, Not Shipped Yet

These are intentionally not in the quickstart until they are publicly
distributed:

- Published Docker image
- Homebrew formula
- Standalone binaries
- Hosted dashboard
- Deeper Linear and Jira workflow automation

## Documentation

- [Usage guide](docs/usage.md)
- [Distribution guide](docs/distribution.md)
- [Tool comparison](docs/comparison.md)
- [Notifications guide](docs/notifications.md)
- [AI integrations](docs/ai-integrations.md)
- [Basic Node project example](docs/examples/basic-node-project.md)
- [JSON output examples](docs/examples/json-output.md)
- [Windows smoke test notes](docs/examples/windows-smoke-test.md)
- [Branch strategy](docs/branch-strategy.md)
- [Release process](docs/release-process.md)
- [Hotfix process](docs/hotfix-process.md)
- [Git upload workflow](docs/git-upload-workflow.md)
- [Roadmap](docs/roadmap.md)
- [Multilingual documentation index](docs/README.md)
- [Changelog](CHANGELOG.md)
- [English operations guide](docs/operations.en.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [中文运维说明](docs/operations.zh.md)
- Local visual HTML guides: [ko](docs/aigate-overview.ko.html), [en](docs/aigate-overview.en.html), [ja](docs/aigate-overview.ja.html), [zh](docs/aigate-overview.zh.html)

## Help AIGate Grow

- Star or watch the repository if AIGate catches a risky push in your workflow.
- Open a real-world example issue showing how AIGate behaves in your repository.
- Share the demo GIF, terminal screenshot, or `assets/social-preview.png` when introducing the project.
- Pick a good first issue if you want to improve docs, examples, integrations, or packaging.

## Contributing

Small issues are welcome. Good first contributions include docs examples,
GitHub Actions examples, Homebrew/Docker validation notes, and real-world
repository case studies.

```sh
npm install
npm test
npm run ci
```

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

## License

MIT

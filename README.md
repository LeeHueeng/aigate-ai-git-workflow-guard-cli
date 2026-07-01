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

## 60-Second Quickstart

Run it without installing:

```sh
npx -y aigate-cli check
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

Or install it globally:

```sh
npm install -g aigate-cli
aigate check
aigate git-ready
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
| Pre-push safety gate | `aigate git-ready` |
| Guarded push wrapper | `aigate push -u origin <branch>` |
| Pull request readiness report | `aigate pr-check` |
| Markdown, HTML, JSON, SARIF reports | `aigate report --format <format>` |
| Changed-file secret scan | `aigate report --format sarif` |
| Repository health score | `aigate evaluate-project` |
| Deep project report | `aigate evaluate-project --deep --report` |
| Branch strategy recommendation | `aigate branch-strategy` |
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

## Typical Workflow

```sh
git switch -c feature/my-work
aigate git-ready
git add <files>
git commit -m "feat: my focused change"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: my focused change"
```

Send a Slack notification when a blocker appears:

```sh
AIGATE_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  aigate git-ready --notify-channel slack
```

## GitHub Actions

This repository ships a local composite action:

```yaml
name: AIGate
on:
  pull_request:
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/aigate
        with:
          command: pr-check
```

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
- GitHub PR comments
- GitHub Checks reporter
- Hosted dashboard
- Linear and Jira integrations

## Documentation

- [Distribution guide](docs/distribution.md)
- [Notifications guide](docs/notifications.md)
- [AI integrations](docs/ai-integrations.md)
- [Basic Node project example](docs/examples/basic-node-project.md)
- [Branch strategy](docs/branch-strategy.md)
- [Git upload workflow](docs/git-upload-workflow.md)
- [Roadmap](docs/roadmap.md)
- [Multilingual documentation index](docs/README.md)
- [Changelog](CHANGELOG.md)
- [English operations guide](docs/operations.en.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [中文运维说明](docs/operations.zh.md)
- Local visual HTML guides: [ko](docs/aigate-overview.ko.html), [en](docs/aigate-overview.en.html), [ja](docs/aigate-overview.ja.html), [zh](docs/aigate-overview.zh.html)

## Contributing

Small issues are welcome. Good first contributions include docs examples,
Windows smoke-test notes, GitHub Actions examples, and real-world repository
case studies.

```sh
npm install
npm test
npm run ci
```

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request.

## License

MIT

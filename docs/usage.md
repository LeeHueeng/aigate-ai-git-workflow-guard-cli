# AIGate Usage Guide

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

This guide follows the current `aigate-cli` structure. Use it when you want to
run AIGate in an existing repository, wire it into GitHub, or hand the same
workflow to Codex and Gemini.

## Install Or Run Directly

Run without installing:

```sh
npx -y aigate-cli check
```

Install globally:

```sh
npm install -g aigate-cli
aigate --help
```

Set the CLI language once per repository:

```sh
aigate settings --language en
aigate settings --language ko
aigate settings --language ja
aigate settings --language zh
```

## First Run In A Repository

Use these commands after moving into a Git repository.

```sh
aigate setup --language en
aigate doctor
aigate demo
aigate install-hook --pre-push
```

What they do:

| Command | Purpose |
| --- | --- |
| `aigate setup --language en` | Creates `.aigate.yml`, `.aigate/settings.json`, reports directory, and AI integration guide files. |
| `aigate doctor` | Checks Node, Git, npm package metadata, GitHub workflow files, and AIGate configuration. |
| `aigate demo` | Shows the main workflow without changing project files. |
| `aigate install-hook --pre-push` | Installs a pre-push hook that runs AIGate before pushing. |

## Daily Git Workflow

```sh
git switch -c feature/my-work
aigate check
aigate git-ready
git add .
git commit -m "feat: short summary"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

Use `aigate push --dry-run origin <branch>` before a real push when you want to
preview the command. `aigate push` is a guarded wrapper around `git push`; it is
not a replacement for Git, but it adds AIGate checks before the remote is
updated.

## Reports And Output Formats

```sh
aigate report --format markdown --output .aigate/reports/report.md
aigate report --format html --output .aigate/reports/report.html
aigate report --format json --output .aigate/reports/report.json
aigate report --format sarif --output .aigate/reports/aigate.sarif
aigate evaluate-project --deep --report
aigate audit-report
aigate compliance-report
aigate dashboard --output .aigate/reports/dashboard.html
```

Use Markdown for pull requests, HTML for local review, JSON for automation, and
SARIF for GitHub code scanning.

## GitHub Setup And Actions

Generate local GitHub helper files:

```sh
aigate github setup --owner @your-org/team --dry-run
aigate github setup --owner @your-org/team
```

Post PR feedback or create a check summary:

```sh
aigate github comment --pr 123
aigate github check --format markdown
```

Reusable GitHub Action example:

```yaml
name: AIGate

on:
  pull_request:
  push:
    branches: [main]

jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.3
        with:
          command: git-ready
          language: en
```

## AI Agent Integration

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate all --output-dir . --force
```

The command creates `AGENTS.md`, `GEMINI.md`, and `.aigate/integrations/*`.
Those files tell Codex and Gemini to use scoped branches, validation commands,
and `aigate push`.

## Branch Strategy And Releases

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
```

`branch-strategy` recommends branch rules and can generate policy packs.
`release-check --npm` checks whether package metadata, release tags, workflow
provenance, and npm publication state are ready.

## Notifications

```sh
aigate notify setup --channel terminal
aigate notify test --channel terminal
aigate notify send --event BLOCK --channel terminal
aigate git-ready --notify-channel terminal
```

For external systems, set the required environment variable and use the matching
channel:

| Channel | Environment variable |
| --- | --- |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` |
| `linear` | `AIGATE_LINEAR_WEBHOOK_URL` |
| `jira` | `AIGATE_JIRA_WEBHOOK_URL` |
| `webhook` | `AIGATE_WEBHOOK_URL` |

## Command Map

| Command | Use it for |
| --- | --- |
| `aigate init` | Create the initial AIGate config. |
| `aigate check` | Inspect local Git changes and secret findings. |
| `aigate git-ready` | Run the pre-commit or pre-push readiness gate. |
| `aigate push` | Run checks, then call `git push`. |
| `aigate pr` | Create a guarded pull request with useful body content. |
| `aigate pr-check` | Generate PR readiness and risk information. |
| `aigate github <comment\|check\|setup>` | Work with PR comments, check summaries, and GitHub helper files. |
| `aigate doctor` | Diagnose local setup and repository foundations. |
| `aigate demo` | Show the workflow without changing files. |
| `aigate install-hook` | Install Git hooks. |
| `aigate setup` | Create config, settings, reports, and AI guide files. |
| `aigate settings` | Read or change AIGate settings such as language. |
| `aigate integrate <provider>` | Generate Codex and Gemini integration files. |
| `aigate report` | Write Markdown, HTML, JSON, or SARIF reports. |
| `aigate evaluate-project` | Score repository foundations and Git signals. |
| `aigate score` | Print the current project score. |
| `aigate trends <record\|show>` | Record or display score history. |
| `aigate branch-strategy` | Recommend or generate branch policy docs. |
| `aigate release-check` | Check release and npm readiness. |
| `aigate audit-report` | Produce an audit-focused report. |
| `aigate compliance-report` | Produce a compliance-focused report. |
| `aigate dashboard` | Write a local HTML status dashboard. |
| `aigate notify <setup\|test\|send>` | Configure and send notifications. |
| `aigate help` | Print command help. |

## What Is Not A Public Install Path Yet

The repository contains Docker and Homebrew preparation files, but the public
npm package is the supported installation path today. Do not put Docker or
Homebrew commands in a user quickstart until those channels are publicly
published.

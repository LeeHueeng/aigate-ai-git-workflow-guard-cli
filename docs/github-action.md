# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate ships a reusable GitHub Action at the repository root. Use the current
release tag for stable runs, or `@main` only when you intentionally want
unreleased behavior.

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
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: en
```

For a pull request report:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## Inputs

| Input | Default | Notes |
| --- | --- | --- |
| `command` | `git-ready` | Supports `git-ready`, `check`, `test`, `aitest`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, `release-check-npm`, `branch-strategy`, and `branch-strategy-compare`. |
| `report-format` | `markdown` | Used by report-producing commands. |
| `output` | empty | Optional output path for report-producing commands. |
| `language` | empty | Optional `en`, `ko`, `ja`, or `zh`. |
| `package` | `aigate-cli@latest` | npm package spec used by `npx`. |

The same action metadata is mirrored at `.github/actions/aigate` for local
workflow testing inside this repository.

For branch strategy comparison:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
  with:
    command: branch-strategy-compare
    report-format: json
    output: .aigate/reports/branch-strategy.json
```

## GitHub Marketplace

Use these values when publishing the next GitHub Release:

| Field | Value |
| --- | --- |
| Action name | `AIGate AI Git Workflow Guard CLI` |
| Primary category | `Code quality` |
| Secondary category | `Security` |
| Release tag | `v0.1.6` |
| Release title | `AIGate AI Git Workflow Guard CLI v0.1.6` |

Keep `Set as the latest release` enabled and do not mark the release as a
pre-release for a stable patch release. Enable the GitHub Marketplace publish
option on the release screen.

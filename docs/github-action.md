# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate ships a reusable GitHub Action at the repository root. Use `@main` for
the latest public action behavior, then pin to a release tag such as `@v0.1.2`
after that tag exists.

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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
        with:
          command: git-ready
          language: en
```

For a pull request report:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## Inputs

| Input | Default | Notes |
| --- | --- | --- |
| `command` | `git-ready` | Supports `git-ready`, `check`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, and `release-check-npm`. |
| `report-format` | `markdown` | Used by report-producing commands. |
| `output` | empty | Optional output path for report-producing commands. |
| `language` | empty | Optional `en`, `ko`, `ja`, or `zh`. |
| `package` | `aigate-cli@latest` | npm package spec used by `npx`. |

The same action metadata is mirrored at `.github/actions/aigate` for local
workflow testing inside this repository.

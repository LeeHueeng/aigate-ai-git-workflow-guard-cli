# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate 在仓库根目录提供可复用的 GitHub Action。要立即使用最新公开行为，
可以使用 `@main`；当包含该 action 的发布标签创建后，再固定到
`@v0.1.2` 这类标签。

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
          language: zh
```

生成 PR 报告时:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## 输入

| 输入 | 默认值 | 说明 |
| --- | --- | --- |
| `command` | `git-ready` | 支持 `git-ready`, `check`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, `release-check-npm`。 |
| `report-format` | `markdown` | 用于生成报告的命令。 |
| `output` | 空 | 生成报告命令的可选输出路径。 |
| `language` | 空 | 可选 `en`, `ko`, `ja`, `zh`。 |
| `package` | `aigate-cli@latest` | `npx` 要运行的 npm 包规格。 |

同一份 action metadata 也复制到 `.github/actions/aigate`，用于本仓库内部的
workflow 测试。

# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate 在仓库根目录提供可复用的 GitHub Action。稳定运行请使用当前发布标签；
只有在有意验证未发布的最新行为时才使用 `@main`。

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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.5
        with:
          command: git-ready
          language: zh
```

生成 PR 报告时:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.5
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## 输入

| 输入 | 默认值 | 说明 |
| --- | --- | --- |
| `command` | `git-ready` | 支持 `git-ready`, `check`, `test`, `aitest`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, `release-check-npm`, `branch-strategy`, `branch-strategy-compare`。 |
| `report-format` | `markdown` | 用于生成报告的命令。 |
| `output` | 空 | 生成报告命令的可选输出路径。 |
| `language` | 空 | 可选 `en`, `ko`, `ja`, `zh`。 |
| `package` | `aigate-cli@latest` | `npx` 要运行的 npm 包规格。 |

同一份 action metadata 也复制到 `.github/actions/aigate`，用于本仓库内部的
workflow 测试。

分支策略比较:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.5
  with:
    command: branch-strategy-compare
    report-format: json
    output: .aigate/reports/branch-strategy.json
```

## GitHub Marketplace

发布下一个 GitHub Release 时使用这些值。

| 项目 | 值 |
| --- | --- |
| Action name | `AIGate AI Git Workflow Guard CLI` |
| Primary category | `Code quality` |
| Secondary category | `Security` |
| Release tag | `v0.1.5` |
| Release title | `AIGate AI Git Workflow Guard CLI v0.1.5` |

稳定 patch release 保持 `Set as the latest release` 开启，不要标记为
pre-release。在 release 页面启用 GitHub Marketplace publish option。

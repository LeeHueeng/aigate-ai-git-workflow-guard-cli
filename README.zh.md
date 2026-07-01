# AIGate

在 push 之前阻止有风险的 AI 生成 Git 变更。

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

AIGate 是面向 AI 辅助开发的 zero-config pre-push safety CLI。它会在变更进入
remote branch 或 PR review 之前，检查 changed files、secret 风险、仓库准备度、
PR 风险和 branch strategy。

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

![AIGate demo](assets/demo.gif)

## 60 秒快速开始

无需安装即可运行:

```sh
npx -y aigate-cli check
npx -y aigate-cli doctor
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

也可以全局安装:

```sh
npm install -g aigate-cli
aigate check
aigate git-ready
aigate install-hook --pre-push
aigate pr-check
```

## 当前可用功能

| 功能 | 命令 |
| --- | --- |
| 本地 Git readiness check | `aigate check` |
| 首次运行诊断 | `aigate doctor` |
| 引导式 CLI demo | `aigate demo` |
| pre-push safety gate | `aigate git-ready` |
| pre-push hook installer | `aigate install-hook --pre-push` |
| 带验证的 push wrapper | `aigate push -u origin <branch>` |
| PR readiness report | `aigate pr-check` |
| GitHub PR 摘要评论 | `aigate github comment --pr <number>` |
| GitHub Checks 摘要 payload | `aigate github check --format json` |
| GitHub PR 模板和 CODEOWNERS 设置 | `aigate github setup` |
| Markdown, HTML, JSON, SARIF report | `aigate report --format <format>` |
| repository health score | `aigate evaluate-project` |
| 项目状态趋势历史 | `aigate trends record` |
| branch strategy recommendation | `aigate branch-strategy` |
| npm release readiness check | `aigate release-check --npm` |
| Codex/Gemini integration files | `aigate integrate all` |

## 典型流程

```sh
git switch -c feature/my-work
aigate doctor
aigate install-hook --pre-push
aigate git-ready
git add <files>
git commit -m "feat: focused change"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: focused change"
aigate github comment --pr <number>
aigate github check --output .aigate/reports/github-check.md
aigate trends record
aigate github setup --owner @your-org/team --dry-run
```

## 语言设置

CLI 输出支持英语、韩语、日语和中文。

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## GitHub Actions

其他仓库也可以把 AIGate 作为可复用的公开 GitHub Action 运行。

```yaml
name: AIGate
on:
  pull_request:
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

包含该 action 的下一个发布标签创建后，请固定到标签。完整输入见
[GitHub Action 文档](docs/github-action.zh.md)。

## AI Agent 集成

```sh
aigate integrate all
```

该命令会生成 `AGENTS.md`、`GEMINI.md` 和 `.aigate/integrations/*`，让 Codex
和 Gemini 遵循相同的 branch、validation 与 guarded push workflow。

## 文档

- [多语言文档索引](docs/README.zh.md)
- [中文运维说明](docs/operations.zh.md)
- [English operations guide](docs/operations.en.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [Distribution guide](docs/distribution.zh.md)
- [Notifications guide](docs/notifications.zh.md)
- [AI integrations](docs/ai-integrations.zh.md)
- [Roadmap](docs/roadmap.zh.md)

## 尚未发布的计划

- 公开 Docker image
- Homebrew formula
- standalone binary
- hosted dashboard
- Linear/Jira integrations

## License

MIT

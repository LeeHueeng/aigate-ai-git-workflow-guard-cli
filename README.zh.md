# AIGate

在 push 之前阻止有风险的 AI 生成 Git 变更。

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

AIGate 是面向 AI 辅助开发的 zero-config pre-push safety CLI。它会在变更进入
remote branch 或 PR review 之前，检查 changed files、secret 风险、仓库准备度、
PR 风险和 branch strategy。

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

![AIGate demo](assets/demo.gif)

## 适合使用 AIGate 的场景

- AI coding assistant 修改文件的速度快过你的 review。
- 你想在 `git push` 前用一个 command 说明 readiness。
- 你维护公开 package，需要 PR、release 和 repository health signals。
- 你需要 Markdown、HTML、JSON、SARIF output 同时用于 local 和 CI。
- 你希望 Codex、Gemini、Claude Code 遵循与人类相同的 branch/validation workflow。

## 60 秒快速开始

无需安装即可运行:

```sh
npx -y aigate-cli check
npx -y aigate-cli start --route quickstart --dry-run
npx -y aigate-cli doctor
npx -y aigate-cli test
npx -y aigate-cli ai report
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

也可以全局安装:

```sh
npm install -g aigate-cli
aigate start
aigate start --route oss --dry-run
aigate check
aigate test
aigate ai report
aigate aitest
aigate git-ready
aigate install-hook --pre-push
aigate pr-check
```

## 当前可用功能

| 功能 | 命令 |
| --- | --- |
| 本地 Git readiness check | `aigate check` |
| 引导式设置路由器 | `aigate start` |
| 公开仓库 README、issue 模板和贡献文件生成 | `aigate start --route oss` |
| 项目测试运行器 | `aigate test` |
| AI 修复提示和可选 agent 执行 | `aigate aitest` |
| 汇总当前问题、做得好的部分和方向的 AI 报告 | `aigate ai report` |
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
| 合规控制报告 | `aigate compliance-report` |
| 本地 HTML 健康仪表盘 | `aigate dashboard` |
| 项目状态趋势历史 | `aigate trends record` |
| 分支策略政策包 | `aigate branch-strategy --apply` |
| 分支策略提案比较 | `aigate branch-strategy --compare` |
| npm release readiness check | `aigate release-check --npm` |
| Codex/Gemini/Claude integration files | `aigate integrate all` |

## 与其他工具的区别

AIGate 不强行替代 Husky、Lefthook、pre-commit 或 Gitleaks。它位于现有 hook
和 scanner 之上，把 AI-assisted changes 的 push safety、PR quality 和
repository governance 连接成一个 workflow layer。

详情见 [tool comparison](docs/comparison.zh.md)。

## 典型流程

```sh
git switch -c feature/my-work
aigate ai report
aigate start --route oss --dry-run
aigate start --route ai --provider all
aigate doctor
aigate install-hook --pre-push
aigate test
aigate aitest
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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: zh
```

稳定运行请使用当前发布标签；只有在有意验证未发布的最新行为时才使用 `@main`。
完整输入见 [GitHub Action 文档](docs/github-action.zh.md)。

Marketplace 发布设置:

- Action name: `AIGate AI Git Workflow Guard CLI`
- Primary category: `Code quality`
- Secondary category: `Security`
- Release title: `AIGate AI Git Workflow Guard CLI v0.1.6`

## AI Agent 集成

```sh
aigate integrate all
aigate ai report
aigate ai report --apply --provider codex
aigate aitest --provider codex
aigate aitest --apply --provider codex
```

该命令会生成 `AGENTS.md`、`GEMINI.md`、`CLAUDE.md` 和
`.aigate/integrations/*`，让 Codex、Gemini、Claude Code 遵循相同的
branch、validation 与 guarded push workflow。`aigate aitest` 会把修复提示写入
`.aigate/reports/ai-test.md`；只有显式添加 `--apply` 时才会运行 Codex、
Claude、Gemini 或自定义 `--agent-command`。

`aigate ai report` 会汇总当前 Git 状态、仓库基础分、发布准备状态、分支策略和
AI 交接提示。默认不会修改文件；只有加上
`--apply --provider codex|claude|gemini` 时才会运行所选 AI CLI。

## 文档

- [多语言文档索引](docs/README.zh.md)
- [中文使用指南](docs/usage.zh.md)
- [中文运维说明](docs/operations.zh.md)
- [Tool comparison](docs/comparison.zh.md)
- [English operations guide](docs/operations.en.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [Distribution guide](docs/distribution.zh.md)
- [Notifications guide](docs/notifications.zh.md)
- [AI integrations](docs/ai-integrations.zh.md)
- [JSON output example](docs/examples/json-output.zh.md)
- [Windows smoke test](docs/examples/windows-smoke-test.zh.md)
- [Release process](docs/release-process.zh.md)
- [Hotfix process](docs/hotfix-process.zh.md)
- [Roadmap](docs/roadmap.zh.md)

## 尚未发布的计划

- 公开 Docker image
- Homebrew formula
- standalone binary
- hosted dashboard
- deeper Linear/Jira integrations

## 帮助 AIGate 成长

- 如果 AIGate 帮你拦下 risky push，请给 repository star 或 watch。
- 通过 issue 分享你在真实 repository 中的使用案例。
- 介绍项目时可以使用 demo GIF、terminal screenshot 或 `assets/social-preview.png`。
- 可以从 docs、examples、integrations、packaging 的 good first issue 开始贡献。

## License

MIT

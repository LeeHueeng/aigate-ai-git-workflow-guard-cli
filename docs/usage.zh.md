# AIGate 使用指南

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

本指南匹配当前 `aigate-cli` 结构。可用于在现有仓库中运行 AIGate、接入
GitHub，或把同一套工作流交给 Codex/Gemini。

## 安装或直接运行

无需安装直接运行:

```sh
npx -y aigate-cli check
```

全局安装:

```sh
npm install -g aigate-cli
aigate --help
```

按仓库设置 CLI 语言:

```sh
aigate settings --language en
aigate settings --language ko
aigate settings --language ja
aigate settings --language zh
```

## 在仓库中首次运行

进入 Git 仓库根目录后执行:

```sh
aigate setup --language zh
aigate doctor
aigate demo
aigate install-hook --pre-push
```

各命令作用:

| 命令 | 用途 |
| --- | --- |
| `aigate setup --language zh` | 创建 `.aigate.yml`、`.aigate/settings.json`、reports 目录和 AI 集成说明文件。 |
| `aigate doctor` | 检查 Node、Git、npm package metadata、GitHub workflow 和 AIGate 配置。 |
| `aigate demo` | 不修改项目文件，展示主要流程。 |
| `aigate install-hook --pre-push` | 安装 push 前运行 AIGate 的 pre-push hook。 |

## 日常 Git 流程

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

如果想在真正 push 前预览，使用 `aigate push --dry-run origin <branch>`。
`aigate push` 不是替代 Git 的新版本管理工具，而是在 `git push` 前增加
AIGate 检查的 guarded wrapper。

## 报告和输出格式

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

Pull request 使用 Markdown，本地查看使用 HTML，自动化使用 JSON，GitHub code
scanning 使用 SARIF。

## GitHub 设置和 Actions

生成 GitHub 辅助文件:

```sh
aigate github setup --owner @your-org/team --dry-run
aigate github setup --owner @your-org/team
```

生成 PR comment 或 check summary:

```sh
aigate github comment --pr 123
aigate github check --format markdown
```

可复用 GitHub Action 示例:

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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.2
        with:
          command: git-ready
          language: zh
```

## AI Agent 集成

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate all --output-dir . --force
```

该命令会创建 `AGENTS.md`、`GEMINI.md` 和 `.aigate/integrations/*`。这些文件
会告诉 Codex 和 Gemini 使用范围明确的 branch、validation commands 和
`aigate push`。

## 分支策略和发布

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
```

`branch-strategy` 会推荐 branch rules，并可生成 policy packs。
`release-check --npm` 会检查 package metadata、release tag、workflow
provenance 和 npm 发布状态是否就绪。

## 通知

```sh
aigate notify setup --channel terminal
aigate notify test --channel terminal
aigate notify send --event BLOCK --channel terminal
aigate git-ready --notify-channel terminal
```

外部系统需要设置对应环境变量，并使用匹配的 channel。

| Channel | 环境变量 |
| --- | --- |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` |
| `linear` | `AIGATE_LINEAR_WEBHOOK_URL` |
| `jira` | `AIGATE_JIRA_WEBHOOK_URL` |
| `webhook` | `AIGATE_WEBHOOK_URL` |

## 命令地图

| 命令 | 使用场景 |
| --- | --- |
| `aigate init` | 创建初始 AIGate 配置。 |
| `aigate check` | 检查 local Git changes 和 secret findings。 |
| `aigate git-ready` | 运行 commit 或 push 前的 readiness gate。 |
| `aigate push` | 检查通过后调用 `git push`。 |
| `aigate pr` | 创建带有有效正文的 pull request。 |
| `aigate pr-check` | 生成 PR readiness 和 risk 信息。 |
| `aigate github <comment\|check\|setup>` | 处理 PR comment、check summary 和 GitHub 辅助文件。 |
| `aigate doctor` | 诊断 local setup 和 repository foundation。 |
| `aigate demo` | 不改文件展示 workflow。 |
| `aigate install-hook` | 安装 Git hooks。 |
| `aigate setup` | 创建 config、settings、reports 和 AI guide files。 |
| `aigate settings` | 查看或修改语言等 AIGate 设置。 |
| `aigate integrate <provider>` | 生成 Codex/Gemini integration files。 |
| `aigate report` | 输出 Markdown、HTML、JSON、SARIF reports。 |
| `aigate evaluate-project` | 为 repository foundation 和 Git signals 打分。 |
| `aigate score` | 输出当前 project score。 |
| `aigate trends <record\|show>` | 记录或显示 score history。 |
| `aigate branch-strategy` | 推荐或生成 branch policy docs。 |
| `aigate release-check` | 检查 release 和 npm readiness。 |
| `aigate audit-report` | 生成 audit-focused report。 |
| `aigate compliance-report` | 生成 compliance-focused report。 |
| `aigate dashboard` | 创建 local HTML status dashboard。 |
| `aigate notify <setup\|test\|send>` | 配置并发送通知。 |
| `aigate help` | 输出 command help。 |

## 还不是公开安装渠道的内容

仓库包含 Docker 和 Homebrew 准备文件，但当前官方安装路径是公开 npm package。
在 Docker 或 Homebrew channel 真正公开前，不要把这些安装命令放进用户
quickstart。

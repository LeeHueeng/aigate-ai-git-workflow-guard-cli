# AIGate 使用指南

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

本指南匹配当前 `aigate-cli` 结构。可用于在现有仓库中运行 AIGate、接入
GitHub，或把同一套工作流交给 Codex/Gemini/Claude Code。

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
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## 在仓库中首次运行

进入 Git 仓库根目录后执行:

```sh
aigate start
aigate start --route default --ask-steps
aigate start --route default --steps init,repo-files
aigate start --route oss --dry-run
aigate start --route oss --owner @your-org/team
aigate start --route ai --provider codex
aigate start --route full --provider all
aigate init
aigate reset --dry-run
aigate clean
aigate uninstall
aigate doctor
aigate demo
aigate install-hook --pre-push
```

各命令作用:

| 命令 | 用途 |
| --- | --- |
| `aigate start` | 在 TTY 中打开方向键路由选择，非交互 shell 中运行 quickstart 路由。第一个路由是默认设置流程。 |
| `aigate start --route default --ask-steps` | 在默认设置流程中逐步询问是否运行推荐步骤。 |
| `aigate start --route default --steps init,repo-files` | 只运行选中的设置步骤 ID，其余标记为 skipped。 |
| `aigate start --route oss --owner @your-org/team` | 创建 README、贡献文档、issue 模板、PR 模板、CODEOWNERS 和运维文档草案。没有 `--force` 时不会覆盖已有文件。 |
| `aigate start --route ai --provider codex` | 创建 AIGate 配置和 Codex 指令文件。 |
| `aigate start --route full --provider all` | 在一个 flow 中创建配置、AI 文件、pre-push hook 和 release checks。 |
| `aigate setup --language zh` | 保存 CLI 输出语言。 |
| `aigate init` | 创建 `.aigate.yml` 和 reports 目录。 |
| `aigate reset` | 重新写入 AIGate config、settings 和报告占位文件。可用 `--dry-run` 预览。 |
| `aigate clean --force` | 删除生成的 AIGate 报告和本地生成状态。没有 `--force` 时只预览目标。 |
| `aigate uninstall --force` | 移除 `.aigate.yml`、`.aigate/` 和 AIGate 自有 pre-push hook。 |
| `aigate doctor` | 检查 Node、Git、检测到的 test command、CI profile、过期 generated files 和 AIGate 配置。 |
| `aigate demo` | 不修改项目文件，展示主要流程。 |
| `aigate install-hook --pre-push` | 安装 push 前运行 AIGate 的 pre-push hook。 |

## 按场景使用示例

不知道现在该运行什么时，可以先从这些短流程中选择。

| 场景 | 流程 | 命令示例 |
| --- | --- | --- |
| 首次接入仓库 | 选择默认设置，只创建需要的文件，然后确认诊断结果。 | `aigate start --route default --ask-steps` -> `aigate doctor` -> `aigate install-hook --pre-push` |
| AI agent 修改了很多文件后 | 先检查 changed files 和 secret 风险，再把失败测试交给 AI 修复提示。 | `aigate check` -> `aigate test` -> `aigate aitest` |
| 打开 PR 之前 | 通过本地 gate，经 guarded push 推送，再生成 reviewer 摘要。 | `aigate git-ready` -> `aigate push -u origin feature/my-work` -> `aigate pr-check` |
| private GitLab monorepo | 固定 profile，检测并运行 workspace tests，避免 GitHub 专用评分噪音。 | `aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm` -> `aigate test` -> `aigate evaluate-project` |
| 准备开源发布 | 生成公开贡献文件，并检查仓库基础评分。 | `aigate start --route oss --owner @team` -> `aigate evaluate-project --deep --report` -> `aigate github setup --dry-run` |
| 发布前后 | 检查 tag 和 npm readiness，运行 CI 后记录状态趋势。 | `aigate release-check --npm` -> `npm run ci` -> `aigate trends record` |
| 清理或移除本地 AIGate 状态 | 先预览删除目标，确认无误后再应用。 | `aigate clean` -> `aigate clean --force` -> `aigate uninstall --force` |

## 日常 Git 流程

```sh
git switch -c feature/my-work
aigate check
aigate test
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

## 测试和 AI 自动修复流程

```sh
aigate test
aigate test --script test
aigate test --command "npm run ci"
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate test` 会运行 `aigate git-ready` 和检测到的 package-manager command。
检测会查看 root scripts、`turbo.json` tasks、`pnpm-workspace.yaml`、
`package.json` workspaces，以及常见的 `apps/*` 或 `packages/*` workspace
packages。它会使用检测到的 package manager (`npm`, `pnpm`, `yarn`, `bun`)，
并可运行 `pnpm turbo run test` 或 `pnpm -r run test` 等命令。如果项目使用
自定义检查命令，请用 `--script` 或 `--command` 指定。只有在 package metadata
中声明了 `turbo`，或能在 `node_modules/.bin` 找到 runner 时，AIGate 才会选择
`turbo` task；否则会自动回退到 `pnpm -r run test` 等 workspace script。

`aigate aitest` 会把失败摘要、测试输出和 AI 修复提示写入
`.aigate/reports/ai-test.md`。默认不会修改代码。只有在需要调用 Codex、
Claude、Gemini CLI 或自定义 agent 时才添加 `--apply`。

`aigate ai report` 是更完整的项目简报。它会汇总当前问题、做得好的部分、方向、
建议命令、发布状态、分支策略和 AI 交接提示。默认不会修改代码；只有需要运行
所选 AI CLI 时才添加 `--apply --provider codex|claude|gemini`。默认 AI 报告
会把尚未创建的发布标签检查作为参考信号，避免把普通 PR 工作标记为因发布准备而
阻塞。需要严格检查发布和 npm 发布准备状态时，请添加 `--npm`。

以文本模式运行 `--apply` 时，AIGate 会在终端显示提示文件路径、provider、agent
命令和实时 agent 输出。最终报告也会包含 agent 命令、耗时、退出码、stdout 和
stderr。JSON 输出会保持 stdout 为机器可读 JSON，并把进度日志发送到 stderr。

## 报告和输出格式

```sh
aigate report --format markdown --output .aigate/reports/report.md
aigate report --format html --output .aigate/reports/report.html
aigate report --format json --output .aigate/reports/report.json
aigate report --format sarif --output .aigate/reports/aigate.sarif
aigate ai report --output .aigate/reports/ai-report.md
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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: zh
```

## AI Agent 集成

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate claude
aigate integrate all --output-dir . --force
```

该命令会创建 `AGENTS.md`、`GEMINI.md`、`CLAUDE.md` 和
`.aigate/integrations/*`。这些文件会告诉 Codex、Gemini、Claude Code 使用
范围明确的 branch、validation commands 和 `aigate push`。

## 分支策略和发布

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
aigate release-check --project-type app
aigate release-check --project-type package --npm
```

`branch-strategy` 会推荐 branch rules，并可生成 policy packs。
`release-check --npm` 会检查 package metadata、release tag、workflow
provenance 和 npm 发布状态是否就绪。

AIGate 会自动检测仓库配置: app/package、private/public、GitHub/GitLab、
npm/pnpm/yarn/bun，以及 workspace test 信号。对于 private GitLab pnpm app，
GitHub 专用项、public OSS governance 和 npm 公开发布项会显示为 `不适用`，
package version release gate 也会显示为 `不适用`，不会算作 `待办`。因此内部
app 即使没有 package release version，`release-check --npm` 也不会阻塞。只有
需要把仓库强制视为可发布 npm 包时，才使用 `--project-type package`。

`aigate doctor` 也会在生成的 AIGate 文件来自旧 CLI 时发出警告。例如当前 CLI 是
`0.1.6`，但仍有 `generatedBy: aigate 0.1.1`，请用 `aigate init --force` 和
`aigate integrate all --force` 重新生成，以获得最新 profile 行为。

当自动检测不够时，可以固定配置:

```sh
aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm
aigate start --route oss --hosting gitlab --ci-provider gitlab --project-type app
```

团队统一规则可以提交到 `.aigate.yml`:

```yaml
project:
  type: app
  hosting: gitlab
  ciProvider: gitlab
  packageManager: pnpm
```

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
| `aigate reset` | 重置 AIGate 配置和 settings。 |
| `aigate clean` | 预览生成报告和本地状态删除目标；添加 `--force` 后执行。 |
| `aigate uninstall` | 预览本地 AIGate 配置、状态和自有 hook 的移除目标；添加 `--force` 后执行。 |
| `aigate start` | 选择并运行引导式设置路由。 |
| `aigate start --route default --ask-steps` | 逐个确认推荐的默认设置步骤后运行。 |
| `aigate start --route default --steps init,repo-files` | 只运行选中的默认设置步骤。 |
| `aigate start --route oss` | 创建公开仓库 README、issue 模板、PR 模板、CODEOWNERS 和贡献文档。 |
| `aigate check` | 检查 local Git changes、实际 secret findings 和敏感文件移除状态。 |
| `aigate test` | 运行 Git 就绪检查和检测到的项目测试命令。 |
| `aigate ai report` | 汇总当前问题、做得好的部分、方向和 AI 交接指引。 |
| `aigate aitest` | 写入 AI 修复提示，并可选择运行 Codex、Claude、Gemini。 |
| `aigate git-ready` | 运行 commit 或 push 前的 readiness gate。 |
| `aigate push` | 检查通过后调用 `git push`。 |
| `aigate pr` | 创建带有有效正文的 pull request。 |
| `aigate pr-check` | 生成 PR readiness 和 risk 信息。 |
| `aigate github <comment\|check\|setup>` | 处理 PR comment、check summary 和 GitHub 辅助文件。 |
| `aigate doctor` | 诊断 local setup 和 repository foundation。 |
| `aigate demo` | 不改文件展示 workflow。 |
| `aigate install-hook` | 安装 Git hooks。 |
| `aigate setup` | 保存语言、托管、CI 服务、项目类型和包管理器等本地设置。 |
| `aigate settings` | 查看 AIGate 设置。 |
| `aigate integrate <provider>` | 生成 Codex/Gemini/Claude integration files。 |
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

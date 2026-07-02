# AI 集成

[English](ai-integrations.md) | [한국어](ai-integrations.ko.md) | [日本語](ai-integrations.ja.md) | [中文](ai-integrations.zh.md)

AIGate 可以为 Codex、Gemini、Claude Code 等 AI assistant 生成仓库本地指令文件，让它们
遵循相同的仓库规则。

## 生成集成文件

```sh
aigate integrate all
```

按 provider 生成:

```sh
aigate integrate codex
aigate integrate gemini
aigate integrate claude
```

输出到其他目录预览:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

重新生成已有文件:

```sh
aigate integrate all --force
```

## AI 项目报告

```sh
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate ai report --apply --provider claude
```

`aigate ai report` 会汇总当前问题、做得好的部分、方向、建议命令、发布准备状态和
分支策略，并生成 AI 交接提示。默认不会修改文件。只有传入 `--apply` 时才会运行
已安装的本地 AI CLI。

运行 `--apply` 时，AIGate 会先显示提示文件路径、provider 和 agent 命令，并在
终端实时显示 agent stdout/stderr。最终报告也会保留命令、耗时、退出码、stdout 和
stderr，方便之后复查。

## AI 测试修复流程

```sh
aigate test
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate aitest` 会把失败命令、捕获输出、Git readiness 摘要和修复指令写入
`.aigate/reports/ai-test.md`。默认不会修改文件。只有传入 `--apply` 时，
AIGate 才会调用可用的本地 CLI: Codex 使用 `codex exec`，Claude 使用
`claude --print`，Gemini 使用 `gemini -p`。

这不是模型隐藏的思考过程，而是 AIGate 的执行追踪: 生成了什么提示、运行了什么
命令，以及 agent 输出了什么。

## 生成的文件

| 文件 | 用途 |
| --- | --- |
| `AGENTS.md` | 面向 Codex 的仓库指令 |
| `GEMINI.md` | 面向 Gemini 的仓库指令 |
| `CLAUDE.md` | 面向 Claude Code 的仓库指令 |
| `.aigate/integrations.json` | machine-readable integration manifest |
| `.aigate/integrations/README.md` | 共享集成概览 |
| `.aigate/integrations/codex.md` | Codex 专用说明 |
| `.aigate/integrations/gemini.md` | Gemini 专用说明 |
| `.aigate/integrations/claude.md` | Claude Code 专用说明 |

## Assistant 规则

生成的指令会要求 assistant:

- 先阅读 `README.md`、`.aigate.yml`、`docs/branch-strategy.md` 和
  `docs/git-upload-workflow.md`
- 不直接 push 到 `main`
- 使用聚焦的 branch 和 Conventional Commits
- 运行按项目配置检测出的验证命令，例如 pnpm app 使用 `pnpm run ci`，
  npm package 使用 `npm run ci`
- push 或 merge 前运行 `aigate git-ready`
- 使用 `aigate push -u origin <branch>`
- 向 `main` 打开 pull request 或 GitLab merge request
- merge 前等待配置的必需检查，例如 `GitHub CI workflow` 或 `GitLab CI pipeline`

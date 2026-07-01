# AI 集成

[English](ai-integrations.md) | [한국어](ai-integrations.ko.md) | [日本語](ai-integrations.ja.md) | [中文](ai-integrations.zh.md)

AIGate 可以为 Codex、Gemini 等 AI assistant 生成仓库本地指令文件，让它们
遵循相同的仓库规则。

## 生成集成文件

```sh
aigate integrate all
```

按 provider 生成:

```sh
aigate integrate codex
aigate integrate gemini
```

输出到其他目录预览:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

重新生成已有文件:

```sh
aigate integrate all --force
```

## 生成的文件

| 文件 | 用途 |
| --- | --- |
| `AGENTS.md` | 面向 Codex 的仓库指令 |
| `GEMINI.md` | 面向 Gemini 的仓库指令 |
| `.aigate/integrations.json` | machine-readable integration manifest |
| `.aigate/integrations/README.md` | 共享集成概览 |
| `.aigate/integrations/codex.md` | Codex 专用说明 |
| `.aigate/integrations/gemini.md` | Gemini 专用说明 |

## Assistant 规则

生成的指令会要求 assistant:

- 先阅读 `README.md`、`.aigate.yml`、`docs/branch-strategy.md` 和
  `docs/git-upload-workflow.md`
- 不直接 push 到 `main`
- 使用聚焦的 branch 和 Conventional Commits
- 运行 `npm run ci` 和 `aigate git-ready`
- 使用 `aigate push -u origin <branch>`
- 向 `main` 打开 pull request
- merge 前等待 `test (20)` 和 `test (22)` 通过

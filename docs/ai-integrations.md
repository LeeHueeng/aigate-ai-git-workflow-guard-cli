# AI Integrations

AIGate can generate repository-local instructions for AI assistants such as
Codex, Gemini, and Claude Code.

## Generate Integrations

```sh
aigate integrate all
```

Provider-specific generation:

```sh
aigate integrate codex
aigate integrate gemini
aigate integrate claude
```

Preview output in another directory:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

Regenerate existing files:

```sh
aigate integrate all --force
```

## AI Project Report

```sh
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate ai report --apply --provider claude
```

`aigate ai report` summarizes current problems, what is working, direction,
recommended commands, release readiness, and branch strategy. It also renders an
AI handoff prompt. It does not modify files unless `--apply` is passed. With
`--apply`, AIGate invokes the selected local CLI when available.

During `--apply`, AIGate prints the prompt path, provider, and agent command,
then streams the agent stdout/stderr in the terminal. The final report captures
the command, duration, exit code, stdout, and stderr for later review.

## AI Test Remediation

```sh
aigate test
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate aitest` writes `.aigate/reports/ai-test.md` with the failing command,
captured output, Git readiness summary, and repair instructions. It does not
modify files unless `--apply` is passed. With `--apply`, AIGate invokes the
selected local CLI when available: Codex through `codex exec`, Claude through
`claude --print`, or Gemini through `gemini -p`.

This is not the model's hidden reasoning. It is the visible execution trace:
what AIGate generated, what command it ran, and what the agent printed.

## Generated Files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Codex-facing repository instructions. |
| `GEMINI.md` | Gemini-facing repository instructions. |
| `CLAUDE.md` | Claude Code-facing repository instructions. |
| `.aigate/integrations.json` | Machine-readable integration manifest. |
| `.aigate/integrations/README.md` | Shared integration overview. |
| `.aigate/integrations/codex.md` | Codex-specific integration notes. |
| `.aigate/integrations/gemini.md` | Gemini-specific integration notes. |
| `.aigate/integrations/claude.md` | Claude Code-specific integration notes. |

## Assistant Rules

Generated instructions tell assistants to:

- read `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, and
  `docs/git-upload-workflow.md`
- avoid direct pushes to `main`
- use focused branches and Conventional Commits
- run the validation commands detected for the project profile, such as
  `pnpm run ci` for a pnpm app or `npm run ci` for an npm package
- run `aigate git-ready` before push or merge
- use `aigate push -u origin <branch>`
- open pull requests or GitLab merge requests into `main`
- wait for the configured required checks, such as `GitHub CI workflow` or
  `GitLab CI pipeline`, before merge

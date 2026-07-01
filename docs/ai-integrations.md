# AI Integrations

AIGate can generate repository-local instructions for AI assistants such as
Codex and Gemini.

## Generate Integrations

```sh
aigate integrate all
```

Provider-specific generation:

```sh
aigate integrate codex
aigate integrate gemini
```

Preview output in another directory:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

Regenerate existing files:

```sh
aigate integrate all --force
```

## Generated Files

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Codex-facing repository instructions. |
| `GEMINI.md` | Gemini-facing repository instructions. |
| `.aigate/integrations.json` | Machine-readable integration manifest. |
| `.aigate/integrations/README.md` | Shared integration overview. |
| `.aigate/integrations/codex.md` | Codex-specific integration notes. |
| `.aigate/integrations/gemini.md` | Gemini-specific integration notes. |

## Assistant Rules

Generated instructions tell assistants to:

- read `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, and
  `docs/git-upload-workflow.md`
- avoid direct pushes to `main`
- use focused branches and Conventional Commits
- run `npm run ci` and `aigate git-ready`
- use `aigate push -u origin <branch>`
- open pull requests into `main`
- wait for `test (20)` and `test (22)` before merge

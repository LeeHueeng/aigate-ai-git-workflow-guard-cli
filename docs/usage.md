# AIGate Usage Guide

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

This guide follows the current `aigate-cli` structure. Use it when you want to
run AIGate in an existing repository, wire it into GitHub, or hand the same
workflow to Codex, Gemini, and Claude Code.

## Install Or Run Directly

Run without installing:

```sh
npx -y aigate-cli check
```

Install globally:

```sh
npm install -g aigate-cli
aigate --help
```

Set the CLI language once per repository:

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

Prefer a browser-based setup instead of CLI flags:

```sh
aigate web --open
```

The web UI starts on localhost, edits the same `.aigate/settings.json` used by
`aigate setup`, runs safe allowlisted AIGate actions, shows `.aigate/reports`
newest first, and suggests next actions from current repository signals. It
does not run arbitrary shell commands from the browser. It tries port `4317` by
default and automatically switches to a free port when that port is already in
use. The browser UI follows the saved language setting for English, Korean,
Japanese, and Chinese.

Pin team workflow settings when the repository is a private GitLab pnpm app or
uses a develop-target merge flow:

```sh
aigate setup \
  --hosting gitlab \
  --ci-provider gitlab \
  --project-type app \
  --package-manager pnpm \
  --distribution none \
  --target-branch develop \
  --protected-branches main,develop \
  --work-branches "codex/*,feature/*,feat/*,fix/*,docs/*,chore/*" \
  --required-checks "build,deploy,aigate git-ready" \
  --quality-command "pnpm lint && pnpm build" \
  --providers claude \
  --branch-strategy git-flow
aigate init --force
aigate integrate --force
```

Those settings remove npm publication assumptions, use the configured GitLab
check names, accept both `feature/*` and `feat/*` work branches, keep AI
instructions pointed at `develop`, and make `aigate test` use the configured
quality command when no explicit `--command` is passed.

## First Run In A Repository

Use these commands after moving into a Git repository.

```sh
aigate start
aigate web --open
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

What they do:

| Command | Purpose |
| --- | --- |
| `aigate start` | Opens a guided route selector in a TTY, or runs the quickstart route in non-interactive shells. The first route is the default setup flow. |
| `aigate web --open` | Starts a local browser console for settings, allowlisted AIGate command execution, newest-first reports, and AI-suggested next actions. |
| `aigate start --route default --ask-steps` | Runs the default setup flow and asks yes/no before each recommended step. |
| `aigate start --route default --steps init,repo-files` | Runs only the selected setup step IDs and marks the rest as skipped. |
| `aigate start --route oss --owner @your-org/team` | Creates README, contribution docs, issue templates, PR template, CODEOWNERS, and starter operations docs without overwriting existing files unless `--force` is used. |
| `aigate start --route ai --provider codex` | Creates AIGate config and Codex instruction files. |
| `aigate start --route full --provider all` | Creates config, AI files, the pre-push hook, and release checks in one flow. |
| `aigate setup --language en` | Saves the CLI output language. |
| `aigate init` | Creates `.aigate.yml` and the report directory. |
| `aigate reset` | Rewrites AIGate config, settings, and report placeholders. Use `--dry-run` to preview. |
| `aigate clean --force` | Deletes generated AIGate reports and local generated state. Without `--force`, it previews targets. |
| `aigate uninstall --force` | Removes `.aigate.yml`, `.aigate/`, and an AIGate-owned pre-push hook. |
| `aigate doctor` | Checks Node, Git, detected test command, CI profile, stale generated files, and AIGate configuration. |
| `aigate demo` | Shows the main workflow without changing project files. |
| `aigate install-hook --pre-push` | Installs a pre-push hook that runs AIGate before pushing. |

## Situational Usage Examples

Use these short routines when you want a concrete answer to "what should I run
right now?"

| Situation | Process | Example commands |
| --- | --- | --- |
| First-time adoption in a repository | Choose the default setup, create only the files you want, then confirm diagnostics. | `aigate start --route default --ask-steps` -> `aigate doctor` -> `aigate install-hook --pre-push` |
| You want a visual control surface | Open the local web console, save repository settings, run a check or report, then open the latest report. | `aigate web --open` -> run `git-ready` or `ai report` -> open latest report |
| After an AI agent changed many files | Inspect changed files and secret risk first, then turn failing tests into an AI repair prompt. | `aigate check` -> `aigate test` -> `aigate aitest` |
| Right before opening a PR | Pass the local gate, push through the guarded wrapper, and generate a reviewer-ready summary. | `aigate git-ready` -> `aigate push -u origin feature/my-work` -> `aigate pr-check` |
| Private GitLab monorepo | Pin the profile, create GitLab MR/CODEOWNERS workflow files, and avoid GitHub-only score noise. | `aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm` -> `aigate start --route default --steps repo-files --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm --owner @team` -> `aigate evaluate-project` |
| Preparing an open source launch | Generate public contribution files and measure the repository foundation score. | `aigate start --route oss --owner @team` -> `aigate evaluate-project --deep --report` -> `aigate github setup --dry-run` |
| Before or after a release | Check tag and npm readiness, run CI, then record the project trend. | `aigate release-check --npm` -> `npm run ci` -> `aigate trends record` |
| Clearing or removing local AIGate state | Preview the deletion target first, then apply only when the list looks right. | `aigate clean` -> `aigate clean --force` -> `aigate uninstall --force` |

## Daily Git Workflow

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

Use `aigate push --dry-run origin <branch>` before a real push when you want to
preview the command. `aigate push` is a guarded wrapper around `git push`; it is
not a replacement for Git, but it adds AIGate checks before the remote is
updated.

## Make The Gate Enforced

Running `aigate git-ready` manually is useful, but it is still advisory if a
developer can ignore it and run plain `git push`. AIGate reports three levels:

- advisory: no hook or required CI gate is proven.
- partial: a hook is active in this clone, but it can be bypassed with `--no-verify` and may not be active in a fresh clone.
- server enforced: CI runs `aigate git-ready` and verified branch protection or merge request rules require the CI result.

Use these commands as the usual path:

```sh
aigate install-hook --pre-push
aigate setup --gitlab-pipeline-must-succeed true
aigate setup --gitlab-pipeline-must-succeed verified
aigate setup --github-required-checks-enforced true
aigate setup --github-required-checks-enforced verified
```

`aigate doctor` reports the combined enforcement state as `AIGate enforcement`.
`aigate evaluate-project` checks `AIGate CI gate exists` separately from
`AIGate server enforcement exists`. GitLab jobs with `allow_failure: true` or
`when: manual` are not treated as server enforcement, and local GitLab
`include:` files are inspected when they point at repository YAML files.
Values such as `--gitlab-pipeline-must-succeed true` are declared evidence, not
live verification; use `verified` only after branch protection or merge rules
have been checked through the hosting provider. If a CI gate exists but server
enforcement is not verified, `evaluate-project` reports the raw score and caps
the final score below A-grade.

## Test And AI Remediation Flow

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

`aigate test` runs `aigate git-ready` plus the detected package-manager command.
Detection checks root scripts, `turbo.json` tasks, `pnpm-workspace.yaml`,
`package.json` workspaces, and common `apps/*` or `packages/*` workspace
packages. It uses the detected package manager (`npm`, `pnpm`, `yarn`, or
`bun`) and can run commands such as `pnpm turbo run test` or
`pnpm -r run test`. Turbo tasks are selected only when `turbo` is declared in
package metadata or available in `node_modules/.bin`; otherwise AIGate falls
back to workspace scripts such as `pnpm -r run test`. Use `--script` or
`--command` when a project has a custom check command.

`aigate aitest` writes `.aigate/reports/ai-test.md` with the failure summary,
test output, and a focused repair prompt for Codex, Claude, or Gemini. It does
not edit code by default. Add `--apply` only when you want AIGate to invoke the
selected AI CLI or a custom `--agent-command`.

`aigate ai report` is a broader project brief. It summarizes current problems,
what is working, direction, suggested commands, release state, branch strategy,
and an AI handoff prompt. It also does not edit code by default; add
`--apply --provider codex|claude|gemini` only when you want AIGate to run the
selected AI CLI with that brief. Default AI reports keep unreleased tag checks
advisory so normal PR work is not marked as release-blocked; add `--npm` when
you want strict release and npm publication readiness.

When `--apply` runs in text mode, AIGate shows the prompt path, provider, agent
command, and live agent output in the terminal. The final report also includes
the agent command, duration, exit code, stdout, and stderr. JSON output keeps
stdout machine-readable and sends progress logs to stderr.

## Reports And Output Formats

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

Use Markdown for pull requests, HTML for local review, JSON for automation, and
SARIF for GitHub code scanning.

## GitHub Setup And Actions

Generate local GitHub helper files:

```sh
aigate github setup --owner @your-org/team --dry-run
aigate github setup --owner @your-org/team
```

Post PR feedback or create a check summary:

```sh
aigate github comment --pr 123
aigate github check --format markdown
```

Reusable GitHub Action example:

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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.7
        with:
          command: git-ready
          language: en
```

## AI Agent Integration

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate claude
aigate integrate all --output-dir . --force
```

The command always writes `.aigate/integrations/*`. It creates root
`AGENTS.md`, `GEMINI.md`, or `CLAUDE.md` only when they do not already exist, or
when the existing file is AIGate-owned. Existing project-owned AI files are
protected even with `--force`; use `--overwrite-ai-files` only when you really
want to replace them.

Project evaluation accepts any root `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, or
generated `.aigate/integrations/*` instruction file, so Claude-only teams do
not need to add `AGENTS.md` just for scoring.

Persist the policy with settings:

```sh
aigate setup --ai-root-files protect
aigate setup --ai-root-files sidecar
aigate setup --ai-root-files overwrite
```

`protect` is the default, `sidecar` writes only `.aigate/integrations/*`, and
`overwrite` allows root AI files to be replaced when `--force` is used.

For GitLab repositories that previously generated GitHub helper templates, clean
them explicitly:

```sh
aigate clean --github-files --force
```

## Branch Strategy And Releases

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
aigate release-check --project-type app
aigate release-check --project-type package --npm
```

`branch-strategy` recommends branch rules and can generate policy packs.
`release-check --npm` checks whether package metadata, release tags, workflow
provenance, and npm publication state are ready.

AIGate auto-detects repository profile signals: app vs package, private vs
public, GitHub vs GitLab, npm/pnpm/yarn/bun, and workspace test signals. For a
private GitLab pnpm app, GitHub-only, public OSS governance, and npm-publication
checks, including package-version release gates, are marked `N/A` instead of
`TODO`. Internal apps without a package release version are therefore not
blocked by `release-check --npm`. Use `--project-type package` only when a
repository should be treated as a publishable npm package.

`aigate doctor` also warns when generated AIGate files were created by an older
CLI version, for example `generatedBy: aigate 0.1.1` while the current CLI is
`0.1.7`. Regenerate those files with `aigate init --force` and
`aigate integrate all --force` when you want the latest generated templates.
Until you regenerate them, stale generated `.aigate.yml` profile values are
ignored during scoring and gates so an old GitHub/npm package template does not
override the current repository signals.

Pin the profile when auto-detection is not enough:

```sh
aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm
aigate start --route oss --hosting gitlab --ci-provider gitlab --project-type app
```

For team-wide behavior, commit this in `.aigate.yml`:

```yaml
project:
  type: app
  hosting: gitlab
  ciProvider: gitlab
  packageManager: pnpm
```

## Notifications

```sh
aigate notify setup --channel terminal
aigate notify test --channel terminal
aigate notify send --event BLOCK --channel terminal
aigate git-ready --notify-channel terminal
```

For external systems, set the required environment variable and use the matching
channel:

| Channel | Environment variable |
| --- | --- |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` |
| `linear` | `AIGATE_LINEAR_WEBHOOK_URL` |
| `jira` | `AIGATE_JIRA_WEBHOOK_URL` |
| `webhook` | `AIGATE_WEBHOOK_URL` |

## Command Map

| Command | Use it for |
| --- | --- |
| `aigate init` | Create the initial AIGate config. |
| `aigate reset` | Reset AIGate config and settings. |
| `aigate clean` | Preview deletion of generated reports and local state; add `--force` to apply. |
| `aigate uninstall` | Preview removal of local AIGate config, state, and owned hook; add `--force` to apply. |
| `aigate start` | Choose and run a guided setup route. |
| `aigate web` | Start a localhost browser console for editing settings, running allowlisted AIGate actions, viewing newest reports first, and following AI suggestions. |
| `aigate start --route default --ask-steps` | Confirm each recommended default setup step before running it. |
| `aigate start --route default --steps init,repo-files` | Run only selected default setup steps. |
| `aigate start --route oss` | Create open-source starter README, issue templates, PR template, CODEOWNERS, and contribution docs. |
| `aigate check` | Inspect local Git changes, active secret findings, and sensitive file removals. |
| `aigate test` | Run Git readiness plus the detected project test command. |
| `aigate ai report` | Summarize current problems, strengths, direction, and AI handoff guidance. |
| `aigate aitest` | Write an AI remediation prompt, optionally invoking Codex, Claude, or Gemini. |
| `aigate git-ready` | Run the pre-commit or pre-push readiness gate. |
| `aigate push` | Run checks, then call `git push`. |
| `aigate pr` | Create a guarded pull request with useful body content. |
| `aigate pr-check` | Generate PR readiness and risk information. |
| `aigate github <comment\|check\|setup>` | Work with PR comments, check summaries, and GitHub helper files. |
| `aigate doctor` | Diagnose local setup and repository foundations. |
| `aigate demo` | Show the workflow without changing files. |
| `aigate install-hook` | Install Git hooks. |
| `aigate setup` | Save local settings such as language, hosting, CI provider, project type, and package manager. |
| `aigate settings` | Read AIGate settings. |
| `aigate integrate <provider>` | Generate Codex, Gemini, and Claude Code integration files. |
| `aigate report` | Write Markdown, HTML, JSON, or SARIF reports. |
| `aigate evaluate-project` | Score repository foundations and Git signals. |
| `aigate verify-enforcement` | Verify GitHub/GitLab required server-side AIGate checks and optionally write verified evidence. |
| `aigate score` | Print the current project score. |
| `aigate trends <record\|show>` | Record or display score history. |
| `aigate branch-strategy` | Recommend or generate branch policy docs. |
| `aigate release-check` | Check release and npm readiness. |
| `aigate audit-report` | Produce an audit-focused report. |
| `aigate compliance-report` | Produce a compliance-focused report. |
| `aigate dashboard` | Write a local HTML status dashboard. |
| `aigate notify <setup\|test\|send>` | Configure and send notifications. |
| `aigate help` | Print command help. |

## Public Install Paths

AIGate can be installed through npm or Homebrew, and can run from the public
GHCR image:

```sh
npm install -g aigate-cli
brew install LeeHueeng/tap/aigate-cli
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:0.1.7 check
```

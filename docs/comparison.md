# AIGate Compared With Husky, Lefthook, pre-commit, And Gitleaks

[English](comparison.md) | [한국어](comparison.ko.md) | [日本語](comparison.ja.md) | [中文](comparison.zh.md)

AIGate does not try to replace every Git hook runner or secret scanner. It sits
one layer higher: a workflow guard for AI-assisted changes, pull request
readiness, repository health, branch strategy, and release confidence.

## Quick Comparison

| Tool | Best for | Keep using it when | Where AIGate fits |
| --- | --- | --- | --- |
| Husky | JavaScript Git hook wiring | You need simple npm-script hooks | AIGate can be the command that a hook runs before push. |
| Lefthook | Fast multi-language hook orchestration | You need many fast hooks across languages | AIGate adds PR readiness, repository scoring, branch strategy, and reports. |
| pre-commit | Hook ecosystem and repeatable local checks | Your team already depends on pre-commit hooks | AIGate complements it with AI workflow, GitHub, and release checks. |
| Gitleaks | Deep secret scanning | You need a dedicated high-coverage secret scanner | AIGate provides lightweight changed-file secret checks and SARIF output. |
| AIGate | AI-assisted Git workflow guard | You want one zero-config gate before push or PR | Use it for readiness, risk, reports, notifications, branch policy, and AI agent instructions. |

## Recommended Combinations

| Setup | Command path |
| --- | --- |
| Small AI-assisted project | `aigate doctor` -> `aigate install-hook --pre-push` -> `aigate git-ready` |
| JavaScript project already using Husky | Run `aigate git-ready` from the existing Husky pre-push hook. |
| Team using Lefthook or pre-commit | Keep existing test/lint hooks and add `aigate pr-check` before PR creation. |
| Security-sensitive repository | Run Gitleaks in CI and keep `aigate report --format sarif` for changed-file context. |
| Public open source package | Use `aigate release-check --npm`, GitHub Action checks, and `aigate branch-strategy --compare`. |

## When AIGate Is A Good Fit

- You use Codex, Gemini, Claude Code, Cursor, or another AI coding assistant.
- You want a local gate that explains what changed before `git push`.
- You need PR readiness, project score, release readiness, and branch strategy in one CLI.
- You want outputs that work locally and in CI: Markdown, HTML, JSON, and SARIF.
- You want AI agents to follow the same repository workflow as humans.

## When Another Tool Should Lead

- Use Husky or Lefthook first if your main need is hook orchestration.
- Use pre-commit first if your team already standardizes checks through that ecosystem.
- Use Gitleaks first if deep secret scanning coverage is the primary requirement.

AIGate is strongest as the human-readable workflow layer that ties those checks
to push safety, PR quality, and repository governance.

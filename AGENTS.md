# AIGate Codex Instructions

Use these instructions when working on this repository with Codex.

## Repository Context

- Product: AIGate AI Git Workflow Guard CLI.
- Default branch: `main`.
- Use feature branches for changes; do not push directly to `main`.
- Prefer focused commits with Conventional Commit messages.

## Before Editing

- Read `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, and `docs/git-upload-workflow.md`.
- Inspect the current branch with `git status --short --branch`.
- Keep generated reports and local settings out of commits unless explicitly requested.

## Validation

Run these commands before proposing, pushing, or merging changes:

```sh
npm run ci
aigate git-ready
```

## Push Workflow

Use AIGate's guarded push wrapper:

```sh
aigate push -u origin <branch>
```

Preview without changing the remote:

```sh
aigate push --dry-run origin <branch>
```

## Pull Request Rules

- Target `main`.
- Include summary, why, validation, and release impact.
- Required checks: `test (20)` and `test (22)`.
- Wait for review approval and resolved conversations before merge.

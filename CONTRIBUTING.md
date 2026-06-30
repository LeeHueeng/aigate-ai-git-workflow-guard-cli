# Contributing

Thanks for helping shape AIGate.

## Development Setup

```sh
npm install
npm test
node src/cli.mjs --help
```

## Branches

Create branches from `main`:

- `feature/<short-name>` for new behavior.
- `fix/<short-name>` for defects.
- `docs/<short-name>` for documentation.
- `chore/<short-name>` for maintenance.
- `codex/<short-name>` for AI-assisted work.

See [docs/branch-strategy.md](docs/branch-strategy.md) for full rules.

## Commits

Use Conventional Commits:

```text
feat: add report command
fix: handle empty repositories
docs: document branch protection
chore: update repository metadata
test: cover score output
```

## Pull Requests

- Keep each pull request focused.
- Explain what changed and why.
- Include validation commands.
- Update docs when command behavior changes.
- Keep generated reports out of commits unless they are intentional fixtures.

## Review Checklist

- The branch name matches the change type.
- The pull request has a focused scope.
- `npm test` passes.
- User-facing command changes are documented.
- Public repository metadata remains accurate.

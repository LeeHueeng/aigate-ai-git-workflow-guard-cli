# Contributing

Thanks for helping shape AIGate.

## Development Setup

```sh
npm install
npm test
node src/cli.mjs --help
```

## First Contribution

1. Pick a `good first issue` or a small documentation improvement.
2. Comment on the issue so maintainers know you are working on it.
3. Fork the repository or create a branch from `main`.
4. Run the first-run checks:

```sh
npm install
node src/cli.mjs doctor
node src/cli.mjs demo
node src/cli.mjs install-hook --pre-push
```

5. Make a focused change and run validation:

```sh
npm test
npm run ci
```

6. Open a pull request with a short summary and the validation commands you ran.

Good first contribution ideas:

- Add a real-world AIGate usage example.
- Improve one translated document.
- Add Windows smoke-test notes.
- Add GitHub Actions examples.
- Improve screenshots or demo assets.

## 15-Minute Contribution Paths

- Run `npx -y aigate-cli doctor` in one of your repositories and share a
  sanitized real-world example issue.
- Add one command output example to `docs/examples/`.
- Improve one paragraph in a translated README.
- Try the GitHub Action snippet in a small repository and report what was clear
  or confusing.
- Suggest one comparison note for Husky, Lefthook, pre-commit, or Gitleaks.

## Sharing AIGate

If AIGate helps you, the most useful signals are:

- star or watch the repository,
- share a short sanitized output screenshot,
- open a real-world example issue,
- mention which AI assistant and repository type you used.

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

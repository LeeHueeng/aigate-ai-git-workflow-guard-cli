# Distribution

AIGate starts with npm as the primary package channel and keeps Docker,
GitHub Actions, Homebrew, and standalone binaries as staged distribution paths.

## npm

The target package is `@aigate/cli`.

```sh
npm install -g @aigate/cli
npx @aigate/cli check
```

Before the first npm publish:

1. Confirm npm access for `@aigate/cli`.
2. Configure npm Trusted Publishing for this repository.
3. Run `aigate release-check`.
4. Run the Release workflow with `dry_run=true`.
5. Create and push the release tag, for example `v0.1.0`.

## Docker

Build locally:

```sh
docker build -t aigate/cli .
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli check
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli audit-report
```

## GitHub Actions

This repository includes a local composite action at `.github/actions/aigate`.

```yaml
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/aigate
        with:
          command: git-ready
```

Use `command: audit-report`, `command: pr-check`, or `command: evaluate-project`
to produce richer workflow reports.

## Later Channels

- Homebrew formula after the npm package has real users.
- Published Docker image after container usage is validated.
- Standalone binaries for environments without Node.js.

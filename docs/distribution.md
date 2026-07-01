# Distribution

AIGate starts with npm as the primary package channel and keeps Docker,
GitHub Actions, Homebrew, and standalone binaries as staged distribution paths.

## npm

The target package is `aigate-cli`.

```sh
npm install -g aigate-cli
npx aigate-cli check
```

The first public release is live on npm:

- Package: <https://www.npmjs.com/package/aigate-cli>
- Current release tag: `v0.1.0`
- Trusted Publishing: GitHub Actions `release.yml`

Routine release flow:

1. Update the package version.
2. Run `npm run ci`.
3. Run `aigate release-check --npm`.
4. Run the Release workflow with `dry_run=true`.
5. Create and push the matching release tag, for example `v0.1.1`.
6. Confirm `npm view aigate-cli version`.

First publish record:

1. Enable 2FA on the npm account that will own `aigate-cli`.
2. Confirm the package name is still available with `npm view aigate-cli`.
3. Run `npm run ci`.
4. Create the package with `npm publish --access public`.
5. Configure npm Trusted Publishing for this repository.
6. Run `aigate release-check`.
7. Run the Release workflow with `dry_run=true`.
8. Create and push the release tag, for example `v0.1.0`.

The first manual publish created the package on npm so Trusted Publishing could
be attached. If a version was already published manually, the Release workflow
will skip the duplicate publish when the matching tag is pushed.

Use these npm Trusted Publisher settings:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `LeeHueeng` |
| Repository | `aigate-ai-git-workflow-guard-cli` |
| Workflow filename | `release.yml` |
| Allowed actions | `npm publish` |

The release workflow uses GitHub OIDC with `id-token: write`, npm CLI
`11.5.1+`, and Node.js `24`.

You can also configure the same trusted publisher from the npm CLI after
logging in with an npm account that has package write access and account-level
2FA enabled:

```sh
npx npm@latest trust github aigate-cli \
  --file release.yml \
  --repo LeeHueeng/aigate-ai-git-workflow-guard-cli \
  --allow-publish \
  --yes
```

To preview the configuration without writing to npm:

```sh
npx npm@latest trust github aigate-cli \
  --file release.yml \
  --repo LeeHueeng/aigate-ai-git-workflow-guard-cli \
  --allow-publish \
  --dry-run \
  --json
```

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

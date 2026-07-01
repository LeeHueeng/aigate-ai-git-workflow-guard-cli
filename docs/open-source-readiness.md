# Open Source Readiness

This checklist keeps AIGate useful and trustworthy for public contributors.

## Community Health

- [x] README
- [x] LICENSE
- [x] CONTRIBUTING
- [x] SECURITY
- [x] SUPPORT
- [x] CODE_OF_CONDUCT
- [x] CHANGELOG
- [x] issue templates
- [x] pull request template
- [x] CODEOWNERS
- [x] funding metadata

## Security And Supply Chain

- [x] GitHub branch protection
- [x] required CI checks
- [x] Dependabot
- [x] local secret scanning
- [x] SARIF report output
- [x] OpenSSF Scorecard workflow
- [x] npm Trusted Publishing workflow scaffold
- [x] release readiness check
- [x] audit report command
- [x] local Dockerfile
- [x] local GitHub composite action

## Maintainer Workflow

- Use `aigate git-ready` before commits.
- Use `aigate push` instead of raw `git push`.
- Use `aigate pr` to create pull requests.
- Keep `main` releasable.
- Keep roadmap items tied to issues or discussions.

## npm Release

- [x] Claim or confirm npm access for `aigate-cli`.
- [x] Configure npm Trusted Publisher for this GitHub repository.
- [x] Run `aigate release-check`.
- [x] Publish the first version, `0.1.0`.
- [x] Create a GitHub release tag, `v0.1.0`.
- [x] Confirm `npm view aigate-cli` after publish.
- [x] Keep future releases tied to changelog entries and tagged GitHub Releases.

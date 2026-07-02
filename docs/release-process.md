# Release Process

[English](release-process.md) | [한국어](release-process.ko.md) | [日本語](release-process.ja.md) | [中文](release-process.zh.md)

AIGate releases are tag-driven. `main` must be releasable before a version tag
is created.

## Checklist

1. Confirm the change is merged to `main`.
2. Update `package.json`, `package-lock.json`, and `CHANGELOG.md`.
3. Run `npm run ci`.
4. Run `aigate release-check --npm`.
5. Run the Release workflow with `dry_run=true`.
6. Create and push the matching tag, for example `v0.1.3`.
7. Confirm npm publication with `npm view aigate-cli version`.
8. Create or update the GitHub Release notes.
9. If publishing the Action, enable GitHub Marketplace publishing on the
   release screen.

## Channels

- `latest`: stable public releases.
- `next`: release candidates.
- `beta`: beta validation.
- `canary`: experimental builds.

## Rollback

If a bad release is published, ship a patch release. Do not delete npm versions
or Git tags unless maintainers agree that the artifact exposes sensitive data.

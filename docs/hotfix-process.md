# Hotfix Process

[English](hotfix-process.md) | [한국어](hotfix-process.ko.md) | [日本語](hotfix-process.ja.md) | [中文](hotfix-process.zh.md)

Use hotfixes only for urgent production or published-package defects.

## Flow

1. Create `hotfix/<short-description>` from `main` or the latest stable tag.
2. Keep the patch minimal and avoid unrelated cleanup.
3. Run `npm run ci` and `aigate git-ready`.
4. Open a pull request into `main`.
5. State user impact, validation, and whether a patch release is required.
6. After merge, bump the patch version and follow the release process.

## Communication

- Add a GitHub issue or release note entry when users are affected.
- Use `aigate notify send --channel slack` or `--channel linear` when teams
  need an operational signal.
- Backport only when an active release branch needs the same fix.

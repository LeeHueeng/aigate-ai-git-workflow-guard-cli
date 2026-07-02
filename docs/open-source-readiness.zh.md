# 开源准备度

[English](open-source-readiness.md) | [한국어](open-source-readiness.ko.md) | [日本語](open-source-readiness.ja.md) | [中文](open-source-readiness.zh.md)

这份 checklist 用来让 AIGate 对 public contributors 保持有用且可信。

## Community health

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
- [x] social preview asset: `assets/social-preview.png`
- [x] real-world example issue template

## Security and supply chain

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
- [x] 可复用的公开 GitHub Action

## Maintainer workflow

- commit 前使用 `aigate git-ready`
- 使用 `aigate push`，而不是直接 `git push`
- 使用 `aigate pr` 创建 pull request
- 保持 `main` 始终可发布
- 将 roadmap item 关联到 issue 或 discussion
- 在 GitHub repository settings 中上传 `assets/social-preview.png`
- 将有用的 support question 转成 documentation 或 good first issue

## npm release

- [x] 确认 `aigate-cli` 的 npm access
- [x] 为此 GitHub repository 配置 npm Trusted Publisher
- [x] 运行 `aigate release-check`
- [x] 发布 npm package，当前公开版本是 `0.1.5`
- [x] 创建 GitHub release tag 至 `v0.1.5`
- [x] publish 后确认 `npm view aigate-cli`
- [x] 后续 release 关联 changelog entry 和 tagged GitHub Release

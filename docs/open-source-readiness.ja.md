# オープンソース準備状況

[English](open-source-readiness.md) | [한국어](open-source-readiness.ko.md) | [日本語](open-source-readiness.ja.md) | [中文](open-source-readiness.zh.md)

この checklist は、AIGate を public contributor にとって有用で信頼できる状態に保つためのものです。

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
- [x] 再利用可能な公開 GitHub Action

## Maintainer workflow

- commit 前に `aigate git-ready` を使う
- raw `git push` の代わりに `aigate push` を使う
- pull request 作成に `aigate pr` を使う
- `main` を常に releasable に保つ
- roadmap item を issue または discussion と結びつける
- GitHub repository settings で `assets/social-preview.png` を upload
- 有用な support question を documentation または good first issue に変換

## npm release

- [x] `aigate-cli` の npm access を確保
- [x] この GitHub repository 用の npm Trusted Publisher を設定
- [x] `aigate release-check` を実行
- [x] npm package を publish、現在の公開 version は `0.1.2`
- [x] GitHub release tag を `v0.1.2` まで作成
- [x] publish 後に `npm view aigate-cli` を確認
- [x] future release を changelog entry と tagged GitHub Release に結びつける

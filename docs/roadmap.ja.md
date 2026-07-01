# ロードマップ

[English](roadmap.md) | [한국어](roadmap.ko.md) | [日本語](roadmap.ja.md) | [中文](roadmap.zh.md)

## V1: CLI distribution and local reports

- [x] `aigate-cli` を npm に publish
- [x] npm、npx、yarn、pnpm、bun install path をサポート
- [x] `aigate init` で starter project configuration を生成
- [x] Markdown、HTML、JSON、SARIF reports を生成
- [x] `aigate pr-check` で pull request readiness report を生成
- [x] `aigate doctor` で first-run setup を診断
- [x] `aigate demo` で guided CLI demo を表示
- [x] `aigate install-hook --pre-push` で guarded pre-push hook をインストール
- [x] blocking event に Slack webhook notification を送信
- [x] optional deep Git signals 付き weighted project evaluation
- [x] repository と team signal から branch strategy を推薦
- [x] `aigate release-check` で first package release readiness を検証
- [x] `aigate audit-report` で governance snapshot を生成

## V1.5: Workflow intelligence

- [ ] Homebrew formula を publish
- [ ] local Docker usage 検証後に Docker image を publish
- [x] bundled GitHub composite action を reusable public action に昇格
- [x] Discord と Teams webhook notification payload を追加
- [x] generated branch strategy docs を richer policy pack に拡張
- [x] PR テンプレートと CODEOWNERS 草案をガイド付き設定に昇格

## V2: Team reports and GitHub integration

- [x] GitHub pull request に AIGate summary を comment
- [x] `aigate github check` で GitHub Checks と Actions summary を準備
- [x] weekly team report を生成
- [x] `aigate trends` でプロジェクト状態トレンドを追跡
- [ ] Linear と Jira と連携
- [ ] standalone binary を publish
- [ ] 複数の AI-generated branch strategy proposal を比較

## V3: Enterprise governance

- [ ] organization dashboard
- [x] policy violation audit report を生成
- [ ] compliance report を生成
- [ ] central notification policy を管理
- [ ] self-hosted reporting をサポート
- [ ] enterprise offline installer をサポート
- [ ] organization-standard branch strategy を適用

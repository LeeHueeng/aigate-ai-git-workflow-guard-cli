# AIGate

AI が生成した危険な Git 変更を push 前に止める CLI です。

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

AIGate は、AI コーディング支援を使う開発者向けの zero-config
pre-push safety CLI です。変更ファイル、secret リスク、リポジトリの
準備状況、PR リスク、ブランチ戦略を、remote branch や PR review に
届く前に確認します。

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

## 60 秒クイックスタート

インストールせずに実行できます。

```sh
npx -y aigate-cli check
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

グローバルにインストールする場合:

```sh
npm install -g aigate-cli
aigate check
aigate git-ready
aigate pr-check
```

## 現在使える機能

| 機能 | コマンド |
| --- | --- |
| ローカル Git readiness check | `aigate check` |
| pre-push safety gate | `aigate git-ready` |
| 検証付き push wrapper | `aigate push -u origin <branch>` |
| PR readiness report | `aigate pr-check` |
| Markdown, HTML, JSON, SARIF report | `aigate report --format <format>` |
| repository health score | `aigate evaluate-project` |
| branch strategy recommendation | `aigate branch-strategy` |
| npm release readiness check | `aigate release-check --npm` |
| Codex/Gemini integration files | `aigate integrate all` |

## 代表的な流れ

```sh
git switch -c feature/my-work
aigate git-ready
git add <files>
git commit -m "feat: focused change"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: focused change"
```

## 言語設定

CLI 出力は英語、韓国語、日本語、中国語に対応しています。

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## AI エージェント連携

```sh
aigate integrate all
```

このコマンドは `AGENTS.md`、`GEMINI.md`、`.aigate/integrations/*` を生成し、
Codex と Gemini が同じ branch、validation、guarded push workflow に従うようにします。

## ドキュメント

- [多言語ドキュメント索引](docs/README.ja.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [English operations guide](docs/operations.en.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [中文运维说明](docs/operations.zh.md)
- [Distribution guide](docs/distribution.ja.md)
- [Notifications guide](docs/notifications.ja.md)
- [AI integrations](docs/ai-integrations.ja.md)
- [Roadmap](docs/roadmap.ja.md)

## まだ公開していない計画

- 公開 Docker image
- Homebrew formula
- standalone binary
- GitHub PR comments
- GitHub Checks reporter
- hosted dashboard
- Linear/Jira integrations

## License

MIT

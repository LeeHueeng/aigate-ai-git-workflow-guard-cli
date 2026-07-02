# AIGate

AI が生成した危険な Git 変更を push 前に止める CLI です。

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

AIGate は、AI コーディング支援を使う開発者向けの zero-config
pre-push safety CLI です。変更ファイル、secret リスク、リポジトリの
準備状況、PR リスク、ブランチ戦略を、remote branch や PR review に
届く前に確認します。

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

![AIGate demo](assets/demo.gif)

## AIGate が向いている場面

- AI coding assistant がレビュー速度より速くファイルを変更する。
- `git push` 前に readiness を説明する 1 つの command がほしい。
- 公開 package を運用し、PR、release、repository health signals が必要。
- Markdown、HTML、JSON、SARIF output を local と CI の両方で使いたい。
- Codex と Gemini に人間と同じ branch/validation workflow を守らせたい。

## 60 秒クイックスタート

インストールせずに実行できます。

```sh
npx -y aigate-cli check
npx -y aigate-cli doctor
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

グローバルにインストールする場合:

```sh
npm install -g aigate-cli
aigate check
aigate git-ready
aigate install-hook --pre-push
aigate pr-check
```

## 現在使える機能

| 機能 | コマンド |
| --- | --- |
| ローカル Git readiness check | `aigate check` |
| 初回実行 diagnostics | `aigate doctor` |
| ガイド付き CLI demo | `aigate demo` |
| pre-push safety gate | `aigate git-ready` |
| pre-push hook installer | `aigate install-hook --pre-push` |
| 検証付き push wrapper | `aigate push -u origin <branch>` |
| PR readiness report | `aigate pr-check` |
| GitHub PR 要約コメント | `aigate github comment --pr <number>` |
| GitHub Checks 要約 payload | `aigate github check --format json` |
| GitHub PR テンプレートと CODEOWNERS 設定 | `aigate github setup` |
| Markdown, HTML, JSON, SARIF report | `aigate report --format <format>` |
| repository health score | `aigate evaluate-project` |
| コンプライアンス統制レポート | `aigate compliance-report` |
| ローカル HTML ヘルスダッシュボード | `aigate dashboard` |
| プロジェクト状態トレンド履歴 | `aigate trends record` |
| ブランチ戦略ポリシーパック | `aigate branch-strategy --apply` |
| ブランチ戦略提案の比較 | `aigate branch-strategy --compare` |
| npm release readiness check | `aigate release-check --npm` |
| Codex/Gemini integration files | `aigate integrate all` |

## 他ツールとの違い

AIGate は Husky、Lefthook、pre-commit、Gitleaks を無理に置き換えません。
既存の hook や scanner の上で、AI-assisted changes の push safety、PR quality、
repository governance をまとめる workflow layer です。

詳しくは [tool comparison](docs/comparison.ja.md) を参照してください。

## 代表的な流れ

```sh
git switch -c feature/my-work
aigate doctor
aigate install-hook --pre-push
aigate git-ready
git add <files>
git commit -m "feat: focused change"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: focused change"
aigate github comment --pr <number>
aigate github check --output .aigate/reports/github-check.md
aigate trends record
aigate github setup --owner @your-org/team --dry-run
```

## 言語設定

CLI 出力は英語、韓国語、日本語、中国語に対応しています。

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## GitHub Actions

他のリポジトリでも、AIGate を再利用可能な公開 GitHub Action として実行
できます。

```yaml
name: AIGate
on:
  pull_request:
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.3
        with:
          command: git-ready
          language: ja
```

安定運用では現在のリリースタグを使い、未リリースの最新動作を意図的に確認
したい場合だけ `@main` を使ってください。入力一覧は
[GitHub Action ドキュメント](docs/github-action.ja.md) にまとめています。

Marketplace 登録値:

- Action name: `AIGate AI Git Workflow Guard CLI`
- Primary category: `Code quality`
- Secondary category: `Security`
- Release title: `AIGate AI Git Workflow Guard CLI v0.1.3`

## AI エージェント連携

```sh
aigate integrate all
```

このコマンドは `AGENTS.md`、`GEMINI.md`、`.aigate/integrations/*` を生成し、
Codex と Gemini が同じ branch、validation、guarded push workflow に従うようにします。

## ドキュメント

- [多言語ドキュメント索引](docs/README.ja.md)
- [日本語使い方ガイド](docs/usage.ja.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [Tool comparison](docs/comparison.ja.md)
- [English operations guide](docs/operations.en.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [中文运维说明](docs/operations.zh.md)
- [Distribution guide](docs/distribution.ja.md)
- [Notifications guide](docs/notifications.ja.md)
- [AI integrations](docs/ai-integrations.ja.md)
- [JSON output example](docs/examples/json-output.ja.md)
- [Windows smoke test](docs/examples/windows-smoke-test.ja.md)
- [Release process](docs/release-process.ja.md)
- [Hotfix process](docs/hotfix-process.ja.md)
- [Roadmap](docs/roadmap.ja.md)

## まだ公開していない計画

- 公開 Docker image
- Homebrew formula
- standalone binary
- hosted dashboard
- deeper Linear/Jira integrations

## AIGate の成長に協力する

- AIGate が risky push を防いだら、repository に star または watch をお願いします。
- 実際の repository での利用例を issue として共有してください。
- 紹介するときは demo GIF、terminal screenshot、`assets/social-preview.png` を使えます。
- docs、examples、integrations、packaging の good first issue から始められます。

## License

MIT

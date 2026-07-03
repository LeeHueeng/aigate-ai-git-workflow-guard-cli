# AIGate 使い方ガイド

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

このガイドは現在の `aigate-cli` 構成に合わせています。既存リポジトリで
AIGate を実行する、GitHub と接続する、Codex/Gemini/Claude Code に同じ workflow を
渡すときに使います。

## インストールまたは直接実行

インストールせずに実行:

```sh
npx -y aigate-cli check
```

グローバルインストール:

```sh
npm install -g aigate-cli
aigate --help
```

リポジトリごとの CLI 言語設定:

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

private GitLab pnpm app や `develop` を merge target にするチームでは、workflow
設定を固定します:

```sh
aigate setup \
  --hosting gitlab \
  --ci-provider gitlab \
  --project-type app \
  --package-manager pnpm \
  --distribution none \
  --target-branch develop \
  --protected-branches main,develop \
  --work-branches "codex/*,feature/*,feat/*,fix/*,docs/*,chore/*" \
  --required-checks "build,deploy,aigate git-ready" \
  --quality-command "pnpm lint && pnpm build" \
  --providers claude \
  --branch-strategy git-flow
aigate init --force
aigate integrate --force
```

この設定により npm publish の前提を外し、実際の GitLab check 名を使い、
`feature/*` と `feat/*` の両方を作業ブランチとして許可します。AI 指示の
対象 branch は `develop` に合わせます。明示的な `--command` がない場合、
`aigate test` は設定された quality command を既定で実行します。

## リポジトリでの初回実行

Git リポジトリのルートで実行します。

```sh
aigate start
aigate start --route default --ask-steps
aigate start --route default --steps init,repo-files
aigate start --route oss --dry-run
aigate start --route oss --owner @your-org/team
aigate start --route ai --provider codex
aigate start --route full --provider all
aigate init
aigate reset --dry-run
aigate clean
aigate uninstall
aigate doctor
aigate demo
aigate install-hook --pre-push
```

各コマンドの役割:

| コマンド | 目的 |
| --- | --- |
| `aigate start` | TTY では矢印キーのルート選択を開き、非対話 shell では quickstart ルートを実行します。最初のルートはデフォルト設定フローです。 |
| `aigate start --route default --ask-steps` | デフォルト設定フローで推奨手順ごとに実行するか確認します。 |
| `aigate start --route default --steps init,repo-files` | 選択した設定手順 ID だけを実行し、他はスキップします。 |
| `aigate start --route oss --owner @your-org/team` | README、貢献文書、issue テンプレート、PR テンプレート、CODEOWNERS、運用文書の草案を作成します。既存ファイルは `--force` なしでは上書きしません。 |
| `aigate start --route ai --provider codex` | AIGate 設定と Codex 指示ファイルを作成します。 |
| `aigate start --route full --provider all` | 設定、AI ファイル、pre-push hook、release checks を一つの flow で実行します。 |
| `aigate setup --language ja` | CLI 出力言語を保存します。 |
| `aigate init` | `.aigate.yml` と reports ディレクトリを作成します。 |
| `aigate reset` | AIGate config、settings、レポート placeholder を再作成します。`--dry-run` でプレビューできます。 |
| `aigate clean --force` | 生成済み AIGate レポートとローカル生成状態を削除します。`--force` なしでは対象だけをプレビューします。 |
| `aigate uninstall --force` | `.aigate.yml`、`.aigate/`、AIGate 所有の pre-push hook を削除します。 |
| `aigate doctor` | Node、Git、検出した test command、CI profile、古い generated files、AIGate 設定を確認します。 |
| `aigate demo` | プロジェクトファイルを変更せずに主な流れを表示します。 |
| `aigate install-hook --pre-push` | push 前に AIGate を実行する pre-push hook をインストールします。 |

## 状況別の使用例

今どのコマンドを実行するべきか迷ったときは、この短いルーティンから選べます。

| 状況 | プロセス | コマンド例 |
| --- | --- | --- |
| 初めてリポジトリに導入する | デフォルト設定を選び、必要なファイルだけ作成して診断を確認します。 | `aigate start --route default --ask-steps` -> `aigate doctor` -> `aigate install-hook --pre-push` |
| AI エージェントが多数のファイルを変更した後 | 変更ファイルと secret リスクを先に確認し、失敗したテストは AI 修正プロンプトに渡します。 | `aigate check` -> `aigate test` -> `aigate aitest` |
| PR を開く直前 | ローカル gate を通し、guarded push の後に reviewer 向けサマリーを生成します。 | `aigate git-ready` -> `aigate push -u origin feature/my-work` -> `aigate pr-check` |
| private GitLab monorepo | profile を固定し、GitLab MR/CODEOWNERS ワークフローファイルを作成して、GitHub 専用の score noise を避けます。 | `aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm` -> `aigate start --route default --steps repo-files --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm --owner @team` -> `aigate evaluate-project` |
| オープンソース公開準備 | 公開貢献ファイルを作成し、リポジトリ基盤スコアを確認します。 | `aigate start --route oss --owner @team` -> `aigate evaluate-project --deep --report` -> `aigate github setup --dry-run` |
| リリース前後 | tag と npm readiness を確認し、CI 後に状態トレンドを記録します。 | `aigate release-check --npm` -> `npm run ci` -> `aigate trends record` |
| ローカル状態を整理または削除する | 削除対象を先にプレビューし、内容が正しいときだけ適用します。 | `aigate clean` -> `aigate clean --force` -> `aigate uninstall --force` |

## 日常の Git workflow

```sh
git switch -c feature/my-work
aigate check
aigate test
aigate git-ready
git add .
git commit -m "feat: short summary"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

実際に push する前に確認したい場合は `aigate push --dry-run origin <branch>`
を使います。`aigate push` は Git の置き換えではなく、`git push` の前に
AIGate checks を追加する guarded wrapper です。

## テストと AI 自動修正フロー

```sh
aigate test
aigate test --script test
aigate test --command "npm run ci"
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate test` は `aigate git-ready` と検出した package-manager command を
実行します。root script、`turbo.json` task、`pnpm-workspace.yaml`、
`package.json` workspaces、一般的な `apps/*` または `packages/*` workspace
package を探索します。検出した package manager (`npm`, `pnpm`, `yarn`,
`bun`) を使い、`pnpm turbo run test` や `pnpm -r run test` のような command
も実行できます。`turbo` task は package metadata に `turbo` が宣言されているか
`node_modules/.bin` に runner がある場合だけ選択し、見つからない場合は
`pnpm -r run test` などの workspace script に切り替えます。独自の検証
コマンドを使う場合は `--script` または `--command` で指定します。

`aigate aitest` は失敗サマリー、テスト出力、AI 修正指示を
`.aigate/reports/ai-test.md` に書き込みます。既定ではコードを変更しません。
Codex、Claude、Gemini CLI または独自 agent を実行する場合だけ `--apply`
を付けます。

`aigate ai report` はより広いプロジェクトブリーフです。現在の問題、良い点、
方向性、推奨コマンド、リリース状態、ブランチ戦略、AI 引き継ぎプロンプトを
まとめます。既定ではコードを変更せず、選択した AI CLI を実行する場合だけ
`--apply --provider codex|claude|gemini` を付けます。既定の AI レポートでは
未作成のリリースタグ確認は参考扱いにし、通常の PR 作業をリリースで
ブロックされた状態として表示しません。厳密なリリースと npm 公開準備を
確認する場合は `--npm` を付けてください。

`--apply` をテキストモードで実行すると、AIGate はプロンプトのパス、provider、
agent コマンド、リアルタイムの agent 出力をターミナルに表示します。最終レポート
にも agent コマンド、所要時間、終了コード、stdout、stderr が残ります。JSON 出力
では stdout を機械可読 JSON のままにし、進行ログは stderr に送ります。

## レポートと出力形式

```sh
aigate report --format markdown --output .aigate/reports/report.md
aigate report --format html --output .aigate/reports/report.html
aigate report --format json --output .aigate/reports/report.json
aigate report --format sarif --output .aigate/reports/aigate.sarif
aigate ai report --output .aigate/reports/ai-report.md
aigate evaluate-project --deep --report
aigate audit-report
aigate compliance-report
aigate dashboard --output .aigate/reports/dashboard.html
```

Pull request には Markdown、ローカル確認には HTML、自動化には JSON、
GitHub code scanning には SARIF を使います。

## GitHub 設定と Actions

GitHub 補助ファイルの生成:

```sh
aigate github setup --owner @your-org/team --dry-run
aigate github setup --owner @your-org/team
```

PR comment または check summary の作成:

```sh
aigate github comment --pr 123
aigate github check --format markdown
```

再利用可能な GitHub Action 例:

```yaml
name: AIGate

on:
  pull_request:
  push:
    branches: [main]

jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: ja
```

## AI エージェント連携

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate claude
aigate integrate all --output-dir . --force
```

このコマンドは常に `.aigate/integrations/*` を生成します。root の
`AGENTS.md`、`GEMINI.md`、`CLAUDE.md` は、存在しない場合、または AIGate が生成
したファイルの場合だけ作成/更新します。プロジェクト既存の AI 指示ファイルは
`--force` でも保護されます。本当に置き換える場合のみ `--overwrite-ai-files` を
使ってください。

プロジェクト評価では、root の `AGENTS.md`、`GEMINI.md`、`CLAUDE.md`、または生成済み
`.aigate/integrations/*` 指示ファイルのいずれかを AI 指示として認めます。Claude
だけを使うチームが点数のために `AGENTS.md` を追加する必要はありません。

チーム方針は設定として保存できます:

```sh
aigate setup --ai-root-files protect
aigate setup --ai-root-files sidecar
aigate setup --ai-root-files overwrite
```

`protect` がデフォルトです。`sidecar` は `.aigate/integrations/*` のみを書き、
`overwrite` は `--force` 使用時に root AI ファイルの置き換えを許可します。

GitLab repository に過去生成された GitHub helper template が残っている場合は、
明示的に削除します:

```sh
aigate clean --github-files --force
```

## ブランチ戦略とリリース

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
aigate release-check --project-type app
aigate release-check --project-type package --npm
```

`branch-strategy` は branch rule を推薦し、policy pack を生成できます。
`release-check --npm` は package metadata、release tag、workflow provenance、
npm 公開状態が準備できているか確認します。

AIGate は repository profile を自動検出します: app/package、private/public、
GitHub/GitLab、npm/pnpm/yarn/bun、workspace test signal。private GitLab
pnpm app では、GitHub 専用、public OSS governance、npm 公開項目を `未対応`
ではなく、package version の release gate も含めて `対象外` として表示します。
そのため内部 app に package release version がなくても `release-check --npm`
はブロックしません。npm 公開 package として強制的に検査したい場合だけ
`--project-type package` を使います。

`aigate doctor` は、生成済み AIGate files が古い CLI で作成された場合も警告
します。たとえば現在の CLI が `0.1.6` で `generatedBy: aigate 0.1.1` が残って
いる場合は、最新 generated template を使うために `aigate init --force` と
`aigate integrate all --force` で再生成してください。再生成するまでは、古い
`.aigate.yml` の profile 値は scoring と gate 計算で無視されるため、古い
GitHub/npm package template が現在の repository signal を上書きしません。

自動検出だけでは足りない場合は profile を固定します:

```sh
aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm
aigate start --route oss --hosting gitlab --ci-provider gitlab --project-type app
```

チーム全体の基準にする場合は `.aigate.yml` にコミットします:

```yaml
project:
  type: app
  hosting: gitlab
  ciProvider: gitlab
  packageManager: pnpm
```

## 通知

```sh
aigate notify setup --channel terminal
aigate notify test --channel terminal
aigate notify send --event BLOCK --channel terminal
aigate git-ready --notify-channel terminal
```

外部システムには必要な環境変数を設定し、対応する channel を使います。

| Channel | 環境変数 |
| --- | --- |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` |
| `linear` | `AIGATE_LINEAR_WEBHOOK_URL` |
| `jira` | `AIGATE_JIRA_WEBHOOK_URL` |
| `webhook` | `AIGATE_WEBHOOK_URL` |

## コマンド一覧

| コマンド | 使う場面 |
| --- | --- |
| `aigate init` | 初期 AIGate 設定を作成します。 |
| `aigate reset` | AIGate 設定と settings を初期化します。 |
| `aigate clean` | 生成レポートとローカル状態の削除対象をプレビューします。適用するには `--force` を付けます。 |
| `aigate uninstall` | ローカル AIGate 設定、状態、所有 hook の削除対象をプレビューします。適用するには `--force` を付けます。 |
| `aigate start` | ガイド付き設定ルートを選択して実行します。 |
| `aigate start --route default --ask-steps` | 推奨デフォルト手順を一つずつ確認してから実行します。 |
| `aigate start --route default --steps init,repo-files` | 選択したデフォルト設定手順だけを実行します。 |
| `aigate start --route oss` | 公開リポジトリ用 README、issue テンプレート、PR テンプレート、CODEOWNERS、貢献文書を作成します。 |
| `aigate check` | local Git 変更、実際の secret findings、機密ファイル削除状態を確認します。 |
| `aigate test` | Git 準備状態と検出した project test command を実行します。 |
| `aigate ai report` | 現在の問題、良い点、方向性、AI 引き継ぎガイドをまとめます。 |
| `aigate aitest` | AI 修正プロンプトを書き、必要なら Codex、Claude、Gemini を実行します。 |
| `aigate git-ready` | commit または push 前の readiness gate を実行します。 |
| `aigate push` | checks 後に `git push` を呼び出します。 |
| `aigate pr` | 役立つ本文付きの pull request を作成します。 |
| `aigate pr-check` | PR readiness と risk 情報を生成します。 |
| `aigate github <comment\|check\|setup>` | PR comment、check summary、GitHub 補助ファイルを扱います。 |
| `aigate doctor` | local setup と repository foundation を診断します。 |
| `aigate demo` | ファイルを変更せず workflow を表示します。 |
| `aigate install-hook` | Git hook をインストールします。 |
| `aigate setup` | 言語、hosting、CI provider、project type、package manager などのローカル設定を保存します。 |
| `aigate settings` | AIGate 設定を確認します。 |
| `aigate integrate <provider>` | Codex/Gemini/Claude integration files を生成します。 |
| `aigate report` | Markdown、HTML、JSON、SARIF reports を書き出します。 |
| `aigate evaluate-project` | repository foundation と Git signals を score 化します。 |
| `aigate score` | 現在の project score を表示します。 |
| `aigate trends <record\|show>` | score history を記録または表示します。 |
| `aigate branch-strategy` | branch policy docs を推薦または生成します。 |
| `aigate release-check` | release と npm readiness を確認します。 |
| `aigate audit-report` | audit 向け report を生成します。 |
| `aigate compliance-report` | compliance 向け report を生成します。 |
| `aigate dashboard` | local HTML status dashboard を作成します。 |
| `aigate notify <setup\|test\|send>` | 通知を設定して送信します。 |
| `aigate help` | command help を表示します。 |

## まだ公開インストール経路ではないもの

リポジトリには Docker と Homebrew の準備ファイルがありますが、現時点の
公式インストール経路は公開 npm package です。Docker または Homebrew channel
が公開されるまでは、user quickstart にインストール command として載せません。

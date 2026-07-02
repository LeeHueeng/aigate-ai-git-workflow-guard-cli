# 配布

[English](distribution.md) | [한국어](distribution.ko.md) | [日本語](distribution.ja.md) | [中文](distribution.zh.md)

AIGate は npm を最初の配布 channel にします。Docker、Homebrew、
standalone binary は計画中の public channel であり、公開されるまでは
copy-paste install path として案内しません。

## npm

対象 package は `aigate-cli` です。

```sh
npm install -g aigate-cli
npx aigate-cli check
```

最初の public release は npm に公開済みです。

- Package: <https://www.npmjs.com/package/aigate-cli>
- Latest tagged public release: `v0.1.3`
- Current repository package version: `package.json` と `CHANGELOG.md` を参照
- Trusted Publishing: GitHub Actions `release.yml`

Routine release flow:

1. package version を更新
2. `npm run ci`
3. `aigate release-check --npm`
4. Release workflow を `dry_run=true` で実行
5. `vX.Y.Z` 形式の matching release tag を作成して push
6. `npm view aigate-cli version` を確認

## npm Trusted Publisher 設定

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `LeeHueeng` |
| Repository | `aigate-ai-git-workflow-guard-cli` |
| Workflow filename | `release.yml` |
| Allowed actions | `npm publish` |

CLI で設定:

```sh
npx npm@latest trust github aigate-cli \
  --file release.yml \
  --repo LeeHueeng/aigate-ai-git-workflow-guard-cli \
  --allow-publish \
  --yes
```

## Docker

リポジトリには `.github/workflows/docker.yml` の GHCR 公開 workflow が
含まれています。タグ付き workflow run が public image を公開するまでは、
local build で container usage を検証します。

```sh
docker build -t aigate/cli .
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli check
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli audit-report
```

公開が有効になった後、タグ付きリリースは次の image に publish されます。

```text
ghcr.io/leehueeng/aigate-cli
```

## Homebrew

リポジトリには `packaging/homebrew/aigate-cli.rb` の formula draft が
含まれています。一致する npm release が安定した後に Homebrew tap へ
publish します。

```sh
brew install --formula ./packaging/homebrew/aigate-cli.rb
```

## GitHub Actions

この repository はルートに再利用可能な公開 action を含みます。最新の action
動作は現在のリリースタグに固定し、未リリースの最新動作を意図的に確認
したい場合だけ `@main` を使ってください。

```yaml
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

`command: audit-report`、`command: pr-check`、`command: evaluate-project` で
より詳しい workflow report を作れます。
同じ metadata は、この repository の local workflow test 用に
`.github/actions/aigate` にも複製されています。入力一覧は
[GitHub Action](github-action.ja.md) を確認してください。

## 今後の channel

- GHCR workflow のタグ実行成功後の public Docker image
- npm package に実ユーザーが付いた後の Homebrew tap publish
- Node.js がない環境向け standalone binary

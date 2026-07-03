# 配布

[English](distribution.md) | [한국어](distribution.ko.md) | [日本語](distribution.ja.md) | [中文](distribution.zh.md)

AIGate は npm、GHCR Docker image、Homebrew tap、再利用可能な GitHub Action
で配布されます。standalone binary は今後の配布 channel です。

## npm

対象 package は `aigate-cli` です。

```sh
npm install -g aigate-cli
npx aigate-cli check
```

最初の public release は npm に公開済みです。

- Package: <https://www.npmjs.com/package/aigate-cli>
- Latest tagged public release: `v0.1.6`
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

タグ付き release は `.github/workflows/docker.yml` を通じて GHCR public
image を publish します。

```sh
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:0.1.6 check
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:latest audit-report
```

Image:

```text
ghcr.io/leehueeng/aigate-cli
```

## Homebrew

公開 tap は <https://github.com/LeeHueeng/homebrew-tap> です。

```sh
brew tap LeeHueeng/tap
brew install aigate-cli
```

1 command install:

```sh
brew install LeeHueeng/tap/aigate-cli
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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
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

- Node.js がない環境向け standalone binary

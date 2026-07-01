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
- Latest tagged public release: `v0.1.0`
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

Docker image はまだ公開されていません。container usage を検証する場合は
local build を使います。

```sh
docker build -t aigate/cli .
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli check
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli audit-report
```

## GitHub Actions

この repository は `.github/actions/aigate` の local composite action を含みます。

```yaml
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/aigate
        with:
          command: git-ready
```

`command: audit-report`、`command: pr-check`、`command: evaluate-project` で
より詳しい workflow report を作れます。

## 今後の channel

- container usage 検証後の public Docker image
- npm package に実ユーザーが付いた後の Homebrew formula
- Node.js がない環境向け standalone binary

# 分发

[English](distribution.md) | [한국어](distribution.ko.md) | [日本語](distribution.ja.md) | [中文](distribution.zh.md)

AIGate 先通过 npm 分发。Docker、Homebrew 和 standalone binary 是计划中的
公开分发渠道，在正式发布前不会作为可复制粘贴的 install path 展示。

## npm

目标 package 是 `aigate-cli`。

```sh
npm install -g aigate-cli
npx aigate-cli check
```

首个公开 release 已发布到 npm。

- Package: <https://www.npmjs.com/package/aigate-cli>
- Latest tagged public release: `v0.1.4`
- Current repository package version: 参考 `package.json` 和 `CHANGELOG.md`
- Trusted Publishing: GitHub Actions `release.yml`

Routine release flow:

1. 更新 package version
2. 运行 `npm run ci`
3. 运行 `aigate release-check --npm`
4. 用 `dry_run=true` 运行 Release workflow
5. 创建并 push 匹配的 release tag，例如 `vX.Y.Z`
6. 确认 `npm view aigate-cli version`

## npm Trusted Publisher 设置

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `LeeHueeng` |
| Repository | `aigate-ai-git-workflow-guard-cli` |
| Workflow filename | `release.yml` |
| Allowed actions | `npm publish` |

通过 CLI 设置:

```sh
npx npm@latest trust github aigate-cli \
  --file release.yml \
  --repo LeeHueeng/aigate-ai-git-workflow-guard-cli \
  --allow-publish \
  --yes
```

## Docker

仓库已包含 `.github/workflows/docker.yml` GHCR 发布 workflow。在带标签的
workflow run 发布 public image 前，请使用 local build 验证 container usage。

```sh
docker build -t aigate/cli .
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli check
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli audit-report
```

发布启用后，带标签的 release 会 publish 到:

```text
ghcr.io/leehueeng/aigate-cli
```

## Homebrew

仓库包含 `packaging/homebrew/aigate-cli.rb` formula 草案。匹配的 npm release
稳定后，再发布到 Homebrew tap。

```sh
brew install --formula ./packaging/homebrew/aigate-cli.rb
```

## GitHub Actions

此 repository 在根目录提供可复用的公开 action。最新 action 行为可以使用
请固定到当前发布标签；只有在有意验证未发布的最新行为时才使用 `@main`。

```yaml
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.4
        with:
          command: git-ready
          language: zh
```

使用 `command: audit-report`、`command: pr-check` 或
`command: evaluate-project` 可以生成更丰富的 workflow report。
同一份 metadata 也复制到 `.github/actions/aigate`，用于本 repository 的
local workflow test。完整输入见 [GitHub Action](github-action.zh.md)。

## 后续渠道

- GHCR workflow 标签运行成功后发布 public Docker image
- npm package 有真实用户后发布 Homebrew tap
- 为无 Node.js 环境提供 standalone binary

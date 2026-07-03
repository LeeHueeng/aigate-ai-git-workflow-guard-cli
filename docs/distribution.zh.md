# 分发

[English](distribution.md) | [한국어](distribution.ko.md) | [日本語](distribution.ja.md) | [中文](distribution.zh.md)

AIGate 通过 npm、GHCR Docker image、Homebrew tap 和可复用 GitHub Action
分发。standalone binary 仍是后续分发渠道。

## 当前公开状态

| 渠道 | 当前状态 |
| --- | --- |
| npm | `aigate-cli@0.1.6` 已发布到 `latest` dist-tag |
| GitHub Release | `v0.1.6` 已发布 |
| Docker/GHCR | `ghcr.io/leehueeng/aigate-cli:0.1.6` 和 `latest` 已发布 |
| Homebrew | `brew install LeeHueeng/tap/aigate-cli` |
| GitHub Action | 可通过 `LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6` 使用，Marketplace 展示需在 release 页面手动确认 |

## npm

目标 package 是 `aigate-cli`。

```sh
npm install -g aigate-cli
npx aigate-cli check
```

首个公开 release 已发布到 npm。

- Package: <https://www.npmjs.com/package/aigate-cli>
- Latest tagged public release: `v0.1.6`
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

带标签的 release 会通过 `.github/workflows/docker.yml` 发布 GHCR public
image。

```sh
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:0.1.6 check
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:latest audit-report
```

Image:

```text
ghcr.io/leehueeng/aigate-cli
```

## Homebrew

公开 tap 位于 <https://github.com/LeeHueeng/homebrew-tap>。

```sh
brew tap LeeHueeng/tap
brew install aigate-cli
```

一行安装：

```sh
brew install LeeHueeng/tap/aigate-cli
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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: zh
```

使用 `command: audit-report`、`command: pr-check` 或
`command: evaluate-project` 可以生成更丰富的 workflow report。
同一份 metadata 也复制到 `.github/actions/aigate`，用于本 repository 的
local workflow test。完整输入见 [GitHub Action](github-action.zh.md)。

## 后续渠道

- 为无 Node.js 环境提供 standalone binary

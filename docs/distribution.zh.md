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
- Latest tagged public release: `v0.1.0`
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

Docker image 尚未公开发布。验证 container usage 时使用 local build。

```sh
docker build -t aigate/cli .
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli check
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli audit-report
```

## GitHub Actions

此 repository 在根目录提供可复用的公开 action。最新 action 行为可以使用
`@main`，当包含该 action 的下一个发布标签创建后，请固定到标签。

```yaml
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
        with:
          command: git-ready
          language: zh
```

使用 `command: audit-report`、`command: pr-check` 或
`command: evaluate-project` 可以生成更丰富的 workflow report。
同一份 metadata 也复制到 `.github/actions/aigate`，用于本 repository 的
local workflow test。完整输入见 [GitHub Action](github-action.zh.md)。

## 后续渠道

- 验证 container usage 后发布 public Docker image
- npm package 有真实用户后发布 Homebrew formula
- 为无 Node.js 环境提供 standalone binary

# 发布流程

[English](release-process.md) | [한국어](release-process.ko.md) | [日本語](release-process.ja.md) | [中文](release-process.zh.md)

AIGate 发布由标签驱动。创建版本标签前，`main` 必须处于可发布状态。

## 检查清单

1. 确认变更已合并到 `main`。
2. 更新 `package.json`、`package-lock.json` 和 `CHANGELOG.md`。
3. 运行 `npm run ci`。
4. 运行 `aigate release-check --npm`。
5. 以 `dry_run=true` 运行 Release workflow。
6. 创建并推送匹配的标签，例如 `v0.1.6`。
7. 使用 `npm view aigate-cli version` 确认 npm 发布。
8. 使用 `docker manifest inspect ghcr.io/leehueeng/aigate-cli:<version>` 确认 GHCR 发布。
9. npm tarball 变化时，更新并 push Homebrew tap formula。
10. 创建或更新 GitHub Release notes。
11. 如果发布 Action，请在 release 页面启用 GitHub Marketplace publish option。

## 频道

- `latest`: 稳定公开发布
- `next`: 发布候选
- `beta`: beta 验证
- `canary`: 实验构建

## 回滚

如果发布有问题，请发布 patch 版本修复。除非构件暴露敏感信息，否则不要删除
npm 版本或 Git 标签。

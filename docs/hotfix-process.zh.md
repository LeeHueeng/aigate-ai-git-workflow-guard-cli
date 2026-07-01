# 热修复流程

[English](hotfix-process.md) | [한국어](hotfix-process.ko.md) | [日本語](hotfix-process.ja.md) | [中文](hotfix-process.zh.md)

热修复只用于紧急生产问题或已发布包的缺陷。

## 流程

1. 从 `main` 或最新稳定标签创建 `hotfix/<short-description>`。
2. 保持补丁最小化，避免无关清理。
3. 运行 `npm run ci` 和 `aigate git-ready`。
4. 创建指向 `main` 的 pull request。
5. 写明用户影响、验证方式，以及是否需要 patch 发布。
6. 合并后提升 patch version，并按照发布流程执行。

## 沟通

- 如果用户受影响，请创建 GitHub issue 或 release note 条目。
- 需要运维信号时，使用 `aigate notify send --channel slack` 或
  `--channel linear`。
- 只有 active release branch 也需要同一修复时才 backport。

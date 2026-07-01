# ホットフィックスプロセス

[English](hotfix-process.md) | [한국어](hotfix-process.ko.md) | [日本語](hotfix-process.ja.md) | [中文](hotfix-process.zh.md)

ホットフィックスは、緊急の本番問題または公開済みパッケージの欠陥にのみ使います。

## フロー

1. `main` または最新の安定タグから `hotfix/<short-description>` を作成します。
2. パッチは最小限にし、無関係な整理を避けます。
3. `npm run ci` と `aigate git-ready` を実行します。
4. `main` 向けの pull request を開きます。
5. ユーザー影響、検証、パッチリリース要否を記載します。
6. マージ後に patch version を上げ、リリースプロセスに従います。

## コミュニケーション

- ユーザーに影響がある場合は GitHub issue または release note に記録します。
- 運用シグナルが必要な場合は `aigate notify send --channel slack` または
  `--channel linear` を使います。
- 同じ修正が active release branch に必要な場合だけ backport します。

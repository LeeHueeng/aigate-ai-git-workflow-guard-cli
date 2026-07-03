# リリースプロセス

[English](release-process.md) | [한국어](release-process.ko.md) | [日本語](release-process.ja.md) | [中文](release-process.zh.md)

AIGate のリリースはタグ駆動です。バージョンタグを作成する前に、`main` は
リリース可能な状態である必要があります。

## チェックリスト

1. 変更が `main` にマージ済みであることを確認します。
2. `package.json`、`package-lock.json`、`CHANGELOG.md` を更新します。
3. `npm run ci` を実行します。
4. `aigate release-check --npm` を実行します。
5. Release workflow を `dry_run=true` で実行します。
6. `v0.1.6` のように一致するタグを作成して push します。
7. `npm view aigate-cli version` で npm 公開を確認します。
8. `docker manifest inspect ghcr.io/leehueeng/aigate-cli:<version>` で GHCR 公開を確認します。
9. npm tarball が変わったら Homebrew tap formula を更新して push します。
10. GitHub Release note を作成または更新します。
11. Action を公開する場合は、リリース画面で GitHub Marketplace publish
   option を有効にします。

## チャンネル

- `latest`: 安定した公開リリース
- `next`: リリース候補
- `beta`: ベータ検証
- `canary`: 実験ビルド

## ロールバック

問題のあるリリースが公開された場合はパッチリリースで修正します。機密情報が
露出した場合を除き、npm バージョンや Git タグは削除しません。

# AIGate と Husky、Lefthook、pre-commit、Gitleaks の比較

[English](comparison.md) | [한국어](comparison.ko.md) | [日本語](comparison.ja.md) | [中文](comparison.zh.md)

AIGate は、すべての Git hook runner や secret scanner を置き換えるものでは
ありません。AI-assisted changes、PR readiness、repository health、branch
strategy、release confidence をまとめて見る workflow guard です。

## クイック比較

| ツール | 得意分野 | 使い続ける場面 | AIGate の役割 |
| --- | --- | --- | --- |
| Husky | JavaScript の Git hook 配線 | npm script hook が主目的のとき | pre-push hook から実行する readiness gate になります。 |
| Lefthook | 高速な多言語 hook orchestration | 多数の hook を高速に実行したいとき | PR readiness、repository scoring、branch strategy、reports を追加します。 |
| pre-commit | hook ecosystem と再現可能な local checks | チームが pre-commit を標準化しているとき | AI workflow、GitHub、release checks を補完します。 |
| Gitleaks | 深い secret scanning | 専用 secret scanner の coverage が必要なとき | changed-file 中心の軽量 secret check と SARIF output を提供します。 |
| AIGate | AI-assisted Git workflow guard | push や PR 前の zero-config gate が必要なとき | readiness、risk、reports、notifications、branch policy、AI agent instructions をまとめます。 |

## 推奨組み合わせ

| 状況 | コマンド |
| --- | --- |
| 小さな AI-assisted project | `aigate doctor` -> `aigate install-hook --pre-push` -> `aigate git-ready` |
| Husky 使用中の JavaScript project | 既存の Husky pre-push hook から `aigate git-ready` を実行 |
| Lefthook または pre-commit 使用チーム | 既存の test/lint hook を維持し、PR 前に `aigate pr-check` を追加 |
| セキュリティ重視 repository | CI で Gitleaks を実行し、`aigate report --format sarif` で変更 context を補足 |
| 公開 open source package | `aigate release-check --npm`、GitHub Action、`aigate branch-strategy --compare` を使用 |

## AIGate が向いている場合

- Codex、Gemini、Claude Code、Cursor などの AI coding assistant を使っている。
- `git push` 前に変更内容を説明する local gate がほしい。
- PR readiness、project score、release readiness、branch strategy を 1 つの CLI で見たい。
- Markdown、HTML、JSON、SARIF output を local と CI の両方で使いたい。
- AI agent にも人間と同じ repository workflow を守らせたい。

## 他のツールを中心にするべき場合

- hook orchestration が主目的なら Husky または Lefthook が先です。
- チームが pre-commit ecosystem を標準化しているなら pre-commit を中心にします。
- deep secret scanning coverage が主目的なら Gitleaks を中心にします。

AIGate は、それらの checks を push safety、PR quality、repository governance に
つなげる human-readable workflow layer として最も力を発揮します。

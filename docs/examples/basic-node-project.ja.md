# Basic Node project example

[English](basic-node-project.md) | [한국어](basic-node-project.ko.md) | [日本語](basic-node-project.ja.md) | [中文](basic-node-project.zh.md)

既存の Node.js repository で AIGate を最短で試す手順です。

## One-time trial

```sh
npx -y aigate-cli check
npx -y aigate-cli start --route quickstart --dry-run
npx -y aigate-cli doctor
npx -y aigate-cli test
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

## Repository に AIGate を追加

```sh
npm install --save-dev aigate-cli
npx aigate-cli start --route ai --provider all
npx aigate-cli init
npx aigate-cli setup --language ja
npx aigate-cli install-hook --pre-push
```

package script を追加:

```json
{
  "scripts": {
    "aigate:ready": "aigate git-ready",
    "aigate:pr": "aigate pr-check"
  }
}
```

## Push 前

```sh
npx aigate-cli test
npx aigate-cli aitest
npx aigate-cli doctor
npm run aigate:ready
git add <files>
git commit -m "feat: focused change"
npx aigate-cli push -u origin feature/my-work
```

## PR review 前

```sh
npx aigate-cli pr-check --output .aigate/reports/pr.md
npx aigate-cli evaluate-project --deep --report
```

reviewer が changed paths、risk score、secret findings、project score、
recommended actions を見られるよう、report summary を PR description に添付します。

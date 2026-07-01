# Basic Node project example

[English](basic-node-project.md) | [한국어](basic-node-project.ko.md) | [日本語](basic-node-project.ja.md) | [中文](basic-node-project.zh.md)

这是在现有 Node.js repository 中快速试用 AIGate 的最短路径。

## One-time trial

```sh
npx -y aigate-cli check
npx -y aigate-cli doctor
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

## 将 AIGate 加入 repository

```sh
npm install --save-dev aigate-cli
npx aigate-cli init
npx aigate-cli setup --language zh
npx aigate-cli install-hook --pre-push
```

添加 package script:

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
npm test
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

把 report summary 附到 pull request description 中，让 reviewer 可以看到
changed paths、risk score、secret findings、project score 和 recommended actions。

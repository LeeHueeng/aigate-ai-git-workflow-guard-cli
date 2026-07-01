# 기본 Node 프로젝트 예제

[English](basic-node-project.md) | [한국어](basic-node-project.ko.md) | [日本語](basic-node-project.ja.md) | [中文](basic-node-project.zh.md)

기존 Node.js repository에서 AIGate를 가장 빠르게 체험하는 경로입니다.

## 1회 체험

```sh
npx -y aigate-cli check
npx -y aigate-cli doctor
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

## Repository에 AIGate 추가

```sh
npm install --save-dev aigate-cli
npx aigate-cli init
npx aigate-cli setup --language ko
npx aigate-cli install-hook --pre-push
```

package script 추가:

```json
{
  "scripts": {
    "aigate:ready": "aigate git-ready",
    "aigate:pr": "aigate pr-check"
  }
}
```

## Push 전

```sh
npm test
npx aigate-cli doctor
npm run aigate:ready
git add <files>
git commit -m "feat: focused change"
npx aigate-cli push -u origin feature/my-work
```

## PR review 전

```sh
npx aigate-cli pr-check --output .aigate/reports/pr.md
npx aigate-cli evaluate-project --deep --report
```

reviewer가 changed paths, risk score, secret findings, project score,
recommended actions를 볼 수 있도록 report summary를 PR description에 붙입니다.

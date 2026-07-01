# Basic Node Project Example

This example shows the shortest path for trying AIGate in an existing Node.js
repository.

## One-Time Trial

```sh
npx -y aigate-cli check
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

## Add AIGate To A Repository

```sh
npm install --save-dev aigate-cli
npx aigate-cli init
npx aigate-cli setup --language en
```

Add a package script:

```json
{
  "scripts": {
    "aigate:ready": "aigate git-ready",
    "aigate:pr": "aigate pr-check"
  }
}
```

## Before Push

```sh
npm test
npm run aigate:ready
git add <files>
git commit -m "feat: focused change"
npx aigate-cli push -u origin feature/my-work
```

## Before PR Review

```sh
npx aigate-cli pr-check --output .aigate/reports/pr.md
npx aigate-cli evaluate-project --deep --report
```

Attach the report summary to your pull request description so reviewers can
see changed paths, risk score, secret findings, project score, and recommended
actions.

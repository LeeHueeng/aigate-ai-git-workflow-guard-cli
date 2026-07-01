# 배포

[English](distribution.md) | [한국어](distribution.ko.md) | [日本語](distribution.ja.md) | [中文](distribution.zh.md)

AIGate는 npm을 첫 배포 채널로 사용합니다. Docker, Homebrew, standalone
binary는 계획된 공개 배포 채널이며, 실제 publish 전에는 copy-paste install
path로 안내하지 않습니다.

## npm

대상 package는 `aigate-cli`입니다.

```sh
npm install -g aigate-cli
npx aigate-cli check
```

첫 공개 release는 npm에 올라가 있습니다.

- Package: <https://www.npmjs.com/package/aigate-cli>
- Latest tagged public release: `v0.1.0`
- Current repository package version: `package.json`, `CHANGELOG.md` 참고
- Trusted Publishing: GitHub Actions `release.yml`

Routine release flow:

1. package version update
2. `npm run ci`
3. `aigate release-check --npm`
4. Release workflow를 `dry_run=true`로 실행
5. `vX.Y.Z` 같은 matching release tag 생성 및 push
6. `npm view aigate-cli version` 확인

## npm Trusted Publisher 설정

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `LeeHueeng` |
| Repository | `aigate-ai-git-workflow-guard-cli` |
| Workflow filename | `release.yml` |
| Allowed actions | `npm publish` |

CLI로 설정:

```sh
npx npm@latest trust github aigate-cli \
  --file release.yml \
  --repo LeeHueeng/aigate-ai-git-workflow-guard-cli \
  --allow-publish \
  --yes
```

## Docker

Docker image는 아직 공개 publish되지 않았습니다. container 사용 검증 시에는
local build만 사용합니다.

```sh
docker build -t aigate/cli .
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli check
docker run --rm -v "$PWD:/repo" -w /repo aigate/cli audit-report
```

## GitHub Actions

이 repository는 루트에 재사용 가능한 공개 action을 포함합니다. 최신 action
동작은 `@main`으로 사용하고, 다음 action 포함 릴리스 태그가 만들어진 뒤에는
태그로 고정하세요.

```yaml
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
        with:
          command: git-ready
          language: ko
```

`command: audit-report`, `command: pr-check`, `command: evaluate-project`로
더 풍부한 workflow report를 만들 수 있습니다.
동일한 metadata는 이 repository의 local workflow test를 위해
`.github/actions/aigate`에도 복제되어 있습니다. 전체 입력값은
[GitHub Action](github-action.ko.md)을 확인하세요.

## 이후 채널

- container 사용이 검증된 뒤 공개 Docker image
- npm package에 실제 사용자가 생긴 뒤 Homebrew formula
- Node.js가 없는 환경을 위한 standalone binary

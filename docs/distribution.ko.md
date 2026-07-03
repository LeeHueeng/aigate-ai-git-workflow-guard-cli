# 배포

[English](distribution.md) | [한국어](distribution.ko.md) | [日本語](distribution.ja.md) | [中文](distribution.zh.md)

AIGate는 npm, GHCR Docker image, Homebrew tap, 재사용 가능한 GitHub Action으로
배포됩니다. standalone binary는 이후 배포 채널로 남아 있습니다.

## 현재 공개 상태

| 채널 | 현재 상태 |
| --- | --- |
| npm | `aigate-cli@0.1.6`가 `latest` dist-tag로 배포됨 |
| GitHub Release | `v0.1.6` 게시 완료 |
| Docker/GHCR | `ghcr.io/leehueeng/aigate-cli:0.1.6`, `latest` 배포 완료 |
| Homebrew | `brew install LeeHueeng/tap/aigate-cli` |
| GitHub Action | `LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6`로 사용 가능, Marketplace 게시 여부는 릴리스 화면에서 수동 확인 |

## npm

대상 package는 `aigate-cli`입니다.

```sh
npm install -g aigate-cli
npx aigate-cli check
```

첫 공개 release는 npm에 올라가 있습니다.

- Package: <https://www.npmjs.com/package/aigate-cli>
- Latest tagged public release: `v0.1.6`
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

태그 릴리스는 `.github/workflows/docker.yml`을 통해 GHCR public image를
배포합니다.

```sh
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:0.1.6 check
docker run --rm -v "$PWD:/repo" -w /repo ghcr.io/leehueeng/aigate-cli:latest audit-report
```

이미지:

```text
ghcr.io/leehueeng/aigate-cli
```

## Homebrew

공개 tap은 <https://github.com/LeeHueeng/homebrew-tap> 에 있습니다.

```sh
brew tap LeeHueeng/tap
brew install aigate-cli
```

한 줄 설치:

```sh
brew install LeeHueeng/tap/aigate-cli
```

## GitHub Actions

이 repository는 루트에 재사용 가능한 공개 action을 포함합니다. 최신 action
동작은 현재 릴리스 태그로 고정하고, 아직 배포되지 않은 최신 동작을 의도적으로
확인할 때만 `@main`을 사용하세요.

```yaml
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
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

- Node.js가 없는 환경을 위한 standalone binary

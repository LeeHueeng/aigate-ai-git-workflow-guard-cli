# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate는 저장소 루트의 재사용 가능한 GitHub Action을 제공합니다. 안정적인
실행에는 현재 릴리스 태그를 사용하고, 아직 배포되지 않은 최신 동작을 의도적으로
확인할 때만 `@main`을 사용하세요.

```yaml
name: AIGate
on:
  pull_request:
  push:
    branches: [main]

jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.4
        with:
          command: git-ready
          language: ko
```

PR 리포트를 만들 때:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.4
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## 입력값

| 입력값 | 기본값 | 설명 |
| --- | --- | --- |
| `command` | `git-ready` | `git-ready`, `check`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, `release-check-npm`, `branch-strategy`, `branch-strategy-compare`를 지원합니다. |
| `report-format` | `markdown` | 리포트 생성 명령에서 사용합니다. |
| `output` | 비어 있음 | 리포트 생성 명령의 선택 출력 경로입니다. |
| `language` | 비어 있음 | 선택값은 `en`, `ko`, `ja`, `zh`입니다. |
| `package` | `aigate-cli@latest` | `npx`로 실행할 npm 패키지 지정자입니다. |

동일한 action metadata는 이 저장소 내부 workflow 테스트를 위해
`.github/actions/aigate`에도 복제되어 있습니다.

브랜치 전략 비교:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.4
  with:
    command: branch-strategy-compare
    report-format: json
    output: .aigate/reports/branch-strategy.json
```

## GitHub Marketplace

다음 GitHub Release를 게시할 때 이 값을 사용합니다.

| 항목 | 값 |
| --- | --- |
| Action name | `AIGate AI Git Workflow Guard CLI` |
| 주요 카테고리 | `Code quality` |
| 보조 카테고리 | `Security` |
| 릴리스 태그 | `v0.1.4` |
| 릴리스 제목 | `AIGate AI Git Workflow Guard CLI v0.1.4` |

안정 patch release라면 `Set as the latest release`는 켜고, pre-release는
체크하지 않습니다. 릴리스 화면에서 GitHub Marketplace 게시 옵션을 켜세요.

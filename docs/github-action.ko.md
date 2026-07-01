# GitHub Action

[English](github-action.md) | [한국어](github-action.ko.md) | [日本語](github-action.ja.md) | [中文](github-action.zh.md)

AIGate는 저장소 루트의 재사용 가능한 GitHub Action을 제공합니다. 최신 공개
동작을 바로 확인하려면 `@main`을 쓰고, 해당 액션이 포함된 릴리스 태그가 생긴
뒤에는 `@v0.1.2` 같은 태그로 고정하세요.

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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
        with:
          command: git-ready
          language: ko
```

PR 리포트를 만들 때:

```yaml
- uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@main
  with:
    command: pr-check
    report-format: markdown
    output: .aigate/reports/pr.md
```

## 입력값

| 입력값 | 기본값 | 설명 |
| --- | --- | --- |
| `command` | `git-ready` | `git-ready`, `check`, `doctor`, `pr-check`, `report`, `audit-report`, `evaluate-project`, `github-check`, `release-check`, `release-check-npm`을 지원합니다. |
| `report-format` | `markdown` | 리포트 생성 명령에서 사용합니다. |
| `output` | 비어 있음 | 리포트 생성 명령의 선택 출력 경로입니다. |
| `language` | 비어 있음 | 선택값은 `en`, `ko`, `ja`, `zh`입니다. |
| `package` | `aigate-cli@latest` | `npx`로 실행할 npm 패키지 지정자입니다. |

동일한 action metadata는 이 저장소 내부 workflow 테스트를 위해
`.github/actions/aigate`에도 복제되어 있습니다.

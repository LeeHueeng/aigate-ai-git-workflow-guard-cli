# AIGate 사용 가이드

[English](usage.md) | [한국어](usage.ko.md) | [日本語](usage.ja.md) | [中文](usage.zh.md)

이 문서는 현재 `aigate-cli` 구조에 맞춘 사용법입니다. 기존 저장소에서 바로
실행하거나, GitHub와 연결하거나, Codex/Gemini/Claude Code에 같은 작업 규칙을 전달할 때
사용하세요.

## 설치 또는 바로 실행

설치 없이 실행:

```sh
npx -y aigate-cli check
```

전역 설치:

```sh
npm install -g aigate-cli
aigate --help
```

저장소별 CLI 언어 설정:

```sh
aigate settings --language en
aigate settings --language ko
aigate settings --language ja
aigate settings --language zh
```

## 저장소에서 첫 실행

Git 저장소 루트로 이동한 뒤 실행합니다.

```sh
aigate setup --language ko
aigate doctor
aigate demo
aigate install-hook --pre-push
```

각 명령의 역할:

| 명령어 | 목적 |
| --- | --- |
| `aigate setup --language ko` | `.aigate.yml`, `.aigate/settings.json`, 리포트 디렉터리, AI 연동 안내 파일을 만듭니다. |
| `aigate doctor` | Node, Git, npm package metadata, GitHub workflow, AIGate 설정을 점검합니다. |
| `aigate demo` | 프로젝트 파일을 바꾸지 않고 주요 흐름을 보여줍니다. |
| `aigate install-hook --pre-push` | push 전에 AIGate가 실행되는 pre-push hook을 설치합니다. |

## 매일 쓰는 Git 흐름

```sh
git switch -c feature/my-work
aigate check
aigate git-ready
git add .
git commit -m "feat: short summary"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

실제 push 전에 확인만 하고 싶으면 `aigate push --dry-run origin <branch>`를
사용합니다. `aigate push`는 `git push`를 대체하는 새 버전 관리 도구가 아니라,
push 전에 AIGate 점검을 붙이는 보호 래퍼입니다.

## 리포트와 출력 형식

```sh
aigate report --format markdown --output .aigate/reports/report.md
aigate report --format html --output .aigate/reports/report.html
aigate report --format json --output .aigate/reports/report.json
aigate report --format sarif --output .aigate/reports/aigate.sarif
aigate evaluate-project --deep --report
aigate audit-report
aigate compliance-report
aigate dashboard --output .aigate/reports/dashboard.html
```

Pull request에는 Markdown, 로컬 검토에는 HTML, 자동화에는 JSON, GitHub code
scanning에는 SARIF를 사용합니다.

## GitHub 설정과 Actions

GitHub 보조 파일 생성:

```sh
aigate github setup --owner @your-org/team --dry-run
aigate github setup --owner @your-org/team
```

PR comment 또는 check summary 생성:

```sh
aigate github comment --pr 123
aigate github check --format markdown
```

재사용 가능한 GitHub Action 예시:

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
      - uses: actions/checkout@v4
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.4
        with:
          command: git-ready
          language: ko
```

## AI 에이전트 연동

```sh
aigate integrate all
aigate integrate codex
aigate integrate gemini
aigate integrate claude
aigate integrate all --output-dir . --force
```

이 명령은 `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`,
`.aigate/integrations/*`를 생성합니다. Codex, Gemini, Claude Code가 범위가
명확한 브랜치, 검증 명령, `aigate push` 규칙을 따르도록 안내합니다.

## 브랜치 전략과 릴리스

```sh
aigate branch-strategy --compare
aigate branch-strategy --apply
aigate release-check
aigate release-check --npm
```

`branch-strategy`는 브랜치 규칙을 추천하고 정책 팩을 생성할 수 있습니다.
`release-check --npm`은 package metadata, release tag, workflow provenance,
npm 배포 상태가 준비됐는지 확인합니다.

## 알림

```sh
aigate notify setup --channel terminal
aigate notify test --channel terminal
aigate notify send --event BLOCK --channel terminal
aigate git-ready --notify-channel terminal
```

외부 시스템은 필요한 환경 변수를 설정한 뒤 해당 채널을 사용합니다.

| 채널 | 환경 변수 |
| --- | --- |
| `slack` | `AIGATE_SLACK_WEBHOOK_URL` |
| `discord` | `AIGATE_DISCORD_WEBHOOK_URL` |
| `teams` | `AIGATE_TEAMS_WEBHOOK_URL` |
| `email` | `AIGATE_EMAIL_WEBHOOK_URL` |
| `linear` | `AIGATE_LINEAR_WEBHOOK_URL` |
| `jira` | `AIGATE_JIRA_WEBHOOK_URL` |
| `webhook` | `AIGATE_WEBHOOK_URL` |

## 명령어 지도

| 명령어 | 언제 쓰는가 |
| --- | --- |
| `aigate init` | 초기 AIGate 설정을 만듭니다. |
| `aigate check` | 로컬 Git 변경사항과 secret findings를 점검합니다. |
| `aigate git-ready` | commit 또는 push 전 readiness gate를 실행합니다. |
| `aigate push` | 점검 후 `git push`를 호출합니다. |
| `aigate pr` | 유용한 본문을 포함한 pull request를 만듭니다. |
| `aigate pr-check` | PR 준비도와 위험 정보를 생성합니다. |
| `aigate github <comment\|check\|setup>` | PR comment, check summary, GitHub 보조 파일을 처리합니다. |
| `aigate doctor` | 로컬 환경과 저장소 기반을 진단합니다. |
| `aigate demo` | 파일 변경 없이 workflow를 보여줍니다. |
| `aigate install-hook` | Git hook을 설치합니다. |
| `aigate setup` | config, settings, reports, AI guide 파일을 생성합니다. |
| `aigate settings` | 언어 같은 AIGate 설정을 조회하거나 변경합니다. |
| `aigate integrate <provider>` | Codex/Gemini/Claude 연동 파일을 생성합니다. |
| `aigate report` | Markdown, HTML, JSON, SARIF 리포트를 작성합니다. |
| `aigate evaluate-project` | 저장소 기반과 Git signal을 점수화합니다. |
| `aigate score` | 현재 프로젝트 점수를 출력합니다. |
| `aigate trends <record\|show>` | 점수 이력을 기록하거나 보여줍니다. |
| `aigate branch-strategy` | 브랜치 정책 문서를 추천하거나 생성합니다. |
| `aigate release-check` | 릴리스와 npm 준비 상태를 점검합니다. |
| `aigate audit-report` | 감사 중심 리포트를 만듭니다. |
| `aigate compliance-report` | 컴플라이언스 중심 리포트를 만듭니다. |
| `aigate dashboard` | 로컬 HTML 상태 대시보드를 만듭니다. |
| `aigate notify <setup\|test\|send>` | 알림을 설정하고 전송합니다. |
| `aigate help` | 명령어 도움말을 출력합니다. |

## 아직 공개 설치 경로가 아닌 것

저장소에는 Docker와 Homebrew 준비 파일이 있지만, 현재 공식 설치 경로는 공개
npm package입니다. Docker 또는 Homebrew 채널이 실제로 공개되기 전까지는
사용자 quickstart에 설치 명령으로 넣지 않습니다.

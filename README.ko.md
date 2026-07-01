# AIGate

위험한 AI 생성 Git 변경사항이 push 되기 전에 막아주는 CLI입니다.

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

AIGate는 AI 코딩 도구와 함께 개발할 때 로컬 변경 파일, secret 위험,
저장소 준비 상태, PR 위험도, 브랜치 전략을 `git push` 전에 확인하는
zero-config pre-push safety CLI입니다.

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

![AIGate demo](assets/demo.gif)

## 60초 빠른 시작

설치 없이 바로 실행할 수 있습니다.

```sh
npx -y aigate-cli check
npx -y aigate-cli doctor
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

전역 설치 후에는 이렇게 씁니다.

```sh
npm install -g aigate-cli
aigate check
aigate git-ready
aigate install-hook --pre-push
aigate pr-check
```

## 지금 되는 것

| 기능 | 명령어 |
| --- | --- |
| 로컬 Git 준비 상태 확인 | `aigate check` |
| 첫 실행 환경 진단 | `aigate doctor` |
| 안내형 CLI 데모 | `aigate demo` |
| pre-push 안전 게이트 | `aigate git-ready` |
| pre-push hook 설치 | `aigate install-hook --pre-push` |
| 검증 후 push 실행 | `aigate push -u origin <branch>` |
| PR 준비 상태 리포트 | `aigate pr-check` |
| GitHub PR 요약 댓글 | `aigate github comment --pr <number>` |
| GitHub Checks 요약 payload | `aigate github check --format json` |
| GitHub PR 템플릿과 CODEOWNERS 설정 | `aigate github setup` |
| Markdown, HTML, JSON, SARIF 리포트 | `aigate report --format <format>` |
| 저장소 건강 점수 | `aigate evaluate-project` |
| 컴플라이언스 통제 리포트 | `aigate compliance-report` |
| 로컬 HTML 상태 대시보드 | `aigate dashboard` |
| 프로젝트 상태 추세 기록 | `aigate trends record` |
| 브랜치 전략 정책 팩 | `aigate branch-strategy --apply` |
| 브랜치 전략 제안 비교 | `aigate branch-strategy --compare` |
| npm 릴리스 준비 확인 | `aigate release-check --npm` |
| Codex/Gemini 연동 파일 생성 | `aigate integrate all` |

## 대표 흐름

```sh
git switch -c feature/my-work
aigate doctor
aigate install-hook --pre-push
aigate git-ready
git add <files>
git commit -m "feat: focused change"
aigate push -u origin feature/my-work
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: focused change"
aigate github comment --pr <number>
aigate github check --output .aigate/reports/github-check.md
aigate trends record
aigate github setup --owner @your-org/team --dry-run
```

## 언어 설정

CLI 출력은 영어, 한국어, 일본어, 중국어를 지원합니다.

```sh
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## GitHub Actions

다른 저장소에서도 AIGate를 재사용 가능한 공개 GitHub Action으로 실행할 수
있습니다.

```yaml
name: AIGate
on:
  pull_request:
jobs:
  aigate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.2
        with:
          command: git-ready
          language: ko
```

안정적인 실행에는 현재 릴리스 태그를 사용하고, 아직 배포되지 않은 최신 동작을
의도적으로 확인할 때만 `@main`을 사용하세요. 전체 입력값은
[GitHub Action 문서](docs/github-action.ko.md)에 정리했습니다.

## AI 에이전트 연동

```sh
aigate integrate all
```

이 명령은 `AGENTS.md`, `GEMINI.md`, `.aigate/integrations/*`를 생성해서
Codex와 Gemini가 같은 브랜치, 검증, guarded push 규칙을 따르게 합니다.

## 문서 바로가기

- [다국어 문서 색인](docs/README.ko.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [English operations guide](docs/operations.en.md)
- [日本語運用ドキュメント](docs/operations.ja.md)
- [中文运维说明](docs/operations.zh.md)
- [배포 가이드](docs/distribution.ko.md)
- [알림 가이드](docs/notifications.ko.md)
- [AI 연동 가이드](docs/ai-integrations.ko.md)
- [JSON 출력 예시](docs/examples/json-output.ko.md)
- [Windows 스모크 테스트](docs/examples/windows-smoke-test.ko.md)
- [릴리스 프로세스](docs/release-process.ko.md)
- [핫픽스 프로세스](docs/hotfix-process.ko.md)
- [로드맵](docs/roadmap.ko.md)

## 아직 배포하지 않은 계획

- 공개 Docker 이미지
- Homebrew formula
- standalone binary
- hosted dashboard
- Linear/Jira 연동 심화

## 라이선스

MIT

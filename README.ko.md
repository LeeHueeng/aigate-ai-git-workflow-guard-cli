# AIGate

위험한 AI 생성 Git 변경사항이 push 되기 전에 막아주는 CLI입니다.

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

AIGate는 AI 코딩 도구와 함께 개발할 때 로컬 변경 파일, secret 위험,
저장소 준비 상태, PR 위험도, 브랜치 전략을 `git push` 전에 확인하는
zero-config pre-push safety CLI입니다.

![AIGate terminal demo](assets/aigate-terminal-demo.svg)

![AIGate demo](assets/demo.gif)

## 이런 경우에 쓰세요

- AI coding assistant가 검토 속도보다 빠르게 파일을 바꾼다.
- `git push` 전에 준비 상태를 설명해주는 명령 하나가 필요하다.
- 공개 패키지를 운영하며 PR, 릴리스, 저장소 건강도 신호가 필요하다.
- Markdown, HTML, JSON, SARIF 출력이 로컬과 CI 모두에서 필요하다.
- Codex, Gemini, Claude Code가 사람과 같은 브랜치/검증 workflow를 따르게 만들고 싶다.

## 60초 빠른 시작

설치 없이 바로 실행할 수 있습니다.

```sh
npx -y aigate-cli check
npx -y aigate-cli start --route default --dry-run
npx -y aigate-cli start --route quickstart --dry-run
npx -y aigate-cli doctor
npx -y aigate-cli test
npx -y aigate-cli ai report
npx -y aigate-cli demo
npx -y aigate-cli pr-check
npx -y aigate-cli evaluate-project
```

전역 설치 후에는 이렇게 씁니다.

```sh
npm install -g aigate-cli
aigate start
aigate start --route default --ask-steps
aigate start --route default --steps init,repo-files
aigate start --route oss --dry-run
aigate reset --dry-run
aigate clean
aigate uninstall
aigate check
aigate test
aigate ai report
aigate aitest
aigate git-ready
aigate install-hook --pre-push
aigate pr-check
```

## 상황별 플레이북

| 상황 | 프로세스 | 명령어 |
| --- | --- | --- |
| 새 저장소에 도입 | 기본 AIGate 파일을 단계별로 만들고 pre-push 보호를 설치합니다. | `aigate start --route default --ask-steps` -> `aigate doctor` -> `aigate install-hook --pre-push` |
| AI가 파일을 많이 변경 | 변경 경로를 확인하고 테스트를 돌린 뒤 실패 내용을 AI 수정 프롬프트로 만듭니다. | `aigate check` -> `aigate test` -> `aigate aitest --provider codex` |
| PR 직전 | gate를 통과시키고 AIGate로 push한 뒤 리뷰어가 볼 요약을 만듭니다. | `aigate git-ready` -> `aigate push -u origin feature/my-work` -> `aigate pr-check` |
| 오픈소스 공개 | 공개 기여 파일을 만들고 저장소 기반을 점검합니다. | `aigate start --route oss --owner @team` -> `aigate evaluate-project --deep --report` -> `aigate github setup --dry-run` |
| 릴리스 주간 | npm과 tag 준비 상태를 확인하고 CI 후 추세를 기록합니다. | `aigate release-check --npm` -> `npm run ci` -> `aigate trends record` |

## 지금 되는 것

| 기능 | 명령어 |
| --- | --- |
| 로컬 Git 준비 상태 확인 | `aigate check` |
| 안내형 설정 라우터 | `aigate start` |
| 예/아니오로 고르는 기본 설정 | `aigate start --route default --ask-steps` |
| 필요한 단계만 지정 실행 | `aigate start --route default --steps init,repo-files` |
| AIGate 설정과 settings 초기화 | `aigate reset` |
| 생성된 로컬 리포트와 상태 삭제 | `aigate clean --force` |
| AIGate 설정, 로컬 상태, 소유 hook 제거 | `aigate uninstall --force` |
| 공개 저장소 README, 이슈 템플릿, 기여 파일 생성 | `aigate start --route oss` |
| 프로젝트 테스트 실행 | `aigate test` |
| AI 수정 프롬프트와 선택적 에이전트 실행 | `aigate aitest` |
| 현재 문제점, 잘된 점, 방향성을 정리한 AI 리포트 | `aigate ai report` |
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
| private 앱, GitLab, pnpm 자동 프로필 감지 | `aigate evaluate-project` |
| 브랜치 전략 정책 팩 | `aigate branch-strategy --apply` |
| 브랜치 전략 제안 비교 | `aigate branch-strategy --compare` |
| npm 릴리스 준비 확인 | `aigate release-check --npm` |
| Codex/Gemini/Claude 연동 파일 생성 | `aigate integrate all` |

## 다른 도구와의 차이

AIGate는 Husky, Lefthook, pre-commit, Gitleaks를 무리하게 대체하지 않습니다.
기존 hook과 scanner 위에서 AI-assisted 변경의 push safety, PR quality,
repository governance를 묶는 workflow layer입니다.

자세한 조합은 [도구 비교 문서](docs/comparison.ko.md)에 정리했습니다.

## 대표 흐름

```sh
git switch -c feature/my-work
aigate ai report
aigate start --route default --ask-steps
aigate start --route oss --dry-run
aigate start --route ai --provider all
aigate reset --dry-run
aigate clean
aigate doctor
aigate install-hook --pre-push
aigate test
aigate aitest
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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
        with:
          command: git-ready
          language: ko
```

안정적인 실행에는 현재 릴리스 태그를 사용하고, 아직 배포되지 않은 최신 동작을
의도적으로 확인할 때만 `@main`을 사용하세요. 전체 입력값은
[GitHub Action 문서](docs/github-action.ko.md)에 정리했습니다.

Marketplace 등록값:

- Action name: `AIGate AI Git Workflow Guard CLI`
- 주요 카테고리: `Code quality`
- 보조 카테고리: `Security`
- 릴리스 제목: `AIGate AI Git Workflow Guard CLI v0.1.6`

## AI 에이전트 연동

```sh
aigate integrate all
aigate ai report
aigate ai report --apply --provider codex
aigate aitest --provider codex
aigate aitest --apply --provider codex
```

이 명령은 `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`,
`.aigate/integrations/*`를 생성해서 Codex, Gemini, Claude Code가 같은
브랜치, 검증, guarded push 규칙을 따르게 합니다. `aigate aitest`는
`.aigate/reports/ai-test.md`에 수정 프롬프트를 쓰고, `--apply`를 명시했을 때만
Codex, Claude, Gemini 또는 사용자 지정 `--agent-command`를 실행합니다.

`aigate ai report`는 현재 Git 상태, 저장소 기반 점수, 릴리스 준비 상태,
브랜치 전략, AI 전달 프롬프트를 한 번에 정리합니다. 기본 실행은 파일을 바꾸지
않고, `--apply --provider codex|claude|gemini`를 붙였을 때만 선택한 AI CLI를
실행합니다.

`--apply` 실행 중에는 프롬프트 경로, 제공자, 에이전트 명령, 실시간 에이전트
출력이 터미널에 표시되고, 최종 리포트에는 stdout/stderr가 함께 남습니다.

## 문서 바로가기

- [다국어 문서 색인](docs/README.ko.md)
- [한국어 사용 가이드](docs/usage.ko.md)
- [한국어 운영 문서](docs/operations.ko.md)
- [도구 비교](docs/comparison.ko.md)
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

## AIGate 성장에 기여하기

- AIGate가 위험한 push를 막아줬다면 repository에 star나 watch를 남겨주세요.
- 실제 저장소에서 사용한 사례를 issue로 공유해 주세요.
- 프로젝트를 소개할 때 demo GIF, 터미널 스크린샷, `assets/social-preview.png`를 함께 써주세요.
- 문서, 예제, integration, packaging 관련 good first issue를 골라 기여할 수 있습니다.

## 라이선스

MIT

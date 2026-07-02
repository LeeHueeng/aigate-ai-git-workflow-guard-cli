# AIGate 운영 문서

[English](operations.en.md) | [한국어](operations.ko.md) | [日本語](operations.ja.md) | [中文](operations.zh.md)

이 문서는 GitHub에서 코드가 아니라 문서로 바로 읽을 수 있는 운영 문서입니다.
시각형 HTML 문서는 로컬에서 `docs/aigate-overview.ko.html` 파일을 열어 확인할 수 있습니다.
그대로 실행할 명령어 중심 안내는 [사용 가이드](usage.ko.md)에서 확인하세요.

## 전체 운영 프로세스

```mermaid
flowchart LR
  A["aigate start 실행"] --> B["Git 변경 감지"]
  B --> C["aigate test 실행"]
  C --> D["실패 시 aitest 실행"]
  D --> E["범위가 명확한 커밋"]
  E --> F["검증 후 push"]
  F --> G["PR 생성"]
  G --> H["CI 확인"]
  H --> I["main 병합"]
  I --> J["릴리스 점검"]
  J --> K["태그 배포"]
  K --> L["npm 공개"]
```

## 릴리스 프로세스

```mermaid
flowchart LR
  A["package version bump"] --> B["npm run ci 실행"]
  B --> C["vX.Y.Z 태그 생성"]
  C --> D["GitHub Actions release workflow"]
  D --> E["npm Trusted Publishing"]
  E --> F["GitHub Release note"]
```

## 명령어 맵

| 영역 | 명령어 |
| --- | --- |
| 설정 | `start`, `start --route default`, `start --route oss`, `init`, `setup`, `settings`, `integrate` |
| 첫 실행 | `doctor`, `demo`, `install-hook --pre-push` |
| 보호 게이트 | `check`, `test`, `aitest`, `git-ready`, `push`, `pr` |
| 리포트 | `ai report`, `pr-check`, `report`, `evaluate-project`, `compliance-report`, `dashboard`, `audit-report` |
| 릴리스 | `release-check`, `release-check --npm`, `branch-strategy`, `branch-strategy --compare`, `notify` |

## 대표 실행 경로

```sh
npm install -g aigate-cli
aigate setup --language ko
aigate ai report
aigate start --route default --ask-steps
aigate start --route oss --dry-run
aigate start --route ai --provider all
git switch -c feature/my-change
aigate doctor
aigate install-hook --pre-push
aigate test
aigate aitest
aigate git-ready
git add <files>
git commit -m "feat: short summary"
aigate push -u origin feature/my-change
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
aigate github comment --pr <number>
aigate github check --output .aigate/reports/github-check.md
aigate trends record
aigate compliance-report --output .aigate/reports/compliance.md
aigate dashboard --output .aigate/reports/dashboard.html
aigate branch-strategy --compare
aigate github setup --owner @your-org/team --dry-run
aigate release-check --npm
```

## 현재 구현된 기능

- npm 패키지 `aigate-cli` 공개 배포와 `npx` 실행
- `aigate start` 기반 안내형 시작 루트
- `aigate start --route default --ask-steps` 기반 단계별 기본 설정
- `aigate start --route default --steps init,repo-files` 기반 선택 단계 실행
- `aigate start --route oss` 기반 오픈소스 시작 파일 생성
- `aigate doctor` 기반 첫 실행 환경 진단
- `aigate demo` 기반 안내형 CLI 데모
- `aigate install-hook --pre-push` 기반 pre-push hook 설치
- Git 변경 파일과 untracked 파일 기반 readiness check
- `aigate test` 기반 프로젝트 테스트 자동화
- `aigate ai report` 기반 AI 프로젝트 상태 브리프
- `aigate aitest` 기반 AI 수정 프롬프트와 선택적 에이전트 실행
- secret 패턴 탐지와 SARIF 출력
- `git-ready`, guarded push, guarded PR 생성 흐름
- `aigate github` 기반 GitHub PR 댓글과 Checks 요약
- `aigate github setup` 기반 PR 템플릿과 CODEOWNERS 설정
- `action.yml` 기반 재사용 가능한 공개 GitHub Action
- Markdown, HTML, JSON, SARIF 리포트
- 컴플라이언스 리포트와 로컬 HTML 상태 대시보드
- 프로젝트 점수와 deep Git signal 평가
- `aigate trends` 기반 프로젝트 상태 추세 기록
- 브랜치 전략 추천, 제안 비교, 정책 팩 생성
- Codex/Gemini/Claude Code 통합 파일 생성
- 영어, 한국어, 일본어, 중국어 CLI 설정
- release-check와 npm Trusted Publishing workflow
- 터미널, Slack BLOCK, Discord, Teams, email, Linear, Jira 알림
- GHCR Docker 배포 workflow와 Homebrew formula 초안

## 미래에 구현할 기능

- 태그 기반 GHCR workflow 실행 후 public Docker image
- Homebrew tap publish
- standalone binary
- Linear/Jira workflow 연동 심화
- organization dashboard와 엔터프라이즈 거버넌스 pack

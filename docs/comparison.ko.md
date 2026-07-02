# AIGate와 Husky, Lefthook, pre-commit, Gitleaks 비교

[English](comparison.md) | [한국어](comparison.ko.md) | [日本語](comparison.ja.md) | [中文](comparison.zh.md)

AIGate는 모든 Git hook runner나 secret scanner를 대체하려는 도구가 아닙니다.
한 단계 위에서 AI-assisted 변경, PR 준비도, 저장소 건강도, 브랜치 전략,
릴리스 신뢰도를 함께 보는 workflow guard입니다.

## 빠른 비교

| 도구 | 가장 잘하는 일 | 계속 쓰면 좋은 경우 | AIGate가 맡는 부분 |
| --- | --- | --- | --- |
| Husky | JavaScript Git hook 연결 | npm script 기반 hook만 필요할 때 | pre-push hook에서 실행할 readiness gate가 됩니다. |
| Lefthook | 빠른 다중 언어 hook 실행 | 여러 언어의 hook을 빠르게 묶어야 할 때 | PR 준비도, 저장소 점수, 브랜치 전략, 리포트를 추가합니다. |
| pre-commit | hook 생태계와 반복 가능한 로컬 검사 | 팀이 이미 pre-commit hook을 표준으로 쓸 때 | AI workflow, GitHub, 릴리스 검사를 보완합니다. |
| Gitleaks | 깊은 secret scanning | 높은 커버리지의 전용 secret scanner가 필요할 때 | 변경 파일 중심의 가벼운 secret check와 SARIF 출력을 제공합니다. |
| AIGate | AI-assisted Git workflow guard | push나 PR 전 zero-config gate가 필요할 때 | readiness, risk, report, notification, branch policy, AI agent instruction을 묶습니다. |

## 추천 조합

| 상황 | 명령 흐름 |
| --- | --- |
| 작은 AI-assisted 프로젝트 | `aigate doctor` -> `aigate install-hook --pre-push` -> `aigate git-ready` |
| Husky를 이미 쓰는 JavaScript 프로젝트 | 기존 Husky pre-push hook에서 `aigate git-ready`를 실행 |
| Lefthook 또는 pre-commit을 쓰는 팀 | 기존 test/lint hook은 유지하고 PR 전 `aigate pr-check` 추가 |
| 보안 민감 저장소 | CI에서 Gitleaks를 돌리고 `aigate report --format sarif`로 변경 파일 context 보강 |
| 공개 오픈소스 패키지 | `aigate release-check --npm`, GitHub Action, `aigate branch-strategy --compare` 사용 |

## AIGate가 잘 맞는 경우

- Codex, Gemini, Claude Code, Cursor 같은 AI coding assistant를 쓴다.
- `git push` 전에 무엇이 바뀌었는지 설명해주는 로컬 gate가 필요하다.
- PR 준비도, 프로젝트 점수, 릴리스 준비도, 브랜치 전략을 하나의 CLI에서 보고 싶다.
- Markdown, HTML, JSON, SARIF 출력이 로컬과 CI 모두에서 필요하다.
- AI agent도 사람과 같은 저장소 workflow를 따르게 만들고 싶다.

## 다른 도구가 먼저 필요한 경우

- hook orchestration이 핵심이면 Husky나 Lefthook이 먼저입니다.
- 팀 표준이 pre-commit 생태계라면 pre-commit을 중심에 두세요.
- deep secret scanning coverage가 핵심이면 Gitleaks를 먼저 두세요.

AIGate는 이런 검사들을 push safety, PR quality, repository governance로 묶어
사람이 읽을 수 있게 만드는 workflow layer일 때 가장 강합니다.

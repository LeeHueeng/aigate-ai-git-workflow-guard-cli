# AI 연동

[English](ai-integrations.md) | [한국어](ai-integrations.ko.md) | [日本語](ai-integrations.ja.md) | [中文](ai-integrations.zh.md)

AIGate는 Codex, Gemini, Claude Code 같은 AI assistant가 저장소 안에서 같은 규칙을
따르도록 로컬 지침 파일을 생성합니다.

## 연동 파일 생성

```sh
aigate integrate all
```

Provider별 생성:

```sh
aigate integrate codex
aigate integrate gemini
aigate integrate claude
```

다른 폴더에 미리보기:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

기존 파일 재생성:

```sh
aigate integrate all --force
```

## AI 프로젝트 리포트

```sh
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate ai report --apply --provider claude
```

`aigate ai report`는 현재 문제점, 잘된 점, 방향성, 추천 명령어, 릴리스 준비
상태, 브랜치 전략을 정리하고 AI 전달 프롬프트도 렌더링합니다. 기본값은 파일을
수정하지 않습니다. `--apply`를 넘겼을 때만 설치된 로컬 AI CLI를 실행합니다.

`--apply` 중에는 AIGate가 프롬프트 경로, 제공자, 에이전트 명령을 먼저 보여주고
에이전트 stdout/stderr를 터미널에 실시간으로 표시합니다. 최종 리포트에도 명령,
소요 시간, 종료 코드, stdout, stderr를 남겨 나중에 다시 확인할 수 있습니다.

## AI 테스트 수정 흐름

```sh
aigate test
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate aitest`는 실패한 명령, 캡처한 출력, Git 준비 상태 요약, 수정 지시를
`.aigate/reports/ai-test.md`에 작성합니다. 기본값은 파일을 수정하지 않습니다.
`--apply`를 넘겼을 때만 설치된 로컬 CLI를 실행합니다. Codex는 `codex exec`,
Claude는 `claude --print`, Gemini는 `gemini -p` 경로를 사용합니다.

이 출력은 모델의 숨겨진 사고 과정이 아니라 AIGate의 실행 추적입니다. 즉, 어떤
프롬프트를 만들었고 어떤 명령을 실행했으며 에이전트가 무엇을 출력했는지 보여줍니다.

## 생성되는 파일

| 파일 | 목적 |
| --- | --- |
| `AGENTS.md` | Codex용 저장소 지침 |
| `GEMINI.md` | Gemini용 저장소 지침 |
| `CLAUDE.md` | Claude Code용 저장소 지침 |
| `.aigate/integrations.json` | machine-readable 연동 manifest |
| `.aigate/integrations/README.md` | 공통 연동 개요 |
| `.aigate/integrations/codex.md` | Codex 전용 연동 메모 |
| `.aigate/integrations/gemini.md` | Gemini 전용 연동 메모 |
| `.aigate/integrations/claude.md` | Claude Code 전용 연동 메모 |

## Assistant 규칙

생성된 지침은 assistant에게 다음을 요구합니다.

- `README.md`, `.aigate.yml`, `docs/branch-strategy.md`,
  `docs/git-upload-workflow.md`를 먼저 읽기
- `main`에 직접 push하지 않기
- 범위가 명확한 브랜치와 Conventional Commits 사용
- 프로젝트 프로필에서 감지된 검증 명령 실행. 예: pnpm 앱은 `pnpm run ci`,
  npm 패키지는 `npm run ci`
- push 또는 merge 전 `aigate git-ready` 실행
- `aigate push -u origin <branch>` 사용
- `main` 대상으로 pull request 또는 GitLab merge request 열기
- merge 전에 `GitHub CI workflow` 또는 `GitLab CI pipeline` 같은 설정된 필수 검사 통과 대기

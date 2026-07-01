# AI 연동

[English](ai-integrations.md) | [한국어](ai-integrations.ko.md) | [日本語](ai-integrations.ja.md) | [中文](ai-integrations.zh.md)

AIGate는 Codex와 Gemini 같은 AI assistant가 저장소 안에서 같은 규칙을
따르도록 로컬 지침 파일을 생성합니다.

## 연동 파일 생성

```sh
aigate integrate all
```

Provider별 생성:

```sh
aigate integrate codex
aigate integrate gemini
```

다른 폴더에 미리보기:

```sh
aigate integrate all --output-dir /tmp/aigate-preview
```

기존 파일 재생성:

```sh
aigate integrate all --force
```

## 생성되는 파일

| 파일 | 목적 |
| --- | --- |
| `AGENTS.md` | Codex용 저장소 지침 |
| `GEMINI.md` | Gemini용 저장소 지침 |
| `.aigate/integrations.json` | machine-readable 연동 manifest |
| `.aigate/integrations/README.md` | 공통 연동 개요 |
| `.aigate/integrations/codex.md` | Codex 전용 연동 메모 |
| `.aigate/integrations/gemini.md` | Gemini 전용 연동 메모 |

## Assistant 규칙

생성된 지침은 assistant에게 다음을 요구합니다.

- `README.md`, `.aigate.yml`, `docs/branch-strategy.md`,
  `docs/git-upload-workflow.md`를 먼저 읽기
- `main`에 직접 push하지 않기
- 범위가 명확한 브랜치와 Conventional Commits 사용
- `npm run ci`와 `aigate git-ready` 실행
- `aigate push -u origin <branch>` 사용
- `main` 대상으로 pull request 열기
- merge 전에 `test (20)`, `test (22)` 통과 대기

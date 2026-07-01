# 브랜치 전략

[English](branch-strategy.md) | [한국어](branch-strategy.ko.md) | [日本語](branch-strategy.ja.md) | [中文](branch-strategy.zh.md)

AIGate는 기본 개발 모델로 GitHub Flow를 사용하고, package publish를 위해
release branch와 npm dist-tag 전략을 함께 둡니다.

## 목표

- `main`을 안정적이고 언제든 releasable한 상태로 유지합니다.
- 의미 있는 변경은 pull request로 review 가능하게 만듭니다.
- Conventional Commits로 history를 명확하게 유지합니다.
- AI-assisted work가 빠르게 진행되어도 unrelated changes가 섞이지 않게 합니다.
- `latest`, `next`, `beta`, `canary` public package channel을 지원합니다.

## 영구 브랜치

| Branch | 목적 | 규칙 |
| --- | --- | --- |
| `main` | stable source of truth | protected, bootstrap 이후 direct push 금지, 모든 변경은 PR로 반영 |
| `release/*` | release stabilization | versioned release 준비 시에만 생성 |
| `hotfix/*` | urgent production fix | latest stable tag 또는 `main`에서 분기하고 PR로 다시 merge |

## 작업 브랜치 prefix

| Prefix | 용도 |
| --- | --- |
| `codex/*` | AI-assisted implementation 또는 repository maintenance |
| `feature/*` | 사용자-facing feature |
| `fix/*` | bug fix |
| `docs/*` | documentation-only changes |
| `chore/*` | tooling, metadata, release, maintenance |
| `test/*` | test-only improvements |
| `experiment/*` | merge 없이 닫을 수 있는 short-lived spike |

## Pull request 규칙

- pull request 하나에는 하나의 관심사만 담습니다.
- branch name은 `feature/report-generator`처럼 의도를 드러냅니다.
- summary, validation steps, release/documentation impact를 포함합니다.
- merge 전 review conversation을 모두 해결합니다.
- review 요청 전 로컬에서 `npm run git:ready`를 실행합니다.
- maintainer가 확정되면 CODEOWNERS review를 요구합니다.

## Commit 전략

Conventional Commits를 사용합니다.

```text
feat: add branch strategy recommendation command
fix: handle repositories without commits
docs: explain public release channels
test: cover report output formats
chore: initialize public repository metadata
```

## GitHub 보호 규칙

`main`에는 다음 branch protection을 둡니다.

- merge 전 pull request 필수
- 최소 1 approval
- CODEOWNERS가 있으면 matching owner review
- required status checks 통과
- conversation resolution 필수
- force push 차단
- deletion 차단
- release automation과 맞으면 linear history 요구

초기 required status checks:

- `test (20)`
- `test (22)`
- future: `npm run lint`
- future: `npm run typecheck`

## Release branch flow

1. 완료된 작업을 `main`에 merge합니다.
2. 필요할 때만 `release/vX.Y.Z`를 만들어 stabilization합니다.
3. release candidate는 `next`, `beta`, `canary` dist-tag로 publish합니다.
4. stable release는 `vX.Y.Z` tag를 붙입니다.
5. stable package는 `latest` dist-tag로 publish합니다.
6. release fix는 다시 `main`에 merge합니다.

## AI-assisted work 규칙

- assistant-generated implementation은 `codex/*` branch를 사용합니다.
- 생성물은 의도된 docs, template, reproducible fixture일 때만 source에 둡니다.
- unrelated work가 있으면 file을 명시적으로 stage합니다.
- 하나의 mixed commit보다 작은 commit 여러 개를 선호합니다.
- PR body에 validation command를 포함합니다.
- AI-assisted work를 push하기 전 `npm run git:ready`를 실행합니다.

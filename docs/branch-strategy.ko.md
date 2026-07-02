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
- 기본값으로 필수 approval 요구 안 함
- 저장소 정책상 필요할 때 maintainer 또는 CODEOWNER review 활성화
- required status checks 통과
- conversation resolution 필수
- force push 차단
- deletion 차단
- release automation과 맞으면 linear history 요구

초기 required status checks:

- GitHub 저장소는 `GitHub CI workflow`, GitLab 저장소는 `GitLab CI pipeline`
- `aigate git-ready`
- local: `npm run lint`
- local: `npm run typecheck`

## 제안 비교

`aigate branch-strategy --compare`는 릴리스 채널을 포함한 GitHub Flow,
Trunk 기반 개발, Hybrid Flow, Git Flow를 비교합니다. 각 제안에는 적합 점수,
브랜치 규칙, 적합한 상황, 강점, 위험, 전환 단계, 정책 적용 방식이 포함됩니다.

저장소 신호가 충분해서 여러 브랜치 모델을 비교해야 할 때 사용합니다.

```sh
aigate branch-strategy --compare --team-size 8 --release weekly
aigate branch-strategy --compare --team-size 14 --release monthly --language ko
```

## 생성되는 정책 팩

`aigate branch-strategy --apply`는 `.aigate/policy-packs/` 아래에 재사용
가능한 정책 팩을 생성합니다.

- `branch-protection.json`: 보호 브랜치, 리뷰, 상태 검사, force push 규칙
- `pr-quality.json`: PR 섹션, 검증 명령, 위험 라벨, 품질 게이트
- `release-channels.json`: npm dist-tag, 릴리스 태그, 태그 전 검증 규칙
- `ai-collaboration.json`: AI 지원 브랜치 prefix, 필수 저장소 문맥, 보호 명령

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

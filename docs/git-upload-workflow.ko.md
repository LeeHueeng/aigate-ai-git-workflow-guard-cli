# Git 업로드 workflow

[English](git-upload-workflow.md) | [한국어](git-upload-workflow.ko.md) | [日本語](git-upload-workflow.ja.md) | [中文](git-upload-workflow.zh.md)

GitHub에 push되는 모든 AIGate 변경에 이 workflow를 사용합니다.

## 1. 올바른 브랜치에서 시작

```sh
git switch main
git pull --ff-only
git switch -c feature/<short-name>
```

Prefix:

- `feature/*`: 새 user-facing behavior
- `fix/*`: bug fix
- `docs/*`: documentation
- `chore/*`: maintenance
- `codex/*`: AI-assisted repository work

## 2. Commit 전 확인

CLI 언어를 한 번 선택합니다. 지원 값은 `en`, `ko`, `ja`, `zh`입니다.

```sh
aigate setup --language ko
```

```sh
npm run git:ready
git status --short --branch
```

`npm run git:ready`는 syntax check, test suite, before-push gate,
package dry-run validation을 실행합니다.

Gate는 다음 상황에서 block합니다.

- secret 가능성이 있는 file name
- repository foundation 누락
- project foundation score가 80 미만

## 3. 명확한 경계로 commit

```sh
git add <files>
git commit -m "type: short summary"
```

Conventional Commits 예시:

- `feat: add report command`
- `fix: handle empty repositories`
- `docs: document branch protection`
- `chore: update repository metadata`
- `test: cover git-ready output`

## 4. Push와 PR 생성

```sh
aigate push -u origin <branch>
```

`aigate push`는 먼저 AIGate readiness gate를 실행합니다. 통과하면 남은 인자를
`git push`로 전달합니다. 원격 변경 없이 미리 보려면
`aigate push --dry-run origin <branch>`를 사용합니다.

PR에는 다음을 포함합니다.

- 변경 내용
- 변경 이유
- PR readiness report findings
- validation commands
- release 또는 documentation impact

```sh
aigate pr-check --output .aigate/reports/pr.md
aigate pr --title "feat: short summary"
```

## 5. Merge 규칙

다음을 만족하기 전에는 merge하지 않습니다.

- `GitHub CI workflow` 또는 `GitLab CI pipeline` 같은 설정된 CI 검사 통과
- `aigate git-ready`가 로컬 또는 CI에서 통과
- 저장소의 현재 review 정책 준수
- review를 사용했다면 review conversation 해결
- branch에 unrelated changes 없음

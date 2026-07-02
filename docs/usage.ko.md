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
aigate setup --language en
aigate setup --language ko
aigate setup --language ja
aigate setup --language zh
```

## 저장소에서 첫 실행

Git 저장소 루트로 이동한 뒤 실행합니다.

```sh
aigate start
aigate start --route default --ask-steps
aigate start --route default --steps init,repo-files
aigate start --route oss --dry-run
aigate start --route oss --owner @your-org/team
aigate start --route ai --provider codex
aigate start --route full --provider all
aigate init
aigate reset --dry-run
aigate clean
aigate uninstall
aigate doctor
aigate demo
aigate install-hook --pre-push
```

각 명령의 역할:

| 명령어 | 목적 |
| --- | --- |
| `aigate start` | TTY에서는 화살표 선택 메뉴를 열고, 비대화형 shell에서는 quickstart 루트를 실행합니다. 첫 번째 루트는 기본 설정 흐름입니다. |
| `aigate start --route default --ask-steps` | 기본 설정 흐름에서 추천 단계마다 예/아니오를 묻고 실행합니다. |
| `aigate start --route default --steps init,repo-files` | 선택한 설정 단계 ID만 실행하고 나머지는 건너뜁니다. |
| `aigate start --route oss --owner @your-org/team` | README, 기여 문서, 이슈 템플릿, PR 템플릿, CODEOWNERS, 운영 문서 초안을 생성합니다. 기존 파일은 `--force` 없이는 덮어쓰지 않습니다. |
| `aigate start --route ai --provider codex` | AIGate 설정과 Codex 지침 파일을 생성합니다. |
| `aigate start --route full --provider all` | 설정, AI 파일, pre-push hook, 릴리스 점검을 한 흐름으로 실행합니다. |
| `aigate setup --language ko` | CLI 출력 언어를 저장합니다. |
| `aigate init` | `.aigate.yml`과 리포트 디렉터리를 생성합니다. |
| `aigate reset` | AIGate config, settings, 리포트 placeholder를 다시 작성합니다. `--dry-run`으로 미리 볼 수 있습니다. |
| `aigate clean --force` | 생성된 AIGate 리포트와 로컬 생성 상태를 삭제합니다. `--force`가 없으면 대상만 미리 봅니다. |
| `aigate uninstall --force` | `.aigate.yml`, `.aigate/`, AIGate 소유 pre-push hook을 제거합니다. |
| `aigate doctor` | Node, Git, 감지된 테스트 명령, CI 프로필, 오래된 생성 파일, AIGate 설정을 점검합니다. |
| `aigate demo` | 프로젝트 파일을 바꾸지 않고 주요 흐름을 보여줍니다. |
| `aigate install-hook --pre-push` | push 전에 AIGate가 실행되는 pre-push hook을 설치합니다. |

## 상황별 사용 예시

지금 무엇을 실행해야 하는지 헷갈릴 때는 아래 루틴부터 고르면 됩니다.

| 상황 | 프로세스 | 예시 명령 |
| --- | --- | --- |
| 처음 저장소에 도입할 때 | 기본 설정을 고르고 필요한 파일만 만든 뒤 진단 결과를 확인합니다. | `aigate start --route default --ask-steps` -> `aigate doctor` -> `aigate install-hook --pre-push` |
| AI 에이전트가 파일을 많이 바꾼 뒤 | 변경 파일과 secret 위험을 먼저 보고, 테스트 실패는 AI 수정 프롬프트로 넘깁니다. | `aigate check` -> `aigate test` -> `aigate aitest` |
| PR을 열기 직전 | 로컬 gate를 통과시키고, 보호된 push 후 리뷰어용 요약을 생성합니다. | `aigate git-ready` -> `aigate push -u origin feature/my-work` -> `aigate pr-check` |
| private GitLab 모노레포 | 프로필을 고정하고 workspace 테스트를 감지해 실행하며 GitHub 전용 점수 노이즈를 줄입니다. | `aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm` -> `aigate test` -> `aigate evaluate-project` |
| 오픈소스 공개 준비 | 공개 기여 파일을 만들고 저장소 기반 점수를 확인합니다. | `aigate start --route oss --owner @team` -> `aigate evaluate-project --deep --report` -> `aigate github setup --dry-run` |
| 릴리스 전후 | 태그와 npm 상태를 점검하고, CI 후 상태 추세를 남깁니다. | `aigate release-check --npm` -> `npm run ci` -> `aigate trends record` |
| 로컬 상태를 비우거나 제거할 때 | 삭제 대상을 먼저 미리 본 뒤 확실할 때만 적용합니다. | `aigate clean` -> `aigate clean --force` -> `aigate uninstall --force` |

## 매일 쓰는 Git 흐름

```sh
git switch -c feature/my-work
aigate check
aigate test
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

## 테스트와 AI 자동 조치 흐름

```sh
aigate test
aigate test --script test
aigate test --command "npm run ci"
aigate ai report
aigate ai report --output .aigate/reports/ai-report.md
aigate ai report --apply --provider codex
aigate aitest
aigate aitest --provider codex
aigate aitest --apply --provider codex
aigate aitest --apply --provider claude
aigate aitest --apply --agent-command "codex exec --sandbox workspace-write --ask-for-approval never -"
```

`aigate test`는 `aigate git-ready`와 감지된 package-manager 명령을 함께
실행합니다. 루트 script, `turbo.json` task, `pnpm-workspace.yaml`,
`package.json` workspaces, 그리고 흔한 `apps/*` 또는 `packages/*` workspace
패키지를 탐색합니다. 감지된 package manager(`npm`, `pnpm`, `yarn`, `bun`)를
사용하며 `pnpm turbo run test` 또는 `pnpm -r run test` 같은 명령을 실행할 수
있습니다. `turbo` task는 package metadata에 `turbo`가 선언되어 있거나
`node_modules/.bin`에서 실행기를 찾을 수 있을 때만 선택하고, 없으면
`pnpm -r run test` 같은 workspace script로 대체 실행합니다. 프로젝트마다 다른
검사 명령을 쓰면 `--script` 또는 `--command`로 직접 지정합니다.

`aigate aitest`는 실패 요약, 테스트 출력, AI 수정 지시를
`.aigate/reports/ai-test.md`에 작성합니다. 기본값은 코드를 수정하지 않는
안전 모드입니다. 실제 Codex, Claude, Gemini CLI 또는 사용자 지정 에이전트를
실행하려면 `--apply`를 명시합니다.

`aigate ai report`는 더 넓은 프로젝트 브리프입니다. 현재 문제점, 잘된 점,
방향성, 추천 명령어, 릴리스 상태, 브랜치 전략, AI 전달 프롬프트를 정리합니다.
기본값은 코드를 수정하지 않는 안전 모드이며, 선택한 AI CLI를 실행하려면
`--apply --provider codex|claude|gemini`를 붙입니다. 기본 AI 리포트는 미생성
릴리스 태그를 참고 신호로만 다뤄 일반 PR 작업을 릴리스 차단 상태로 표시하지
않습니다. 엄격한 릴리스와 npm 배포 준비 상태를 보려면 `--npm`을 붙이세요.

`--apply`를 텍스트 모드로 실행하면 AIGate가 프롬프트 경로, 제공자, 에이전트
명령, 실시간 에이전트 출력을 터미널에 보여줍니다. 최종 리포트에도 에이전트
명령, 소요 시간, 종료 코드, stdout, stderr가 남습니다. JSON 출력은 자동화가
깨지지 않도록 stdout을 기계가 읽는 JSON으로 유지하고 진행 로그는 stderr로 보냅니다.

## 리포트와 출력 형식

```sh
aigate report --format markdown --output .aigate/reports/report.md
aigate report --format html --output .aigate/reports/report.html
aigate report --format json --output .aigate/reports/report.json
aigate report --format sarif --output .aigate/reports/aigate.sarif
aigate ai report --output .aigate/reports/ai-report.md
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
      - uses: LeeHueeng/aigate-ai-git-workflow-guard-cli@v0.1.6
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
aigate release-check --project-type app
aigate release-check --project-type package --npm
```

`branch-strategy`는 브랜치 규칙을 추천하고 정책 팩을 생성할 수 있습니다.
`release-check --npm`은 package metadata, release tag, workflow provenance,
npm 배포 상태가 준비됐는지 확인합니다.

AIGate는 저장소 프로필을 자동 감지합니다: app/package, private/public,
GitHub/GitLab, npm/pnpm/yarn/bun, workspace 테스트 신호. private GitLab pnpm
앱에서는 GitHub 전용, 공개 OSS 거버넌스, npm 공개 배포 항목을 `할 일`이 아니라
package version 릴리스 gate까지 `해당 없음`으로 표시합니다. 그래서 내부 앱에
package release version이 없어도 `release-check --npm`이 차단하지 않습니다.
저장소를 npm 배포 패키지로 강제 검사해야 할 때만 `--project-type package`를
사용하세요.

`aigate doctor`는 생성된 AIGate 파일이 오래된 CLI로 만들어졌는지도 경고합니다.
예를 들어 현재 CLI가 `0.1.6`인데 `generatedBy: aigate 0.1.1`이 남아 있으면
`aigate init --force`와 `aigate integrate all --force`로 최신 프로필 동작을
다시 생성하세요.

자동 감지만으로 부족하면 프로필을 고정하세요:

```sh
aigate setup --hosting gitlab --ci-provider gitlab --project-type app --package-manager pnpm
aigate start --route oss --hosting gitlab --ci-provider gitlab --project-type app
```

팀 전체 기준으로 쓰려면 `.aigate.yml`에 커밋하세요:

```yaml
project:
  type: app
  hosting: gitlab
  ciProvider: gitlab
  packageManager: pnpm
```

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
| `aigate reset` | AIGate 설정과 settings를 초기화합니다. |
| `aigate clean` | 생성 리포트와 로컬 상태 삭제 대상을 미리 봅니다. 적용하려면 `--force`를 붙입니다. |
| `aigate uninstall` | 로컬 AIGate 설정, 상태, 소유 hook 제거 대상을 미리 봅니다. 적용하려면 `--force`를 붙입니다. |
| `aigate start` | 안내형 설정 루트를 선택하고 실행합니다. |
| `aigate start --route default --ask-steps` | 기본 추천 단계를 하나씩 확인한 뒤 실행합니다. |
| `aigate start --route default --steps init,repo-files` | 선택한 기본 설정 단계만 실행합니다. |
| `aigate start --route oss` | 공개 저장소용 README, 이슈 템플릿, PR 템플릿, CODEOWNERS, 기여 문서를 생성합니다. |
| `aigate check` | 로컬 Git 변경사항, 실제 secret findings, 민감 파일 제거 상태를 점검합니다. |
| `aigate test` | Git 준비 상태와 감지된 프로젝트 테스트 명령을 실행합니다. |
| `aigate ai report` | 현재 문제점, 잘된 점, 방향성, AI 전달 지침을 정리합니다. |
| `aigate aitest` | AI 수정 프롬프트를 작성하고 필요하면 Codex, Claude, Gemini를 실행합니다. |
| `aigate git-ready` | commit 또는 push 전 readiness gate를 실행합니다. |
| `aigate push` | 점검 후 `git push`를 호출합니다. |
| `aigate pr` | 유용한 본문을 포함한 pull request를 만듭니다. |
| `aigate pr-check` | PR 준비도와 위험 정보를 생성합니다. |
| `aigate github <comment\|check\|setup>` | PR comment, check summary, GitHub 보조 파일을 처리합니다. |
| `aigate doctor` | 로컬 환경과 저장소 기반을 진단합니다. |
| `aigate demo` | 파일 변경 없이 workflow를 보여줍니다. |
| `aigate install-hook` | Git hook을 설치합니다. |
| `aigate setup` | 언어, 호스팅, CI 제공자, 프로젝트 유형, 패키지 매니저 같은 로컬 설정을 저장합니다. |
| `aigate settings` | AIGate 설정을 조회합니다. |
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

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(rootDir, "docs");
const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
const version = packageJson.version;
const generatedOn = "2026-07-01";

const fileNames = {
  ko: "aigate-overview.ko.html",
  en: "aigate-overview.en.html",
  ja: "aigate-overview.ja.html",
  zh: "aigate-overview.zh.html"
};

const localeNames = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文"
};

const locales = {
  ko: {
    lang: "ko",
    dir: "ltr",
    title: "AIGate 운영 문서",
    eyebrow: "오픈소스 AI Git Workflow Guard CLI",
    subtitle: "AIGate가 어떤 흐름으로 동작하는지, 어떤 명령어를 제공하는지, 현재 구현된 기능과 앞으로의 기능 계획을 한눈에 설명합니다.",
    nav: ["개요", "프로세스", "명령어", "릴리스", "기능"],
    badges: ["npm 배포 완료", "Trusted Publishing 연결", "GitHub Release 운영", "CLI v" + version],
    summaryTitle: "지금까지 만든 것",
    summary: [
      "AIGate는 로컬 변경사항, secret 위험, 프로젝트 기반 점수, PR 준비 상태, 릴리스 준비 상태를 점검하는 CLI입니다.",
      "패키지는 npm의 aigate-cli로 공개되어 있으며, GitHub Actions와 npm Trusted Publishing으로 태그 기반 자동 배포가 가능합니다.",
      "Codex와 Gemini가 같은 저장소 규칙을 따르도록 통합 파일을 생성하는 기능도 포함되어 있습니다."
    ],
    installTitle: "설치와 빠른 실행",
    installCaption: "설치 없이도 npx로 바로 실행할 수 있습니다.",
    flowTitle: "전체 운영 프로세스",
    flowIntro: "AIGate는 개발자가 커밋하기 전부터 PR, CI, 릴리스, npm 배포까지 같은 기준으로 검증하도록 설계되었습니다.",
    processSteps: [
      ["변경 감지", "Git diff와 untracked 파일 확인"],
      ["로컬 게이트", "git-ready가 테스트, secret, 점수를 확인"],
      ["커밋", "Conventional Commit으로 범위 고정"],
      ["Guarded push", "aigate push가 push 전 검증"],
      ["PR 생성", "aigate pr과 pr-check로 설명 생성"],
      ["CI 확인", "Node 20/22 테스트와 Scorecard"],
      ["병합", "main은 항상 배포 가능 상태 유지"],
      ["릴리스 점검", "release-check --npm으로 tag/npm 상태 확인"],
      ["태그 배포", "vX.Y.Z 태그가 GitHub Actions 실행"],
      ["npm 공개", "Trusted Publishing으로 provenance 포함 배포"]
    ],
    releaseTitle: "릴리스 자동화 차트",
    releaseIntro: "첫 배포 이후에는 버전 bump와 태그 push가 릴리스의 핵심 트리거입니다.",
    releaseSteps: [
      ["버전 bump", "package.json과 lockfile"],
      ["검증", "npm run ci + dry-run"],
      ["태그 생성", "git tag vX.Y.Z"],
      ["GitHub Actions", "release.yml 실행"],
      ["npm publish", "OIDC Trusted Publishing"],
      ["Release note", "GitHub Release 작성"]
    ],
    commandMapTitle: "명령어 맵",
    commandGroups: [
      ["설정", ["init", "setup", "settings", "integrate"]],
      ["첫 실행", ["doctor", "demo", "install-hook"]],
      ["보호 게이트", ["check", "git-ready", "push", "pr"]],
      ["보고서", ["pr-check", "github comment", "github check", "github setup", "trends", "report", "evaluate-project", "audit-report"]],
      ["릴리스", ["release-check", "release-check --npm", "branch-strategy", "notify"]]
    ],
    commandsTitle: "전체 명령어와 사용 과정",
    commandHeaders: ["명령어", "용도", "언제 쓰는가"],
    commands: [
      ["npm install -g aigate-cli", "CLI를 전역 설치합니다.", "처음 사용하는 개발자 환경"],
      ["npx aigate-cli check", "설치 없이 현재 저장소 상태를 확인합니다.", "빠른 체험 또는 CI 전 점검"],
      ["aigate init", "AIGate 기본 설정 파일과 리포트 폴더를 만듭니다.", "새 프로젝트에 AIGate를 적용할 때"],
      ["aigate setup --language <en|ko|ja|zh>", "CLI 출력 언어를 저장합니다.", "팀 기본 언어를 맞출 때"],
      ["aigate settings", "현재 AIGate 설정을 확인합니다.", "설정 검증"],
      ["aigate doctor", "첫 실행 환경, Git hook, 프로젝트 기반 상태를 진단합니다.", "처음 실행하거나 저장소 상태를 점검할 때"],
      ["aigate demo", "파일을 바꾸지 않고 AIGate 사용 흐름을 보여줍니다.", "처음 체험하거나 팀에 사용법을 설명할 때"],
      ["aigate install-hook --pre-push", "git push 전에 git-ready가 실행되도록 pre-push hook을 설치합니다.", "push 실수를 로컬에서 막고 싶을 때"],
      ["aigate check", "변경 파일과 secret 위험을 요약합니다.", "커밋 전 가벼운 점검"],
      ["aigate git-ready", "테스트, secret scan, 프로젝트 점수를 포함한 게이트를 실행합니다.", "커밋/푸시 전 필수 점검"],
      ["aigate push -u origin <branch>", "검증 통과 후 git push를 실행합니다.", "브랜치를 원격에 올릴 때"],
      ["aigate pr-check", "PR 준비 상태 리포트를 생성합니다.", "PR 설명 작성 전"],
      ["aigate pr --title \"...\"", "GitHub CLI를 통해 PR을 생성합니다.", "브랜치 푸시 후"],
      ["aigate github comment --pr <number>", "PR에 AIGate 요약 댓글을 작성합니다.", "리뷰어에게 gate 결과를 남길 때"],
      ["aigate github check --format json", "GitHub Checks/Actions용 summary payload를 생성합니다.", "CI에서 AIGate 결과를 표시할 때"],
      ["aigate github setup --owner @team", "PR 템플릿과 CODEOWNERS를 설정합니다.", "공개 기여 흐름을 정리할 때"],
      ["aigate trends record", "프로젝트 상태 스냅샷을 기록합니다.", "릴리스 전후 상태 추세를 남길 때"],
      ["aigate trends show", "기록된 상태 추세를 요약합니다.", "팀 리뷰나 주간 점검 때"],
      ["aigate report --format markdown", "로컬 워크플로 리포트를 출력합니다.", "상태 공유"],
      ["aigate report --format sarif", "secret finding을 SARIF로 출력합니다.", "보안 도구 연동"],
      ["aigate evaluate-project", "저장소 기반 점수를 계산합니다.", "오픈소스 공개 준비 확인"],
      ["aigate evaluate-project --deep --report", "Git signal을 포함한 상세 평가 보고서를 만듭니다.", "릴리스/분기 리뷰"],
      ["aigate branch-strategy", "팀 규모와 릴리스 흐름에 맞는 브랜치 전략을 추천합니다.", "브랜치 정책 설계"],
      ["aigate branch-strategy --apply", "브랜치 정책, 릴리스, hotfix, PR, CODEOWNERS 초안을 생성합니다.", "정책 파일을 시작할 때"],
      ["aigate integrate all", "Codex와 Gemini 통합 문서를 생성합니다.", "AI assistant가 같은 규칙을 따르게 할 때"],
      ["aigate release-check", "패키지, workflow, tag 상태를 점검합니다.", "릴리스 태그 생성 전"],
      ["aigate release-check --npm", "npm registry에 해당 버전이 있는지 확인합니다.", "자동 배포 전후"],
      ["aigate audit-report", "거버넌스와 정책 상태를 요약합니다.", "운영 감사와 공개 준비 리뷰"],
      ["aigate notify send --channel terminal", "로컬 알림 이벤트를 출력합니다.", "게이트 차단 상황 확인"],
      ["aigate git-ready --notify-channel slack", "BLOCK 상황에서 Slack webhook 알림을 전송합니다.", "민감 정보나 고위험 변경이 차단될 때"],
      ["aigate notify test --channel slack", "Slack, Discord, Teams webhook payload를 테스트합니다.", "팀 채널 연동 점검"]
    ],
    branchTitle: "브랜치와 배포 흐름",
    branchText: "main은 보호된 안정 브랜치이며, codex/*와 feature/* 같은 작업 브랜치에서 PR을 만든 뒤 병합합니다. release/*와 hotfix/*는 배포 안정화와 긴급 수정에 예약되어 있습니다.",
    commandPathTitle: "대표 실행 경로",
    commandPath: [
      "npm install -g aigate-cli",
      "aigate setup --language ko",
      "git switch -c feature/my-change",
      "aigate doctor",
      "aigate install-hook --pre-push",
      "aigate git-ready",
      "git add <files>",
      "git commit -m \"feat: short summary\"",
      "aigate push -u origin feature/my-change",
      "aigate pr-check --output .aigate/reports/pr.md",
      "aigate pr --title \"feat: short summary\"",
      "aigate github comment --pr <number>",
      "aigate github check --output .aigate/reports/github-check.md",
      "aigate trends record",
      "aigate github setup --owner @your-org/team --dry-run",
      "aigate release-check --npm"
    ],
    currentTitle: "현재 구현된 기능",
    futureTitle: "미래에 구현할 기능",
    implemented: [
      "npm 패키지 aigate-cli 공개 배포와 npx 실행",
      "Git 변경사항과 untracked 파일 기반 readiness check",
      "doctor, demo, install-hook 기반 첫 실행 UX",
      "pre-push Git hook 설치",
      "secret 패턴 탐지와 SARIF 출력",
      "git-ready, guarded push, guarded PR 생성 흐름",
      "GitHub PR comment와 GitHub Checks summary payload",
      "PR 템플릿과 CODEOWNERS 안내형 설정",
      "재사용 가능한 공개 GitHub Action",
      "프로젝트 상태 추세 기록",
      "Markdown, HTML, JSON, SARIF 리포트",
      "프로젝트 점수와 deep Git signal 평가",
      "브랜치 전략 추천과 정책 초안 생성",
      "Codex/Gemini 통합 파일 생성",
      "한국어/영어/일본어/중국어 CLI 설정",
      "release-check와 release-check --npm",
      "npm Trusted Publishing 기반 자동 배포",
      "GitHub CI, OpenSSF Scorecard, GitHub Release 운영",
      "터미널, Slack BLOCK, Discord, Teams webhook 알림"
    ],
    future: [
      "Slack BLOCK 알림을 제품 수준 UX로 고도화",
      "Docker image 공개 배포",
      "Homebrew formula 배포",
      "email 알림 채널과 알림 정책 강화",
      "Linear/Jira 이슈 추적 연동",
      "standalone binary 배포",
      "조직 대시보드, 정책 pack, 감사/컴플라이언스 리포트",
      "self-hosted reporting, SSO/SAML, 엔터프라이즈 거버넌스"
    ],
    footer: "이 문서는 AIGate 공개 릴리스 이후의 운영 상태를 설명합니다."
  },
  en: {
    lang: "en",
    dir: "ltr",
    title: "AIGate Operations Guide",
    eyebrow: "Open Source AI Git Workflow Guard CLI",
    subtitle: "A compact guide to how AIGate works, which commands it provides, what is implemented today, and what is planned next.",
    nav: ["Overview", "Process", "Commands", "Release", "Features"],
    badges: ["npm live", "Trusted Publishing", "GitHub Releases", "CLI v" + version],
    summaryTitle: "What Has Been Built",
    summary: [
      "AIGate is a CLI that checks local changes, secret risk, project foundation score, pull request readiness, and release readiness.",
      "The package is public on npm as aigate-cli and can be released automatically from GitHub tags through npm Trusted Publishing.",
      "It can also generate Codex and Gemini integration files so AI assistants follow the same repository rules."
    ],
    installTitle: "Install And Quick Start",
    installCaption: "You can run it immediately through npx without installing it globally.",
    flowTitle: "End-To-End Operating Process",
    flowIntro: "AIGate keeps the same quality gate from local development through PR review, CI, release, and npm publishing.",
    processSteps: [
      ["Detect changes", "Read Git diff and untracked files"],
      ["Local gate", "git-ready checks tests, secrets, score"],
      ["Commit", "Keep scope with Conventional Commits"],
      ["Guarded push", "aigate push validates before push"],
      ["Open PR", "aigate pr and pr-check prepare context"],
      ["CI checks", "Node 20/22 tests and Scorecard"],
      ["Merge", "main remains releasable"],
      ["Release check", "release-check --npm checks tag/npm state"],
      ["Tag release", "vX.Y.Z tag triggers GitHub Actions"],
      ["Publish npm", "Trusted Publishing with provenance"]
    ],
    releaseTitle: "Release Automation Chart",
    releaseIntro: "After the first public release, version bumps and tag pushes are the main release triggers.",
    releaseSteps: [
      ["Version bump", "package.json and lockfile"],
      ["Validation", "npm run ci + dry run"],
      ["Create tag", "git tag vX.Y.Z"],
      ["GitHub Actions", "Run release.yml"],
      ["npm publish", "OIDC Trusted Publishing"],
      ["Release notes", "Create GitHub Release"]
    ],
    commandMapTitle: "Command Map",
    commandGroups: [
      ["Setup", ["init", "setup", "settings", "integrate"]],
      ["First run", ["doctor", "demo", "install-hook"]],
      ["Guard gates", ["check", "git-ready", "push", "pr"]],
      ["Reports", ["pr-check", "github comment", "github check", "github setup", "trends", "report", "evaluate-project", "audit-report"]],
      ["Release", ["release-check", "release-check --npm", "branch-strategy", "notify"]]
    ],
    commandsTitle: "Commands And When To Use Them",
    commandHeaders: ["Command", "Purpose", "When to use it"],
    commands: [
      ["npm install -g aigate-cli", "Install the CLI globally.", "First-time developer setup"],
      ["npx aigate-cli check", "Check the repository without installing.", "Quick trial or pre-CI check"],
      ["aigate init", "Create starter configuration and report folders.", "When adopting AIGate in a new project"],
      ["aigate setup --language <en|ko|ja|zh>", "Save the CLI output language.", "When aligning team language"],
      ["aigate settings", "Show current AIGate settings.", "Configuration review"],
      ["aigate doctor", "Diagnose first-run environment, Git hook, and project foundations.", "First run or repository health check"],
      ["aigate demo", "Show the AIGate workflow without changing files.", "Trying the CLI or explaining it to a team"],
      ["aigate install-hook --pre-push", "Install a pre-push hook that runs git-ready before git push.", "Preventing risky pushes locally"],
      ["aigate check", "Summarize changed files and secret risk.", "Light pre-commit check"],
      ["aigate git-ready", "Run tests, secret scan, and project score gates.", "Required before commit or push"],
      ["aigate push -u origin <branch>", "Run the gate, then forward to git push.", "When publishing a branch"],
      ["aigate pr-check", "Generate a PR readiness report.", "Before writing the PR description"],
      ["aigate pr --title \"...\"", "Create a PR through GitHub CLI.", "After pushing a branch"],
      ["aigate github comment --pr <number>", "Post an AIGate summary comment to a pull request.", "Leaving gate results for reviewers"],
      ["aigate github check --format json", "Generate a GitHub Checks/Actions summary payload.", "Showing AIGate status in CI"],
      ["aigate github setup --owner @team", "Set up PR templates and CODEOWNERS.", "Opening the public contribution path"],
      ["aigate trends record", "Record a project health snapshot.", "Tracking state before and after releases"],
      ["aigate trends show", "Summarize recorded health trends.", "Team review or weekly checks"],
      ["aigate report --format markdown", "Print a local workflow report.", "Status sharing"],
      ["aigate report --format sarif", "Print secret findings as SARIF.", "Security tool integration"],
      ["aigate evaluate-project", "Score repository foundations.", "Open source readiness review"],
      ["aigate evaluate-project --deep --report", "Render a detailed report with Git signals.", "Release or quarterly review"],
      ["aigate branch-strategy", "Recommend a branch strategy for team and release cadence.", "Branch policy design"],
      ["aigate branch-strategy --apply", "Generate branch policy, release, hotfix, PR, and CODEOWNERS drafts.", "Starting policy files"],
      ["aigate integrate all", "Generate Codex and Gemini integration files.", "Keeping AI assistants aligned"],
      ["aigate release-check", "Check package, workflow, and tag readiness.", "Before creating a release tag"],
      ["aigate release-check --npm", "Check whether the version exists on npm.", "Before and after automated publishing"],
      ["aigate audit-report", "Summarize governance and policy posture.", "Operational audit and public readiness"],
      ["aigate notify send --channel terminal", "Print a local notification event.", "Checking gate-block events"],
      ["aigate git-ready --notify-channel slack", "Send a Slack webhook notification when a BLOCK occurs.", "When secrets or risky changes block the gate"],
      ["aigate notify test --channel slack", "Test Slack, Discord, and Teams webhook payloads.", "Validating team channel integrations"]
    ],
    branchTitle: "Branch And Delivery Flow",
    branchText: "main is the protected stable branch. Work happens on codex/*, feature/*, fix/*, docs/*, and chore/* branches, then lands through PRs. release/* and hotfix/* are reserved for release stabilization and urgent fixes.",
    commandPathTitle: "Typical Command Path",
    commandPath: [
      "npm install -g aigate-cli",
      "aigate setup --language en",
      "git switch -c feature/my-change",
      "aigate doctor",
      "aigate install-hook --pre-push",
      "aigate git-ready",
      "git add <files>",
      "git commit -m \"feat: short summary\"",
      "aigate push -u origin feature/my-change",
      "aigate pr-check --output .aigate/reports/pr.md",
      "aigate pr --title \"feat: short summary\"",
      "aigate github comment --pr <number>",
      "aigate github check --output .aigate/reports/github-check.md",
      "aigate trends record",
      "aigate github setup --owner @your-org/team --dry-run",
      "aigate release-check --npm"
    ],
    currentTitle: "Implemented Features",
    futureTitle: "Future Features",
    implemented: [
      "Public npm package aigate-cli and npx execution",
      "Git change and untracked-file readiness checks",
      "First-run UX through doctor, demo, and install-hook",
      "Pre-push Git hook installation",
      "Secret pattern detection and SARIF output",
      "git-ready, guarded push, and guarded PR creation",
      "GitHub PR comments and GitHub Checks summary payloads",
      "PR template and CODEOWNERS guided setup",
      "Reusable public GitHub Action",
      "Project health trend history",
      "Markdown, HTML, JSON, and SARIF reports",
      "Project scoring and deep Git signal evaluation",
      "Branch strategy recommendations and policy draft generation",
      "Codex/Gemini integration file generation",
      "Korean/English/Japanese/Chinese CLI settings",
      "release-check and release-check --npm",
      "Automated npm releases through Trusted Publishing",
      "GitHub CI, OpenSSF Scorecard, and GitHub Releases",
      "Terminal, Slack BLOCK, Discord, and Teams webhook notifications"
    ],
    future: [
      "Product-grade Slack BLOCK notification UX",
      "Published Docker image",
      "Homebrew formula",
      "Email channel and notification policy hardening",
      "Linear/Jira issue tracker integrations",
      "Standalone binary distribution",
      "Organization dashboards, policy packs, audit/compliance reports",
      "Self-hosted reporting, SSO/SAML, and enterprise governance"
    ],
    footer: "This document describes the operating state after the public AIGate release."
  },
  ja: {
    lang: "ja",
    dir: "ltr",
    title: "AIGate 運用ドキュメント",
    eyebrow: "オープンソース AI Git Workflow Guard CLI",
    subtitle: "AIGate の動作プロセス、提供コマンド、現在実装済みの機能、今後の計画をまとめた HTML ガイドです。",
    nav: ["概要", "プロセス", "コマンド", "リリース", "機能"],
    badges: ["npm 公開済み", "Trusted Publishing", "GitHub Release", "CLI v" + version],
    summaryTitle: "これまでに構築したもの",
    summary: [
      "AIGate は、ローカル変更、secret リスク、プロジェクト基盤スコア、PR 準備状況、リリース準備状況を確認する CLI です。",
      "パッケージは npm で aigate-cli として公開されており、GitHub tag と npm Trusted Publishing による自動リリースが可能です。",
      "Codex と Gemini が同じリポジトリ規則を守れるように、AI assistant 向け統合ファイルも生成できます。"
    ],
    installTitle: "インストールとクイックスタート",
    installCaption: "グローバルインストールなしでも npx ですぐに実行できます。",
    flowTitle: "全体運用プロセス",
    flowIntro: "AIGate はローカル開発から PR、CI、リリース、npm 公開まで同じ品質ゲートでつなぎます。",
    processSteps: [
      ["変更検出", "Git diff と untracked ファイルを確認"],
      ["ローカルゲート", "git-ready がテスト、secret、スコアを確認"],
      ["コミット", "Conventional Commit で範囲を固定"],
      ["保護付き push", "aigate push が push 前に検証"],
      ["PR 作成", "aigate pr と pr-check で文脈を準備"],
      ["CI 確認", "Node 20/22 テストと Scorecard"],
      ["マージ", "main を常にリリース可能に維持"],
      ["リリース確認", "release-check --npm で tag/npm 状態を確認"],
      ["タグ公開", "vX.Y.Z tag が GitHub Actions を起動"],
      ["npm 公開", "provenance 付き Trusted Publishing"]
    ],
    releaseTitle: "リリース自動化チャート",
    releaseIntro: "初回公開後は、バージョン更新と tag push が主なリリーストリガーです。",
    releaseSteps: [
      ["バージョン更新", "package.json と lockfile"],
      ["検証", "npm run ci + dry-run"],
      ["タグ作成", "git tag vX.Y.Z"],
      ["GitHub Actions", "release.yml を実行"],
      ["npm publish", "OIDC Trusted Publishing"],
      ["リリースノート", "GitHub Release を作成"]
    ],
    commandMapTitle: "コマンドマップ",
    commandGroups: [
      ["セットアップ", ["init", "setup", "settings", "integrate"]],
      ["初回実行", ["doctor", "demo", "install-hook"]],
      ["保護ゲート", ["check", "git-ready", "push", "pr"]],
      ["レポート", ["pr-check", "github comment", "github check", "github setup", "trends", "report", "evaluate-project", "audit-report"]],
      ["リリース", ["release-check", "release-check --npm", "branch-strategy", "notify"]]
    ],
    commandsTitle: "コマンド一覧と利用タイミング",
    commandHeaders: ["コマンド", "目的", "使う場面"],
    commands: [
      ["npm install -g aigate-cli", "CLI をグローバルにインストールします。", "初回セットアップ"],
      ["npx aigate-cli check", "インストールせずに現在のリポジトリを確認します。", "試用または CI 前確認"],
      ["aigate init", "基本設定とレポート用フォルダを作成します。", "新しいプロジェクトに導入するとき"],
      ["aigate setup --language <en|ko|ja|zh>", "CLI 出力言語を保存します。", "チームの出力言語をそろえるとき"],
      ["aigate settings", "現在の AIGate 設定を表示します。", "設定確認"],
      ["aigate doctor", "初回実行環境、Git hook、プロジェクト基盤を診断します。", "初回実行またはリポジトリ確認"],
      ["aigate demo", "ファイルを変更せず AIGate の利用フローを表示します。", "CLI の試用やチーム説明"],
      ["aigate install-hook --pre-push", "git push 前に git-ready を実行する pre-push hook をインストールします。", "危険な push をローカルで防ぐとき"],
      ["aigate check", "変更ファイルと secret リスクを要約します。", "軽いコミット前確認"],
      ["aigate git-ready", "テスト、secret scan、プロジェクトスコアを含むゲートを実行します。", "コミットまたは push 前"],
      ["aigate push -u origin <branch>", "ゲート通過後に git push を実行します。", "ブランチをリモートへ送るとき"],
      ["aigate pr-check", "PR 準備レポートを生成します。", "PR 説明を書く前"],
      ["aigate pr --title \"...\"", "GitHub CLI で PR を作成します。", "ブランチ push 後"],
      ["aigate github comment --pr <number>", "PR に AIGate summary comment を投稿します。", "レビュー担当者に gate 結果を残すとき"],
      ["aigate github check --format json", "GitHub Checks/Actions summary payload を生成します。", "CI で AIGate 状態を表示するとき"],
      ["aigate github setup --owner @team", "PR テンプレートと CODEOWNERS を設定します。", "公開コントリビューション導線を整えるとき"],
      ["aigate trends record", "プロジェクト状態スナップショットを記録します。", "リリース前後の状態推移を残すとき"],
      ["aigate trends show", "記録済み状態トレンドを要約します。", "チームレビューや週次確認"],
      ["aigate report --format markdown", "ローカルワークフローレポートを出力します。", "状態共有"],
      ["aigate report --format sarif", "secret finding を SARIF で出力します。", "セキュリティツール連携"],
      ["aigate evaluate-project", "リポジトリ基盤をスコア化します。", "公開準備レビュー"],
      ["aigate evaluate-project --deep --report", "Git signal を含む詳細レポートを生成します。", "リリースまたは定期レビュー"],
      ["aigate branch-strategy", "チームとリリース頻度に合うブランチ戦略を推薦します。", "ブランチポリシー設計"],
      ["aigate branch-strategy --apply", "ブランチポリシー、release、hotfix、PR、CODEOWNERS の草案を生成します。", "ポリシーファイル作成時"],
      ["aigate integrate all", "Codex と Gemini 統合ファイルを生成します。", "AI assistant の規則をそろえるとき"],
      ["aigate release-check", "パッケージ、workflow、tag の準備状態を確認します。", "リリース tag 作成前"],
      ["aigate release-check --npm", "該当バージョンが npm に存在するか確認します。", "自動公開の前後"],
      ["aigate audit-report", "ガバナンスとポリシー状態を要約します。", "運用監査と公開準備レビュー"],
      ["aigate notify send --channel terminal", "ローカル通知イベントを出力します。", "ゲートブロック確認"],
      ["aigate git-ready --notify-channel slack", "BLOCK 時に Slack webhook 通知を送信します。", "secret や高リスク変更でゲートが止まるとき"],
      ["aigate notify test --channel slack", "Slack、Discord、Teams webhook payload をテストします。", "チームチャンネル連携の確認"]
    ],
    branchTitle: "ブランチとデリバリーの流れ",
    branchText: "main は保護された安定ブランチです。作業は codex/*、feature/*、fix/*、docs/*、chore/* で行い、PR 経由で main に入れます。release/* と hotfix/* はリリース安定化と緊急修正用です。",
    commandPathTitle: "代表的な実行パス",
    commandPath: [
      "npm install -g aigate-cli",
      "aigate setup --language ja",
      "git switch -c feature/my-change",
      "aigate doctor",
      "aigate install-hook --pre-push",
      "aigate git-ready",
      "git add <files>",
      "git commit -m \"feat: short summary\"",
      "aigate push -u origin feature/my-change",
      "aigate pr-check --output .aigate/reports/pr.md",
      "aigate pr --title \"feat: short summary\"",
      "aigate github comment --pr <number>",
      "aigate github check --output .aigate/reports/github-check.md",
      "aigate trends record",
      "aigate github setup --owner @your-org/team --dry-run",
      "aigate release-check --npm"
    ],
    currentTitle: "現在実装済みの機能",
    futureTitle: "今後実装する機能",
    implemented: [
      "npm パッケージ aigate-cli の公開と npx 実行",
      "Git 変更と untracked ファイルの readiness check",
      "doctor、demo、install-hook による初回実行 UX",
      "pre-push Git hook のインストール",
      "secret パターン検出と SARIF 出力",
      "git-ready、保護付き push、保護付き PR 作成",
      "GitHub PR comment と GitHub Checks summary payload",
      "PR テンプレートと CODEOWNERS のガイド付き設定",
      "再利用可能な公開 GitHub Action",
      "プロジェクト状態トレンド履歴",
      "Markdown、HTML、JSON、SARIF レポート",
      "プロジェクトスコアと deep Git signal 評価",
      "ブランチ戦略推薦とポリシー草案生成",
      "Codex/Gemini 統合ファイル生成",
      "韓国語/英語/日本語/中国語 CLI 設定",
      "release-check と release-check --npm",
      "Trusted Publishing による npm 自動リリース",
      "GitHub CI、OpenSSF Scorecard、GitHub Release 運用",
      "ターミナル、Slack BLOCK、Discord、Teams webhook 通知"
    ],
    future: [
      "製品レベルの Slack BLOCK 通知 UX",
      "Docker image の公開配布",
      "Homebrew formula",
      "email チャンネルと通知ポリシー強化",
      "Linear/Jira 連携",
      "standalone binary 配布",
      "組織ダッシュボード、policy pack、監査/コンプライアンスレポート",
      "self-hosted reporting、SSO/SAML、エンタープライズガバナンス"
    ],
    footer: "この文書は AIGate の公開リリース後の運用状態を説明します。"
  },
  zh: {
    lang: "zh-CN",
    dir: "ltr",
    title: "AIGate 运维说明",
    eyebrow: "开源 AI Git Workflow Guard CLI",
    subtitle: "这份 HTML 文档说明 AIGate 的运行流程、全部命令、当前已实现能力以及未来规划。",
    nav: ["概览", "流程", "命令", "发布", "功能"],
    badges: ["npm 已发布", "Trusted Publishing", "GitHub Release", "CLI v" + version],
    summaryTitle: "目前已经完成的内容",
    summary: [
      "AIGate 是一个 CLI，用于检查本地变更、secret 风险、项目基础分、PR 就绪状态和发布就绪状态。",
      "包已经以 aigate-cli 发布到 npm，并且可以通过 GitHub tag 和 npm Trusted Publishing 自动发布。",
      "它还可以生成 Codex 和 Gemini 集成文件，让 AI assistant 遵循同一套仓库规则。"
    ],
    installTitle: "安装与快速开始",
    installCaption: "也可以不全局安装，直接通过 npx 运行。",
    flowTitle: "整体运行流程",
    flowIntro: "AIGate 将本地开发、PR、CI、发布和 npm 分发串成同一套质量门禁。",
    processSteps: [
      ["检测变更", "读取 Git diff 和 untracked 文件"],
      ["本地门禁", "git-ready 检查测试、secret、分数"],
      ["提交", "用 Conventional Commit 固定范围"],
      ["受保护 push", "aigate push 在 push 前验证"],
      ["创建 PR", "aigate pr 和 pr-check 准备上下文"],
      ["CI 检查", "Node 20/22 测试和 Scorecard"],
      ["合并", "main 始终保持可发布"],
      ["发布检查", "release-check --npm 检查 tag/npm 状态"],
      ["推送标签", "vX.Y.Z tag 触发 GitHub Actions"],
      ["npm 发布", "带 provenance 的 Trusted Publishing"]
    ],
    releaseTitle: "发布自动化图表",
    releaseIntro: "首次公开发布后，版本更新和 tag push 就是主要发布触发器。",
    releaseSteps: [
      ["版本更新", "package.json 和 lockfile"],
      ["验证", "npm run ci + dry-run"],
      ["创建标签", "git tag vX.Y.Z"],
      ["GitHub Actions", "运行 release.yml"],
      ["npm publish", "OIDC Trusted Publishing"],
      ["发布说明", "创建 GitHub Release"]
    ],
    commandMapTitle: "命令地图",
    commandGroups: [
      ["设置", ["init", "setup", "settings", "integrate"]],
      ["首次运行", ["doctor", "demo", "install-hook"]],
      ["保护门禁", ["check", "git-ready", "push", "pr"]],
      ["报告", ["pr-check", "github comment", "github check", "github setup", "trends", "report", "evaluate-project", "audit-report"]],
      ["发布", ["release-check", "release-check --npm", "branch-strategy", "notify"]]
    ],
    commandsTitle: "全部命令与使用时机",
    commandHeaders: ["命令", "用途", "使用场景"],
    commands: [
      ["npm install -g aigate-cli", "全局安装 CLI。", "首次开发环境设置"],
      ["npx aigate-cli check", "无需安装即可检查仓库。", "快速体验或 CI 前检查"],
      ["aigate init", "创建基础配置和报告目录。", "在新项目中启用 AIGate"],
      ["aigate setup --language <en|ko|ja|zh>", "保存 CLI 输出语言。", "统一团队输出语言"],
      ["aigate settings", "显示当前 AIGate 设置。", "配置核对"],
      ["aigate doctor", "诊断首次运行环境、Git hook 和项目基础状态。", "首次运行或检查仓库状态"],
      ["aigate demo", "不改动文件，展示 AIGate 使用流程。", "试用 CLI 或向团队说明"],
      ["aigate install-hook --pre-push", "安装 pre-push hook，在 git push 前运行 git-ready。", "在本地阻止有风险的 push"],
      ["aigate check", "汇总变更文件和 secret 风险。", "轻量提交前检查"],
      ["aigate git-ready", "运行测试、secret scan 和项目分数门禁。", "提交或 push 前"],
      ["aigate push -u origin <branch>", "门禁通过后转发到 git push。", "推送分支时"],
      ["aigate pr-check", "生成 PR 就绪报告。", "编写 PR 描述前"],
      ["aigate pr --title \"...\"", "通过 GitHub CLI 创建 PR。", "分支 push 后"],
      ["aigate github comment --pr <number>", "向 PR 发布 AIGate 摘要评论。", "给评审者留下门禁结果"],
      ["aigate github check --format json", "生成 GitHub Checks/Actions summary payload。", "在 CI 中显示 AIGate 状态"],
      ["aigate github setup --owner @team", "设置 PR 模板和 CODEOWNERS。", "整理公开贡献路径"],
      ["aigate trends record", "记录项目状态快照。", "跟踪发布前后的状态趋势"],
      ["aigate trends show", "汇总已记录的状态趋势。", "团队评审或每周检查"],
      ["aigate report --format markdown", "输出本地工作流报告。", "状态共享"],
      ["aigate report --format sarif", "以 SARIF 输出 secret finding。", "安全工具集成"],
      ["aigate evaluate-project", "计算仓库基础分。", "开源发布准备检查"],
      ["aigate evaluate-project --deep --report", "生成包含 Git signal 的详细报告。", "发布或周期复盘"],
      ["aigate branch-strategy", "按团队和发布节奏推荐分支策略。", "设计分支政策"],
      ["aigate branch-strategy --apply", "生成分支政策、release、hotfix、PR、CODEOWNERS 草案。", "创建政策文件时"],
      ["aigate integrate all", "生成 Codex 和 Gemini 集成文件。", "让 AI assistant 保持一致规则"],
      ["aigate release-check", "检查包、workflow 和 tag 准备状态。", "创建发布 tag 前"],
      ["aigate release-check --npm", "检查该版本是否存在于 npm。", "自动发布前后"],
      ["aigate audit-report", "汇总治理和政策状态。", "运维审计和公开准备"],
      ["aigate notify send --channel terminal", "输出本地通知事件。", "检查门禁阻塞事件"],
      ["aigate git-ready --notify-channel slack", "BLOCK 时发送 Slack webhook 通知。", "敏感信息或高风险变更阻塞门禁时"],
      ["aigate notify test --channel slack", "测试 Slack、Discord、Teams webhook payload。", "验证团队频道集成"]
    ],
    branchTitle: "分支与交付流程",
    branchText: "main 是受保护的稳定分支。工作在 codex/*、feature/*、fix/*、docs/*、chore/* 分支上完成，并通过 PR 合并。release/* 和 hotfix/* 用于发布稳定和紧急修复。",
    commandPathTitle: "典型执行路径",
    commandPath: [
      "npm install -g aigate-cli",
      "aigate setup --language zh",
      "git switch -c feature/my-change",
      "aigate doctor",
      "aigate install-hook --pre-push",
      "aigate git-ready",
      "git add <files>",
      "git commit -m \"feat: short summary\"",
      "aigate push -u origin feature/my-change",
      "aigate pr-check --output .aigate/reports/pr.md",
      "aigate pr --title \"feat: short summary\"",
      "aigate github comment --pr <number>",
      "aigate github check --output .aigate/reports/github-check.md",
      "aigate trends record",
      "aigate github setup --owner @your-org/team --dry-run",
      "aigate release-check --npm"
    ],
    currentTitle: "当前已实现功能",
    futureTitle: "未来计划功能",
    implemented: [
      "公开 npm 包 aigate-cli 和 npx 运行",
      "基于 Git 变更和 untracked 文件的 readiness check",
      "通过 doctor、demo、install-hook 提供首次运行体验",
      "pre-push Git hook 安装",
      "secret 模式检测和 SARIF 输出",
      "git-ready、受保护 push、受保护 PR 创建",
      "GitHub PR comment 和 GitHub Checks summary payload",
      "PR 模板和 CODEOWNERS 引导式设置",
      "可复用的公开 GitHub Action",
      "项目状态趋势历史",
      "Markdown、HTML、JSON、SARIF 报告",
      "项目分数和 deep Git signal 评估",
      "分支策略推荐和政策草案生成",
      "Codex/Gemini 集成文件生成",
      "韩语/英语/日语/中文 CLI 设置",
      "release-check 和 release-check --npm",
      "基于 Trusted Publishing 的 npm 自动发布",
      "GitHub CI、OpenSSF Scorecard、GitHub Release 运维",
      "终端、Slack BLOCK、Discord、Teams webhook 通知"
    ],
    future: [
      "产品级 Slack BLOCK 通知体验",
      "公开 Docker image",
      "Homebrew formula",
      "email 通道和通知政策强化",
      "Linear/Jira 问题追踪集成",
      "standalone binary 发布",
      "组织仪表盘、policy pack、审计/合规报告",
      "self-hosted reporting、SSO/SAML、企业治理"
    ],
    footer: "本文档说明 AIGate 公开发布后的运行状态。"
  }
};

function renderDocument(localeKey, t) {
  const title = `${t.title} | AIGate`;
  return `<!doctype html>
<html lang="${escapeHtml(t.lang)}" dir="${escapeHtml(t.dir)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${css()}</style>
</head>
<body>
  <header class="hero">
    <nav class="topbar" aria-label="Language navigation">
      <a class="brand" href="https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli">AIGate</a>
      <div class="language-links">${renderLanguageLinks(localeKey)}</div>
    </nav>
    <p class="eyebrow">${escapeHtml(t.eyebrow)}</p>
    <h1>${escapeHtml(t.title)}</h1>
    <p class="subtitle">${escapeHtml(t.subtitle)}</p>
    <div class="badges">${t.badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</div>
  </header>

  <main>
    <section class="section" id="overview">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[0])}</p>
        <h2>${escapeHtml(t.summaryTitle)}</h2>
      </div>
      <div class="summary-grid">
        ${t.summary.map((item) => `<article class="panel"><p>${escapeHtml(item)}</p></article>`).join("")}
      </div>
      <div class="install-panel">
        <div>
          <p class="kicker">npm</p>
          <h3>${escapeHtml(t.installTitle)}</h3>
          <p>${escapeHtml(t.installCaption)}</p>
        </div>
        <pre><code>npm install -g aigate-cli
aigate --version
aigate check

npx aigate-cli check</code></pre>
      </div>
    </section>

    <section class="section" id="process">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[1])}</p>
        <h2>${escapeHtml(t.flowTitle)}</h2>
        <p>${escapeHtml(t.flowIntro)}</p>
      </div>
      ${renderProcessChart(t)}
    </section>

    <section class="section" id="release">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[3])}</p>
        <h2>${escapeHtml(t.releaseTitle)}</h2>
        <p>${escapeHtml(t.releaseIntro)}</p>
      </div>
      ${renderReleaseChart(t)}
    </section>

    <section class="section" id="command-map">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[2])}</p>
        <h2>${escapeHtml(t.commandMapTitle)}</h2>
      </div>
      ${renderCommandMap(t)}
    </section>

    <section class="section" id="commands">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[2])}</p>
        <h2>${escapeHtml(t.commandsTitle)}</h2>
      </div>
      ${renderCommandTable(t)}
    </section>

    <section class="section split" id="branch-flow">
      <div>
        <p class="kicker">Git</p>
        <h2>${escapeHtml(t.branchTitle)}</h2>
        <p>${escapeHtml(t.branchText)}</p>
      </div>
      <pre><code>${escapeHtml(t.commandPath.join("\n"))}</code></pre>
    </section>

    <section class="section bottom-features" id="features">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[4])}</p>
        <h2>${escapeHtml(t.currentTitle)}</h2>
      </div>
      <div class="feature-grid">${t.implemented.map((item) => `<div class="feature done">${escapeHtml(item)}</div>`).join("")}</div>
    </section>

    <section class="section bottom-features future" id="future">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(t.nav[4])}</p>
        <h2>${escapeHtml(t.futureTitle)}</h2>
      </div>
      <div class="feature-grid">${t.future.map((item) => `<div class="feature planned">${escapeHtml(item)}</div>`).join("")}</div>
    </section>
  </main>

  <footer>
    <p>${escapeHtml(t.footer)}</p>
    <p>Generated ${generatedOn}. Package version ${escapeHtml(version)}.</p>
  </footer>
</body>
</html>
`;
}

function renderLanguageLinks(current) {
  return Object.entries(fileNames)
    .map(([key, fileName]) => `<a ${key === current ? "aria-current=\"page\"" : ""} href="./${fileName}">${escapeHtml(localeNames[key])}</a>`)
    .join("");
}

function renderProcessChart(t) {
  const positions = [
    [28, 50], [252, 50], [476, 50], [700, 50], [924, 50],
    [924, 250], [700, 250], [476, 250], [252, 250], [28, 250]
  ];
  const boxes = t.processSteps.map(([title, body], index) => renderBox({
    x: positions[index][0],
    y: positions[index][1],
    w: 190,
    h: 118,
    title,
    body,
    index: index + 1,
    tone: index % 2 === 0 ? "blue" : "green"
  })).join("");
  const arrows = positions.slice(0, -1).map((from, index) => {
    const to = positions[index + 1];
    const x1 = from[0] + 190;
    const y1 = from[1] + 59;
    const x2 = index === 4 ? to[0] + 95 : to[0];
    const y2 = index === 4 ? to[1] : to[1] + 59;
    if (index === 4) {
      return `<path class="arrow" d="M ${x1 - 95} ${y1 + 60} V ${y2 - 12}" marker-end="url(#arrow-process)"/>`;
    }
    return `<path class="arrow" d="M ${x1 + 10} ${y1} H ${x2 - 10}" marker-end="url(#arrow-process)"/>`;
  }).join("");

  return `<div class="chart-wrap">
    <svg class="chart" viewBox="0 0 1142 410" role="img" aria-label="${escapeHtml(t.flowTitle)}">
      ${svgDefs("process")}
      ${arrows}
      ${boxes}
    </svg>
  </div>`;
}

function renderReleaseChart(t) {
  const positions = [[32, 55], [218, 55], [404, 55], [590, 55], [776, 55], [962, 55]];
  const boxes = t.releaseSteps.map(([title, body], index) => renderBox({
    x: positions[index][0],
    y: positions[index][1],
    w: 150,
    h: 120,
    title,
    body,
    index: index + 1,
    tone: index < 3 ? "blue" : "purple"
  })).join("");
  const arrows = positions.slice(0, -1).map((from, index) => {
    const to = positions[index + 1];
    return `<path class="arrow" d="M ${from[0] + 160} ${from[1] + 60} H ${to[0] - 12}" marker-end="url(#arrow-release)"/>`;
  }).join("");

  return `<div class="chart-wrap compact">
    <svg class="chart" viewBox="0 0 1142 230" role="img" aria-label="${escapeHtml(t.releaseTitle)}">
      ${svgDefs("release")}
      ${arrows}
      ${boxes}
    </svg>
  </div>`;
}

function renderCommandMap(t) {
  const groups = t.commandGroups.map(([title, commands], index) => {
    const commandItems = commands.map((command) => `<span>${escapeHtml(command)}</span>`).join("");
    return `<article class="command-group group-${index}">
      <h3>${escapeHtml(title)}</h3>
      <div>${commandItems}</div>
    </article>`;
  }).join("");

  return `<div class="command-groups">${groups}</div>`;
}

function renderCommandTable(t) {
  const rows = t.commands.map(([command, purpose, when]) => `<tr>
    <td><code>${escapeHtml(command)}</code></td>
    <td>${escapeHtml(purpose)}</td>
    <td>${escapeHtml(when)}</td>
  </tr>`).join("");

  return `<div class="table-wrap">
    <table>
      <thead><tr>${t.commandHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderBox({ x, y, w, h, title, body, index, tone }) {
  return `<g class="svg-box ${tone}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>
    <circle cx="${x + 24}" cy="${y + 24}" r="13"/>
    <text x="${x + 24}" y="${y + 29}" text-anchor="middle">${index}</text>
    <foreignObject x="${x + 44}" y="${y + 14}" width="${w - 56}" height="${h - 24}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="svg-label">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(body)}</span>
      </div>
    </foreignObject>
  </g>`;
}

function svgDefs(id) {
  return `<defs>
    <marker id="arrow-${id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#2f5f8f"/>
    </marker>
  </defs>`;
}

function css() {
  return `
:root {
  color-scheme: light;
  --bg: #f6f8fb;
  --ink: #152033;
  --muted: #5f6f86;
  --line: #d8e1ed;
  --panel: #ffffff;
  --blue: #2f6fed;
  --green: #168763;
  --purple: #6c55c7;
  --amber: #a66705;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
}
a { color: var(--blue); text-decoration: none; }
a:hover { text-decoration: underline; }
.hero {
  padding: 28px min(5vw, 64px) 56px;
  background: linear-gradient(135deg, #f9fbff 0%, #eef5ff 58%, #f4fff9 100%);
  border-bottom: 1px solid var(--line);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 64px;
}
.brand {
  color: var(--ink);
  font-weight: 800;
  font-size: 1.1rem;
}
.language-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.language-links a {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 7px 12px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.76);
  font-size: 0.92rem;
}
.language-links a[aria-current="page"] {
  border-color: var(--blue);
  color: var(--blue);
  font-weight: 700;
}
.eyebrow, .kicker {
  color: var(--blue);
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  font-size: 0.78rem;
  margin: 0 0 10px;
}
h1 {
  max-width: 920px;
  font-size: clamp(2.4rem, 7vw, 5.6rem);
  line-height: 0.98;
  margin: 0;
  letter-spacing: 0;
}
.subtitle {
  max-width: 820px;
  color: var(--muted);
  font-size: 1.2rem;
  margin: 28px 0 0;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}
.badges span {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 700;
  color: #27384f;
}
main {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
}
.section {
  padding: 56px 0;
  border-bottom: 1px solid var(--line);
}
.section-heading {
  max-width: 860px;
  margin-bottom: 24px;
}
h2 {
  margin: 0 0 10px;
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  line-height: 1.18;
  letter-spacing: 0;
}
h3 { margin: 0 0 8px; font-size: 1.15rem; }
p { color: var(--muted); margin: 0; }
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.panel, .install-panel, .command-group, .feature {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(17, 31, 52, 0.05);
}
.panel { padding: 20px; }
.install-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 22px;
  align-items: center;
  padding: 24px;
  margin-top: 18px;
}
pre {
  margin: 0;
  overflow-x: auto;
  background: #0d1829;
  color: #e7f0ff;
  border-radius: 8px;
  padding: 18px;
  font-size: 0.92rem;
  line-height: 1.55;
}
code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.94em;
}
.chart-wrap {
  overflow-x: auto;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}
.chart { min-width: 980px; width: 100%; height: auto; display: block; }
.arrow {
  fill: none;
  stroke: #2f5f8f;
  stroke-width: 2.3;
}
.svg-box rect {
  fill: #ffffff;
  stroke: var(--line);
  stroke-width: 1.5;
}
.svg-box.blue circle { fill: var(--blue); }
.svg-box.green circle { fill: var(--green); }
.svg-box.purple circle { fill: var(--purple); }
.svg-box text {
  fill: #ffffff;
  font-size: 13px;
  font-weight: 800;
}
.svg-label {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  color: var(--ink);
}
.svg-label strong {
  display: block;
  font-size: 15px;
  line-height: 1.2;
}
.svg-label span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.25;
}
.command-groups {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.command-group { padding: 18px; }
.command-group div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.command-group span {
  background: #eef5ff;
  color: #214b84;
  border-radius: 999px;
  padding: 5px 9px;
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.83rem;
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}
th, td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
  text-align: left;
}
th {
  background: #f1f5fb;
  color: #27384f;
  font-size: 0.88rem;
}
td code {
  color: #193f7a;
  font-weight: 700;
}
.split {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 24px;
  align-items: start;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.feature {
  padding: 14px 16px;
  color: #27384f;
  font-weight: 650;
}
.feature.done { border-left: 4px solid var(--green); }
.feature.planned { border-left: 4px solid var(--amber); }
.bottom-features { border-bottom: 0; padding-bottom: 32px; }
.bottom-features.future { padding-top: 8px; }
footer {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 50px;
  color: var(--muted);
}
footer p + p { margin-top: 6px; }
@media (max-width: 860px) {
  .topbar, .install-panel, .split {
    grid-template-columns: 1fr;
    display: grid;
  }
  .summary-grid, .command-groups, .feature-grid {
    grid-template-columns: 1fr;
  }
  h1 { font-size: 2.4rem; }
  .hero { padding-bottom: 42px; }
}
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

mkdirSync(docsDir, { recursive: true });
for (const [localeKey, locale] of Object.entries(locales)) {
  const html = renderDocument(localeKey, locale);
  writeFileSync(join(docsDir, fileNames[localeKey]), html);
  console.log(`Wrote docs/${fileNames[localeKey]}`);
}

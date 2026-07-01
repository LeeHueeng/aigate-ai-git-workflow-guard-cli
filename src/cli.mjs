#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(CLI_DIR);
const VERSION = readPackageVersion();
const SUPPORTED_LANGUAGES = ["en", "ko", "ja", "zh"];
const SUPPORTED_INTEGRATIONS = ["codex", "gemini"];
const DEFAULT_SETTINGS = {
  version: 1,
  language: "en"
};
const MAX_SECRET_SCAN_BYTES = 250_000;
const SECRET_PATTERNS = [
  { id: "aws-access-key-id", label: "AWS access key id", pattern: /AKIA[0-9A-Z]{16}/g },
  { id: "github-token", label: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/g },
  { id: "slack-token", label: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/g },
  { id: "private-key", label: "Private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { id: "generic-secret", label: "Generic secret assignment", pattern: /\b(api[_-]?key|secret|token|password|private[_-]?key)\b\s*[:=]\s*["']?([A-Za-z0-9_./+=-]{16,})/gi }
];

const I18N = {
  en: {
    "action.created": "created",
    "action.skipped": "skipped",
    "action.updated": "updated",
    "branchStrategy.applied": "Applied branch strategy files",
    "branchStrategy.branches": "Branches:",
    "branchStrategy.generated": "Generated branch strategy files",
    "branchStrategy.githubProtection": "GitHub protection:",
    "branchStrategy.outputs": "Generated outputs:",
    "branchStrategy.reason": "Reason: {reason}",
    "branchStrategy.recommended": "Recommended strategy: {strategy}",
    "check.branch": "Branch: {branch}",
    "check.changedFiles": "Changed files: {count}",
    "check.recommendation": "Recommendation: {recommendation}",
    "check.secretFindings": "Secret findings: {count}",
    "check.status": "AIGate check: {status}",
    "common.next": "Next: {next}",
    "common.wrote": "Wrote {path}",
    "gitReady.blockers": "Blockers:",
    "gitReady.blockersNone": "Blockers: none",
    "gitReady.branch": "Branch: {branch}",
    "gitReady.changedFiles": "Changed files: {count}",
    "gitReady.projectScore": "Project score: {score}/100",
    "gitReady.recommendation": "Recommendation: {recommendation}",
    "gitReady.secretFindings": "Secret findings: {count}",
    "gitReady.status": "AIGate git-ready: {status}",
    "init.complete": "AIGate init complete",
    "integrate.complete": "AIGate AI integration files",
    "integrate.next": "Next: review the generated instruction files and run npm run ci.",
    "integrate.providers": "Providers: {providers}",
    "language.label": "Language: {language}",
    "notify.missingWebhook": "Missing webhook environment variable: {env}",
    "notify.ready": "Status: ready",
    "notify.sent": "Sent {event} notification to {channel}",
    "notify.setup": "Notification setup preview",
    "notify.status": "Status: {status}",
    "notify.target": "Target: {channel}",
    "notify.test": "Notification test event: {event}",
    "notify.terminal": "AIGate notification: {event}",
    "notify.usage": "Usage: aigate notify <setup|test|send> [--event BLOCK] [--channel terminal]",
    "notify.webhookHint": "Set {env} or use --channel terminal.",
    "notify.wouldSend": "Would send {event} notification to {channel} using {env}",
    "push.skip": "AIGate push: readiness gate skipped with --no-verify",
    "push.wouldRun": "Would run: {command}",
    "release.branch": "Release tag: {tag}",
    "release.nextSteps": "Next steps:",
    "release.package": "Package: {packageName}",
    "release.registryNotChecked": "npm registry: not checked (use --npm)",
    "release.registryNotPublished": "npm registry: {packageName}@{version} not published",
    "release.registryPublished": "npm registry: published {packageName}@{version}",
    "release.registryFailed": "npm registry: lookup failed ({error})",
    "release.status": "AIGate release-check: {status}",
    "release.version": "Version: {version}",
    "settings.complete": "AIGate setup complete",
    "settings.file": "Settings file: {path}",
    "settings.title": "AIGate settings",
    "unsupportedLanguage": "Unsupported language: {language}",
    "supportedLanguages": "Supported languages: {languages}",
    "unsupportedIntegration": "Unsupported integration provider: {provider}",
    "supportedIntegrations": "Supported providers: {providers}, all"
  },
  ko: {
    "action.created": "생성",
    "action.skipped": "건너뜀",
    "action.updated": "갱신",
    "branchStrategy.applied": "브랜치 전략 파일 적용 완료",
    "branchStrategy.branches": "브랜치:",
    "branchStrategy.generated": "브랜치 전략 파일 생성 완료",
    "branchStrategy.githubProtection": "GitHub 보호 규칙:",
    "branchStrategy.outputs": "생성 산출물:",
    "branchStrategy.reason": "이유: {reason}",
    "branchStrategy.recommended": "권장 전략: {strategy}",
    "check.branch": "브랜치: {branch}",
    "check.changedFiles": "변경 파일: {count}",
    "check.recommendation": "권장 사항: {recommendation}",
    "check.secretFindings": "Secret 탐지: {count}",
    "check.status": "AIGate 검사: {status}",
    "common.next": "다음 단계: {next}",
    "common.wrote": "{path} 파일을 작성했습니다",
    "gitReady.blockers": "차단 사유:",
    "gitReady.blockersNone": "차단 사유: 없음",
    "gitReady.branch": "브랜치: {branch}",
    "gitReady.changedFiles": "변경 파일: {count}",
    "gitReady.projectScore": "프로젝트 점수: {score}/100",
    "gitReady.recommendation": "권장 사항: {recommendation}",
    "gitReady.secretFindings": "Secret 탐지: {count}",
    "gitReady.status": "AIGate git-ready: {status}",
    "init.complete": "AIGate 초기화 완료",
    "integrate.complete": "AIGate AI 연동 파일 생성",
    "integrate.next": "다음 단계: 생성된 지침 파일을 검토하고 npm run ci를 실행하세요.",
    "integrate.providers": "대상: {providers}",
    "language.label": "언어: {language}",
    "notify.missingWebhook": "웹훅 환경 변수가 없습니다: {env}",
    "notify.ready": "상태: 준비 완료",
    "notify.sent": "{channel} 채널로 {event} 알림을 보냈습니다",
    "notify.setup": "알림 설정 미리보기",
    "notify.status": "상태: {status}",
    "notify.target": "대상: {channel}",
    "notify.test": "알림 테스트 이벤트: {event}",
    "notify.terminal": "AIGate 알림: {event}",
    "notify.usage": "사용법: aigate notify <setup|test|send> [--event BLOCK] [--channel terminal]",
    "notify.webhookHint": "{env}를 설정하거나 --channel terminal을 사용하세요.",
    "notify.wouldSend": "{env}를 사용해 {channel} 채널로 {event} 알림을 보낼 예정입니다",
    "push.skip": "AIGate push: --no-verify로 준비 게이트를 건너뜁니다.",
    "push.wouldRun": "실행 예정: {command}",
    "release.branch": "릴리스 태그: {tag}",
    "release.nextSteps": "다음 단계:",
    "release.package": "패키지: {packageName}",
    "release.registryNotChecked": "npm registry: 확인 안 함 (--npm 사용)",
    "release.registryNotPublished": "npm registry: {packageName}@{version} 미배포",
    "release.registryPublished": "npm registry: {packageName}@{version} 배포됨",
    "release.registryFailed": "npm registry: 조회 실패 ({error})",
    "release.status": "AIGate release-check: {status}",
    "release.version": "버전: {version}",
    "settings.complete": "AIGate 설정 완료",
    "settings.file": "설정 파일: {path}",
    "settings.title": "AIGate 설정",
    "unsupportedLanguage": "지원하지 않는 언어: {language}",
    "supportedLanguages": "지원 언어: {languages}",
    "unsupportedIntegration": "지원하지 않는 연동 대상: {provider}",
    "supportedIntegrations": "지원 대상: {providers}, all"
  },
  ja: {
    "action.created": "作成",
    "action.skipped": "スキップ",
    "action.updated": "更新",
    "branchStrategy.applied": "ブランチ戦略ファイルを適用しました",
    "branchStrategy.branches": "ブランチ:",
    "branchStrategy.generated": "ブランチ戦略ファイルを生成しました",
    "branchStrategy.githubProtection": "GitHub 保護ルール:",
    "branchStrategy.outputs": "生成される出力:",
    "branchStrategy.reason": "理由: {reason}",
    "branchStrategy.recommended": "推奨戦略: {strategy}",
    "check.branch": "ブランチ: {branch}",
    "check.changedFiles": "変更ファイル: {count}",
    "check.recommendation": "推奨事項: {recommendation}",
    "check.secretFindings": "Secret 検出: {count}",
    "check.status": "AIGate チェック: {status}",
    "common.next": "次の手順: {next}",
    "common.wrote": "{path} を書き込みました",
    "gitReady.blockers": "ブロッカー:",
    "gitReady.blockersNone": "ブロッカー: なし",
    "gitReady.branch": "ブランチ: {branch}",
    "gitReady.changedFiles": "変更ファイル: {count}",
    "gitReady.projectScore": "プロジェクトスコア: {score}/100",
    "gitReady.recommendation": "推奨事項: {recommendation}",
    "gitReady.secretFindings": "Secret 検出: {count}",
    "gitReady.status": "AIGate git-ready: {status}",
    "init.complete": "AIGate 初期化完了",
    "integrate.complete": "AIGate AI 連携ファイル",
    "integrate.next": "次の手順: 生成された指示ファイルを確認し、npm run ci を実行してください。",
    "integrate.providers": "対象: {providers}",
    "language.label": "言語: {language}",
    "notify.missingWebhook": "Webhook 環境変数がありません: {env}",
    "notify.ready": "状態: 準備完了",
    "notify.sent": "{channel} に {event} 通知を送信しました",
    "notify.setup": "通知設定プレビュー",
    "notify.status": "状態: {status}",
    "notify.target": "対象: {channel}",
    "notify.test": "通知テストイベント: {event}",
    "notify.terminal": "AIGate 通知: {event}",
    "notify.usage": "使い方: aigate notify <setup|test|send> [--event BLOCK] [--channel terminal]",
    "notify.webhookHint": "{env} を設定するか --channel terminal を使用してください。",
    "notify.wouldSend": "{env} を使って {channel} に {event} 通知を送信予定です",
    "push.skip": "AIGate push: --no-verify により readiness gate をスキップします。",
    "push.wouldRun": "実行予定: {command}",
    "release.branch": "リリースタグ: {tag}",
    "release.nextSteps": "次の手順:",
    "release.package": "パッケージ: {packageName}",
    "release.registryNotChecked": "npm registry: 未確認 (--npm を使用)",
    "release.registryNotPublished": "npm registry: {packageName}@{version} は未公開",
    "release.registryPublished": "npm registry: {packageName}@{version} は公開済み",
    "release.registryFailed": "npm registry: 照会失敗 ({error})",
    "release.status": "AIGate release-check: {status}",
    "release.version": "バージョン: {version}",
    "settings.complete": "AIGate 設定完了",
    "settings.file": "設定ファイル: {path}",
    "settings.title": "AIGate 設定",
    "unsupportedLanguage": "未対応の言語: {language}",
    "supportedLanguages": "対応言語: {languages}",
    "unsupportedIntegration": "未対応の連携対象: {provider}",
    "supportedIntegrations": "対応対象: {providers}, all"
  },
  zh: {
    "action.created": "已创建",
    "action.skipped": "已跳过",
    "action.updated": "已更新",
    "branchStrategy.applied": "已应用分支策略文件",
    "branchStrategy.branches": "分支:",
    "branchStrategy.generated": "已生成分支策略文件",
    "branchStrategy.githubProtection": "GitHub 保护规则:",
    "branchStrategy.outputs": "生成输出:",
    "branchStrategy.reason": "原因: {reason}",
    "branchStrategy.recommended": "推荐策略: {strategy}",
    "check.branch": "分支: {branch}",
    "check.changedFiles": "变更文件: {count}",
    "check.recommendation": "建议: {recommendation}",
    "check.secretFindings": "Secret 发现: {count}",
    "check.status": "AIGate 检查: {status}",
    "common.next": "下一步: {next}",
    "common.wrote": "已写入 {path}",
    "gitReady.blockers": "阻塞原因:",
    "gitReady.blockersNone": "阻塞原因: 无",
    "gitReady.branch": "分支: {branch}",
    "gitReady.changedFiles": "变更文件: {count}",
    "gitReady.projectScore": "项目分数: {score}/100",
    "gitReady.recommendation": "建议: {recommendation}",
    "gitReady.secretFindings": "Secret 发现: {count}",
    "gitReady.status": "AIGate git-ready: {status}",
    "init.complete": "AIGate 初始化完成",
    "integrate.complete": "AIGate AI 集成文件",
    "integrate.next": "下一步: 检查生成的说明文件并运行 npm run ci。",
    "integrate.providers": "目标: {providers}",
    "language.label": "语言: {language}",
    "notify.missingWebhook": "缺少 webhook 环境变量: {env}",
    "notify.ready": "状态: 就绪",
    "notify.sent": "已向 {channel} 发送 {event} 通知",
    "notify.setup": "通知设置预览",
    "notify.status": "状态: {status}",
    "notify.target": "目标: {channel}",
    "notify.test": "通知测试事件: {event}",
    "notify.terminal": "AIGate 通知: {event}",
    "notify.usage": "用法: aigate notify <setup|test|send> [--event BLOCK] [--channel terminal]",
    "notify.webhookHint": "请设置 {env}，或使用 --channel terminal。",
    "notify.wouldSend": "将使用 {env} 向 {channel} 发送 {event} 通知",
    "push.skip": "AIGate push: 已通过 --no-verify 跳过 readiness gate。",
    "push.wouldRun": "将执行: {command}",
    "release.branch": "发布标签: {tag}",
    "release.nextSteps": "下一步:",
    "release.package": "包: {packageName}",
    "release.registryNotChecked": "npm registry: 未检查 (使用 --npm)",
    "release.registryNotPublished": "npm registry: {packageName}@{version} 尚未发布",
    "release.registryPublished": "npm registry: {packageName}@{version} 已发布",
    "release.registryFailed": "npm registry: 查询失败 ({error})",
    "release.status": "AIGate release-check: {status}",
    "release.version": "版本: {version}",
    "settings.complete": "AIGate 设置完成",
    "settings.file": "设置文件: {path}",
    "settings.title": "AIGate 设置",
    "unsupportedLanguage": "不支持的语言: {language}",
    "supportedLanguages": "支持语言: {languages}",
    "unsupportedIntegration": "不支持的集成目标: {provider}",
    "supportedIntegrations": "支持目标: {providers}, all"
  }
};

const LANGUAGE_NAMES = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文"
};

const STATUS_LABELS = {
  en: {
    ACTION_REQUIRED: "ACTION_REQUIRED",
    BLOCK: "BLOCK",
    PASS: "PASS",
    READY: "READY",
    RELEASED: "RELEASED",
    TODO: "TODO",
    WARN: "WARN"
  },
  ko: {
    ACTION_REQUIRED: "조치 필요",
    BLOCK: "차단",
    PASS: "통과",
    READY: "준비 완료",
    RELEASED: "배포 완료",
    TODO: "할 일",
    WARN: "주의"
  },
  ja: {
    ACTION_REQUIRED: "対応が必要",
    BLOCK: "ブロック",
    PASS: "通過",
    READY: "準備完了",
    RELEASED: "公開済み",
    TODO: "TODO",
    WARN: "注意"
  },
  zh: {
    ACTION_REQUIRED: "需要处理",
    BLOCK: "阻塞",
    PASS: "通过",
    READY: "就绪",
    RELEASED: "已发布",
    TODO: "待办",
    WARN: "警告"
  }
};

const RECOMMENDATION_TRANSLATIONS = {
  ko: {
    "No local changes detected.": "로컬 변경사항이 없습니다.",
    "Run AIGate inside a Git repository.": "AIGate를 Git 저장소 안에서 실행하세요.",
    "Review possible secret-bearing files before commit or push.": "커밋 또는 푸시 전에 secret 포함 가능성이 있는 파일을 검토하세요.",
    "Open a focused branch and pull request after tests pass.": "테스트 통과 후 범위가 명확한 브랜치와 PR을 여세요.",
    "Resolve blockers before committing, pushing, or opening a pull request.": "커밋, 푸시, PR 생성 전에 차단 사유를 해결하세요.",
    "Run npm test, commit focused changes, push the branch, and open a pull request.": "npm test를 실행하고, 범위가 명확한 변경을 커밋한 뒤 브랜치를 푸시하고 PR을 여세요.",
    "Repository foundations are ready for the next MVP slice.": "저장소 기반이 다음 MVP 단계를 진행할 준비가 됐습니다.",
    "Complete the missing repository foundations before public release.": "공개 릴리스 전에 부족한 저장소 기반 항목을 보완하세요."
  },
  ja: {
    "No local changes detected.": "ローカル変更はありません。",
    "Run AIGate inside a Git repository.": "AIGate は Git リポジトリ内で実行してください。",
    "Review possible secret-bearing files before commit or push.": "commit または push 前に secret を含む可能性があるファイルを確認してください。",
    "Open a focused branch and pull request after tests pass.": "テスト通過後、範囲を絞ったブランチと PR を作成してください。",
    "Resolve blockers before committing, pushing, or opening a pull request.": "commit、push、PR 作成の前にブロッカーを解消してください。",
    "Run npm test, commit focused changes, push the branch, and open a pull request.": "npm test を実行し、範囲を絞って commit し、ブランチを push して PR を作成してください。",
    "Repository foundations are ready for the next MVP slice.": "リポジトリ基盤は次の MVP スライスに進める状態です。",
    "Complete the missing repository foundations before public release.": "公開リリース前に不足しているリポジトリ基盤を整備してください。"
  },
  zh: {
    "No local changes detected.": "未检测到本地变更。",
    "Run AIGate inside a Git repository.": "请在 Git 仓库内运行 AIGate。",
    "Review possible secret-bearing files before commit or push.": "提交或推送前，请检查可能包含 secret 的文件。",
    "Open a focused branch and pull request after tests pass.": "测试通过后，创建范围清晰的分支和 PR。",
    "Resolve blockers before committing, pushing, or opening a pull request.": "提交、推送或创建 PR 前，请先解决阻塞原因。",
    "Run npm test, commit focused changes, push the branch, and open a pull request.": "运行 npm test，提交聚焦的变更，推送分支并创建 PR。",
    "Repository foundations are ready for the next MVP slice.": "仓库基础已经可以进入下一个 MVP 阶段。",
    "Complete the missing repository foundations before public release.": "公开发布前，请补齐缺失的仓库基础项。"
  }
};

const BRANCH_USE_TRANSLATIONS = {
  ko: {
    "AI-assisted implementation branches": "AI 보조 구현 브랜치",
    "user-facing feature branches": "사용자 기능 브랜치",
    "bug fix branches": "버그 수정 브랜치",
    "documentation-only branches": "문서 전용 브랜치",
    "maintenance and tooling branches": "유지보수 및 도구 브랜치",
    "production releases only": "프로덕션 릴리스 전용",
    "next release integration": "다음 릴리스 통합",
    "release stabilization from develop": "develop 기반 릴리스 안정화",
    "urgent production fixes from main": "main 기반 긴급 프로덕션 수정",
    "protected trunk and release source": "보호된 trunk 및 릴리스 기준",
    "short-lived changes merged quickly": "짧게 유지하고 빠르게 병합하는 변경",
    "optional release hardening": "선택적 릴리스 안정화",
    "urgent stable fixes": "긴급 안정 버전 수정",
    "stable production source of truth": "안정 프로덕션 기준 브랜치",
    "optional integration branch for larger releases": "큰 릴리스를 위한 선택적 통합 브랜치",
    "planned release stabilization": "계획된 릴리스 안정화",
    "protected stable source of truth": "보호된 안정 기준 브랜치",
    "release stabilization": "릴리스 안정화"
  },
  ja: {
    "AI-assisted implementation branches": "AI 支援実装ブランチ",
    "user-facing feature branches": "ユーザー向け機能ブランチ",
    "bug fix branches": "バグ修正ブランチ",
    "documentation-only branches": "ドキュメント専用ブランチ",
    "maintenance and tooling branches": "保守とツール用ブランチ",
    "production releases only": "本番リリース専用",
    "next release integration": "次回リリースの統合",
    "release stabilization from develop": "develop からのリリース安定化",
    "urgent production fixes from main": "main からの緊急本番修正",
    "protected trunk and release source": "保護された trunk とリリース基準",
    "short-lived changes merged quickly": "短期間で素早く merge する変更",
    "optional release hardening": "任意のリリース安定化",
    "urgent stable fixes": "緊急の安定版修正",
    "stable production source of truth": "安定した本番の基準ブランチ",
    "optional integration branch for larger releases": "大きなリリース向けの任意統合ブランチ",
    "planned release stabilization": "計画的なリリース安定化",
    "protected stable source of truth": "保護された安定基準ブランチ",
    "release stabilization": "リリース安定化"
  },
  zh: {
    "AI-assisted implementation branches": "AI 辅助实现分支",
    "user-facing feature branches": "面向用户的功能分支",
    "bug fix branches": "缺陷修复分支",
    "documentation-only branches": "仅文档分支",
    "maintenance and tooling branches": "维护和工具分支",
    "production releases only": "仅用于生产发布",
    "next release integration": "下一版本集成",
    "release stabilization from develop": "从 develop 进行发布稳定",
    "urgent production fixes from main": "从 main 进行紧急生产修复",
    "protected trunk and release source": "受保护的 trunk 和发布来源",
    "short-lived changes merged quickly": "短生命周期并快速合并的变更",
    "optional release hardening": "可选发布加固",
    "urgent stable fixes": "紧急稳定版修复",
    "stable production source of truth": "稳定生产基准分支",
    "optional integration branch for larger releases": "大型发布的可选集成分支",
    "planned release stabilization": "计划内发布稳定",
    "protected stable source of truth": "受保护的稳定基准分支",
    "release stabilization": "发布稳定"
  }
};

const BRANCH_REASON_TRANSLATIONS = {
  ko: {
    "AIGate needs fast public contribution flow": "AIGate에는 빠른 공개 기여 흐름이 필요합니다",
    "npm channel control for latest, next, beta, and canary releases": "latest, next, beta, canary 릴리스를 위한 npm 채널 제어가 필요합니다",
    "CI-backed pull request protection is already present": "CI 기반 PR 보호가 이미 준비되어 있습니다",
    "release documentation and package metadata exist": "릴리스 문서와 패키지 메타데이터가 존재합니다"
  },
  ja: {
    "AIGate needs fast public contribution flow": "AIGate には高速な公開コントリビューションフローが必要です",
    "npm channel control for latest, next, beta, and canary releases": "latest、next、beta、canary リリース向けの npm チャンネル制御が必要です",
    "CI-backed pull request protection is already present": "CI による PR 保護がすでにあります",
    "release documentation and package metadata exist": "リリース文書とパッケージメタデータがあります"
  },
  zh: {
    "AIGate needs fast public contribution flow": "AIGate 需要快速的公开贡献流程",
    "npm channel control for latest, next, beta, and canary releases": "需要为 latest、next、beta、canary 发布控制 npm 频道",
    "CI-backed pull request protection is already present": "已经具备基于 CI 的 PR 保护",
    "release documentation and package metadata exist": "已经存在发布文档和包元数据"
  }
};

const GITHUB_PROTECTION_TRANSLATIONS = {
  ko: {
    "Require pull request before merging into main.": "main에 병합하기 전에 PR을 필수로 요구합니다.",
    "Require at least one approval.": "최소 1개의 승인을 요구합니다.",
    "Require the CI test job before merging.": "병합 전에 CI test job 통과를 요구합니다.",
    "Require conversation resolution.": "대화 해결을 요구합니다.",
    "Block force pushes and branch deletion.": "강제 푸시와 브랜치 삭제를 차단합니다."
  },
  ja: {
    "Require pull request before merging into main.": "main へ merge する前に PR を必須にします。",
    "Require at least one approval.": "少なくとも 1 件の承認を必須にします。",
    "Require the CI test job before merging.": "merge 前に CI test job の通過を必須にします。",
    "Require conversation resolution.": "会話の解決を必須にします。",
    "Block force pushes and branch deletion.": "force push とブランチ削除をブロックします。"
  },
  zh: {
    "Require pull request before merging into main.": "合并到 main 前必须创建 PR。",
    "Require at least one approval.": "至少需要 1 个审批。",
    "Require the CI test job before merging.": "合并前必须通过 CI test job。",
    "Require conversation resolution.": "必须解决所有对话。",
    "Block force pushes and branch deletion.": "阻止强制推送和删除分支。"
  }
};

const RELEASE_CHECK_TRANSLATIONS = {
  ko: {
    "package.json exists": "package.json 존재",
    "package-lock.json version matches package.json": "package-lock.json 버전이 package.json과 일치",
    "package is not marked private": "package.json이 private 패키지가 아님",
    "package has a valid npm package name": "패키지가 유효한 npm 이름 규칙을 충족",
    "package version is not 0.0.0": "패키지 버전이 0.0.0이 아님",
    "package declares npm entrypoint or bin": "패키지가 npm 진입점 또는 bin을 선언",
    "publishConfig access is public": "publishConfig access가 public",
    "release workflow exists": "릴리스 workflow 존재",
    "release workflow uses npm provenance": "릴리스 workflow가 npm provenance 사용",
    "release workflow disables package manager cache": "릴리스 workflow가 package manager cache를 비활성화",
    "README documents npm install command": "README가 npm 설치 명령을 문서화"
  },
  ja: {
    "package.json exists": "package.json が存在",
    "package-lock.json version matches package.json": "package-lock.json の version が package.json と一致",
    "package is not marked private": "package.json が private パッケージではない",
    "package has a valid npm package name": "パッケージが有効な npm 名を持つ",
    "package version is not 0.0.0": "パッケージ version が 0.0.0 ではない",
    "package declares npm entrypoint or bin": "パッケージが npm entrypoint または bin を宣言",
    "publishConfig access is public": "publishConfig access が public",
    "release workflow exists": "リリース workflow が存在",
    "release workflow uses npm provenance": "リリース workflow が npm provenance を使用",
    "release workflow disables package manager cache": "リリース workflow が package manager cache を無効化",
    "README documents npm install command": "README に npm install コマンドが記載済み"
  },
  zh: {
    "package.json exists": "package.json 存在",
    "package-lock.json version matches package.json": "package-lock.json 版本与 package.json 一致",
    "package is not marked private": "package.json 未标记为 private 包",
    "package has a valid npm package name": "包具有有效 npm 名称",
    "package version is not 0.0.0": "包版本不是 0.0.0",
    "package declares npm entrypoint or bin": "包声明 npm entrypoint 或 bin",
    "publishConfig access is public": "publishConfig access 为 public",
    "release workflow exists": "发布 workflow 存在",
    "release workflow uses npm provenance": "发布 workflow 使用 npm provenance",
    "release workflow disables package manager cache": "发布 workflow 禁用 package manager cache",
    "README documents npm install command": "README 记录 npm install 命令"
  }
};

function t(language, key, values = {}) {
  const template = I18N[language]?.[key] ?? I18N.en[key] ?? key;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) => (
    Object.hasOwn(values, name) ? String(values[name]) : `{${name}}`
  ));
}

function statusLabel(status, language) {
  return STATUS_LABELS[language]?.[status] ?? STATUS_LABELS.en[status] ?? status;
}

function languageName(language) {
  return LANGUAGE_NAMES[language] ?? language;
}

const helpText = `AIGate ${VERSION}

AI Git Workflow Guard CLI

Usage:
  aigate <command> [options]

Commands:
  init                     Create starter AIGate project configuration.
  check                    Summarize local Git readiness.
  git-ready                Run the before-push readiness gate.
  push                     Run AIGate checks, then run git push.
  pr                       Run AIGate checks, then create a GitHub pull request.
  pr-check                 Generate a pull request readiness report.
  setup                    Configure AIGate project settings.
  settings                 Show current AIGate settings.
  integrate <provider>     Generate Codex/Gemini assistant integration files.
  report                   Print a workflow report.
  evaluate-project         Score repository workflow foundations.
  score                    Print only the project score.
  branch-strategy          Recommend a branch strategy.
  release-check            Validate package release readiness.
  audit-report             Generate a policy and governance audit report.
  notify <setup|test|send> Preview or send notification workflows.
  help                     Show this help message.

Options:
  --format <text|json|markdown|html|sarif>
  --type <local|pr|weekly>
  --output <path>          Write report output to a file.
  --base <branch>          Pull request base branch.
  --title <text>           Pull request title.
  --body <text>            Pull request body.
  --generate               Write generated branch strategy guidance.
  --apply                  Apply branch strategy policy files locally.
  --github                 Include GitHub protection guidance.
  --deep                   Include deeper project history signals.
  --report                 Render a project evaluation report.
  --team-size <number>     Team size signal for strategy recommendations.
  --release <cadence>      Release cadence signal for strategy recommendations.
  --event <name>           Notification event name.
  --channel <name>         Notification channel.
  --notify-channel <name>  Send BLOCK notification when a gate blocks.
  --language <en|ko|ja|zh> Select output language.
  --output-dir <path>      Select integration output directory.
  --force                  Overwrite generated integration files.
  --npm                    Check npm registry state for release-check.
  --dry-run                Preview an AIGate command without changing remotes.
  --no-verify              Skip the AIGate readiness gate for push.
  --version                Print CLI version.
`;

const commands = {
  init: commandInit,
  check: commandCheck,
  "git-ready": commandGitReady,
  push: commandPush,
  pr: commandPr,
  "pr-check": commandPrCheck,
  setup: commandSetup,
  settings: commandSettings,
  integrate: commandIntegrate,
  report: commandReport,
  "evaluate-project": commandEvaluateProject,
  score: commandScore,
  "branch-strategy": commandBranchStrategy,
  "release-check": commandReleaseCheck,
  "audit-report": commandAuditReport,
  notify: commandNotify,
  help: () => helpText.trimEnd()
};

function main(argv) {
  const [commandName, ...args] = argv;

  if (!commandName || commandName === "--help" || commandName === "-h") {
    return print(helpText.trimEnd());
  }

  if (commandName === "--version" || commandName === "-v") {
    return print(VERSION);
  }

  const command = commands[commandName];
  if (!command) {
    printError(`Unknown command: ${commandName}`);
    print("Run `aigate --help` for available commands.");
    process.exitCode = 1;
    return;
  }

  const output = command(args);
  if (output) {
    print(output);
  }
}

function commandInit(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const packageJson = readJsonFile("package.json");
  const outputDir = options.outputDir ?? ".";
  const files = [
    {
      path: options.config ?? join(outputDir, ".aigate.yml"),
      content: renderDefaultConfig(packageJson)
    },
    {
      path: join(outputDir, ".aigate", "reports", ".gitkeep"),
      content: ""
    }
  ];
  const results = writeProjectFiles(files, Boolean(options.force));

  if (options.format === "json") {
    return JSON.stringify({
      command: "init",
      files: results
    }, null, 2);
  }

  const lines = [
    t(language, "init.complete"),
    ...results.map((result) => `- ${translateIntegrationAction(result.action, language)}: ${result.path}`),
    t(language, "common.next", { next: "aigate evaluate-project && aigate branch-strategy --github" })
  ];

  return lines.join("\n");
}

function commandCheck(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const status = buildGitStatus();
  const analysis = buildChangeAnalysis();
  const result = {
    command: "check",
    status: analysis.secretFindings.length ? "BLOCK" : status.riskLevel === "high" ? "BLOCK" : status.changedFiles.length ? "WARN" : "PASS",
    branch: status.branch,
    changedFiles: status.changedFiles.length,
    changedPaths: analysis.paths,
    secretFindings: analysis.secretFindings,
    tracked: status.insideGitRepository,
    recommendation: analysis.secretFindings.length
      ? "Review possible secret-bearing files before commit or push."
      : status.recommendation
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return [
    t(language, "check.status", { status: statusLabel(result.status, language) }),
    t(language, "check.branch", { branch: result.branch }),
    t(language, "check.changedFiles", { count: result.changedFiles }),
    t(language, "check.secretFindings", { count: result.secretFindings.length }),
    t(language, "check.recommendation", { recommendation: translateRecommendation(result.recommendation, language) })
  ].join("\n");
}

function commandGitReady(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  return formatGitReadyResult(buildGitReadyResult(), options, language);
}

function commandPush(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const pushArgs = stripAigatePushOptions(args);
  const lines = [];

  if (!options.noVerify) {
    const result = buildGitReadyResult();
    lines.push(formatGitReadyResult(result, { format: "text" }, language));

    if (result.blockers.length) {
      appendBlockNotification(lines, options, language);
      process.exitCode = 1;
      return lines.join("\n");
    }
  } else {
    lines.push(t(language, "push.skip"));
  }

  const gitArgs = ["push", ...pushArgs];
  if (options.dryRun) {
    lines.push(t(language, "push.wouldRun", { command: `git ${gitArgs.join(" ")}` }));
    return lines.join("\n");
  }

  const result = spawnSync("git", gitArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.stdout.trim()) {
    lines.push(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    lines.push(result.stderr.trim());
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }

  return lines.join("\n");
}

function commandPr(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const lines = [];
  if (!options.noVerify) {
    const readiness = buildGitReadyResult();
    lines.push(formatGitReadyResult(readiness, { format: "text" }, language));

    if (readiness.blockers.length) {
      appendBlockNotification(lines, options, language);
      process.exitCode = 1;
      return lines.join("\n");
    }
  }

  const branch = git(["branch", "--show-current"]) || "HEAD";
  const base = options.base ?? "main";
  const title = options.title ?? `feat: update ${branch}`;
  const body = options.body ?? renderMarkdownReport(buildReport("pr"));
  const ghArgs = [
    "pr",
    "create",
    "--base",
    base,
    "--head",
    branch,
    "--title",
    title,
    "--body",
    body
  ];

  if (options.draft) {
    ghArgs.push("--draft");
  }

  if (options.dryRun) {
    lines.push(t(language, "push.wouldRun", { command: `gh ${quoteArgs(ghArgs).join(" ")}` }));
    return lines.join("\n");
  }

  const result = spawnSync("gh", ghArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.stdout.trim()) {
    lines.push(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    lines.push(result.stderr.trim());
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }

  return lines.join("\n");
}

function commandPrCheck(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const format = options.format ?? "markdown";
  const report = buildReport("pr");
  const output = renderReport(report, format);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

function commandSetup(args) {
  const options = parseOptions(args);
  const currentSettings = readSettings();
  const language = normalizeLanguage(options.language ?? currentSettings.language ?? DEFAULT_SETTINGS.language);

  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    ...currentSettings,
    language
  };

  writeSettings(settings);

  if (options.format === "json") {
    return JSON.stringify({
      command: "setup",
      settingsPath: getSettingsPath(),
      settings
    }, null, 2);
  }

  return [
    t(language, "settings.complete"),
    t(language, "settings.file", { path: getSettingsPath() }),
    t(language, "language.label", { language: languageName(language) })
  ].join("\n");
}

function commandSettings(args) {
  const options = parseOptions(args);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...readSettings()
  };
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  if (options.format === "json") {
    return JSON.stringify({
      command: "settings",
      settingsPath: getSettingsPath(),
      settings
    }, null, 2);
  }

  return [
    t(language, "settings.title"),
    t(language, "settings.file", { path: getSettingsPath() }),
    t(language, "language.label", { language: languageName(settings.language) })
  ].join("\n");
}

function commandIntegrate(args) {
  const options = parseOptions(args);
  const providerArg = firstPositionalArg(args) ?? "all";
  const providers = resolveIntegrationProviders(providerArg);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  if (!providers) {
    process.exitCode = 1;
    return [
      t(language, "unsupportedIntegration", { provider: providerArg }),
      t(language, "supportedIntegrations", { providers: SUPPORTED_INTEGRATIONS.join(", ") })
    ].join("\n");
  }

  const outputDir = options.outputDir ?? ".";
  const manifest = buildIntegrationManifest(providers);
  const files = buildIntegrationFiles(providers, outputDir, manifest);
  const results = writeIntegrationFiles(files, Boolean(options.force));

  if (options.format === "json") {
    return JSON.stringify({
      command: "integrate",
      providers,
      outputDir,
      files: results
    }, null, 2);
  }

  return [
    t(language, "integrate.complete"),
    t(language, "integrate.providers", { providers: providers.join(", ") }),
    ...results.map((result) => `- ${translateIntegrationAction(result.action, language)}: ${result.path}`),
    t(language, "integrate.next")
  ].join("\n");
}

function buildGitReadyResult() {
  const status = buildGitStatus();
  const evaluation = buildEvaluation();
  const analysis = buildChangeAnalysis();
  const blockers = [];

  if (!status.insideGitRepository) {
    blockers.push("AIGate must run inside a Git repository.");
  }

  if (status.riskLevel === "high") {
    blockers.push("Possible secret-bearing file names are present in local changes.");
  }

  if (analysis.secretFindings.length) {
    blockers.push(`${analysis.secretFindings.length} possible secret finding(s) detected in changed files.`);
  }

  if (evaluation.score < 80) {
    blockers.push(`Project foundation score is ${evaluation.score}/100; minimum is 80.`);
  }

  return {
    command: "git-ready",
    status: blockers.length ? "BLOCK" : "READY",
    branch: status.branch,
    changedFiles: status.changedFiles.length,
    changedPaths: analysis.paths,
    projectScore: evaluation.score,
    secretFindings: analysis.secretFindings,
    blockers,
    recommendation: blockers.length
      ? "Resolve blockers before committing, pushing, or opening a pull request."
      : "Run npm test, commit focused changes, push the branch, and open a pull request."
  };
}

function formatGitReadyResult(result, options, language = "en") {
  if (result.blockers.length) {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return [
    t(language, "gitReady.status", { status: statusLabel(result.status, language) }),
    t(language, "gitReady.branch", { branch: result.branch }),
    t(language, "gitReady.changedFiles", { count: result.changedFiles }),
    t(language, "gitReady.secretFindings", { count: result.secretFindings.length }),
    t(language, "gitReady.projectScore", { score: result.projectScore }),
    result.blockers.length ? t(language, "gitReady.blockers") : t(language, "gitReady.blockersNone"),
    ...result.blockers.map((blocker) => `- ${translateBlocker(blocker, language)}`),
    t(language, "gitReady.recommendation", { recommendation: translateRecommendation(result.recommendation, language) })
  ].join("\n");
}

function commandReport(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const format = options.format ?? "markdown";
  const type = options.type ?? "local";
  const report = buildReport(type);
  const output = renderReport(report, format);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

function commandEvaluateProject(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const evaluation = buildEvaluation({ deep: Boolean(options.deep) });

  if (options.report) {
    const format = options.format ?? "markdown";
    const output = renderProjectEvaluationReport(evaluation, format);

    if (options.output) {
      mkdirSync(dirname(options.output), { recursive: true });
      writeFileSync(options.output, `${output}\n`, "utf8");
      return t(language, "common.wrote", { path: options.output });
    }

    return output;
  }

  if (options.format === "json") {
    return JSON.stringify(evaluation, null, 2);
  }

  const rows = evaluation.checks.map((check) => {
    const mark = check.pass ? "PASS" : "TODO";
    return `- ${mark}: ${check.name}`;
  });
  const categoryRows = evaluation.categories.map((category) => (
    `- ${category.name}: ${category.score}/${category.weight}`
  ));
  const signalRows = evaluation.deepSignals
    ? [
        "",
        "Deep signals:",
        `- Commits inspected: ${evaluation.deepSignals.commitCount}`,
        `- Branches detected: ${evaluation.deepSignals.branchCount}`,
        `- Tags detected: ${evaluation.deepSignals.tagCount}`,
        `- Release workflows: ${evaluation.deepSignals.releaseWorkflowCount}`
      ]
    : [];

  return [
    `AIGate project score: ${evaluation.score}/100 (${evaluation.grade})`,
    "",
    "Categories:",
    ...categoryRows,
    "",
    "Checks:",
    ...rows,
    ...signalRows,
    "",
    `Recommendation: ${evaluation.recommendation}`
  ].join("\n");
}

function commandScore() {
  return String(buildEvaluation().score);
}

function commandReleaseCheck(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const check = buildReleaseCheck({ checkNpm: Boolean(options.npm) });

  if (options.format === "json") {
    return JSON.stringify(check, null, 2);
  }

  const rows = check.checks.map((item) => (
    `- ${statusLabel(item.pass ? "PASS" : "TODO", language)}: ${translateReleaseCheckName(item.name, language)}`
  ));
  const registryLine = renderRegistryLine(check.registry, language);

  return [
    t(language, "release.status", { status: statusLabel(check.status, language) }),
    t(language, "release.package", { packageName: check.packageName }),
    t(language, "release.version", { version: check.version }),
    t(language, "release.branch", { tag: check.expectedTag }),
    registryLine,
    "",
    ...rows,
    "",
    t(language, "release.nextSteps"),
    ...check.nextSteps.map((step) => `- ${translateReleaseNextStep(step, language)}`)
  ].join("\n");
}

function commandBranchStrategy(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const strategy = buildBranchStrategy(options);

  if (options.generate || options.apply) {
    const files = buildBranchStrategyFiles(strategy, options.outputDir ?? ".", language);
    const results = writeProjectFiles(files, Boolean(options.force));

    if (options.format === "json") {
      return JSON.stringify({
        command: "branch-strategy",
        strategy,
        files: results
      }, null, 2);
    }

    return [
      options.apply ? t(language, "branchStrategy.applied") : t(language, "branchStrategy.generated"),
      ...results.map((result) => `- ${translateIntegrationAction(result.action, language)}: ${result.path}`)
    ].join("\n");
  }

  if (options.format === "json") {
    return JSON.stringify(strategy, null, 2);
  }

  const lines = [
    t(language, "branchStrategy.recommended", { strategy: translateStrategyName(strategy.name, language) }),
    t(language, "branchStrategy.reason", { reason: translateBranchReason(strategy, language) }),
    "",
    t(language, "branchStrategy.branches"),
    ...strategy.branches.map((branch) => `- ${branch.name}: ${translateBranchUse(branch.use, language)}`)
  ];

  if (options.github) {
    lines.push("", t(language, "branchStrategy.githubProtection"), ...strategy.githubProtection.map((rule) => `- ${translateGithubProtection(rule, language)}`));
  }

  if (strategy.generatedOutputs.length) {
    lines.push("", t(language, "branchStrategy.outputs"), ...strategy.generatedOutputs.map((file) => `- ${file}`));
  }

  return lines.join("\n");
}

function commandAuditReport(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const format = options.format ?? "markdown";
  const report = buildAuditReport();
  const output = renderAuditReport(report, format);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

function commandNotify(args) {
  const [subcommand, ...rest] = args;
  const options = parseOptions(rest);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const event = options.event ?? "BLOCK";
  const channel = options.channel ?? "terminal";

  if (subcommand === "setup") {
    return [
      t(language, "notify.setup"),
      "- MVP: terminal",
      "- V1: Slack",
      "- V1.5: Discord and Teams",
      "- V2: email, GitHub PR comments, GitHub Checks"
    ].join("\n");
  }

  if (subcommand === "test") {
    return [
      t(language, "notify.test", { event }),
      t(language, "notify.target", { channel }),
      t(language, "notify.ready")
    ].join("\n");
  }

  if (subcommand === "send") {
    return sendNotification(event, channel, options, language);
  }

  process.exitCode = 1;
  return t(language, "notify.usage");
}

function sendNotification(event, channel, options, language = "en") {
  const payload = {
    event,
    channel,
    branch: git(["branch", "--show-current"]) || "unknown",
    status: buildGitReadyResult().status,
    generatedAt: new Date().toISOString()
  };

  if (channel === "terminal") {
    return [
      t(language, "notify.terminal", { event }),
      t(language, "check.branch", { branch: payload.branch }),
      t(language, "notify.status", { status: statusLabel(payload.status, language) })
    ].join("\n");
  }

  const webhookEnv = options.webhookEnv ?? defaultWebhookEnv(channel);
  const webhookUrl = process.env[webhookEnv];

  if (!webhookUrl) {
    process.exitCode = 1;
    return [
      t(language, "notify.missingWebhook", { env: webhookEnv }),
      t(language, "notify.webhookHint", { env: webhookEnv })
    ].join("\n");
  }

  if (options.dryRun) {
    return t(language, "notify.wouldSend", { event, channel, env: webhookEnv });
  }

  const result = spawnSync("curl", [
    "-sS",
    "-X",
    "POST",
    "-H",
    "Content-Type: application/json",
    "--data",
    JSON.stringify({ text: `AIGate ${event}: ${payload.status} on ${payload.branch}`, ...payload }),
    webhookUrl
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return result.stderr.trim() || `Failed to send notification to ${channel}`;
  }

  return t(language, "notify.sent", { event, channel });
}

function appendBlockNotification(lines, options, language = "en") {
  if (!options.notifyChannel) {
    return;
  }

  const originalExitCode = process.exitCode;
  lines.push("", sendNotification("BLOCK", options.notifyChannel, options, language));
  process.exitCode = originalExitCode;
}

function defaultWebhookEnv(channel) {
  return {
    slack: "AIGATE_SLACK_WEBHOOK_URL",
    discord: "AIGATE_DISCORD_WEBHOOK_URL",
    teams: "AIGATE_TEAMS_WEBHOOK_URL"
  }[channel] ?? "AIGATE_WEBHOOK_URL";
}

function buildChangeAnalysis() {
  const paths = getChangedPaths();
  return {
    paths,
    secretFindings: scanSecrets(paths)
  };
}

function getChangedPaths() {
  const outputs = [
    git(["diff", "--name-only", "HEAD"]),
    git(["diff", "--name-only", "--cached"]),
    git(["ls-files", "--others", "--exclude-standard"])
  ];

  return [...new Set(outputs
    .flatMap((output) => (output ?? "").split("\n"))
    .map((path) => path.trim())
    .filter(Boolean)
    .filter((path) => !path.startsWith(".git/")))];
}

function scanSecrets(paths) {
  const findings = [];

  for (const filePath of paths) {
    if (!existsSync(filePath) || !isScannableFile(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const secretPattern of SECRET_PATTERNS) {
      secretPattern.pattern.lastIndex = 0;
      let match;
      while ((match = secretPattern.pattern.exec(content)) !== null) {
        if (isLikelyPlaceholder(match[0])) {
          continue;
        }

        const line = lineNumberForIndex(lines, content, match.index);
        findings.push({
          ruleId: secretPattern.id,
          label: secretPattern.label,
          file: filePath,
          line,
          excerpt: redactSecret(match[0])
        });
      }
    }
  }

  return findings;
}

function isScannableFile(filePath) {
  try {
    const stat = statSync(filePath);
    return stat.isFile() && stat.size <= MAX_SECRET_SCAN_BYTES && !isBinaryPath(filePath);
  } catch {
    return false;
  }
}

function isBinaryPath(filePath) {
  return /\.(png|jpe?g|gif|webp|pdf|zip|gz|tgz|tar|ico|woff2?|ttf|otf)$/i.test(filePath);
}

function isLikelyPlaceholder(value) {
  return /(example|placeholder|dummy|fake|sample|<|your_|replace_me)/i.test(value);
}

function lineNumberForIndex(lines, content, index) {
  const prefix = content.slice(0, index);
  return prefix.split(/\r?\n/).length;
}

function redactSecret(value) {
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= 12) {
    return "[redacted]";
  }

  return `${text.slice(0, 6)}...[redacted]`;
}

function buildGitStatus() {
  const insideGitRepository = git(["rev-parse", "--is-inside-work-tree"]) === "true";
  const branch = insideGitRepository ? git(["branch", "--show-current"]) || "detached" : "not-a-git-repo";
  const statusOutput = insideGitRepository ? git(["status", "--short"]) ?? "" : "";
  const changedFiles = statusOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const highRisk = changedFiles.some((line) => /(\.env|secret|token|private[_-]?key)/i.test(line));

  let recommendation = "No local changes detected.";
  if (!insideGitRepository) {
    recommendation = "Run AIGate inside a Git repository.";
  } else if (highRisk) {
    recommendation = "Review possible secret-bearing files before commit or push.";
  } else if (changedFiles.length) {
    recommendation = "Open a focused branch and pull request after tests pass.";
  }

  return {
    insideGitRepository,
    branch,
    changedFiles,
    riskLevel: highRisk ? "high" : changedFiles.length ? "medium" : "low",
    recommendation
  };
}

function buildEvaluation(options = {}) {
  const packageJson = readJsonFile("package.json");
  const checks = [
    { category: "git_workflow", name: "AIGate configuration exists", pass: existsSync(".aigate.yml") },
    { category: "git_workflow", name: "Branch strategy is documented", pass: existsSync(join("docs", "branch-strategy.md")) },
    { category: "git_workflow", name: "Git upload workflow is documented", pass: existsSync(join("docs", "git-upload-workflow.md")) },
    { category: "git_workflow", name: "Pull request template exists", pass: existsSync(join(".github", "pull_request_template.md")) },
    { category: "git_workflow", name: "CODEOWNERS exists", pass: existsSync(join(".github", "CODEOWNERS")) },
    { category: "pr_quality", name: "Contribution guide exists", pass: existsSync("CONTRIBUTING.md") },
    { category: "pr_quality", name: "Issue templates exist", pass: existsSync(join(".github", "ISSUE_TEMPLATE")) },
    { category: "pr_quality", name: "AI assistant instructions exist", pass: existsSync("AGENTS.md") && existsSync("GEMINI.md") },
    { category: "testing", name: "Test directory exists", pass: existsSync("test") },
    { category: "testing", name: "npm test script exists", pass: Boolean(packageJson.scripts?.test) },
    { category: "testing", name: "CI gate script exists", pass: Boolean(packageJson.scripts?.ci || packageJson.scripts?.["git:ready"]) },
    { category: "ci_cd", name: "CI workflow exists", pass: existsSync(join(".github", "workflows", "ci.yml")) },
    { category: "ci_cd", name: "Release workflow exists", pass: existsSync(join(".github", "workflows", "release.yml")) },
    { category: "ci_cd", name: "Dependabot exists", pass: existsSync(join(".github", "dependabot.yml")) },
    { category: "security", name: "Security policy exists", pass: existsSync("SECURITY.md") },
    { category: "security", name: "Security scanning is documented", pass: existsSync(join("docs", "security-scanning.md")) },
    { category: "security", name: "OpenSSF Scorecard workflow exists", pass: existsSync(join(".github", "workflows", "scorecard.yml")) },
    { category: "documentation", name: "README exists", pass: existsSync("README.md") },
    { category: "documentation", name: "License exists", pass: existsSync("LICENSE") },
    { category: "documentation", name: "Roadmap exists", pass: existsSync(join("docs", "roadmap.md")) },
    { category: "maintainability", name: "Package metadata exists", pass: existsSync("package.json") },
    { category: "maintainability", name: "Support policy exists", pass: existsSync("SUPPORT.md") },
    { category: "maintainability", name: "Governance exists", pass: existsSync("GOVERNANCE.md") }
  ];
  const weights = {
    git_workflow: 20,
    pr_quality: 15,
    testing: 20,
    ci_cd: 15,
    security: 15,
    documentation: 10,
    maintainability: 5
  };
  const categories = Object.entries(weights).map(([name, weight]) => {
    const categoryChecks = checks.filter((check) => check.category === name);
    const passed = categoryChecks.filter((check) => check.pass).length;
    return {
      name,
      weight,
      passed,
      total: categoryChecks.length,
      score: Math.round((passed / categoryChecks.length) * weight)
    };
  });
  const score = categories.reduce((sum, category) => sum + category.score, 0);
  const grade = gradeForScore(score);
  const recommendation = score === 100
    ? "Repository foundations are ready for the next MVP slice."
    : "Complete the missing repository foundations before public release.";
  const evaluation = {
    score,
    grade,
    categories,
    checks,
    recommendation
  };

  if (options.deep) {
    evaluation.deepSignals = buildDeepSignals();
  }

  return evaluation;
}

function gradeForScore(score) {
  if (score >= 90) {
    return "A";
  }

  if (score >= 75) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  if (score >= 40) {
    return "D";
  }

  return "F";
}

function buildDeepSignals() {
  const branches = (git(["branch", "--all", "--format=%(refname:short)"]) ?? "")
    .split("\n")
    .map((branch) => branch.trim())
    .filter(Boolean);
  const tags = (git(["tag", "--list"]) ?? "")
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const commitCount = Number.parseInt(git(["rev-list", "--count", "HEAD"]) ?? "0", 10) || 0;
  const recentCommitSubjects = (git(["log", "-5", "--pretty=%s"]) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    commitCount,
    branchCount: branches.length,
    tagCount: tags.length,
    releaseWorkflowCount: existsSync(join(".github", "workflows", "release.yml")) ? 1 : 0,
    hasHotfixFlowDocs: existsSync(join("docs", "hotfix-process.md")),
    hasReleaseProcessDocs: existsSync(join("docs", "release-process.md")),
    recentCommitSubjects
  };
}

function buildBranchStrategy(options = {}) {
  const packageJson = readJsonFile("package.json");
  const hasCi = existsSync(join(".github", "workflows", "ci.yml"));
  const hasReleaseDocs = existsSync(join("docs", "roadmap.md"));
  const branchNames = (git(["branch", "--all", "--format=%(refname:short)"]) ?? "")
    .split("\n")
    .map((branch) => branch.trim())
    .filter(Boolean);
  const teamSize = Number.parseInt(options.teamSize ?? "0", 10) || null;
  const releaseCadence = String(options.release ?? "auto").trim().toLowerCase();
  const selectedStrategy = selectBranchStrategy({
    branchNames,
    hasCi,
    teamSize,
    releaseCadence
  });
  const reasonParts = [
    "AIGate needs fast public contribution flow",
    "npm channel control for latest, next, beta, and canary releases"
  ];

  if (hasCi) {
    reasonParts.push("CI-backed pull request protection is already present");
  }

  if (hasReleaseDocs || packageJson.name) {
    reasonParts.push("release documentation and package metadata exist");
  }

  if (teamSize) {
    reasonParts.push(`team size signal is ${teamSize}`);
  }

  if (releaseCadence !== "auto") {
    reasonParts.push(`release cadence signal is ${releaseCadence}`);
  }

  return {
    name: selectedStrategy,
    reason: `${reasonParts.join("; ")}.`,
    reasonParts,
    signals: {
      packageName: packageJson.name ?? null,
      hasCi,
      hasReleaseDocs,
      teamSize,
      releaseCadence,
      branchCount: branchNames.length,
      changedPaths: getChangedPaths().length
    },
    branches: branchRulesForStrategy(selectedStrategy),
    githubProtection: [
      "Require pull request before merging into main.",
      "Require at least one approval.",
      "Require the CI test job before merging.",
      "Require conversation resolution.",
      "Block force pushes and branch deletion."
    ],
    generatedOutputs: [
      ".aigate/generated-branch-strategy.md",
      ".aigate/branch-strategy-policy.json",
      "docs/release-process.md",
      "docs/hotfix-process.md",
      ".github/pull_request_template.aigate.md",
      ".github/CODEOWNERS.aigate"
    ]
  };
}

function selectBranchStrategy({ branchNames, hasCi, teamSize, releaseCadence }) {
  const hasDevelop = branchNames.some((branch) => branch === "develop" || branch.endsWith("/develop"));
  const hasReleaseBranches = branchNames.some((branch) => /(^|\/)release\//.test(branch));

  if (hasDevelop || hasReleaseBranches || teamSize >= 12 || ["monthly", "quarterly", "scheduled"].includes(releaseCadence)) {
    return "Git Flow";
  }

  if (hasCi && teamSize && teamSize <= 10 && ["daily", "continuous", "on-demand"].includes(releaseCadence)) {
    return "Trunk-Based Development";
  }

  if (teamSize && teamSize >= 6 && ["weekly", "biweekly"].includes(releaseCadence)) {
    return "Hybrid Flow";
  }

  return "GitHub Flow with release channels";
}

function branchRulesForStrategy(strategyName) {
  const commonBranches = [
    { name: "codex/*", use: "AI-assisted implementation branches" },
    { name: "feature/*", use: "user-facing feature branches" },
    { name: "fix/*", use: "bug fix branches" },
    { name: "docs/*", use: "documentation-only branches" },
    { name: "chore/*", use: "maintenance and tooling branches" }
  ];

  if (strategyName === "Git Flow") {
    return [
      { name: "main", use: "production releases only" },
      { name: "develop", use: "next release integration" },
      ...commonBranches,
      { name: "release/*", use: "release stabilization from develop" },
      { name: "hotfix/*", use: "urgent production fixes from main" }
    ];
  }

  if (strategyName === "Trunk-Based Development") {
    return [
      { name: "main", use: "protected trunk and release source" },
      { name: "short/*", use: "short-lived changes merged quickly" },
      ...commonBranches,
      { name: "release/*", use: "optional release hardening" },
      { name: "hotfix/*", use: "urgent stable fixes" }
    ];
  }

  if (strategyName === "Hybrid Flow") {
    return [
      { name: "main", use: "stable production source of truth" },
      { name: "develop", use: "optional integration branch for larger releases" },
      ...commonBranches,
      { name: "release/*", use: "planned release stabilization" },
      { name: "hotfix/*", use: "urgent stable fixes" }
    ];
  }

  return [
    { name: "main", use: "protected stable source of truth" },
    ...commonBranches,
    { name: "release/*", use: "release stabilization" },
    { name: "hotfix/*", use: "urgent stable fixes" }
  ];
}

function buildReleaseCheck(options = {}) {
  const packageJson = readJsonFile("package.json");
  const version = packageJson.version ?? "0.0.0";
  const packageName = packageJson.name ?? "";
  const repository = detectRepositorySlug(packageJson);
  const repositoryForCommand = repository ?? "<owner>/<repo>";
  const expectedTag = `v${version}`;
  const tags = (git(["tag", "--list"]) ?? "")
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const hasExpectedTag = tags.includes(expectedTag);
  const checks = [
    { name: "package.json exists", pass: existsSync("package.json") },
    { name: "package-lock.json version matches package.json", pass: readJsonFile("package-lock.json").version === version },
    { name: "package is not marked private", pass: packageJson.private !== true },
    { name: "package has a valid npm package name", pass: isValidNpmPackageName(packageName) },
    { name: "package version is not 0.0.0", pass: version !== "0.0.0" },
    { name: "package declares npm entrypoint or bin", pass: hasNpmEntrypoint(packageJson) },
    { name: "publishConfig access is public", pass: packageJson.publishConfig?.access === "public" },
    { name: "release workflow exists", pass: existsSync(join(".github", "workflows", "release.yml")) },
    { name: "release workflow uses npm provenance", pass: fileIncludes(join(".github", "workflows", "release.yml"), "--provenance") },
    { name: "release workflow disables package manager cache", pass: fileIncludes(join(".github", "workflows", "release.yml"), "package-manager-cache: false") },
    { name: "README documents npm install command", pass: readmeDocumentsNpmInstall(packageName) },
    { name: `${expectedTag} tag exists`, pass: hasExpectedTag }
  ];
  const registry = options.checkNpm
    ? lookupNpmPublication(packageName, version)
    : { checked: false };
  const localReady = checks.every((check) => check.pass);
  const status = localReady && registry.checked && registry.published
    ? "RELEASED"
    : (localReady ? "READY" : "ACTION_REQUIRED");
  const nextSteps = [];

  if (!hasExpectedTag) {
    if (registry.checked && registry.published) {
      nextSteps.push(`${packageName}@${version} is already on npm; create release tag ${expectedTag} to record the release.`);
    } else if (registry.checked && registry.packageExists) {
      nextSteps.push(`${packageName}@${version} is not on npm yet; create release tag ${expectedTag} to publish with Trusted Publishing.`);
    } else {
      nextSteps.push(`If ${packageName} is not on npm yet, enable npm account 2FA and create it with: npm publish --access public`);
      nextSteps.push(`Configure trusted publishing after the package exists: npx npm@latest trust github ${packageName} --file release.yml --repo ${repositoryForCommand} --allow-publish --yes`);
      nextSteps.push(`Create release tag ${expectedTag} after npm Trusted Publishing is configured.`);
    }
  }

  if (registry.checked && registry.published && hasExpectedTag) {
    nextSteps.push(`${packageName}@${version} is released; bump package.json before the next npm release.`);
  }

  if (registry.checked && registry.error) {
    nextSteps.push(`Review npm registry lookup error: ${registry.error}`);
  }

  if (!registry.checked) {
    nextSteps.push("Run release-check --npm to confirm npm registry publication state.");
  }

  if (!checks.find((check) => check.name === "release workflow uses npm provenance")?.pass) {
    nextSteps.push("Ensure release workflow publishes with npm provenance.");
  }

  nextSteps.push("Run npm run ci before tagging a release.");
  nextSteps.push("Run npm publish dry-run through the Release workflow_dispatch dry_run input.");

  return {
    command: "release-check",
    status,
    packageName: packageJson.name ?? null,
    version,
    expectedTag,
    repository,
    registry,
    checks,
    nextSteps
  };
}

function isValidNpmPackageName(packageName) {
  if (!packageName || packageName.length > 214 || packageName !== packageName.toLowerCase()) {
    return false;
  }

  if (packageName.startsWith(".") || packageName.startsWith("_") || packageName.includes(" ")) {
    return false;
  }

  if (packageName.includes("..") || /[~'!()*]/.test(packageName)) {
    return false;
  }

  if (packageName.startsWith("@")) {
    return /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/.test(packageName);
  }

  return /^[a-z0-9][a-z0-9._-]*$/.test(packageName);
}

function hasNpmEntrypoint(packageJson) {
  return Boolean(
    packageJson.bin ||
    packageJson.main ||
    packageJson.module ||
    packageJson.exports ||
    Array.isArray(packageJson.files)
  );
}

function readmeDocumentsNpmInstall(packageName) {
  if (!packageName || !existsSync("README.md")) {
    return false;
  }

  const readme = readFileSync("README.md", "utf8");
  const escapedName = escapeRegExp(packageName);
  return new RegExp(`\\b(?:npm|pnpm|yarn|bun)\\s+(?:install|add|dlx|x|global\\s+add)\\s+(?:-g\\s+)?${escapedName}\\b`).test(readme) ||
    new RegExp(`\\bnpx\\s+${escapedName}\\b`).test(readme);
}

function detectRepositorySlug(packageJson) {
  return parseGitHubRepositorySlug(git(["config", "--get", "remote.origin.url"])) ??
    parseGitHubRepositorySlug(packageJson.repository?.url ?? packageJson.repository) ??
    null;
}

function parseGitHubRepositorySlug(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim().replace(/\.git$/, "");
  const patterns = [
    /github\.com[:/]([^/\s]+)\/([^/\s]+)$/i,
    /^([^/\s]+)\/([^/\s]+)$/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }

  return null;
}

function lookupNpmPublication(packageName, version) {
  const base = {
    checked: true,
    packageName,
    version,
    packageExists: null,
    published: false,
    publishedVersion: null,
    error: null
  };

  if (!packageName || !version) {
    return { ...base, published: null, error: "Missing package name or version." };
  }

  const result = spawnSync("npm", ["view", `${packageName}@${version}`, "version", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status === 0) {
    const rawVersion = result.stdout.trim();
    let publishedVersion = rawVersion;
    try {
      publishedVersion = JSON.parse(rawVersion);
    } catch {
      // Keep raw npm output when the registry returns non-JSON text.
    }

    return {
      ...base,
      packageExists: true,
      published: Boolean(publishedVersion),
      publishedVersion: publishedVersion ? String(publishedVersion) : null
    };
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (/E404|404 Not Found|not in this registry/i.test(output)) {
    const packageResult = spawnSync("npm", ["view", packageName, "name", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });

    if (packageResult.status === 0) {
      return { ...base, packageExists: true };
    }

    const packageOutput = `${packageResult.stdout}\n${packageResult.stderr}`;
    if (/E404|404 Not Found|not in this registry/i.test(packageOutput)) {
      return { ...base, packageExists: false };
    }

    const packageError = packageOutput
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "npm package lookup failed";

    return { ...base, published: null, error: packageError };
  }

  const error = output
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) ?? "npm view failed";

  return { ...base, published: null, error };
}

function renderRegistryLine(registry, language = "en") {
  if (!registry?.checked) {
    return t(language, "release.registryNotChecked");
  }

  if (registry.error) {
    return t(language, "release.registryFailed", { error: registry.error });
  }

  if (registry.published) {
    return t(language, "release.registryPublished", {
      packageName: registry.packageName,
      version: registry.publishedVersion
    });
  }

  return t(language, "release.registryNotPublished", {
    packageName: registry.packageName,
    version: registry.version
  });
}

function buildAuditReport() {
  const evaluation = buildEvaluation({ deep: true });
  const releaseCheck = buildReleaseCheck();
  const readiness = buildGitReadyResult();
  const recentCommits = (git(["log", "-10", "--pretty=%h %s"]) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const findings = [
    ...readiness.blockers.map((blocker) => ({
      severity: "high",
      area: "readiness",
      message: blocker
    })),
    ...releaseCheck.checks
      .filter((check) => !check.pass)
      .map((check) => ({
        severity: check.name.includes("tag exists") ? "medium" : "high",
        area: "release",
        message: check.name
      })),
    ...evaluation.checks
      .filter((check) => !check.pass)
      .map((check) => ({
        severity: "medium",
        area: check.category,
        message: check.name
      }))
  ];

  return {
    command: "audit-report",
    generatedAt: new Date().toISOString(),
    branch: git(["branch", "--show-current"]) || "unknown",
    status: findings.length ? "ACTION_REQUIRED" : "PASS",
    projectScore: evaluation.score,
    projectGrade: evaluation.grade,
    releaseStatus: releaseCheck.status,
    findings,
    recentCommits,
    recommendations: [
      "Keep all changes going through pull requests into main.",
      "Run npm run ci and aigate git-ready before release tags.",
      "Review release-check output before publishing npm packages.",
      "Attach audit-report output to release readiness discussions when governance matters."
    ]
  };
}

function buildReport(type) {
  const status = buildGitStatus();
  const evaluation = buildEvaluation();
  const analysis = buildChangeAnalysis();
  const riskScore = calculateRiskScore(status, evaluation, analysis);
  const reportStatus = analysis.secretFindings.length
    ? "BLOCK"
    : riskScore >= 65 || status.changedFiles.length
      ? "WARN"
      : "PASS";

  return {
    command: "report",
    type,
    generatedAt: new Date().toISOString(),
    branch: status.branch,
    status: reportStatus,
    finalVerdict: reportStatus,
    riskScore,
    prReadinessScore: Math.max(0, 100 - riskScore),
    changedFiles: status.changedFiles.length,
    changedPaths: analysis.paths,
    secretFindings: analysis.secretFindings,
    projectScore: evaluation.score,
    projectGrade: evaluation.grade,
    checks: evaluation.checks,
    branchAnalysis: buildBranchStrategy(),
    recommendedActions: recommendedActionsForReport(status, evaluation, analysis, type),
    recommendation: analysis.secretFindings.length
      ? "Review possible secret-bearing files before commit or push."
      : status.recommendation
  };
}

function calculateRiskScore(status, evaluation, analysis) {
  let score = 0;

  score += Math.min(status.changedFiles.length * 4, 40);

  if (status.riskLevel === "high") {
    score += 30;
  }

  if (analysis.secretFindings.length) {
    score += 50;
  }

  if (evaluation.score < 80) {
    score += 20;
  }

  return Math.min(score, 100);
}

function recommendedActionsForReport(status, evaluation, analysis, type) {
  const actions = [];

  if (analysis.secretFindings.length) {
    actions.push("Remove or rotate suspected secrets before commit or push.");
  }

  if (status.changedFiles.length > 20) {
    actions.push("Split large changes into smaller pull requests.");
  }

  if (evaluation.score < 100) {
    actions.push("Complete missing repository foundation checks.");
  }

  if (type === "pr") {
    actions.push("Include validation commands and release impact in the pull request body.");
  }

  if (!actions.length) {
    actions.push("Run tests, keep the change focused, and open a pull request.");
  }

  return actions;
}

function renderReport(report, format) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  if (format === "html") {
    return renderHtmlReport(report);
  }

  if (format === "sarif") {
    return JSON.stringify(renderSarifReport(report), null, 2);
  }

  return renderMarkdownReport(report);
}

function renderMarkdownReport(report) {
  const lines = [
    `# AIGate ${report.type} report`,
    "",
    `- Status: ${report.status}`,
    `- Risk score: ${report.riskScore}/100`,
    `- PR readiness score: ${report.prReadinessScore}/100`,
    `- Branch: ${report.branch}`,
    `- Changed files: ${report.changedFiles}`,
    `- Secret findings: ${report.secretFindings.length}`,
    `- Project score: ${report.projectScore}/100 (${report.projectGrade})`,
    `- Recommendation: ${report.recommendation}`,
    "",
    "## Changed Paths",
    "",
    ...(report.changedPaths.length ? report.changedPaths.map((path) => `- ${path}`) : ["- None"]),
    "",
    "## Secret Findings",
    "",
    ...(report.secretFindings.length
      ? report.secretFindings.map((finding) => `- ${finding.label} in ${finding.file}:${finding.line}`)
      : ["- None"]),
    "",
    "## Recommended Actions",
    "",
    ...report.recommendedActions.map((action) => `- ${action}`)
  ];

  if (report.type === "weekly") {
    lines.push(
      "",
      "## Weekly Team Signals",
      "",
      `- Project grade: ${report.projectGrade}`,
      `- Changed paths in current workspace: ${report.changedPaths.length}`,
      `- Release status: ${buildReleaseCheck().status}`
    );
  }

  if (report.type === "risk") {
    lines.push(
      "",
      "## Risk Signals",
      "",
      `- High-risk file signal: ${report.riskScore >= 65 ? "yes" : "no"}`,
      `- Secret findings: ${report.secretFindings.length}`,
      `- Suggested verdict: ${report.finalVerdict}`
    );
  }

  return lines.join("\n");
}

function renderHtmlReport(report) {
  return [
    "<!doctype html>",
    "<html>",
    "<head><meta charset=\"utf-8\"><title>AIGate report</title></head>",
    "<body>",
    `<h1>AIGate ${escapeHtml(report.type)} report</h1>`,
    "<ul>",
    `<li>Status: ${escapeHtml(report.status)}</li>`,
    `<li>Risk score: ${report.riskScore}/100</li>`,
    `<li>PR readiness score: ${report.prReadinessScore}/100</li>`,
    `<li>Branch: ${escapeHtml(report.branch)}</li>`,
    `<li>Changed files: ${report.changedFiles}</li>`,
    `<li>Secret findings: ${report.secretFindings.length}</li>`,
    `<li>Project score: ${report.projectScore}/100 (${escapeHtml(report.projectGrade)})</li>`,
    `<li>Recommendation: ${escapeHtml(report.recommendation)}</li>`,
    "</ul>",
    "<h2>Recommended Actions</h2>",
    "<ul>",
    ...report.recommendedActions.map((action) => `<li>${escapeHtml(action)}</li>`),
    "</ul>",
    "</body>",
    "</html>"
  ].join("\n");
}

function renderSarifReport(report) {
  const rules = [...new Map(report.secretFindings.map((finding) => [
    finding.ruleId,
    {
      id: finding.ruleId,
      name: finding.label,
      shortDescription: {
        text: finding.label
      }
    }
  ])).values()];

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "AIGate",
            informationUri: "https://github.com/LeeHueeng/aigate-ai-git-workflow-guard-cli",
            rules
          }
        },
        results: report.secretFindings.map((finding) => ({
          ruleId: finding.ruleId,
          level: "error",
          message: {
            text: `${finding.label}: ${finding.excerpt}`
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: finding.file
                },
                region: {
                  startLine: finding.line
                }
              }
            }
          ]
        }))
      }
    ]
  };
}

function renderProjectEvaluationReport(evaluation, format) {
  if (format === "json") {
    return JSON.stringify(evaluation, null, 2);
  }

  if (format === "html") {
    return [
      "<!doctype html>",
      "<html>",
      "<head><meta charset=\"utf-8\"><title>AIGate project evaluation</title></head>",
      "<body>",
      "<h1>AIGate project evaluation</h1>",
      `<p>Score: ${evaluation.score}/100 (${escapeHtml(evaluation.grade)})</p>`,
      "<h2>Categories</h2>",
      "<ul>",
      ...evaluation.categories.map((category) => (
        `<li>${escapeHtml(category.name)}: ${category.score}/${category.weight}</li>`
      )),
      "</ul>",
      "<h2>Checks</h2>",
      "<ul>",
      ...evaluation.checks.map((check) => (
        `<li>${check.pass ? "PASS" : "TODO"}: ${escapeHtml(check.name)}</li>`
      )),
      "</ul>",
      `<p>Recommendation: ${escapeHtml(evaluation.recommendation)}</p>`,
      "</body>",
      "</html>"
    ].join("\n");
  }

  return [
    "# AIGate Project Evaluation",
    "",
    `- Score: ${evaluation.score}/100`,
    `- Grade: ${evaluation.grade}`,
    `- Recommendation: ${evaluation.recommendation}`,
    "",
    "## Categories",
    "",
    ...evaluation.categories.map((category) => `- ${category.name}: ${category.score}/${category.weight}`),
    "",
    "## Checks",
    "",
    ...evaluation.checks.map((check) => `- ${check.pass ? "PASS" : "TODO"}: ${check.name}`),
    ...(evaluation.deepSignals
      ? [
          "",
          "## Deep Signals",
          "",
          `- Commits inspected: ${evaluation.deepSignals.commitCount}`,
          `- Branches detected: ${evaluation.deepSignals.branchCount}`,
          `- Tags detected: ${evaluation.deepSignals.tagCount}`,
          `- Release workflows: ${evaluation.deepSignals.releaseWorkflowCount}`,
          `- Release process docs: ${evaluation.deepSignals.hasReleaseProcessDocs ? "yes" : "no"}`,
          `- Hotfix process docs: ${evaluation.deepSignals.hasHotfixFlowDocs ? "yes" : "no"}`
        ]
      : [])
  ].join("\n");
}

function renderAuditReport(report, format) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  if (format === "html") {
    return [
      "<!doctype html>",
      "<html>",
      "<head><meta charset=\"utf-8\"><title>AIGate audit report</title></head>",
      "<body>",
      "<h1>AIGate audit report</h1>",
      `<p>Status: ${escapeHtml(report.status)}</p>`,
      `<p>Project score: ${report.projectScore}/100 (${escapeHtml(report.projectGrade)})</p>`,
      `<p>Release status: ${escapeHtml(report.releaseStatus)}</p>`,
      "<h2>Findings</h2>",
      "<ul>",
      ...(report.findings.length
        ? report.findings.map((finding) => `<li>${escapeHtml(finding.severity)} ${escapeHtml(finding.area)}: ${escapeHtml(finding.message)}</li>`)
        : ["<li>None</li>"]),
      "</ul>",
      "</body>",
      "</html>"
    ].join("\n");
  }

  return [
    "# AIGate Audit Report",
    "",
    `- Status: ${report.status}`,
    `- Branch: ${report.branch}`,
    `- Project score: ${report.projectScore}/100 (${report.projectGrade})`,
    `- Release status: ${report.releaseStatus}`,
    "",
    "## Findings",
    "",
    ...(report.findings.length
      ? report.findings.map((finding) => `- ${finding.severity} ${finding.area}: ${finding.message}`)
      : ["- None"]),
    "",
    "## Recent Commits",
    "",
    ...(report.recentCommits.length ? report.recentCommits.map((commit) => `- ${commit}`) : ["- None"]),
    "",
    "## Recommendations",
    "",
    ...report.recommendations.map((recommendation) => `- ${recommendation}`)
  ].join("\n");
}

function renderBranchStrategyMarkdown(strategy, language = "en") {
  return [
    language === "en" ? `# ${strategy.name}` : `# ${t(language, "branchStrategy.recommended", { strategy: translateStrategyName(strategy.name, language) })}`,
    "",
    t(language, "branchStrategy.reason", { reason: translateBranchReason(strategy, language) }),
    "",
    `## ${t(language, "branchStrategy.branches").replace(/:$/, "")}`,
    "",
    ...strategy.branches.map((branch) => `- \`${branch.name}\`: ${translateBranchUse(branch.use, language)}`),
    "",
    `## ${t(language, "branchStrategy.githubProtection").replace(/:$/, "")}`,
    "",
    ...strategy.githubProtection.map((rule) => `- ${translateGithubProtection(rule, language)}`),
    "",
    `## ${t(language, "branchStrategy.outputs").replace(/:$/, "")}`,
    "",
    ...strategy.generatedOutputs.map((file) => `- \`${file}\``)
  ].join("\n");
}

function buildBranchStrategyFiles(strategy, outputDir, language = "en") {
  return [
    {
      path: join(outputDir, ".aigate", "generated-branch-strategy.md"),
      content: `${renderBranchStrategyMarkdown(strategy, language)}\n`
    },
    {
      path: join(outputDir, ".aigate", "branch-strategy-policy.json"),
      content: `${JSON.stringify({
        version: 1,
        strategy: strategy.name,
        generatedAt: new Date().toISOString(),
        branches: strategy.branches,
        githubProtection: strategy.githubProtection
      }, null, 2)}\n`
    },
    {
      path: join(outputDir, "docs", "release-process.md"),
      content: renderReleaseProcess(strategy, language)
    },
    {
      path: join(outputDir, "docs", "hotfix-process.md"),
      content: renderHotfixProcess(strategy, language)
    },
    {
      path: join(outputDir, ".github", "pull_request_template.aigate.md"),
      content: renderPullRequestTemplateDraft(language)
    },
    {
      path: join(outputDir, ".github", "CODEOWNERS.aigate"),
      content: "* @LeeHueeng\n"
    }
  ];
}

function renderReleaseProcess(strategy, language = "en") {
  if (language === "ko") {
    return [
      "# 릴리스 프로세스",
      "",
      `권장 전략: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main`은 PR을 통해 항상 배포 가능한 상태로 유지합니다.",
      "2. 릴리스 준비 전에 `npm run ci`와 `aigate git-ready`를 실행합니다.",
      "3. 별도 안정화가 필요할 때만 `release/vX.Y.Z`를 생성합니다.",
      "4. 안정 릴리스는 `vX.Y.Z` 태그로 표시합니다.",
      "5. npm Trusted Publishing 설정 후 Release workflow로 npm 패키지를 배포합니다.",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      "# リリースプロセス",
      "",
      `推奨戦略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main` は PR 経由で常にリリース可能な状態に保ちます。",
      "2. リリース準備前に `npm run ci` と `aigate git-ready` を実行します。",
      "3. 個別の安定化が必要な場合のみ `release/vX.Y.Z` を作成します。",
      "4. 安定リリースは `vX.Y.Z` tag で示します。",
      "5. npm Trusted Publishing 設定後、Release workflow で npm パッケージを公開します。",
      ""
    ].join("\n");
  }

  if (language === "zh") {
    return [
      "# 发布流程",
      "",
      `推荐策略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. 通过 PR 保持 `main` 始终可发布。",
      "2. 发布准备前运行 `npm run ci` 和 `aigate git-ready`。",
      "3. 仅在需要单独稳定时创建 `release/vX.Y.Z`。",
      "4. 稳定发布使用 `vX.Y.Z` 标签。",
      "5. 配置 npm Trusted Publishing 后，通过 Release workflow 发布 npm 包。",
      ""
    ].join("\n");
  }

  return [
    "# Release Process",
    "",
    `Recommended strategy: ${strategy.name}`,
    "",
    "1. Keep `main` releasable through pull requests.",
    "2. Run `npm run ci` and `aigate git-ready` before release preparation.",
    "3. Create `release/vX.Y.Z` only when stabilization needs a separate branch.",
    "4. Tag stable releases as `vX.Y.Z`.",
    "5. Publish npm packages through the Release workflow after npm Trusted Publishing is configured.",
    ""
  ].join("\n");
}

function renderHotfixProcess(strategy, language = "en") {
  if (language === "ko") {
    return [
      "# Hotfix 프로세스",
      "",
      `권장 전략: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main` 또는 최신 안정 태그에서 `hotfix/<short-description>` 브랜치를 만듭니다.",
      "2. 변경 범위를 최소화하고 집중합니다.",
      "3. `npm run ci`, `aigate git-ready`, 필요한 회귀 검사를 실행합니다.",
      "4. 롤백 노트를 포함해 `main` 대상 PR을 엽니다.",
      "5. 검사와 리뷰 통과 후 patch 릴리스를 배포합니다.",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      "# Hotfix プロセス",
      "",
      `推奨戦略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main` または最新の安定 tag から `hotfix/<short-description>` ブランチを作成します。",
      "2. 変更は最小限かつ focused に保ちます。",
      "3. `npm run ci`、`aigate git-ready`、必要な回帰確認を実行します。",
      "4. rollback note を含めて `main` 向け PR を作成します。",
      "5. check と review 通過後に patch release を公開します。",
      ""
    ].join("\n");
  }

  if (language === "zh") {
    return [
      "# Hotfix 流程",
      "",
      `推荐策略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. 从 `main` 或最新稳定标签创建 `hotfix/<short-description>` 分支。",
      "2. 保持变更最小且聚焦。",
      "3. 运行 `npm run ci`、`aigate git-ready` 和必要的回归检查。",
      "4. 创建指向 `main` 的 PR，并附上回滚说明。",
      "5. 检查和 review 通过后发布 patch 版本。",
      ""
    ].join("\n");
  }

  return [
    "# Hotfix Process",
    "",
    `Recommended strategy: ${strategy.name}`,
    "",
    "1. Branch from `main` or the latest stable tag with `hotfix/<short-description>`.",
    "2. Keep the change minimal and focused.",
    "3. Run `npm run ci`, `aigate git-ready`, and a focused regression check.",
    "4. Open a pull request into `main` with rollback notes.",
    "5. Publish a patch release after checks and review pass.",
    ""
  ].join("\n");
}

function renderPullRequestTemplateDraft(language = "en") {
  if (language === "ko") {
    return [
      "## 요약",
      "",
      "-",
      "",
      "## 위험도",
      "",
      "- [ ] 낮은 위험 변경",
      "- [ ] 보안 민감 변경",
      "- [ ] 릴리스 또는 마이그레이션 변경",
      "",
      "## 검증",
      "",
      "- [ ] `npm run ci`",
      "- [ ] `aigate git-ready`",
      "- [ ] `aigate pr-check`",
      "",
      "## 릴리스 영향",
      "",
      "- [ ] 릴리스 영향 없음",
      "- [ ] 문서 업데이트 필요",
      "- [ ] 패키지 동작 변경",
      "- [ ] 새 설정 또는 마이그레이션 필요",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      "## 概要",
      "",
      "-",
      "",
      "## リスク",
      "",
      "- [ ] 低リスク変更",
      "- [ ] セキュリティに関わる変更",
      "- [ ] リリースまたは migration 変更",
      "",
      "## 検証",
      "",
      "- [ ] `npm run ci`",
      "- [ ] `aigate git-ready`",
      "- [ ] `aigate pr-check`",
      "",
      "## リリース影響",
      "",
      "- [ ] リリース影響なし",
      "- [ ] ドキュメント更新が必要",
      "- [ ] パッケージ動作変更",
      "- [ ] 新しい設定または migration が必要",
      ""
    ].join("\n");
  }

  if (language === "zh") {
    return [
      "## 摘要",
      "",
      "-",
      "",
      "## 风险",
      "",
      "- [ ] 低风险变更",
      "- [ ] 安全敏感变更",
      "- [ ] 发布或迁移变更",
      "",
      "## 验证",
      "",
      "- [ ] `npm run ci`",
      "- [ ] `aigate git-ready`",
      "- [ ] `aigate pr-check`",
      "",
      "## 发布影响",
      "",
      "- [ ] 无发布影响",
      "- [ ] 需要更新文档",
      "- [ ] 包行为变更",
      "- [ ] 需要新配置或迁移",
      ""
    ].join("\n");
  }

  return [
    "## Summary",
    "",
    "-",
    "",
    "## Risk",
    "",
    "- [ ] Low-risk change",
    "- [ ] Security-sensitive change",
    "- [ ] Release or migration change",
    "",
    "## Validation",
    "",
    "- [ ] `npm run ci`",
    "- [ ] `aigate git-ready`",
    "- [ ] `aigate pr-check`",
    "",
    "## Release Impact",
    "",
    "- [ ] No release impact",
    "- [ ] Docs update needed",
    "- [ ] Package behavior changed",
    "- [ ] New configuration or migration needed",
    ""
  ].join("\n");
}

function resolveIntegrationProviders(providerArg) {
  const provider = String(providerArg).trim().toLowerCase();
  if (provider === "all") {
    return [...SUPPORTED_INTEGRATIONS];
  }

  if (SUPPORTED_INTEGRATIONS.includes(provider)) {
    return [provider];
  }

  return null;
}

function buildIntegrationManifest(providers) {
  return {
    version: 1,
    generatedBy: `aigate ${VERSION}`,
    providers,
    requiredCommands: [
      "npm run ci",
      "aigate git-ready",
      "aigate push --dry-run origin <branch>"
    ],
    branchStrategy: "GitHub Flow with release channels",
    requiredChecks: [
      "test (20)",
      "test (22)"
    ]
  };
}

function buildIntegrationFiles(providers, outputDir, manifest) {
  const files = [
    {
      path: join(outputDir, ".aigate", "integrations.json"),
      content: `${JSON.stringify(manifest, null, 2)}\n`
    },
    {
      path: join(outputDir, ".aigate", "integrations", "README.md"),
      content: renderIntegrationReadme(providers)
    }
  ];

  if (providers.includes("codex")) {
    files.push(
      {
        path: join(outputDir, "AGENTS.md"),
        content: renderCodexInstructions()
      },
      {
        path: join(outputDir, ".aigate", "integrations", "codex.md"),
        content: renderProviderInstructions("Codex")
      }
    );
  }

  if (providers.includes("gemini")) {
    files.push(
      {
        path: join(outputDir, "GEMINI.md"),
        content: renderGeminiInstructions()
      },
      {
        path: join(outputDir, ".aigate", "integrations", "gemini.md"),
        content: renderProviderInstructions("Gemini")
      }
    );
  }

  return files;
}

function writeIntegrationFiles(files, force) {
  return files.map((file) => {
    if (existsSync(file.path) && !force) {
      return {
        path: file.path,
        action: "skipped"
      };
    }

    const action = existsSync(file.path) ? "updated" : "created";
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, "utf8");

    return {
      path: file.path,
      action
    };
  });
}

function renderIntegrationReadme(providers) {
  return [
    "# AIGate AI Integrations",
    "",
    "This directory contains assistant-facing instructions generated by AIGate.",
    "",
    "Enabled providers:",
    "",
    ...providers.map((provider) => `- ${provider}`),
    "",
    "Required local checks:",
    "",
    "```sh",
    "npm run ci",
    "aigate git-ready",
    "```",
    "",
    "Use `aigate integrate all --force` to regenerate these files."
  ].join("\n") + "\n";
}

function renderCodexInstructions() {
  return [
    "# AIGate Codex Instructions",
    "",
    "Use these instructions when working on this repository with Codex.",
    "",
    ...renderSharedAssistantInstructions()
  ].join("\n") + "\n";
}

function renderGeminiInstructions() {
  return [
    "# AIGate Gemini Instructions",
    "",
    "Use these instructions when working on this repository with Gemini.",
    "",
    ...renderSharedAssistantInstructions()
  ].join("\n") + "\n";
}

function renderProviderInstructions(providerName) {
  return [
    `# ${providerName} Integration`,
    "",
    `AIGate generated this ${providerName} integration guide so the assistant can follow the same Git workflow as maintainers.`,
    "",
    ...renderSharedAssistantInstructions()
  ].join("\n") + "\n";
}

function renderSharedAssistantInstructions() {
  return [
    "## Repository Context",
    "",
    "- Product: AIGate AI Git Workflow Guard CLI.",
    "- Default branch: `main`.",
    "- Use feature branches for changes; do not push directly to `main`.",
    "- Prefer focused commits with Conventional Commit messages.",
    "",
    "## Before Editing",
    "",
    "- Read `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, and `docs/git-upload-workflow.md`.",
    "- Inspect the current branch with `git status --short --branch`.",
    "- Keep generated reports and local settings out of commits unless explicitly requested.",
    "",
    "## Validation",
    "",
    "Run these commands before proposing, pushing, or merging changes:",
    "",
    "```sh",
    "npm run ci",
    "aigate git-ready",
    "```",
    "",
    "## Push Workflow",
    "",
    "Use AIGate's guarded push wrapper:",
    "",
    "```sh",
    "aigate push -u origin <branch>",
    "```",
    "",
    "Preview without changing the remote:",
    "",
    "```sh",
    "aigate push --dry-run origin <branch>",
    "```",
    "",
    "## Pull Request Rules",
    "",
    "- Target `main`.",
    "- Include summary, why, validation, and release impact.",
    "- Required checks: `test (20)` and `test (22)`.",
    "- Wait for review approval and resolved conversations before merge."
  ];
}

function renderDefaultConfig(packageJson) {
  const projectName = packageJson.name ?? "my-project";
  return [
    "version: 1",
    "",
    "project:",
    `  name: ${quoteYamlScalar(projectName)}`,
    `  package: ${quoteYamlScalar(packageJson.name ?? "")}`,
    "  defaultBranch: main",
    "",
    "distribution:",
    "  primaryRegistry: npm",
    `  packageName: ${quoteYamlScalar(packageJson.name ?? "aigate-cli")}`,
    "  releaseChannels:",
    "    stable: latest",
    "    candidate: next",
    "    beta: beta",
    "    experimental: canary",
    "",
    "reports:",
    "  defaultFormat: markdown",
    "  outputDir: .aigate/reports",
    "  outputs:",
    "    - markdown",
    "    - html",
    "    - json",
    "    - sarif",
    "",
    "notifications:",
    "  defaults:",
    "    BLOCK:",
    "      - terminal",
    "      - slack",
    "    SECRET_DETECTED:",
    "      - terminal",
    "      - slack",
    "",
    "branchStrategy:",
    "  default: auto",
    "  protectedBranches:",
    "    - main",
    "  workBranches:",
    "    - feature/*",
    "    - fix/*",
    "    - docs/*",
    "    - chore/*",
    "",
    "qualityGates:",
    "  beforePush:",
    "    minimumProjectScore: 80",
    "    commands:",
    "      - npm run ci",
    "      - aigate git-ready",
    ""
  ].join("\n");
}

function writeProjectFiles(files, force) {
  return files.map((file) => {
    if (existsSync(file.path) && !force) {
      return {
        path: file.path,
        action: "skipped"
      };
    }

    const action = existsSync(file.path) ? "updated" : "created";
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, "utf8");

    return {
      path: file.path,
      action
    };
  });
}

function readPackageVersion() {
  return readJsonFile(join(PACKAGE_ROOT, "package.json")).version ?? "0.0.0";
}

function readSettings() {
  const settingsPath = getSettingsPath();
  if (!existsSync(settingsPath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    return {};
  }
}

function readJsonFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function fileIncludes(filePath, pattern) {
  if (!existsSync(filePath)) {
    return false;
  }

  return readFileSync(filePath, "utf8").includes(pattern);
}

function writeSettings(settings) {
  const settingsPath = getSettingsPath();
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function getSettingsPath() {
  return process.env.AIGATE_SETTINGS_PATH ?? join(".aigate", "settings.json");
}

function resolveLanguage(options) {
  if (options.language !== undefined) {
    return normalizeLanguage(options.language);
  }

  const settings = readSettings();
  return normalizeLanguage(settings.language ?? DEFAULT_SETTINGS.language);
}

function normalizeLanguage(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const aliases = {
    english: "en",
    eng: "en",
    "en-us": "en",
    "en-gb": "en",
    korean: "ko",
    kr: "ko",
    "ko-kr": "ko",
    "한국어": "ko",
    japanese: "ja",
    japan: "ja",
    jp: "ja",
    "ja-jp": "ja",
    "日本語": "ja",
    chinese: "zh",
    china: "zh",
    cn: "zh",
    "zh-cn": "zh",
    "zh-hans": "zh",
    "zh-sg": "zh",
    "中文": "zh",
    "简体中文": "zh",
    "簡體中文": "zh"
  };
  const language = aliases[normalized] ?? normalized;
  return SUPPORTED_LANGUAGES.includes(language) ? language : null;
}

function unsupportedLanguage(value) {
  process.exitCode = 1;
  const settingsLanguage = normalizeLanguage(readSettings().language ?? DEFAULT_SETTINGS.language) ?? DEFAULT_SETTINGS.language;
  return [
    t(settingsLanguage, "unsupportedLanguage", { language: String(value ?? "").trim() }),
    t(settingsLanguage, "supportedLanguages", { languages: SUPPORTED_LANGUAGES.join(", ") })
  ].join("\n");
}

function translateRecommendation(recommendation, language) {
  return RECOMMENDATION_TRANSLATIONS[language]?.[recommendation] ?? recommendation;
}

function translateBlocker(blocker, language) {
  if (language === "en") {
    return blocker;
  }

  if (blocker === "AIGate must run inside a Git repository.") {
    return {
      ko: "AIGate는 Git 저장소 안에서 실행해야 합니다.",
      ja: "AIGate は Git リポジトリ内で実行してください。",
      zh: "请在 Git 仓库内运行 AIGate。"
    }[language] ?? blocker;
  }

  if (blocker === "Possible secret-bearing file names are present in local changes.") {
    return {
      ko: "로컬 변경사항에 secret이 포함될 수 있는 파일명이 있습니다.",
      ja: "ローカル変更に secret を含む可能性があるファイル名があります。",
      zh: "本地变更中存在可能包含 secret 的文件名。"
    }[language] ?? blocker;
  }

  const secretCountMatch = blocker.match(/^(\d+) possible secret finding\(s\) detected in changed files\.$/);
  if (secretCountMatch) {
    return {
      ko: `변경 파일에서 secret 의심 항목 ${secretCountMatch[1]}개가 감지됐습니다.`,
      ja: `変更ファイルで secret の疑いがある項目を ${secretCountMatch[1]} 件検出しました。`,
      zh: `在变更文件中检测到 ${secretCountMatch[1]} 个疑似 secret。`
    }[language] ?? blocker;
  }

  const scoreMatch = blocker.match(/^Project foundation score is (\d+)\/100; minimum is 80\.$/);
  if (scoreMatch) {
    return {
      ko: `프로젝트 기반 점수는 ${scoreMatch[1]}/100이며 최소 기준은 80입니다.`,
      ja: `プロジェクト基盤スコアは ${scoreMatch[1]}/100 で、最小基準は 80 です。`,
      zh: `项目基础分为 ${scoreMatch[1]}/100，最低要求为 80。`
    }[language] ?? blocker;
  }

  return blocker;
}

function translateBranchUse(use, language) {
  return BRANCH_USE_TRANSLATIONS[language]?.[use] ?? use;
}

function translateStrategyName(name, language) {
  if (language === "en") {
    return name;
  }

  return {
    ko: {
      "Git Flow": "Git Flow",
      "Trunk-Based Development": "Trunk 기반 개발",
      "Hybrid Flow": "Hybrid Flow",
      "GitHub Flow with release channels": "릴리스 채널을 포함한 GitHub Flow"
    },
    ja: {
      "Git Flow": "Git Flow",
      "Trunk-Based Development": "Trunk-Based Development",
      "Hybrid Flow": "Hybrid Flow",
      "GitHub Flow with release channels": "リリースチャンネル付き GitHub Flow"
    },
    zh: {
      "Git Flow": "Git Flow",
      "Trunk-Based Development": "基于 Trunk 的开发",
      "Hybrid Flow": "混合 Flow",
      "GitHub Flow with release channels": "带发布频道的 GitHub Flow"
    }
  }[language]?.[name] ?? name;
}

function translateBranchReason(strategy, language) {
  if (language === "en") {
    return strategy.reason;
  }

  const reasonParts = strategy.reasonParts ?? String(strategy.reason ?? "").replace(/\.$/, "").split("; ");
  const separator = language === "ko" ? "; " : "；";
  const ending = language === "ko" ? "." : "。";
  return `${reasonParts.map((part) => translateBranchReasonPart(part, language)).join(separator)}${ending}`;
}

function translateBranchReasonPart(part, language) {
  const direct = BRANCH_REASON_TRANSLATIONS[language]?.[part];
  if (direct) {
    return direct;
  }

  const teamSizeMatch = part.match(/^team size signal is (\d+)$/);
  if (teamSizeMatch) {
    return {
      ko: `팀 규모 신호는 ${teamSizeMatch[1]}명입니다`,
      ja: `チームサイズシグナルは ${teamSizeMatch[1]} です`,
      zh: `团队规模信号为 ${teamSizeMatch[1]}`
    }[language] ?? part;
  }

  const releaseCadenceMatch = part.match(/^release cadence signal is (.+)$/);
  if (releaseCadenceMatch) {
    return {
      ko: `릴리스 주기 신호는 ${releaseCadenceMatch[1]}입니다`,
      ja: `リリース頻度シグナルは ${releaseCadenceMatch[1]} です`,
      zh: `发布节奏信号为 ${releaseCadenceMatch[1]}`
    }[language] ?? part;
  }

  return part;
}

function translateGithubProtection(rule, language) {
  return GITHUB_PROTECTION_TRANSLATIONS[language]?.[rule] ?? rule;
}

function translateReleaseCheckName(name, language) {
  if (language === "en") {
    return name;
  }

  const tagMatch = name.match(/^(v\S+) tag exists$/);
  if (tagMatch) {
    return {
      ko: `${tagMatch[1]} 태그 존재`,
      ja: `${tagMatch[1]} tag が存在`,
      zh: `${tagMatch[1]} 标签存在`
    }[language] ?? name;
  }

  return RELEASE_CHECK_TRANSLATIONS[language]?.[name] ?? name;
}

function translateReleaseNextStep(step, language) {
  if (language === "en") {
    return step;
  }

  let match = step.match(/^(.+)@([^@ ]+) is already on npm; create release tag (v\S+) to record the release\.$/);
  if (match) {
    return {
      ko: `${match[1]}@${match[2]}는 이미 npm에 있습니다. 릴리스 기록을 위해 ${match[3]} 태그를 생성하세요.`,
      ja: `${match[1]}@${match[2]} はすでに npm にあります。リリース記録として ${match[3]} tag を作成してください。`,
      zh: `${match[1]}@${match[2]} 已在 npm 上。请创建 ${match[3]} 标签来记录发布。`
    }[language] ?? step;
  }

  match = step.match(/^(.+)@([^@ ]+) is not on npm yet; create release tag (v\S+) to publish with Trusted Publishing\.$/);
  if (match) {
    return {
      ko: `${match[1]}@${match[2]}는 아직 npm에 없습니다. Trusted Publishing으로 배포하려면 ${match[3]} 태그를 생성하세요.`,
      ja: `${match[1]}@${match[2]} はまだ npm にありません。Trusted Publishing で公開するには ${match[3]} tag を作成してください。`,
      zh: `${match[1]}@${match[2]} 尚未发布到 npm。请创建 ${match[3]} 标签并通过 Trusted Publishing 发布。`
    }[language] ?? step;
  }

  match = step.match(/^If (.+) is not on npm yet, enable npm account 2FA and create it with: (.+)$/);
  if (match) {
    return {
      ko: `${match[1]}가 아직 npm에 없다면 npm 계정 2FA를 켜고 다음 명령으로 생성하세요: ${match[2]}`,
      ja: `${match[1]} がまだ npm にない場合は、npm アカウントの 2FA を有効化し、次のコマンドで作成してください: ${match[2]}`,
      zh: `如果 ${match[1]} 尚未在 npm 上，请启用 npm 账户 2FA，并用以下命令创建: ${match[2]}`
    }[language] ?? step;
  }

  match = step.match(/^Configure trusted publishing after the package exists: (.+)$/);
  if (match) {
    return {
      ko: `패키지가 생성된 뒤 Trusted Publishing을 설정하세요: ${match[1]}`,
      ja: `パッケージ作成後に Trusted Publishing を設定してください: ${match[1]}`,
      zh: `包创建后请配置 Trusted Publishing: ${match[1]}`
    }[language] ?? step;
  }

  match = step.match(/^Create release tag (v\S+) after npm Trusted Publishing is configured\.$/);
  if (match) {
    return {
      ko: `npm Trusted Publishing 설정 후 ${match[1]} 릴리스 태그를 생성하세요.`,
      ja: `npm Trusted Publishing 設定後に ${match[1]} リリース tag を作成してください。`,
      zh: `npm Trusted Publishing 配置完成后，请创建 ${match[1]} 发布标签。`
    }[language] ?? step;
  }

  match = step.match(/^(.+)@([^@ ]+) is released; bump package\.json before the next npm release\.$/);
  if (match) {
    return {
      ko: `${match[1]}@${match[2]}는 릴리스 완료 상태입니다. 다음 npm 릴리스 전에 package.json 버전을 올리세요.`,
      ja: `${match[1]}@${match[2]} はリリース済みです。次の npm リリース前に package.json を bump してください。`,
      zh: `${match[1]}@${match[2]} 已发布。下一次 npm 发布前请提升 package.json 版本。`
    }[language] ?? step;
  }

  match = step.match(/^Review npm registry lookup error: (.+)$/);
  if (match) {
    return {
      ko: `npm registry 조회 오류를 확인하세요: ${match[1]}`,
      ja: `npm registry 照会エラーを確認してください: ${match[1]}`,
      zh: `请检查 npm registry 查询错误: ${match[1]}`
    }[language] ?? step;
  }

  return {
    ko: {
      "Run release-check --npm to confirm npm registry publication state.": "npm registry 배포 상태를 확인하려면 release-check --npm을 실행하세요.",
      "Ensure release workflow publishes with npm provenance.": "릴리스 workflow가 npm provenance로 배포하는지 확인하세요.",
      "Run npm run ci before tagging a release.": "릴리스 태그 생성 전에 npm run ci를 실행하세요.",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "Release workflow_dispatch dry_run 입력으로 npm publish dry-run을 실행하세요."
    },
    ja: {
      "Run release-check --npm to confirm npm registry publication state.": "npm registry の公開状態を確認するには release-check --npm を実行してください。",
      "Ensure release workflow publishes with npm provenance.": "リリース workflow が npm provenance 付きで公開することを確認してください。",
      "Run npm run ci before tagging a release.": "リリース tag を作成する前に npm run ci を実行してください。",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "Release workflow_dispatch の dry_run 入力で npm publish dry-run を実行してください。"
    },
    zh: {
      "Run release-check --npm to confirm npm registry publication state.": "运行 release-check --npm 确认 npm registry 发布状态。",
      "Ensure release workflow publishes with npm provenance.": "确保发布 workflow 使用 npm provenance 发布。",
      "Run npm run ci before tagging a release.": "创建发布标签前运行 npm run ci。",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "通过 Release workflow_dispatch 的 dry_run 输入运行 npm publish dry-run。"
    }
  }[language]?.[step] ?? step;
}

function stripAigatePushOptions(args) {
  const pushArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (
      arg === "--dry-run" ||
      arg === "--no-verify" ||
      arg.startsWith("--dry-run=") ||
      arg.startsWith("--no-verify=") ||
      arg.startsWith("--notify-channel=")
    ) {
      continue;
    }

    if (arg === "--language" || arg === "--notify-channel") {
      index += 1;
      continue;
    }

    if (arg.startsWith("--language=")) {
      continue;
    }

    pushArgs.push(arg);
  }

  return pushArgs;
}

function firstPositionalArg(args) {
  const optionsWithValues = new Set([
    "--base",
    "--body",
    "--channel",
    "--config",
    "--event",
    "--format",
    "--language",
    "--notify-channel",
    "--output",
    "--output-dir",
    "--release",
    "--team-size",
    "--title",
    "--type",
    "--webhook-env"
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (optionsWithValues.has(arg)) {
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      continue;
    }

    return arg;
  }

  return null;
}

function translateIntegrationAction(action, language = "en") {
  const key = `action.${action}`;
  const translated = t(language, key);
  return translated === key ? action : translated;
}

function quoteArgs(args) {
  return args.map((arg) => {
    if (/^[A-Za-z0-9_./:=@-]+$/.test(String(arg))) {
      return String(arg);
    }

    return JSON.stringify(String(arg));
  });
}

function parseOptions(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split("=", 2);
    const nextValue = args[index + 1];
    const hasSeparateValue = nextValue && !nextValue.startsWith("--");
    const value = inlineValue ?? (hasSeparateValue ? nextValue : true);

    options[toCamelCase(rawName)] = value;
    if (inlineValue === undefined && hasSeparateValue) {
      index += 1;
    }
  }

  return options;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function quoteYamlScalar(value) {
  return JSON.stringify(String(value));
}

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function print(value) {
  console.log(value);
}

function printError(value) {
  console.error(value);
}

main(process.argv.slice(2));

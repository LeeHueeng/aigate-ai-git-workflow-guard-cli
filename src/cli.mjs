#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { commandDemo, commandDoctor, commandInstallHook } from "./commands/first-run.mjs";
import { commandGithub } from "./commands/github-reporting.mjs";
import { commandTrends } from "./commands/trends.mjs";

const CLI_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(CLI_DIR);
const VERSION = readPackageVersion();
const SUPPORTED_LANGUAGES = ["en", "ko", "ja", "zh"];
const SUPPORTED_INTEGRATIONS = ["codex", "gemini", "claude"];
const START_ROUTE_IDS = ["quickstart", "ai", "hook", "release", "full"];
const AI_TEST_PROVIDERS = ["codex", "claude", "gemini"];
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
    "github.checkPrepared": "GitHub check summary prepared",
    "github.commentPrepared": "GitHub PR comment prepared",
    "github.commentSent": "Sent AIGate comment to GitHub PR #{pr}",
    "github.conclusion": "Conclusion: {conclusion}",
    "github.missingPr": "Could not resolve a GitHub pull request number. Use --pr <number> or run from a branch with an open PR.",
    "github.prNumber": "Pull request: #{pr}",
    "github.status": "Status: {status}",
    "github.stepSummaryWritten": "GitHub Actions step summary updated: {path}",
    "github.unknownAction": "Unknown GitHub action: {action}",
    "github.usage": "Usage: aigate github <comment|check|setup> [--pr <number>] [--owner @team] [--dry-run] [--format json] [--output <path>]",
    "gitReady.blockers": "Blockers:",
    "gitReady.blockersNone": "Blockers: none",
    "gitReady.branch": "Branch: {branch}",
    "gitReady.changedFiles": "Changed files: {count}",
    "gitReady.projectScore": "Project score: {score}/100",
    "gitReady.recommendation": "Recommendation: {recommendation}",
    "gitReady.secretFindings": "Secret findings: {count}",
    "gitReady.status": "AIGate git-ready: {status}",
    "gitReady.warnings": "Warnings:",
    "gitReady.warningsNone": "Warnings: none",
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
    "notify.failed": "Failed to send notification to {channel}",
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
    "trends.unknownAction": "Unknown trends action: {action}",
    "unknownCommand": "Unknown command: {command}",
    "runHelp": "Run `aigate --help` for available commands.",
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
    "check.secretFindings": "민감 정보 탐지: {count}",
    "check.status": "AIGate 검사: {status}",
    "common.next": "다음 단계: {next}",
    "common.wrote": "{path} 파일을 작성했습니다",
    "github.checkPrepared": "GitHub 체크 요약 준비 완료",
    "github.commentPrepared": "GitHub PR 댓글 준비 완료",
    "github.commentSent": "GitHub PR #{pr}에 AIGate 댓글을 작성했습니다",
    "github.conclusion": "결론: {conclusion}",
    "github.missingPr": "GitHub PR 번호를 확인할 수 없습니다. --pr <number>를 지정하거나 열린 PR이 있는 브랜치에서 실행하세요.",
    "github.prNumber": "Pull request: #{pr}",
    "github.status": "상태: {status}",
    "github.stepSummaryWritten": "GitHub Actions step summary를 갱신했습니다: {path}",
    "github.unknownAction": "알 수 없는 GitHub 작업: {action}",
    "github.usage": "사용법: aigate github <comment|check|setup> [--pr <number>] [--owner @team] [--dry-run] [--format json] [--output <path>]",
    "gitReady.blockers": "차단 사유:",
    "gitReady.blockersNone": "차단 사유: 없음",
    "gitReady.branch": "브랜치: {branch}",
    "gitReady.changedFiles": "변경 파일: {count}",
    "gitReady.projectScore": "프로젝트 점수: {score}/100",
    "gitReady.recommendation": "권장 사항: {recommendation}",
    "gitReady.secretFindings": "민감 정보 탐지: {count}",
    "gitReady.status": "AIGate 준비 검사: {status}",
    "gitReady.warnings": "주의 사항:",
    "gitReady.warningsNone": "주의 사항: 없음",
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
    "notify.failed": "{channel} 채널로 알림 전송에 실패했습니다",
    "push.skip": "AIGate push: --no-verify로 준비 게이트를 건너뜁니다.",
    "push.wouldRun": "실행 예정: {command}",
    "release.branch": "릴리스 태그: {tag}",
    "release.nextSteps": "다음 단계:",
    "release.package": "패키지: {packageName}",
    "release.registryNotChecked": "npm 레지스트리: 확인 안 함 (--npm 사용)",
    "release.registryNotPublished": "npm 레지스트리: {packageName}@{version} 미배포",
    "release.registryPublished": "npm 레지스트리: {packageName}@{version} 배포됨",
    "release.registryFailed": "npm 레지스트리: 조회 실패 ({error})",
    "release.status": "AIGate 릴리스 검사: {status}",
    "release.version": "버전: {version}",
    "settings.complete": "AIGate 설정 완료",
    "settings.file": "설정 파일: {path}",
    "settings.title": "AIGate 설정",
    "trends.unknownAction": "알 수 없는 추세 작업: {action}",
    "unknownCommand": "알 수 없는 명령어: {command}",
    "runHelp": "사용 가능한 명령어는 `aigate --help`로 확인하세요.",
    "unsupportedLanguage": "지원하지 않는 언어: {language}",
    "supportedLanguages": "지원 언어: {languages}",
    "unsupportedIntegration": "지원하지 않는 연동 대상: {provider}",
    "supportedIntegrations": "지원 대상: {providers}, 전체(all)"
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
    "check.secretFindings": "機密情報検出: {count}",
    "check.status": "AIGate チェック: {status}",
    "common.next": "次の手順: {next}",
    "common.wrote": "{path} を書き込みました",
    "github.checkPrepared": "GitHub Checks サマリーを準備しました",
    "github.commentPrepared": "GitHub PR コメントを準備しました",
    "github.commentSent": "GitHub PR #{pr} に AIGate コメントを投稿しました",
    "github.conclusion": "結論: {conclusion}",
    "github.missingPr": "GitHub PR 番号を解決できません。--pr <number> を指定するか、開いている PR のあるブランチで実行してください。",
    "github.prNumber": "Pull request: #{pr}",
    "github.status": "状態: {status}",
    "github.stepSummaryWritten": "GitHub Actions step summary を更新しました: {path}",
    "github.unknownAction": "不明な GitHub アクション: {action}",
    "github.usage": "使い方: aigate github <comment|check|setup> [--pr <number>] [--owner @team] [--dry-run] [--format json] [--output <path>]",
    "gitReady.blockers": "ブロッカー:",
    "gitReady.blockersNone": "ブロッカー: なし",
    "gitReady.branch": "ブランチ: {branch}",
    "gitReady.changedFiles": "変更ファイル: {count}",
    "gitReady.projectScore": "プロジェクトスコア: {score}/100",
    "gitReady.recommendation": "推奨事項: {recommendation}",
    "gitReady.secretFindings": "機密情報検出: {count}",
    "gitReady.status": "AIGate 準備チェック: {status}",
    "gitReady.warnings": "警告:",
    "gitReady.warningsNone": "警告: なし",
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
    "notify.failed": "{channel} への通知送信に失敗しました",
    "push.skip": "AIGate push: --no-verify により準備ゲートをスキップします。",
    "push.wouldRun": "実行予定: {command}",
    "release.branch": "リリースタグ: {tag}",
    "release.nextSteps": "次の手順:",
    "release.package": "パッケージ: {packageName}",
    "release.registryNotChecked": "npm レジストリ: 未確認 (--npm を使用)",
    "release.registryNotPublished": "npm レジストリ: {packageName}@{version} は未公開",
    "release.registryPublished": "npm レジストリ: {packageName}@{version} は公開済み",
    "release.registryFailed": "npm レジストリ: 照会失敗 ({error})",
    "release.status": "AIGate リリースチェック: {status}",
    "release.version": "バージョン: {version}",
    "settings.complete": "AIGate 設定完了",
    "settings.file": "設定ファイル: {path}",
    "settings.title": "AIGate 設定",
    "trends.unknownAction": "不明なトレンドアクション: {action}",
    "unknownCommand": "不明なコマンド: {command}",
    "runHelp": "利用可能なコマンドは `aigate --help` で確認してください。",
    "unsupportedLanguage": "未対応の言語: {language}",
    "supportedLanguages": "対応言語: {languages}",
    "unsupportedIntegration": "未対応の連携対象: {provider}",
    "supportedIntegrations": "対応対象: {providers}, すべて(all)"
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
    "check.secretFindings": "敏感信息发现: {count}",
    "check.status": "AIGate 检查: {status}",
    "common.next": "下一步: {next}",
    "common.wrote": "已写入 {path}",
    "github.checkPrepared": "GitHub Checks 摘要已准备",
    "github.commentPrepared": "GitHub PR 评论已准备",
    "github.commentSent": "已向 GitHub PR #{pr} 发布 AIGate 评论",
    "github.conclusion": "结论: {conclusion}",
    "github.missingPr": "无法解析 GitHub PR 编号。请使用 --pr <number>，或在已有开放 PR 的分支上运行。",
    "github.prNumber": "Pull request: #{pr}",
    "github.status": "状态: {status}",
    "github.stepSummaryWritten": "已更新 GitHub Actions step summary: {path}",
    "github.unknownAction": "未知 GitHub 操作: {action}",
    "github.usage": "用法: aigate github <comment|check|setup> [--pr <number>] [--owner @team] [--dry-run] [--format json] [--output <path>]",
    "gitReady.blockers": "阻塞原因:",
    "gitReady.blockersNone": "阻塞原因: 无",
    "gitReady.branch": "分支: {branch}",
    "gitReady.changedFiles": "变更文件: {count}",
    "gitReady.projectScore": "项目分数: {score}/100",
    "gitReady.recommendation": "建议: {recommendation}",
    "gitReady.secretFindings": "敏感信息发现: {count}",
    "gitReady.status": "AIGate 就绪检查: {status}",
    "gitReady.warnings": "警告:",
    "gitReady.warningsNone": "警告: 无",
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
    "notify.failed": "向 {channel} 发送通知失败",
    "push.skip": "AIGate push: 已通过 --no-verify 跳过就绪关卡。",
    "push.wouldRun": "将执行: {command}",
    "release.branch": "发布标签: {tag}",
    "release.nextSteps": "下一步:",
    "release.package": "包: {packageName}",
    "release.registryNotChecked": "npm 注册表: 未检查 (使用 --npm)",
    "release.registryNotPublished": "npm 注册表: {packageName}@{version} 尚未发布",
    "release.registryPublished": "npm 注册表: {packageName}@{version} 已发布",
    "release.registryFailed": "npm 注册表: 查询失败 ({error})",
    "release.status": "AIGate 发布检查: {status}",
    "release.version": "版本: {version}",
    "settings.complete": "AIGate 设置完成",
    "settings.file": "设置文件: {path}",
    "settings.title": "AIGate 设置",
    "trends.unknownAction": "未知趋势操作: {action}",
    "unknownCommand": "未知命令: {command}",
    "runHelp": "运行 `aigate --help` 查看可用命令。",
    "unsupportedLanguage": "不支持的语言: {language}",
    "supportedLanguages": "支持语言: {languages}",
    "unsupportedIntegration": "不支持的集成目标: {provider}",
    "supportedIntegrations": "支持目标: {providers}, 全部(all)"
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
    TODO: "未対応",
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
    "Review possible secret-bearing files before commit or push.": "커밋 또는 푸시 전에 민감 정보 포함 가능성이 있는 파일을 검토하세요.",
    "Open a focused branch and pull request after tests pass.": "테스트 통과 후 범위가 명확한 브랜치와 PR을 여세요.",
    "Resolve blockers before committing, pushing, or opening a pull request.": "커밋, 푸시, PR 생성 전에 차단 사유를 해결하세요.",
    "Run npm test, commit focused changes, push the branch, and open a pull request.": "npm test를 실행하고, 범위가 명확한 변경을 커밋한 뒤 브랜치를 푸시하고 PR을 여세요.",
    "Repository foundations are ready for the next MVP slice.": "저장소 기반이 다음 MVP 단계를 진행할 준비가 됐습니다.",
    "Complete the missing repository foundations before public release.": "공개 릴리스 전에 부족한 저장소 기반 항목을 보완하세요."
  },
  ja: {
    "No local changes detected.": "ローカル変更はありません。",
    "Run AIGate inside a Git repository.": "AIGate は Git リポジトリ内で実行してください。",
    "Review possible secret-bearing files before commit or push.": "コミットまたはプッシュ前に機密情報を含む可能性があるファイルを確認してください。",
    "Open a focused branch and pull request after tests pass.": "テスト通過後、範囲を絞ったブランチと PR を作成してください。",
    "Resolve blockers before committing, pushing, or opening a pull request.": "コミット、プッシュ、PR 作成の前にブロッカーを解消してください。",
    "Run npm test, commit focused changes, push the branch, and open a pull request.": "npm test を実行し、範囲を絞ってコミットし、ブランチをプッシュして PR を作成してください。",
    "Repository foundations are ready for the next MVP slice.": "リポジトリ基盤は次の MVP スライスに進める状態です。",
    "Complete the missing repository foundations before public release.": "公開リリース前に不足しているリポジトリ基盤を整備してください。"
  },
  zh: {
    "No local changes detected.": "未检测到本地变更。",
    "Run AIGate inside a Git repository.": "请在 Git 仓库内运行 AIGate。",
    "Review possible secret-bearing files before commit or push.": "提交或推送前，请检查可能包含敏感信息的文件。",
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
    "short-lived changes merged quickly": "短期間で素早くマージする変更",
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

const STRATEGY_COMPARISON_TRANSLATIONS = {
  ko: {
    "small teams, public OSS projects, and on-demand releases": "소규모 팀, 공개 오픈소스 프로젝트, 필요 시 릴리스",
    "teams with strong CI, small pull requests, and very frequent releases": "강한 CI, 작은 PR, 매우 잦은 릴리스를 운영하는 팀",
    "growing teams that need fast feature work plus planned stabilization": "빠른 기능 개발과 계획된 안정화가 모두 필요한 성장 중인 팀",
    "larger teams, scheduled releases, and strict production governance": "큰 팀, 정기 릴리스, 엄격한 프로덕션 거버넌스",
    "Simple branch model for public contributors.": "공개 기여자가 이해하기 쉬운 단순한 브랜치 모델입니다.",
    "Release channels separate npm latest, next, beta, and canary.": "npm latest, next, beta, canary 릴리스 채널을 분리합니다.",
    "Works well for small teams and fast merges.": "소규모 팀과 빠른 병합 흐름에 잘 맞습니다.",
    "Keeps main close to production at all times.": "main을 항상 프로덕션에 가까운 상태로 유지합니다.",
    "Fits strong CI and short-lived changes.": "강한 CI와 짧게 유지되는 변경에 잘 맞습니다.",
    "Reduces long-running branch drift.": "오래 열린 브랜치의 드리프트를 줄입니다.",
    "Balances fast feature work with planned release stabilization.": "빠른 기능 작업과 계획된 릴리스 안정화의 균형을 잡습니다.",
    "Gives larger changes an integration branch without requiring full Git Flow.": "전체 Git Flow까지 도입하지 않고도 큰 변경을 위한 통합 브랜치를 제공합니다.",
    "Preserves release/* and hotfix/* escape hatches.": "release/*와 hotfix/* 비상 경로를 유지합니다.",
    "Clear separation between production, integration, release, and hotfix work.": "프로덕션, 통합, 릴리스, 핫픽스 작업을 명확히 분리합니다.",
    "Fits scheduled releases and larger teams.": "정기 릴리스와 큰 팀에 잘 맞습니다.",
    "Makes npm channel governance explicit.": "npm 채널 거버넌스를 명확하게 만듭니다.",
    "Can become noisy if large teams queue many changes at once.": "큰 팀이 많은 변경을 동시에 올리면 흐름이 복잡해질 수 있습니다.",
    "Needs disciplined release tagging because there is no develop branch.": "develop 브랜치가 없으므로 릴리스 태그 규율이 필요합니다.",
    "Requires strong automated tests and small pull requests.": "강한 자동화 테스트와 작은 PR이 필요합니다.",
    "Can feel too strict for teams that need long stabilization windows.": "긴 안정화 기간이 필요한 팀에는 너무 엄격하게 느껴질 수 있습니다.",
    "Needs clear rules for when develop is used.": "develop을 언제 쓰는지에 대한 명확한 규칙이 필요합니다.",
    "May drift if integration branches stay open too long.": "통합 브랜치가 오래 열려 있으면 드리프트가 생길 수 있습니다.",
    "Adds process overhead for small or fast-moving teams.": "작거나 빠르게 움직이는 팀에는 프로세스 부담이 늘어납니다.",
    "Long-lived develop branches can hide integration risk.": "오래 유지되는 develop 브랜치가 통합 위험을 숨길 수 있습니다.",
    "Protect main and require AIGate checks before merge.": "main을 보호하고 병합 전에 AIGate 검사를 필수로 둡니다.",
    "Use feature/*, fix/*, docs/*, chore/*, and codex/* for focused work.": "집중된 작업에는 feature/*, fix/*, docs/*, chore/*, codex/*를 사용합니다.",
    "Publish npm releases from main tags and use dist-tags for channels.": "main 태그에서 npm 릴리스를 배포하고 채널에는 dist-tag를 사용합니다.",
    "Keep pull requests small enough to merge quickly into main.": "PR을 main에 빠르게 병합할 수 있을 만큼 작게 유지합니다.",
    "Add short/* only for changes that will merge within a day.": "하루 안에 병합될 변경에만 short/*를 사용합니다.",
    "Use release/* only when a production hardening window is unavoidable.": "프로덕션 안정화 기간이 불가피할 때만 release/*를 사용합니다.",
    "Keep main stable and use develop only for planned integration.": "main은 안정적으로 유지하고 develop은 계획된 통합에만 사용합니다.",
    "Use feature/* and codex/* branches for focused work.": "집중된 작업에는 feature/*와 codex/* 브랜치를 사용합니다.",
    "Create release/* branches for stabilization and hotfix/* for urgent fixes.": "안정화에는 release/*, 긴급 수정에는 hotfix/* 브랜치를 만듭니다.",
    "Create develop as the next-release integration branch.": "develop을 다음 릴리스 통합 브랜치로 만듭니다.",
    "Route feature/* and codex/* branches into develop.": "feature/*와 codex/* 브랜치는 develop으로 병합합니다.",
    "Cut release/* from develop, then merge release and hotfix work back to main.": "develop에서 release/*를 만들고, 릴리스와 핫픽스 작업은 main으로 다시 병합합니다.",
    "Use main branch protection, required AIGate checks, and tag-driven npm release channels.": "main 브랜치 보호, 필수 AIGate 검사, 태그 기반 npm 릴리스 채널을 사용합니다.",
    "Use strict main protection, fast required checks, and short-lived branch age limits.": "엄격한 main 보호, 빠른 필수 검사, 짧은 브랜치 유지 기간 제한을 사용합니다.",
    "Use main protection, optional develop protection, release/* stabilization rules, and AI collaboration policy packs.": "main 보호, 선택적 develop 보호, release/* 안정화 규칙, AI 협업 정책 팩을 사용합니다.",
    "Use protected main/develop/release/*/hotfix/* rules with explicit release and hotfix ownership.": "main/develop/release/*/hotfix/* 보호 규칙과 명확한 릴리스/핫픽스 소유권을 사용합니다."
  },
  ja: {
    "small teams, public OSS projects, and on-demand releases": "小規模チーム、公開 OSS プロジェクト、必要時リリース",
    "teams with strong CI, small pull requests, and very frequent releases": "強い CI、小さな PR、高頻度リリースを運用するチーム",
    "growing teams that need fast feature work plus planned stabilization": "速い機能開発と計画的な安定化の両方が必要な成長中のチーム",
    "larger teams, scheduled releases, and strict production governance": "大きなチーム、定期リリース、厳格な本番ガバナンス",
    "Simple branch model for public contributors.": "公開コントリビューターが理解しやすい単純なブランチモデルです。",
    "Release channels separate npm latest, next, beta, and canary.": "npm latest、next、beta、canary のリリースチャンネルを分離します。",
    "Works well for small teams and fast merges.": "小規模チームと速いマージフローに適しています。",
    "Keeps main close to production at all times.": "main を常に本番に近い状態に保ちます。",
    "Fits strong CI and short-lived changes.": "強い CI と短期間の変更に適しています。",
    "Reduces long-running branch drift.": "長期間残るブランチのドリフトを減らします。",
    "Balances fast feature work with planned release stabilization.": "速い機能作業と計画的なリリース安定化のバランスを取ります。",
    "Gives larger changes an integration branch without requiring full Git Flow.": "完全な Git Flow を要求せず、大きな変更向けの統合ブランチを提供します。",
    "Preserves release/* and hotfix/* escape hatches.": "release/* と hotfix/* の退避経路を維持します。",
    "Clear separation between production, integration, release, and hotfix work.": "本番、統合、リリース、ホットフィックス作業を明確に分離します。",
    "Fits scheduled releases and larger teams.": "定期リリースと大きなチームに適しています。",
    "Makes npm channel governance explicit.": "npm チャンネルのガバナンスを明確にします。",
    "Can become noisy if large teams queue many changes at once.": "大きなチームが多くの変更を同時に積むと流れが複雑になります。",
    "Needs disciplined release tagging because there is no develop branch.": "develop ブランチがないため、リリースタグの規律が必要です。",
    "Requires strong automated tests and small pull requests.": "強い自動テストと小さな PR が必要です。",
    "Can feel too strict for teams that need long stabilization windows.": "長い安定化期間が必要なチームには厳しすぎる場合があります。",
    "Needs clear rules for when develop is used.": "develop をいつ使うかの明確なルールが必要です。",
    "May drift if integration branches stay open too long.": "統合ブランチが長く開いたままだとドリフトが生じます。",
    "Adds process overhead for small or fast-moving teams.": "小規模または高速に動くチームにはプロセス負荷が増えます。",
    "Long-lived develop branches can hide integration risk.": "長期間残る develop ブランチは統合リスクを隠すことがあります。",
    "Protect main and require AIGate checks before merge.": "main を保護し、マージ前に AIGate チェックを必須にします。",
    "Use feature/*, fix/*, docs/*, chore/*, and codex/* for focused work.": "集中した作業には feature/*、fix/*、docs/*、chore/*、codex/* を使います。",
    "Publish npm releases from main tags and use dist-tags for channels.": "main のタグから npm リリースを公開し、チャンネルには dist-tag を使います。",
    "Keep pull requests small enough to merge quickly into main.": "PR は main へ素早くマージできる大きさに保ちます。",
    "Add short/* only for changes that will merge within a day.": "1 日以内にマージする変更にだけ short/* を使います。",
    "Use release/* only when a production hardening window is unavoidable.": "本番安定化期間が避けられない場合だけ release/* を使います。",
    "Keep main stable and use develop only for planned integration.": "main は安定させ、develop は計画的な統合にだけ使います。",
    "Use feature/* and codex/* branches for focused work.": "集中した作業には feature/* と codex/* ブランチを使います。",
    "Create release/* branches for stabilization and hotfix/* for urgent fixes.": "安定化には release/*、緊急修正には hotfix/* ブランチを作成します。",
    "Create develop as the next-release integration branch.": "develop を次回リリースの統合ブランチとして作成します。",
    "Route feature/* and codex/* branches into develop.": "feature/* と codex/* ブランチは develop に統合します。",
    "Cut release/* from develop, then merge release and hotfix work back to main.": "develop から release/* を切り、リリースとホットフィックス作業を main に戻します。",
    "Use main branch protection, required AIGate checks, and tag-driven npm release channels.": "main ブランチ保護、必須 AIGate チェック、タグ駆動の npm リリースチャンネルを使います。",
    "Use strict main protection, fast required checks, and short-lived branch age limits.": "厳格な main 保護、速い必須チェック、短命ブランチの期間制限を使います。",
    "Use main protection, optional develop protection, release/* stabilization rules, and AI collaboration policy packs.": "main 保護、任意の develop 保護、release/* 安定化ルール、AI 協業ポリシーパックを使います。",
    "Use protected main/develop/release/*/hotfix/* rules with explicit release and hotfix ownership.": "main/develop/release/*/hotfix/* の保護ルールと明確なリリース/ホットフィックス所有権を使います。"
  },
  zh: {
    "small teams, public OSS projects, and on-demand releases": "小团队、公开开源项目和按需发布",
    "teams with strong CI, small pull requests, and very frequent releases": "拥有强 CI、小 PR 和高频发布的团队",
    "growing teams that need fast feature work plus planned stabilization": "既需要快速功能开发又需要计划内稳定期的成长团队",
    "larger teams, scheduled releases, and strict production governance": "大型团队、定期发布和严格生产治理",
    "Simple branch model for public contributors.": "公开贡献者容易理解的简单分支模型。",
    "Release channels separate npm latest, next, beta, and canary.": "将 npm latest、next、beta、canary 发布频道分开。",
    "Works well for small teams and fast merges.": "适合小团队和快速合并流程。",
    "Keeps main close to production at all times.": "让 main 始终接近生产状态。",
    "Fits strong CI and short-lived changes.": "适合强 CI 和短生命周期变更。",
    "Reduces long-running branch drift.": "减少长期分支漂移。",
    "Balances fast feature work with planned release stabilization.": "平衡快速功能开发和计划内发布稳定。",
    "Gives larger changes an integration branch without requiring full Git Flow.": "无需完整 Git Flow，也能为大型变更提供集成分支。",
    "Preserves release/* and hotfix/* escape hatches.": "保留 release/* 和 hotfix/* 应急路径。",
    "Clear separation between production, integration, release, and hotfix work.": "清晰分离生产、集成、发布和热修复工作。",
    "Fits scheduled releases and larger teams.": "适合定期发布和大型团队。",
    "Makes npm channel governance explicit.": "让 npm 频道治理更明确。",
    "Can become noisy if large teams queue many changes at once.": "大型团队同时排队大量变更时，流程可能变得嘈杂。",
    "Needs disciplined release tagging because there is no develop branch.": "没有 develop 分支，因此需要严格的发布标签纪律。",
    "Requires strong automated tests and small pull requests.": "需要强自动化测试和小 PR。",
    "Can feel too strict for teams that need long stabilization windows.": "对于需要长稳定期的团队，可能显得过于严格。",
    "Needs clear rules for when develop is used.": "需要明确何时使用 develop 的规则。",
    "May drift if integration branches stay open too long.": "如果集成分支长期打开，可能产生漂移。",
    "Adds process overhead for small or fast-moving teams.": "会给小团队或快速推进的团队增加流程成本。",
    "Long-lived develop branches can hide integration risk.": "长期存在的 develop 分支可能隐藏集成风险。",
    "Protect main and require AIGate checks before merge.": "保护 main，并在合并前要求 AIGate 检查。",
    "Use feature/*, fix/*, docs/*, chore/*, and codex/* for focused work.": "聚焦工作使用 feature/*、fix/*、docs/*、chore/* 和 codex/*。",
    "Publish npm releases from main tags and use dist-tags for channels.": "从 main 标签发布 npm，并使用 dist-tag 管理频道。",
    "Keep pull requests small enough to merge quickly into main.": "保持 PR 足够小，以便快速合并到 main。",
    "Add short/* only for changes that will merge within a day.": "仅对一天内会合并的变更使用 short/*。",
    "Use release/* only when a production hardening window is unavoidable.": "只有无法避免生产加固窗口时才使用 release/*。",
    "Keep main stable and use develop only for planned integration.": "保持 main 稳定，仅将 develop 用于计划内集成。",
    "Use feature/* and codex/* branches for focused work.": "聚焦工作使用 feature/* 和 codex/* 分支。",
    "Create release/* branches for stabilization and hotfix/* for urgent fixes.": "稳定期创建 release/*，紧急修复创建 hotfix/*。",
    "Create develop as the next-release integration branch.": "将 develop 创建为下一版本集成分支。",
    "Route feature/* and codex/* branches into develop.": "将 feature/* 和 codex/* 分支合入 develop。",
    "Cut release/* from develop, then merge release and hotfix work back to main.": "从 develop 切出 release/*，再将发布和热修复工作合回 main。",
    "Use main branch protection, required AIGate checks, and tag-driven npm release channels.": "使用 main 分支保护、必需 AIGate 检查和标签驱动的 npm 发布频道。",
    "Use strict main protection, fast required checks, and short-lived branch age limits.": "使用严格 main 保护、快速必需检查和短生命周期分支限制。",
    "Use main protection, optional develop protection, release/* stabilization rules, and AI collaboration policy packs.": "使用 main 保护、可选 develop 保护、release/* 稳定规则和 AI 协作政策包。",
    "Use protected main/develop/release/*/hotfix/* rules with explicit release and hotfix ownership.": "使用受保护的 main/develop/release/*/hotfix/* 规则，并明确发布和热修复所有权。"
  }
};

const GITHUB_PROTECTION_TRANSLATIONS = {
  ko: {
    "Require pull request before merging into main.": "main에 병합하기 전에 PR을 필수로 요구합니다.",
    "Do not require mandatory approvals by default; enable reviews per repository policy.": "기본값으로 필수 승인은 요구하지 않고, 저장소 정책에 따라 리뷰를 켭니다.",
    "Require the CI test job before merging.": "병합 전에 CI test 작업 통과를 요구합니다.",
    "Require conversation resolution.": "대화 해결을 요구합니다.",
    "Block force pushes and branch deletion.": "강제 푸시와 브랜치 삭제를 차단합니다."
  },
  ja: {
    "Require pull request before merging into main.": "main へマージする前に PR を必須にします。",
    "Do not require mandatory approvals by default; enable reviews per repository policy.": "デフォルトでは必須承認を要求せず、リポジトリポリシーに応じて review を有効にします。",
    "Require the CI test job before merging.": "マージ前に CI test ジョブの通過を必須にします。",
    "Require conversation resolution.": "会話の解決を必須にします。",
    "Block force pushes and branch deletion.": "強制プッシュとブランチ削除をブロックします。"
  },
  zh: {
    "Require pull request before merging into main.": "合并到 main 前必须创建 PR。",
    "Do not require mandatory approvals by default; enable reviews per repository policy.": "默认不要求强制审批，可按仓库政策启用 review。",
    "Require the CI test job before merging.": "合并前必须通过 CI test 作业。",
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
    "release workflow exists": "릴리스 워크플로 존재",
    "release workflow uses npm provenance": "릴리스 워크플로가 npm provenance 사용",
    "release workflow disables package manager cache": "릴리스 워크플로가 패키지 관리자 캐시를 비활성화",
    "README documents npm install command": "README가 npm 설치 명령을 문서화",
    "CHANGELOG documents package version": "CHANGELOG가 패키지 버전을 문서화"
  },
  ja: {
    "package.json exists": "package.json が存在",
    "package-lock.json version matches package.json": "package-lock.json のバージョンが package.json と一致",
    "package is not marked private": "package.json が private パッケージではない",
    "package has a valid npm package name": "パッケージが有効な npm 名を持つ",
    "package version is not 0.0.0": "パッケージバージョンが 0.0.0 ではない",
    "package declares npm entrypoint or bin": "パッケージが npm エントリポイントまたは bin を宣言",
    "publishConfig access is public": "publishConfig access が public",
    "release workflow exists": "リリースワークフローが存在",
    "release workflow uses npm provenance": "リリースワークフローが npm provenance を使用",
    "release workflow disables package manager cache": "リリースワークフローがパッケージマネージャーキャッシュを無効化",
    "README documents npm install command": "README に npm install コマンドが記載済み",
    "CHANGELOG documents package version": "CHANGELOG にパッケージバージョンが記載済み"
  },
  zh: {
    "package.json exists": "package.json 存在",
    "package-lock.json version matches package.json": "package-lock.json 版本与 package.json 一致",
    "package is not marked private": "package.json 未标记为 private 包",
    "package has a valid npm package name": "包具有有效 npm 名称",
    "package version is not 0.0.0": "包版本不是 0.0.0",
    "package declares npm entrypoint or bin": "包声明 npm 入口或 bin",
    "publishConfig access is public": "publishConfig access 为 public",
    "release workflow exists": "发布工作流存在",
    "release workflow uses npm provenance": "发布工作流使用 npm provenance",
    "release workflow disables package manager cache": "发布工作流禁用包管理器缓存",
    "README documents npm install command": "README 记录 npm install 命令",
    "CHANGELOG documents package version": "CHANGELOG 记录包版本"
  }
};

const REPORT_LABELS = {
  en: {
    changedPaths: "Changed Paths",
    none: "None",
    prReadinessScore: "PR readiness score",
    projectScore: "Project score",
    recommendation: "Recommendation",
    recommendedActions: "Recommended Actions",
    riskScore: "Risk score",
    secretFindings: "Secret Findings",
    secretFindingsCount: "Secret findings",
    status: "Status",
    changedFiles: "Changed files",
    branch: "Branch",
    weeklyTeamSignals: "Weekly Team Signals",
    projectGrade: "Project grade",
    changedPathsInWorkspace: "Changed paths in current workspace",
    releaseStatus: "Release status",
    riskSignals: "Risk Signals",
    highRiskFileSignal: "High-risk file signal",
    suggestedVerdict: "Suggested verdict",
    yes: "yes",
    no: "no",
    title: (type) => `AIGate ${type} report`
  },
  ko: {
    changedPaths: "변경 경로",
    none: "없음",
    prReadinessScore: "PR 준비 점수",
    projectScore: "프로젝트 점수",
    recommendation: "권장 사항",
    recommendedActions: "권장 조치",
    riskScore: "위험 점수",
    secretFindings: "민감 정보 탐지",
    secretFindingsCount: "민감 정보 탐지",
    status: "상태",
    changedFiles: "변경 파일",
    branch: "브랜치",
    weeklyTeamSignals: "주간 팀 신호",
    projectGrade: "프로젝트 등급",
    changedPathsInWorkspace: "현재 작업공간 변경 경로",
    releaseStatus: "릴리스 상태",
    riskSignals: "위험 신호",
    highRiskFileSignal: "고위험 파일 신호",
    suggestedVerdict: "제안 판정",
    yes: "예",
    no: "아니오",
    title: (type) => `AIGate ${type} 리포트`
  },
  ja: {
    changedPaths: "変更パス",
    none: "なし",
    prReadinessScore: "PR 準備スコア",
    projectScore: "プロジェクトスコア",
    recommendation: "推奨事項",
    recommendedActions: "推奨アクション",
    riskScore: "リスクスコア",
    secretFindings: "機密情報検出",
    secretFindingsCount: "機密情報検出",
    status: "状態",
    changedFiles: "変更ファイル",
    branch: "ブランチ",
    weeklyTeamSignals: "週次チームシグナル",
    projectGrade: "プロジェクトグレード",
    changedPathsInWorkspace: "現在の作業ツリー内の変更パス",
    releaseStatus: "リリース状態",
    riskSignals: "リスクシグナル",
    highRiskFileSignal: "高リスクファイルシグナル",
    suggestedVerdict: "推奨判定",
    yes: "はい",
    no: "いいえ",
    title: (type) => `AIGate ${type} レポート`
  },
  zh: {
    changedPaths: "变更路径",
    none: "无",
    prReadinessScore: "PR 就绪分数",
    projectScore: "项目分数",
    recommendation: "建议",
    recommendedActions: "建议操作",
    riskScore: "风险分数",
    secretFindings: "敏感信息发现",
    secretFindingsCount: "敏感信息发现",
    status: "状态",
    changedFiles: "变更文件",
    branch: "分支",
    weeklyTeamSignals: "每周团队信号",
    projectGrade: "项目等级",
    changedPathsInWorkspace: "当前工作区变更路径",
    releaseStatus: "发布状态",
    riskSignals: "风险信号",
    highRiskFileSignal: "高风险文件信号",
    suggestedVerdict: "建议判定",
    yes: "是",
    no: "否",
    title: (type) => `AIGate ${type} 报告`
  }
};

const REPORT_TYPE_TRANSLATIONS = {
  en: {
    local: "local",
    pr: "PR",
    weekly: "weekly",
    risk: "risk"
  },
  ko: {
    local: "로컬",
    pr: "PR",
    weekly: "주간",
    risk: "위험"
  },
  ja: {
    local: "ローカル",
    pr: "PR",
    weekly: "週次",
    risk: "リスク"
  },
  zh: {
    local: "本地",
    pr: "PR",
    weekly: "每周",
    risk: "风险"
  }
};

const REPORT_ACTION_TRANSLATIONS = {
  ko: {
    "Remove or rotate suspected secrets before commit or push.": "커밋 또는 푸시 전에 의심되는 민감 정보를 제거하거나 교체하세요.",
    "Split large changes into smaller pull requests.": "큰 변경은 더 작은 PR로 나누세요.",
    "Complete missing repository foundation checks.": "부족한 저장소 기반 점검 항목을 보완하세요.",
    "Include validation commands and release impact in the pull request body.": "PR 본문에 검증 명령과 릴리스 영향을 포함하세요.",
    "Run tests, keep the change focused, and open a pull request.": "테스트를 실행하고 변경 범위를 집중시킨 뒤 PR을 여세요.",
    "Move local AIGate settings out of the commit or add them to .gitignore.": "로컬 AIGate 설정은 커밋에서 빼거나 .gitignore에 추가하세요."
  },
  ja: {
    "Remove or rotate suspected secrets before commit or push.": "コミットまたはプッシュ前に疑わしい機密情報を削除またはローテーションしてください。",
    "Split large changes into smaller pull requests.": "大きな変更は小さな PR に分割してください。",
    "Complete missing repository foundation checks.": "不足しているリポジトリ基盤チェックを整備してください。",
    "Include validation commands and release impact in the pull request body.": "PR 本文に検証コマンドとリリース影響を含めてください。",
    "Run tests, keep the change focused, and open a pull request.": "テストを実行し、変更範囲を絞って PR を作成してください。",
    "Move local AIGate settings out of the commit or add them to .gitignore.": "ローカル AIGate 設定はコミットから外すか .gitignore に追加してください。"
  },
  zh: {
    "Remove or rotate suspected secrets before commit or push.": "提交或推送前，请移除或轮换疑似敏感信息。",
    "Split large changes into smaller pull requests.": "将大型变更拆分为更小的 PR。",
    "Complete missing repository foundation checks.": "补齐缺失的仓库基础检查项。",
    "Include validation commands and release impact in the pull request body.": "在 PR 正文中包含验证命令和发布影响。",
    "Run tests, keep the change focused, and open a pull request.": "运行测试，保持变更聚焦，然后创建 PR。",
    "Move local AIGate settings out of the commit or add them to .gitignore.": "请将本地 AIGate 设置移出提交，或加入 .gitignore。"
  }
};

const FINDING_LABEL_TRANSLATIONS = {
  ko: {
    "AWS access key id": "AWS 액세스 키 ID",
    "GitHub token": "GitHub 토큰",
    "Slack token": "Slack 토큰",
    "Private key block": "개인 키 블록",
    "Generic secret assignment": "일반 민감 정보 할당",
    "Sensitive authentication state file": "민감한 인증 상태 파일"
  },
  ja: {
    "AWS access key id": "AWS アクセスキー ID",
    "GitHub token": "GitHub トークン",
    "Slack token": "Slack トークン",
    "Private key block": "秘密鍵ブロック",
    "Generic secret assignment": "汎用機密情報の代入",
    "Sensitive authentication state file": "機密の認証状態ファイル"
  },
  zh: {
    "AWS access key id": "AWS 访问密钥 ID",
    "GitHub token": "GitHub 令牌",
    "Slack token": "Slack 令牌",
    "Private key block": "私钥块",
    "Generic secret assignment": "通用敏感信息赋值",
    "Sensitive authentication state file": "敏感认证状态文件"
  }
};

const HELP_CONTENT = {
  en: {
    subtitle: "AI Git Workflow Guard CLI",
    usage: "Usage",
    commandsTitle: "Commands",
    optionsTitle: "Options",
    commands: [
      ["init", "Create starter AIGate project configuration."],
      ["check", "Summarize local Git readiness."],
      ["git-ready", "Run the before-push readiness gate."],
      ["push", "Run AIGate checks, then run git push."],
      ["pr", "Run AIGate checks, then create a GitHub pull request."],
      ["pr-check", "Generate a pull request readiness report."],
      ["github <comment|check|setup>", "Post PR comments, prepare Checks summaries, or set up GitHub files."],
      ["start", "Open a guided project setup router."],
      ["doctor", "Diagnose first-run environment and repository setup."],
      ["demo", "Show a guided first-run demo without changing files."],
      ["install-hook", "Install AIGate Git hooks."],
      ["test", "Run Git readiness and the detected project test command."],
      ["aitest", "Create an AI remediation prompt, and optionally run an AI agent."],
      ["setup", "Configure AIGate project settings."],
      ["settings", "Show current AIGate settings."],
      ["integrate <provider>", "Generate Codex/Gemini/Claude assistant integration files."],
      ["report", "Print a workflow report."],
      ["evaluate-project", "Score repository workflow foundations."],
      ["score", "Print only the project score."],
      ["trends <record|show>", "Track repository health trend history."],
      ["branch-strategy", "Recommend or compare branch strategies."],
      ["release-check", "Validate package release readiness."],
      ["audit-report", "Generate a policy and governance audit report."],
      ["compliance-report", "Generate a compliance control report."],
      ["dashboard", "Write a local HTML health dashboard."],
      ["notify <setup|test|send>", "Preview or send notification workflows."],
      ["help", "Show this help message."]
    ],
    options: [
      ["--format <text|json|markdown|html|sarif>", "Select output format."],
      ["--type <local|pr|weekly>", "Select report type."],
      ["--output <path>", "Write report output to a file."],
      ["--base <branch>", "Pull request base branch."],
      ["--pr <number>", "GitHub pull request number."],
      ["--owner <@team>", "Default CODEOWNERS owner for GitHub setup."],
      ["--name <text>", "GitHub Checks display name."],
      ["--details-url <url>", "GitHub Checks details URL."],
      ["--history <path>", "Trend history file path."],
      ["--title <text>", "Pull request title."],
      ["--body <text>", "Pull request body."],
      ["--generate", "Write generated branch strategy guidance."],
      ["--apply", "Apply generated files or run the AI remediation step."],
      ["--compare", "Compare branch strategy proposals."],
      ["--github", "Include GitHub protection guidance."],
      ["--deep", "Include deeper project history signals."],
      ["--report", "Render a project evaluation report."],
      ["--team-size <number>", "Team size signal for strategy recommendations."],
      ["--release <cadence>", "Release cadence signal for strategy recommendations."],
      ["--event <name>", "Notification event name."],
      ["--channel <name>", "Notification channel: terminal, slack, discord, teams, email, linear, jira, or custom webhook."],
      ["--notify-channel <name>", "Send BLOCK notification when a gate blocks."],
      ["--webhook-url <url>", "Webhook URL override for notification sends."],
      ["--webhook-env <name>", "Environment variable name for webhook notifications."],
      ["--linear-team-id <id>", "Linear team id for issue creation."],
      ["--jira-project-key <key>", "Jira project key for issue creation."],
      ["--route <name>", "Start route: quickstart, ai, hook, release, or full."],
      ["--provider <name>", "AI provider: auto, codex, claude, gemini, or all."],
      ["--script <name>", "npm script name for aigate test or aitest."],
      ["--command <shell>", "Custom shell command for aigate test or aitest."],
      ["--agent-command <shell>", "Custom AI agent command for aitest --apply."],
      ["--pre-push", "Install or target the pre-push Git hook."],
      ["--language <en|ko|ja|zh>", "Select output language."],
      ["--output-dir <path>", "Select integration output directory."],
      ["--force", "Overwrite generated integration files."],
      ["--npm", "Check npm registry state for release-check."],
      ["--dry-run", "Preview an AIGate command without changing remotes."],
      ["--no-verify", "Skip the AIGate readiness gate for push."],
      ["--version", "Print CLI version."]
    ]
  },
  ko: {
    subtitle: "AI Git 워크플로 보호 CLI",
    usage: "사용법",
    commandsTitle: "명령어",
    optionsTitle: "옵션",
    commands: [
      ["init", "AIGate 프로젝트 기본 설정을 생성합니다."],
      ["check", "로컬 Git 준비 상태를 요약합니다."],
      ["git-ready", "푸시 전 준비 게이트를 실행합니다."],
      ["push", "AIGate 검사 후 git push를 실행합니다."],
      ["pr", "AIGate 검사 후 GitHub PR을 생성합니다."],
      ["pr-check", "PR 준비 상태 리포트를 생성합니다."],
      ["github <comment|check|setup>", "PR 댓글, Checks 요약, GitHub 파일 설정을 처리합니다."],
      ["start", "프로젝트 설정 라우터를 안내형으로 엽니다."],
      ["doctor", "첫 실행 환경과 저장소 설정을 진단합니다."],
      ["demo", "파일 변경 없이 첫 실행 데모를 보여줍니다."],
      ["install-hook", "AIGate Git hook을 설치합니다."],
      ["test", "Git 준비 상태와 감지된 프로젝트 테스트 명령을 실행합니다."],
      ["aitest", "AI 수정 프롬프트를 만들고, 선택하면 AI 에이전트를 실행합니다."],
      ["setup", "AIGate 프로젝트 설정을 구성합니다."],
      ["settings", "현재 AIGate 설정을 표시합니다."],
      ["integrate <provider>", "Codex/Gemini/Claude 어시스턴트 연동 파일을 생성합니다."],
      ["report", "워크플로 리포트를 출력합니다."],
      ["evaluate-project", "저장소 워크플로 기반 점수를 계산합니다."],
      ["score", "프로젝트 점수만 출력합니다."],
      ["trends <record|show>", "저장소 상태 추세 기록을 관리합니다."],
      ["branch-strategy", "브랜치 전략을 추천하거나 비교합니다."],
      ["release-check", "패키지 릴리스 준비 상태를 검증합니다."],
      ["audit-report", "정책과 거버넌스 감사 리포트를 생성합니다."],
      ["compliance-report", "컴플라이언스 통제 리포트를 생성합니다."],
      ["dashboard", "로컬 HTML 상태 대시보드를 작성합니다."],
      ["notify <setup|test|send>", "알림 흐름을 미리 보거나 전송합니다."],
      ["help", "도움말을 표시합니다."]
    ],
    options: [
      ["--format <text|json|markdown|html|sarif>", "출력 형식을 선택합니다."],
      ["--type <local|pr|weekly>", "리포트 유형을 선택합니다."],
      ["--output <path>", "리포트 출력을 파일로 저장합니다."],
      ["--base <branch>", "PR 대상 브랜치를 지정합니다."],
      ["--pr <number>", "GitHub PR 번호를 지정합니다."],
      ["--owner <@team>", "GitHub 설정용 기본 CODEOWNERS 소유자입니다."],
      ["--name <text>", "GitHub Checks 표시 이름입니다."],
      ["--details-url <url>", "GitHub Checks 상세 URL입니다."],
      ["--history <path>", "추세 기록 파일 경로입니다."],
      ["--title <text>", "PR 제목을 지정합니다."],
      ["--body <text>", "PR 본문을 지정합니다."],
      ["--generate", "브랜치 전략 가이드를 생성합니다."],
      ["--apply", "생성 파일을 적용하거나 AI 수정 단계를 실행합니다."],
      ["--compare", "브랜치 전략 제안을 비교합니다."],
      ["--github", "GitHub 보호 규칙 가이드를 포함합니다."],
      ["--deep", "더 깊은 프로젝트 히스토리 신호를 포함합니다."],
      ["--report", "프로젝트 평가 리포트를 렌더링합니다."],
      ["--team-size <number>", "전략 추천용 팀 규모 신호입니다."],
      ["--release <cadence>", "전략 추천용 릴리스 주기 신호입니다."],
      ["--event <name>", "알림 이벤트 이름입니다."],
      ["--channel <name>", "알림 채널입니다: terminal, slack, discord, teams, email, linear, jira, custom webhook."],
      ["--notify-channel <name>", "게이트가 차단될 때 BLOCK 알림을 보냅니다."],
      ["--webhook-url <url>", "알림 전송용 webhook URL을 직접 지정합니다."],
      ["--webhook-env <name>", "webhook 알림에 사용할 환경 변수 이름입니다."],
      ["--linear-team-id <id>", "Linear 이슈 생성용 팀 ID입니다."],
      ["--jira-project-key <key>", "Jira 이슈 생성용 프로젝트 키입니다."],
      ["--route <name>", "시작 루트입니다: quickstart, ai, hook, release, full."],
      ["--provider <name>", "AI 제공자입니다: auto, codex, claude, gemini, all."],
      ["--script <name>", "aigate test 또는 aitest에서 사용할 npm script 이름입니다."],
      ["--command <shell>", "aigate test 또는 aitest에서 사용할 사용자 지정 shell 명령입니다."],
      ["--agent-command <shell>", "aitest --apply에서 사용할 사용자 지정 AI 에이전트 명령입니다."],
      ["--pre-push", "pre-push Git hook을 설치하거나 대상으로 지정합니다."],
      ["--language <en|ko|ja|zh>", "출력 언어를 선택합니다."],
      ["--output-dir <path>", "연동 파일 출력 디렉터리를 선택합니다."],
      ["--force", "생성된 연동 파일을 덮어씁니다."],
      ["--npm", "release-check에서 npm 레지스트리 상태를 확인합니다."],
      ["--dry-run", "원격 변경 없이 AIGate 명령을 미리 봅니다."],
      ["--no-verify", "푸시 준비 게이트를 건너뜁니다."],
      ["--version", "CLI 버전을 출력합니다."]
    ]
  },
  ja: {
    subtitle: "AI Git ワークフロー保護 CLI",
    usage: "使い方",
    commandsTitle: "コマンド",
    optionsTitle: "オプション",
    commands: [
      ["init", "AIGate プロジェクトの初期設定を作成します。"],
      ["check", "ローカル Git 準備状態を要約します。"],
      ["git-ready", "プッシュ前の準備ゲートを実行します。"],
      ["push", "AIGate チェック後に git push を実行します。"],
      ["pr", "AIGate チェック後に GitHub PR を作成します。"],
      ["pr-check", "PR 準備レポートを生成します。"],
      ["github <comment|check|setup>", "PR コメント、Checks サマリー、GitHub ファイル設定を処理します。"],
      ["start", "プロジェクト設定ルーターをガイド付きで開きます。"],
      ["doctor", "初回実行環境とリポジトリ設定を診断します。"],
      ["demo", "ファイルを変更せず初回実行デモを表示します。"],
      ["install-hook", "AIGate Git hook をインストールします。"],
      ["test", "Git 準備状態と検出したプロジェクト test コマンドを実行します。"],
      ["aitest", "AI 修正プロンプトを作成し、必要なら AI エージェントを実行します。"],
      ["setup", "AIGate プロジェクト設定を構成します。"],
      ["settings", "現在の AIGate 設定を表示します。"],
      ["integrate <provider>", "Codex/Gemini/Claude アシスタント連携ファイルを生成します。"],
      ["report", "ワークフローレポートを出力します。"],
      ["evaluate-project", "リポジトリのワークフロー基盤を採点します。"],
      ["score", "プロジェクトスコアのみ出力します。"],
      ["trends <record|show>", "リポジトリ状態トレンド履歴を管理します。"],
      ["branch-strategy", "ブランチ戦略を推薦または比較します。"],
      ["release-check", "パッケージのリリース準備状況を検証します。"],
      ["audit-report", "ポリシーとガバナンスの監査レポートを生成します。"],
      ["compliance-report", "コンプライアンス統制レポートを生成します。"],
      ["dashboard", "ローカル HTML ヘルスダッシュボードを書き込みます。"],
      ["notify <setup|test|send>", "通知ワークフローをプレビューまたは送信します。"],
      ["help", "このヘルプを表示します。"]
    ],
    options: [
      ["--format <text|json|markdown|html|sarif>", "出力形式を選択します。"],
      ["--type <local|pr|weekly>", "レポート種別を選択します。"],
      ["--output <path>", "レポート出力をファイルに保存します。"],
      ["--base <branch>", "PR の基準ブランチを指定します。"],
      ["--pr <number>", "GitHub PR 番号を指定します。"],
      ["--owner <@team>", "GitHub 設定用の既定 CODEOWNERS オーナーです。"],
      ["--name <text>", "GitHub Checks 表示名です。"],
      ["--details-url <url>", "GitHub Checks 詳細 URL です。"],
      ["--history <path>", "トレンド履歴ファイルのパスです。"],
      ["--title <text>", "PR タイトルを指定します。"],
      ["--body <text>", "PR 本文を指定します。"],
      ["--generate", "ブランチ戦略ガイドを生成します。"],
      ["--apply", "生成ファイルを適用するか AI 修正ステップを実行します。"],
      ["--compare", "ブランチ戦略提案を比較します。"],
      ["--github", "GitHub 保護ルールガイドを含めます。"],
      ["--deep", "より深いプロジェクト履歴シグナルを含めます。"],
      ["--report", "プロジェクト評価レポートをレンダリングします。"],
      ["--team-size <number>", "戦略推薦用のチームサイズシグナルです。"],
      ["--release <cadence>", "戦略推薦用のリリース頻度シグナルです。"],
      ["--event <name>", "通知イベント名です。"],
      ["--channel <name>", "通知チャンネルです: terminal, slack, discord, teams, email, linear, jira, custom webhook."],
      ["--notify-channel <name>", "ゲートがブロックしたときに BLOCK 通知を送ります。"],
      ["--webhook-url <url>", "通知送信用 webhook URL を直接指定します。"],
      ["--webhook-env <name>", "webhook 通知に使う環境変数名です。"],
      ["--linear-team-id <id>", "Linear issue 作成用 team ID です。"],
      ["--jira-project-key <key>", "Jira issue 作成用 project key です。"],
      ["--route <name>", "開始ルート: quickstart, ai, hook, release, full。"],
      ["--provider <name>", "AI provider: auto, codex, claude, gemini, all。"],
      ["--script <name>", "aigate test または aitest で使う npm script 名です。"],
      ["--command <shell>", "aigate test または aitest で使うカスタム shell コマンドです。"],
      ["--agent-command <shell>", "aitest --apply で使うカスタム AI エージェントコマンドです。"],
      ["--pre-push", "pre-push Git hook をインストールまたは対象にします。"],
      ["--language <en|ko|ja|zh>", "出力言語を選択します。"],
      ["--output-dir <path>", "連携ファイルの出力ディレクトリを選択します。"],
      ["--force", "生成済み連携ファイルを上書きします。"],
      ["--npm", "release-check で npm レジストリ状態を確認します。"],
      ["--dry-run", "リモートを変更せずに AIGate コマンドをプレビューします。"],
      ["--no-verify", "プッシュ準備ゲートをスキップします。"],
      ["--version", "CLI バージョンを出力します。"]
    ]
  },
  zh: {
    subtitle: "AI Git 工作流守护 CLI",
    usage: "用法",
    commandsTitle: "命令",
    optionsTitle: "选项",
    commands: [
      ["init", "创建 AIGate 项目初始配置。"],
      ["check", "汇总本地 Git 就绪状态。"],
      ["git-ready", "运行推送前的就绪关卡。"],
      ["push", "运行 AIGate 检查后执行 git push。"],
      ["pr", "运行 AIGate 检查后创建 GitHub PR。"],
      ["pr-check", "生成 PR 就绪报告。"],
      ["github <comment|check|setup>", "发布 PR 评论、准备 Checks 摘要或设置 GitHub 文件。"],
      ["start", "打开引导式项目设置路由器。"],
      ["doctor", "诊断首次运行环境和仓库设置。"],
      ["demo", "不改动文件，显示首次运行演示。"],
      ["install-hook", "安装 AIGate Git hook。"],
      ["test", "运行 Git 就绪检查和检测到的项目测试命令。"],
      ["aitest", "创建 AI 修复提示，并可选择运行 AI agent。"],
      ["setup", "配置 AIGate 项目设置。"],
      ["settings", "显示当前 AIGate 设置。"],
      ["integrate <provider>", "生成 Codex/Gemini/Claude 助手集成文件。"],
      ["report", "输出工作流报告。"],
      ["evaluate-project", "评估仓库工作流基础分。"],
      ["score", "仅输出项目分数。"],
      ["trends <record|show>", "管理仓库状态趋势历史。"],
      ["branch-strategy", "推荐或比较分支策略。"],
      ["release-check", "验证包发布就绪状态。"],
      ["audit-report", "生成政策和治理审计报告。"],
      ["compliance-report", "生成合规控制报告。"],
      ["dashboard", "写入本地 HTML 健康仪表盘。"],
      ["notify <setup|test|send>", "预览或发送通知工作流。"],
      ["help", "显示此帮助。"]
    ],
    options: [
      ["--format <text|json|markdown|html|sarif>", "选择输出格式。"],
      ["--type <local|pr|weekly>", "选择报告类型。"],
      ["--output <path>", "将报告输出写入文件。"],
      ["--base <branch>", "PR 基准分支。"],
      ["--pr <number>", "GitHub PR 编号。"],
      ["--owner <@team>", "GitHub 设置默认 CODEOWNERS 所有者。"],
      ["--name <text>", "GitHub Checks 显示名称。"],
      ["--details-url <url>", "GitHub Checks 详情 URL。"],
      ["--history <path>", "趋势历史文件路径。"],
      ["--title <text>", "PR 标题。"],
      ["--body <text>", "PR 正文。"],
      ["--generate", "生成分支策略指南。"],
      ["--apply", "应用生成文件或运行 AI 修复步骤。"],
      ["--compare", "比较分支策略提案。"],
      ["--github", "包含 GitHub 保护规则指南。"],
      ["--deep", "包含更深入的项目历史信号。"],
      ["--report", "渲染项目评估报告。"],
      ["--team-size <number>", "用于策略推荐的团队规模信号。"],
      ["--release <cadence>", "用于策略推荐的发布节奏信号。"],
      ["--event <name>", "通知事件名称。"],
      ["--channel <name>", "通知频道: terminal, slack, discord, teams, email, linear, jira, custom webhook。"],
      ["--notify-channel <name>", "关卡阻塞时发送 BLOCK 通知。"],
      ["--webhook-url <url>", "直接指定通知 webhook URL。"],
      ["--webhook-env <name>", "webhook 通知使用的环境变量名。"],
      ["--linear-team-id <id>", "创建 Linear issue 的 team ID。"],
      ["--jira-project-key <key>", "创建 Jira issue 的 project key。"],
      ["--route <name>", "启动路由: quickstart, ai, hook, release, full。"],
      ["--provider <name>", "AI provider: auto, codex, claude, gemini, all。"],
      ["--script <name>", "aigate test 或 aitest 使用的 npm script 名称。"],
      ["--command <shell>", "aigate test 或 aitest 使用的自定义 shell 命令。"],
      ["--agent-command <shell>", "aitest --apply 使用的自定义 AI agent 命令。"],
      ["--pre-push", "安装或指定 pre-push Git hook。"],
      ["--language <en|ko|ja|zh>", "选择输出语言。"],
      ["--output-dir <path>", "选择集成输出目录。"],
      ["--force", "覆盖已生成的集成文件。"],
      ["--npm", "在 release-check 中检查 npm 注册表状态。"],
      ["--dry-run", "不修改远端，仅预览 AIGate 命令。"],
      ["--no-verify", "跳过推送准备关卡。"],
      ["--version", "输出 CLI 版本。"]
    ]
  }
};

const EVALUATION_LABELS = {
  en: {
    title: "AIGate Project Evaluation",
    textTitle: "AIGate project score",
    score: "Score",
    grade: "Grade",
    recommendation: "Recommendation",
    categories: "Categories",
    checks: "Checks",
    deepSignals: "Deep Signals",
    commitsInspected: "Commits inspected",
    branchesDetected: "Branches detected",
    tagsDetected: "Tags detected",
    releaseWorkflows: "Release workflows",
    releaseProcessDocs: "Release process docs",
    hotfixProcessDocs: "Hotfix process docs",
    yes: "yes",
    no: "no"
  },
  ko: {
    title: "AIGate 프로젝트 평가",
    textTitle: "AIGate 프로젝트 점수",
    score: "점수",
    grade: "등급",
    recommendation: "권장 사항",
    categories: "카테고리",
    checks: "점검 항목",
    deepSignals: "상세 신호",
    commitsInspected: "검사한 커밋",
    branchesDetected: "감지된 브랜치",
    tagsDetected: "감지된 태그",
    releaseWorkflows: "릴리스 워크플로",
    releaseProcessDocs: "릴리스 프로세스 문서",
    hotfixProcessDocs: "핫픽스 프로세스 문서",
    yes: "예",
    no: "아니오"
  },
  ja: {
    title: "AIGate プロジェクト評価",
    textTitle: "AIGate プロジェクトスコア",
    score: "スコア",
    grade: "グレード",
    recommendation: "推奨事項",
    categories: "カテゴリ",
    checks: "チェック項目",
    deepSignals: "詳細シグナル",
    commitsInspected: "検査したコミット",
    branchesDetected: "検出ブランチ",
    tagsDetected: "検出タグ",
    releaseWorkflows: "リリースワークフロー",
    releaseProcessDocs: "リリースプロセス文書",
    hotfixProcessDocs: "ホットフィックスプロセス文書",
    yes: "はい",
    no: "いいえ"
  },
  zh: {
    title: "AIGate 项目评估",
    textTitle: "AIGate 项目分数",
    score: "分数",
    grade: "等级",
    recommendation: "建议",
    categories: "类别",
    checks: "检查项",
    deepSignals: "详细信号",
    commitsInspected: "已检查提交数",
    branchesDetected: "检测到的分支",
    tagsDetected: "检测到的标签",
    releaseWorkflows: "发布工作流",
    releaseProcessDocs: "发布流程文档",
    hotfixProcessDocs: "Hotfix 流程文档",
    yes: "是",
    no: "否"
  }
};

const EVALUATION_CATEGORY_TRANSLATIONS = {
  ko: {
    git_workflow: "Git 워크플로",
    pr_quality: "PR 품질",
    testing: "테스트",
    ci_cd: "CI/CD",
    security: "보안",
    documentation: "문서",
    maintainability: "유지보수성"
  },
  ja: {
    git_workflow: "Git ワークフロー",
    pr_quality: "PR 品質",
    testing: "テスト",
    ci_cd: "CI/CD",
    security: "セキュリティ",
    documentation: "ドキュメント",
    maintainability: "保守性"
  },
  zh: {
    git_workflow: "Git 工作流",
    pr_quality: "PR 质量",
    testing: "测试",
    ci_cd: "CI/CD",
    security: "安全",
    documentation: "文档",
    maintainability: "可维护性"
  }
};

const EVALUATION_CHECK_TRANSLATIONS = {
  ko: {
    "AIGate configuration exists": "AIGate 설정 존재",
    "Branch strategy is documented": "브랜치 전략 문서화",
    "Git upload workflow is documented": "Git 업로드 워크플로 문서화",
    "Pull request template exists": "PR 템플릿 존재",
    "CODEOWNERS exists": "CODEOWNERS 존재",
    "Contribution guide exists": "기여 가이드 존재",
    "Issue templates exist": "Issue 템플릿 존재",
    "AI assistant instructions exist": "AI 어시스턴트 지침 존재",
    "Test directory exists": "테스트 디렉터리 존재",
    "npm test script exists": "npm test 스크립트 존재",
    "CI gate script exists": "CI 게이트 스크립트 존재",
    "CI workflow exists": "CI 워크플로 존재",
    "Release workflow exists": "릴리스 워크플로 존재",
    "Dependabot exists": "Dependabot 존재",
    "Security policy exists": "보안 정책 존재",
    "Security scanning is documented": "보안 스캔 문서화",
    "OpenSSF Scorecard workflow exists": "OpenSSF Scorecard 워크플로 존재",
    "README exists": "README 존재",
    "License exists": "라이선스 존재",
    "Changelog exists": "CHANGELOG 존재",
    "Roadmap exists": "로드맵 존재",
    "Package metadata exists": "패키지 메타데이터 존재",
    "Support policy exists": "지원 정책 존재",
    "Governance exists": "거버넌스 문서 존재"
  },
  ja: {
    "AIGate configuration exists": "AIGate 設定が存在",
    "Branch strategy is documented": "ブランチ戦略が文書化済み",
    "Git upload workflow is documented": "Git アップロードワークフローが文書化済み",
    "Pull request template exists": "PR テンプレートが存在",
    "CODEOWNERS exists": "CODEOWNERS が存在",
    "Contribution guide exists": "コントリビューションガイドが存在",
    "Issue templates exist": "Issue テンプレートが存在",
    "AI assistant instructions exist": "AI アシスタント指示が存在",
    "Test directory exists": "テストディレクトリが存在",
    "npm test script exists": "npm test スクリプトが存在",
    "CI gate script exists": "CI ゲートスクリプトが存在",
    "CI workflow exists": "CI ワークフローが存在",
    "Release workflow exists": "リリースワークフローが存在",
    "Dependabot exists": "Dependabot が存在",
    "Security policy exists": "セキュリティポリシーが存在",
    "Security scanning is documented": "セキュリティスキャンが文書化済み",
    "OpenSSF Scorecard workflow exists": "OpenSSF Scorecard ワークフローが存在",
    "README exists": "README が存在",
    "License exists": "ライセンスが存在",
    "Changelog exists": "CHANGELOG が存在",
    "Roadmap exists": "ロードマップが存在",
    "Package metadata exists": "パッケージメタデータが存在",
    "Support policy exists": "サポートポリシーが存在",
    "Governance exists": "ガバナンス文書が存在"
  },
  zh: {
    "AIGate configuration exists": "AIGate 配置存在",
    "Branch strategy is documented": "分支策略已文档化",
    "Git upload workflow is documented": "Git 上传工作流已文档化",
    "Pull request template exists": "PR 模板存在",
    "CODEOWNERS exists": "CODEOWNERS 存在",
    "Contribution guide exists": "贡献指南存在",
    "Issue templates exist": "Issue 模板存在",
    "AI assistant instructions exist": "AI 助手指令存在",
    "Test directory exists": "测试目录存在",
    "npm test script exists": "npm test 脚本存在",
    "CI gate script exists": "CI 关卡脚本存在",
    "CI workflow exists": "CI 工作流存在",
    "Release workflow exists": "发布工作流存在",
    "Dependabot exists": "Dependabot 存在",
    "Security policy exists": "安全政策存在",
    "Security scanning is documented": "安全扫描已文档化",
    "OpenSSF Scorecard workflow exists": "OpenSSF Scorecard 工作流存在",
    "README exists": "README 存在",
    "License exists": "许可证存在",
    "Changelog exists": "CHANGELOG 存在",
    "Roadmap exists": "路线图存在",
    "Package metadata exists": "包元数据存在",
    "Support policy exists": "支持政策存在",
    "Governance exists": "治理文档存在"
  }
};

const AUDIT_LABELS = {
  en: {
    title: "AIGate Audit Report",
    status: "Status",
    branch: "Branch",
    projectScore: "Project score",
    releaseStatus: "Release status",
    findings: "Findings",
    recentCommits: "Recent Commits",
    recommendations: "Recommendations",
    none: "None"
  },
  ko: {
    title: "AIGate 감사 리포트",
    status: "상태",
    branch: "브랜치",
    projectScore: "프로젝트 점수",
    releaseStatus: "릴리스 상태",
    findings: "발견 항목",
    recentCommits: "최근 커밋",
    recommendations: "권장 사항",
    none: "없음"
  },
  ja: {
    title: "AIGate 監査レポート",
    status: "状態",
    branch: "ブランチ",
    projectScore: "プロジェクトスコア",
    releaseStatus: "リリース状態",
    findings: "検出項目",
    recentCommits: "最近のコミット",
    recommendations: "推奨事項",
    none: "なし"
  },
  zh: {
    title: "AIGate 审计报告",
    status: "状态",
    branch: "分支",
    projectScore: "项目分数",
    releaseStatus: "发布状态",
    findings: "发现项",
    recentCommits: "最近提交",
    recommendations: "建议",
    none: "无"
  }
};

const COMPLIANCE_LABELS = {
  en: {
    title: "AIGate Compliance Report",
    dashboardTitle: "AIGate Health Dashboard",
    status: "Status",
    branch: "Branch",
    projectScore: "Project score",
    releaseStatus: "Release status",
    controls: "Controls",
    recommendations: "Recommendations",
    generatedAt: "Generated",
    none: "None"
  },
  ko: {
    title: "AIGate 컴플라이언스 리포트",
    dashboardTitle: "AIGate 상태 대시보드",
    status: "상태",
    branch: "브랜치",
    projectScore: "프로젝트 점수",
    releaseStatus: "릴리스 상태",
    controls: "통제 항목",
    recommendations: "권장 사항",
    generatedAt: "생성 시각",
    none: "없음"
  },
  ja: {
    title: "AIGate コンプライアンスレポート",
    dashboardTitle: "AIGate ヘルスダッシュボード",
    status: "状態",
    branch: "ブランチ",
    projectScore: "プロジェクトスコア",
    releaseStatus: "リリース状態",
    controls: "統制項目",
    recommendations: "推奨事項",
    generatedAt: "生成時刻",
    none: "なし"
  },
  zh: {
    title: "AIGate 合规报告",
    dashboardTitle: "AIGate 健康仪表盘",
    status: "状态",
    branch: "分支",
    projectScore: "项目分数",
    releaseStatus: "发布状态",
    controls: "控制项",
    recommendations: "建议",
    generatedAt: "生成时间",
    none: "无"
  }
};

const COMPLIANCE_CONTROL_TRANSLATIONS = {
  ko: {
    "Repository foundation": "저장소 기반",
    "Release readiness": "릴리스 준비 상태",
    "Security policy and scanning": "보안 정책과 스캔",
    "Change control": "변경 통제",
    "Operational documentation": "운영 문서",
    "Audit findings": "감사 발견 항목"
  },
  ja: {
    "Repository foundation": "リポジトリ基盤",
    "Release readiness": "リリース準備状態",
    "Security policy and scanning": "セキュリティポリシーとスキャン",
    "Change control": "変更統制",
    "Operational documentation": "運用ドキュメント",
    "Audit findings": "監査検出事項"
  },
  zh: {
    "Repository foundation": "仓库基础",
    "Release readiness": "发布就绪状态",
    "Security policy and scanning": "安全政策和扫描",
    "Change control": "变更控制",
    "Operational documentation": "运维文档",
    "Audit findings": "审计发现"
  }
};

const AUDIT_RECOMMENDATION_TRANSLATIONS = {
  ko: {
    "Keep all changes going through pull requests into main.": "모든 변경은 main으로 들어가는 PR을 통해 처리하세요.",
    "Run npm run ci and aigate git-ready before release tags.": "릴리스 태그 전에 npm run ci와 aigate git-ready를 실행하세요.",
    "Review release-check output before publishing npm packages.": "npm 패키지 배포 전에 release-check 출력을 검토하세요.",
    "Attach audit-report output to release readiness discussions when governance matters.": "거버넌스가 중요한 릴리스 준비 논의에는 audit-report 출력을 첨부하세요."
  },
  ja: {
    "Keep all changes going through pull requests into main.": "すべての変更は main 向け PR 経由で入れてください。",
    "Run npm run ci and aigate git-ready before release tags.": "リリースタグの前に npm run ci と aigate git-ready を実行してください。",
    "Review release-check output before publishing npm packages.": "npm パッケージ公開前に release-check 出力を確認してください。",
    "Attach audit-report output to release readiness discussions when governance matters.": "ガバナンスが重要なリリース準備の議論には audit-report 出力を添付してください。"
  },
  zh: {
    "Keep all changes going through pull requests into main.": "所有变更都应通过指向 main 的 PR 进入。",
    "Run npm run ci and aigate git-ready before release tags.": "发布标签前运行 npm run ci 和 aigate git-ready。",
    "Review release-check output before publishing npm packages.": "发布 npm 包前请检查 release-check 输出。",
    "Attach audit-report output to release readiness discussions when governance matters.": "治理要求较高的发布准备讨论中，请附上 audit-report 输出。"
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

const commands = {
  init: commandInit,
  check: commandCheck,
  "git-ready": commandGitReady,
  push: commandPush,
  pr: commandPr,
  "pr-check": commandPrCheck,
  github: (args) => commandGithub(args, commandContext()),
  start: commandStart,
  doctor: (args) => commandDoctor(args, commandContext()),
  demo: (args) => commandDemo(args, commandContext()),
  "install-hook": (args) => commandInstallHook(args, commandContext()),
  test: commandTest,
  aitest: commandAiTest,
  setup: commandSetup,
  settings: commandSettings,
  integrate: commandIntegrate,
  report: commandReport,
  "evaluate-project": commandEvaluateProject,
  score: commandScore,
  trends: (args) => commandTrends(args, commandContext()),
  "branch-strategy": commandBranchStrategy,
  "release-check": commandReleaseCheck,
  "audit-report": commandAuditReport,
  "compliance-report": commandComplianceReport,
  dashboard: commandDashboard,
  notify: commandNotify,
  help: commandHelp
};

function commandContext() {
  return {
    buildEvaluation,
    buildGitReadyResult,
    buildReport,
    firstPositionalArg,
    git,
    parseOptions,
    quoteArgs,
    readJsonFile,
    renderPullRequestTemplateDraft,
    renderReport,
    resolveLanguage,
    statusLabel,
    t,
    unsupportedLanguage
  };
}

async function main(argv) {
  const [commandName, ...args] = argv;

  if (!commandName || commandName === "--help" || commandName === "-h") {
    return print(commandHelp(args));
  }

  if (commandName === "--version" || commandName === "-v") {
    return print(VERSION);
  }

  const command = commands[commandName];
  if (!command) {
    const language = resolveLanguage(parseOptions(args)) ?? DEFAULT_SETTINGS.language;
    printError(t(language, "unknownCommand", { command: commandName }));
    print(t(language, "runHelp"));
    process.exitCode = 1;
    return;
  }

  const output = await command(args);
  if (output) {
    print(output);
  }
}

function commandHelp(args = []) {
  const language = resolveLanguage(parseOptions(args)) ?? DEFAULT_SETTINGS.language;
  return renderHelp(language);
}

function renderHelp(language = "en") {
  const content = HELP_CONTENT[language] ?? HELP_CONTENT.en;
  const commandWidth = Math.max(...content.commands.map(([name]) => name.length)) + 2;
  const optionWidth = Math.max(...content.options.map(([name]) => name.length)) + 2;

  return [
    `AIGate ${VERSION}`,
    "",
    content.subtitle,
    "",
    `${content.usage}:`,
    "  aigate <command> [options]",
    "",
    `${content.commandsTitle}:`,
    ...content.commands.map(([name, description]) => `  ${name.padEnd(commandWidth)}${description}`),
    "",
    `${content.optionsTitle}:`,
    ...content.options.map(([name, description]) => `  ${name.padEnd(optionWidth)}${description}`)
  ].join("\n");
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
    changedFiles: analysis.paths.length,
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

  const result = buildGitReadyResult();
  const lines = [formatGitReadyResult(result, options, language)];

  if (result.blockers.length && options.format !== "json") {
    appendBlockNotification(lines, options, language);
  }

  return lines.join("\n");
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
  const body = options.body ?? renderMarkdownReport(buildReport("pr"), language);
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
  const output = renderReport(report, format, language);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

async function commandStart(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const routeArg = firstPositionalArg(args) ?? options.route;
  let route = normalizeStartRoute(routeArg);

  if (!route && routeArg) {
    process.exitCode = 1;
    return renderStartError("unknown-route", language, { route: routeArg });
  }

  if (!route) {
    route = await promptStartRoute(language) ?? "quickstart";
  }

  const provider = normalizeStartProvider(options.provider ?? "all");
  if (!provider) {
    process.exitCode = 1;
    return renderStartError("unknown-provider", language, { provider: options.provider });
  }

  const result = executeStartRoute(route, {
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    provider
  }, language);

  if (result.status === "BLOCK") {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderStartResult(result, language);
}

function commandTest(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const result = buildAigateTestResult(options);

  if (options.output) {
    const output = options.format === "json"
      ? JSON.stringify(result, null, 2)
      : renderTestReport(result, language);
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    result.output = options.output;
  }

  if (result.status === "BLOCK" || result.status === "FAIL") {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderTestReport(result, language);
}

function commandAiTest(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const provider = resolveAiTestProvider(options.provider ?? "auto");
  if (!provider) {
    process.exitCode = 1;
    return renderAiTestError("unknown-provider", language, { provider: options.provider });
  }

  const testResult = buildAigateTestResult(options);
  const promptPath = options.output ?? join(".aigate", "reports", "ai-test.md");
  const prompt = renderAiTestPrompt(testResult, provider, language);
  mkdirSync(dirname(promptPath), { recursive: true });
  writeFileSync(promptPath, `${prompt}\n`, "utf8");

  const result = {
    command: "aitest",
    status: testResult.status === "PASS" ? "PASS" : "ACTION_REQUIRED",
    provider: provider.name,
    providerInstalled: provider.installed,
    promptPath,
    applied: false,
    agent: null,
    test: testResult,
    next: buildAiTestNextSteps(testResult, provider, promptPath, Boolean(options.apply), language)
  };

  if (options.apply) {
    const agentCommand = resolveAgentCommand(provider, options, prompt);
    if (!agentCommand) {
      result.status = "BLOCK";
      result.agent = {
        status: "SKIPPED",
        command: null,
        exitCode: 1,
        stdout: "",
        stderr: translateAiTestText("agentNotFound", language, { provider: provider.name })
      };
    } else {
      result.agent = runAgentCommand(agentCommand, prompt);
      result.applied = result.agent.exitCode === 0;
      result.status = result.applied ? "AI_APPLIED" : "BLOCK";
    }
  }

  if (result.status === "BLOCK" || result.status === "ACTION_REQUIRED") {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderAiTestResult(result, language);
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
  const files = buildIntegrationFiles(providers, outputDir, manifest, language);
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

function normalizeStartRoute(route) {
  if (!route) {
    return null;
  }

  const normalized = String(route).trim().toLowerCase();
  return START_ROUTE_IDS.includes(normalized) ? normalized : null;
}

function normalizeStartProvider(provider) {
  if (!provider) {
    return "all";
  }

  const normalized = String(provider).trim().toLowerCase();
  if (normalized === "auto") {
    return "all";
  }

  return resolveIntegrationProviders(normalized) ? normalized : null;
}

async function promptStartRoute(language) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return null;
  }

  const routes = startRouteDefinitions(language);
  const labels = automationLabels(language);
  let selected = 0;

  return new Promise((resolve) => {
    let renderedLines = [];

    const draw = () => {
      const lines = [
        labels.startPrompt,
        labels.startPromptHint,
        "",
        ...routes.map((route, index) => (
          `${index === selected ? ">" : " "} ${route.title} - ${route.description}`
        ))
      ];

      if (renderedLines.length) {
        process.stdout.write(`\x1b[${renderedLines.length}F`);
      }

      for (const line of lines) {
        process.stdout.write(`\x1b[2K${line}\n`);
      }

      renderedLines = lines;
    };

    const finish = (value) => {
      process.stdin.off("keypress", onKeypress);
      if (typeof process.stdin.setRawMode === "function") {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      resolve(value);
    };

    const onKeypress = (_chunk, key = {}) => {
      if (key.ctrl && key.name === "c") {
        process.stdout.write("\n");
        finish(null);
        return;
      }

      if (key.name === "up") {
        selected = (selected + routes.length - 1) % routes.length;
        draw();
        return;
      }

      if (key.name === "down") {
        selected = (selected + 1) % routes.length;
        draw();
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        process.stdout.write("\n");
        finish(routes[selected].id);
      }
    };

    readline.emitKeypressEvents(process.stdin);
    if (typeof process.stdin.setRawMode === "function") {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.on("keypress", onKeypress);
    draw();
  });
}

function executeStartRoute(routeId, options, language) {
  const route = startRouteDefinitions(language).find((item) => item.id === routeId);
  const stepCalls = buildStartStepCalls(routeId, options.provider, language, options.force);
  const steps = [];

  for (const step of stepCalls) {
    if (options.dryRun) {
      steps.push({
        id: step.id,
        title: step.title,
        command: step.command,
        status: "PENDING",
        exitCode: null,
        output: ""
      });
      continue;
    }

    steps.push(runStartStep(step));
  }

  const status = options.dryRun
    ? "DRY_RUN"
    : steps.some((step) => step.exitCode && step.exitCode !== 0)
      ? "BLOCK"
      : "READY";

  return {
    command: "start",
    status,
    mode: options.dryRun ? "dry-run" : "apply",
    route: routeId,
    title: route?.title ?? routeId,
    provider: options.provider,
    steps,
    next: route?.next ?? []
  };
}

function buildStartStepCalls(routeId, provider, language, force) {
  const baseArgs = ["--language", language];
  const forceArgs = force ? ["--force"] : [];
  const integrationProvider = provider ?? "all";
  const steps = {
    init: {
      id: "init",
      title: automationLabels(language).startStepInit,
      command: `aigate init${force ? " --force" : ""}`,
      run: () => commandInit([...baseArgs, ...forceArgs])
    },
    integrate: {
      id: "integrate",
      title: automationLabels(language).startStepIntegrate,
      command: `aigate integrate ${integrationProvider}${force ? " --force" : ""}`,
      run: () => commandIntegrate([integrationProvider, ...baseArgs, ...forceArgs])
    },
    hook: {
      id: "hook",
      title: automationLabels(language).startStepHook,
      command: `aigate install-hook --pre-push${force ? " --force" : ""}`,
      run: () => commandInstallHook(["--pre-push", ...baseArgs, ...forceArgs], commandContext())
    },
    doctor: {
      id: "doctor",
      title: automationLabels(language).startStepDoctor,
      command: "aigate doctor",
      run: () => commandDoctor(baseArgs, commandContext())
    },
    demo: {
      id: "demo",
      title: automationLabels(language).startStepDemo,
      command: "aigate demo",
      run: () => commandDemo(baseArgs, commandContext())
    },
    release: {
      id: "release-check",
      title: automationLabels(language).startStepRelease,
      command: "aigate release-check",
      run: () => commandReleaseCheck(baseArgs)
    },
    branch: {
      id: "branch-strategy",
      title: automationLabels(language).startStepBranch,
      command: "aigate branch-strategy --github",
      run: () => commandBranchStrategy(["--github", ...baseArgs])
    }
  };

  return {
    quickstart: [steps.init, steps.doctor, steps.demo],
    ai: [steps.init, steps.integrate, steps.doctor],
    hook: [steps.init, steps.hook, steps.doctor],
    release: [steps.release, steps.branch],
    full: [steps.init, steps.integrate, steps.hook, steps.doctor, steps.release]
  }[routeId] ?? [steps.init, steps.doctor];
}

function runStartStep(step) {
  const previousExitCode = process.exitCode;
  process.exitCode = 0;

  try {
    const output = step.run();
    const exitCode = Number(process.exitCode ?? 0);
    process.exitCode = previousExitCode;
    return {
      id: step.id,
      title: step.title,
      command: step.command,
      status: exitCode === 0 ? "PASS" : "BLOCK",
      exitCode,
      output: String(output ?? "")
    };
  } catch (error) {
    process.exitCode = previousExitCode;
    return {
      id: step.id,
      title: step.title,
      command: step.command,
      status: "BLOCK",
      exitCode: 1,
      output: error?.message ?? String(error)
    };
  }
}

function renderStartResult(result, language) {
  const labels = automationLabels(language);
  return [
    `${labels.startTitle}: ${automationStatus(result.status, language)}`,
    `${labels.route}: ${result.title}`,
    `${labels.mode}: ${translateAutomationMode(result.mode, language)}`,
    `${labels.provider}: ${result.provider}`,
    "",
    `${labels.steps}:`,
    ...result.steps.flatMap((step) => [
      `- ${automationStatus(step.status, language)}: ${step.command}`,
      `  ${labels.summary}: ${summarizeStepOutput(step.output, language)}`
    ]),
    "",
    `${labels.next}:`,
    ...result.next.map((step) => `- ${step}`)
  ].join("\n");
}

function renderStartError(kind, language, values = {}) {
  const labels = automationLabels(language);
  if (kind === "unknown-provider") {
    return `${labels.error}: ${labels.unknownProvider} ${values.provider}\n${labels.supportedProviders}: all, codex, gemini, claude`;
  }

  return `${labels.error}: ${labels.unknownRoute} ${values.route}\n${labels.supportedRoutes}: ${START_ROUTE_IDS.join(", ")}`;
}

function summarizeStepOutput(output, language) {
  const text = String(output ?? "").trim();
  if (!text) {
    return automationLabels(language).none;
  }

  return text.split(/\r?\n/).find((line) => line.trim())?.trim() ?? automationLabels(language).none;
}

function startRouteDefinitions(language) {
  const labels = automationLabels(language);
  return [
    {
      id: "quickstart",
      title: labels.routeQuickstart,
      description: labels.routeQuickstartDescription,
      next: [
        "aigate test",
        "aigate aitest"
      ]
    },
    {
      id: "ai",
      title: labels.routeAi,
      description: labels.routeAiDescription,
      next: [
        "aigate integrate all --force",
        "aigate aitest --provider codex"
      ]
    },
    {
      id: "hook",
      title: labels.routeHook,
      description: labels.routeHookDescription,
      next: [
        "git push",
        "aigate git-ready"
      ]
    },
    {
      id: "release",
      title: labels.routeRelease,
      description: labels.routeReleaseDescription,
      next: [
        "aigate release-check --npm",
        "aigate branch-strategy --github --generate"
      ]
    },
    {
      id: "full",
      title: labels.routeFull,
      description: labels.routeFullDescription,
      next: [
        "aigate test",
        "aigate aitest --apply --provider codex",
        "aigate push -u origin <branch>"
      ]
    }
  ];
}

function buildAigateTestResult(options) {
  const startedAt = Date.now();
  const gitReady = buildGitReadyResult();
  const testCommand = resolveProjectTestCommand(options);
  const testRun = testCommand ? runProjectCommand(testCommand, options) : null;
  const status = gitReady.status === "BLOCK"
    ? "BLOCK"
    : !testCommand
      ? "WARN"
      : testRun.exitCode === 0
        ? "PASS"
        : "FAIL";

  return {
    command: "test",
    status,
    branch: gitReady.branch,
    durationMs: Date.now() - startedAt,
    gitReady,
    testCommand,
    testRun,
    next: buildTestNextSteps(status, testCommand)
  };
}

function resolveProjectTestCommand(options) {
  if (options.command) {
    return {
      source: "custom-command",
      display: String(options.command),
      executable: String(options.command),
      args: [],
      shell: true
    };
  }

  const packageJson = readJsonFile("package.json");
  const scripts = packageJson.scripts ?? {};
  const script = options.script
    ?? (scripts.ci ? "ci" : scripts["test:ci"] ? "test:ci" : scripts.test ? "test" : null);

  if (!script) {
    return null;
  }

  return {
    source: "npm-script",
    script,
    display: script === "test" ? "npm test" : `npm run ${script}`,
    executable: "npm",
    args: script === "test" ? ["test"] : ["run", script],
    shell: false
  };
}

function runProjectCommand(command, options) {
  const startedAt = Date.now();
  const result = spawnSync(command.executable, command.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    input: "",
    maxBuffer: 4 * 1024 * 1024,
    shell: Boolean(command.shell),
    timeout: Number(options.timeout ?? 120_000)
  });
  const exitCode = result.status ?? (result.error ? 1 : 0);

  return {
    command: command.display,
    exitCode,
    durationMs: Date.now() - startedAt,
    stdout: truncateOutput(result.stdout ?? ""),
    stderr: truncateOutput(result.stderr ?? result.error?.message ?? "")
  };
}

function buildTestNextSteps(status, testCommand) {
  if (status === "PASS") {
    return [
      "aigate git-ready",
      "aigate push -u origin <branch>"
    ];
  }

  if (status === "WARN") {
    return [
      "Add a package.json test, test:ci, or ci script.",
      "Run aigate test --command \"npm test\" when the command exists."
    ];
  }

  if (status === "BLOCK") {
    return [
      "Resolve AIGate git-ready blockers first.",
      "Run aigate aitest after blockers are fixed."
    ];
  }

  return [
    `Fix the failing command: ${testCommand?.display ?? "project test"}.`,
    "Run aigate aitest to generate an AI remediation prompt."
  ];
}

function renderTestReport(result, language) {
  const labels = automationLabels(language);
  const lines = [
    `${labels.testTitle}: ${automationStatus(result.status, language)}`,
    `${labels.branch}: ${result.branch}`,
    `${labels.gitGate}: ${automationStatus(result.gitReady.status, language)}`,
    `${labels.projectCommand}: ${result.testCommand?.display ?? labels.notDetected}`
  ];

  if (result.testRun) {
    lines.push(
      `${labels.exitCode}: ${result.testRun.exitCode}`,
      `${labels.duration}: ${result.testRun.durationMs}ms`
    );
  }

  if (result.output) {
    lines.push(`${labels.report}: ${result.output}`);
  }

  lines.push("", `${labels.next}:`, ...translateAutomationSteps(result.next, language).map((step) => `- ${step}`));

  if (result.testRun && result.testRun.exitCode !== 0) {
    lines.push("", `${labels.output}:`);
    if (result.testRun.stdout.trim()) {
      lines.push(`${labels.stdout}:`, result.testRun.stdout.trim());
    }
    if (result.testRun.stderr.trim()) {
      lines.push(`${labels.stderr}:`, result.testRun.stderr.trim());
    }
  }

  return lines.join("\n");
}

function resolveAiTestProvider(providerArg) {
  const requested = String(providerArg ?? "auto").trim().toLowerCase();
  if (requested === "auto") {
    const installed = AI_TEST_PROVIDERS.find((provider) => commandExists(provider));
    const name = installed ?? "codex";
    return {
      name,
      installed: Boolean(installed),
      auto: true
    };
  }

  if (!AI_TEST_PROVIDERS.includes(requested)) {
    return null;
  }

  return {
    name: requested,
    installed: commandExists(requested),
    auto: false
  };
}

function resolveAgentCommand(provider, options, prompt) {
  if (options.agentCommand) {
    return {
      display: String(options.agentCommand),
      executable: String(options.agentCommand),
      args: [],
      input: prompt,
      shell: true
    };
  }

  if (!provider.installed) {
    return null;
  }

  if (provider.name === "codex") {
    return {
      display: "codex exec --sandbox workspace-write --ask-for-approval never -",
      executable: "codex",
      args: ["exec", "--cd", process.cwd(), "--sandbox", "workspace-write", "--ask-for-approval", "never", "-"],
      input: prompt,
      shell: false
    };
  }

  if (provider.name === "claude") {
    return {
      display: "claude --print",
      executable: "claude",
      args: ["--print"],
      input: prompt,
      shell: false
    };
  }

  return {
    display: "gemini -p <prompt>",
    executable: "gemini",
    args: ["-p", prompt],
    input: "",
    shell: false
  };
}

function runAgentCommand(command, prompt) {
  const startedAt = Date.now();
  const result = spawnSync(command.executable, command.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    input: command.input ?? prompt,
    maxBuffer: 4 * 1024 * 1024,
    shell: Boolean(command.shell),
    timeout: 10 * 60 * 1000
  });
  const exitCode = result.status ?? (result.error ? 1 : 0);

  return {
    status: exitCode === 0 ? "DONE" : "FAILED",
    command: command.display,
    exitCode,
    durationMs: Date.now() - startedAt,
    stdout: truncateOutput(result.stdout ?? ""),
    stderr: truncateOutput(result.stderr ?? result.error?.message ?? "")
  };
}

function renderAiTestPrompt(testResult, provider, language) {
  const labels = automationLabels(language);
  const testRun = testResult.testRun;
  return [
    "# AIGate AI Test Remediation",
    "",
    `- Status: ${testResult.status}`,
    `- Branch: ${testResult.branch}`,
    `- Provider: ${provider.name}`,
    `- Git gate: ${testResult.gitReady.status}`,
    `- Project command: ${testResult.testCommand?.display ?? "not detected"}`,
    testRun ? `- Exit code: ${testRun.exitCode}` : null,
    "",
    "## Task",
    "",
    "Fix this repository so the AIGate test flow passes.",
    "Keep the change focused, preserve user changes, and do not rewrite unrelated files.",
    "After editing, run the failing command again and then run `aigate git-ready`.",
    "",
    "## AIGate Next Steps",
    "",
    ...translateAutomationSteps(testResult.next, language).map((step) => `- ${step}`),
    "",
    "## Git-Ready Summary",
    "",
    `- Status: ${testResult.gitReady.status}`,
    `- Changed files: ${testResult.gitReady.changedFiles}`,
    `- Secret findings: ${testResult.gitReady.secretFindings.length}`,
    `- Project score: ${testResult.gitReady.projectScore}/100`,
    "",
    testRun ? "## Test Stdout" : null,
    testRun ? "" : null,
    testRun ? "```text" : null,
    testRun ? testRun.stdout.trim() || labels.none : null,
    testRun ? "```" : null,
    testRun ? "" : null,
    testRun ? "## Test Stderr" : null,
    testRun ? "" : null,
    testRun ? "```text" : null,
    testRun ? testRun.stderr.trim() || labels.none : null,
    testRun ? "```" : null
  ].filter((line) => line !== null).join("\n");
}

function buildAiTestNextSteps(testResult, provider, promptPath, apply, language) {
  const labels = automationLabels(language);
  if (testResult.status === "PASS") {
    return translateAutomationSteps([
      "Tests already pass.",
      "Run aigate push -u origin <branch> when ready."
    ], language);
  }

  if (apply) {
    return translateAutomationSteps([
      "Review the AI agent output.",
      "Run aigate test again after the agent finishes."
    ], language);
  }

  const agentHint = provider.installed
    ? `aigate aitest --apply --provider ${provider.name}`
    : `${provider.name} CLI not detected; install it or pass --agent-command.`;

  return [
    translateAutomationStep("AI remediation prompt was written.", language),
    `${labels.prompt}: ${promptPath}`,
    agentHint
  ];
}

function renderAiTestResult(result, language) {
  const labels = automationLabels(language);
  const lines = [
    `${labels.aiTestTitle}: ${automationStatus(result.status, language)}`,
    `${labels.provider}: ${result.provider}${result.providerInstalled ? "" : ` (${labels.notDetected})`}`,
    `${labels.prompt}: ${result.promptPath}`,
    `${labels.testTitle}: ${automationStatus(result.test.status, language)}`,
    `${labels.projectCommand}: ${result.test.testCommand?.display ?? labels.notDetected}`
  ];

  if (result.agent) {
    lines.push(
      `${labels.agent}: ${automationStatus(result.agent.status, language)}`,
      `${labels.command}: ${result.agent.command ?? labels.notDetected}`,
      `${labels.exitCode}: ${result.agent.exitCode}`
    );
    if (result.agent.stderr.trim()) {
      lines.push(`${labels.stderr}:`, result.agent.stderr.trim());
    }
  }

  lines.push("", `${labels.next}:`, ...result.next.map((step) => `- ${step}`));
  return lines.join("\n");
}

function renderAiTestError(kind, language, values = {}) {
  const labels = automationLabels(language);
  if (kind === "unknown-provider") {
    return `${labels.error}: ${labels.unknownProvider} ${values.provider}\n${labels.supportedProviders}: auto, codex, claude, gemini`;
  }

  return `${labels.error}: ${kind}`;
}

function commandExists(command) {
  return spawnSync("sh", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
    stdio: ["ignore", "ignore", "ignore"],
    timeout: 5_000
  }).status === 0;
}

function truncateOutput(value, maxLength = 12_000) {
  const text = String(value ?? "");
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}\n...[truncated ${text.length - maxLength} chars]`;
}

function automationLabels(language) {
  return {
    en: {
      agent: "Agent",
      aiTestTitle: "AIGate aitest",
      branch: "Branch",
      command: "Command",
      duration: "Duration",
      error: "Error",
      exitCode: "Exit code",
      gitGate: "Git gate",
      mode: "Mode",
      next: "Next",
      none: "none",
      notDetected: "not detected",
      output: "Output",
      projectCommand: "Project command",
      prompt: "Prompt",
      provider: "Provider",
      report: "Report",
      route: "Route",
      routeAi: "AI agent setup",
      routeAiDescription: "Create Codex, Gemini, and Claude instruction files.",
      routeFull: "Full project guard",
      routeFullDescription: "Set config, AI files, pre-push guard, and release checks.",
      routeHook: "Pre-push guard",
      routeHookDescription: "Install the guarded git push path.",
      routeQuickstart: "Quick setup",
      routeQuickstartDescription: "Create config, run doctor, and show the demo.",
      routeRelease: "Release readiness",
      routeReleaseDescription: "Check package metadata and branch policy.",
      startPrompt: "Choose an AIGate start route",
      startPromptHint: "Use arrow keys and press Enter.",
      startStepBranch: "Recommend branch strategy",
      startStepDemo: "Show guided demo",
      startStepDoctor: "Run doctor",
      startStepHook: "Install pre-push hook",
      startStepInit: "Create AIGate config",
      startStepIntegrate: "Create AI integration files",
      startStepRelease: "Check release readiness",
      startTitle: "AIGate start",
      steps: "Steps",
      stderr: "stderr",
      stdout: "stdout",
      summary: "Summary",
      supportedProviders: "Supported providers",
      supportedRoutes: "Supported routes",
      testTitle: "AIGate test",
      unknownProvider: "Unknown AI provider:",
      unknownRoute: "Unknown start route:"
    },
    ko: {
      agent: "에이전트",
      aiTestTitle: "AIGate aitest",
      branch: "브랜치",
      command: "명령",
      duration: "소요 시간",
      error: "오류",
      exitCode: "종료 코드",
      gitGate: "Git 게이트",
      mode: "모드",
      next: "다음 단계",
      none: "없음",
      notDetected: "감지되지 않음",
      output: "출력",
      projectCommand: "프로젝트 명령",
      prompt: "프롬프트",
      provider: "제공자",
      report: "리포트",
      route: "루트",
      routeAi: "AI 에이전트 설정",
      routeAiDescription: "Codex, Gemini, Claude 지침 파일을 생성합니다.",
      routeFull: "전체 프로젝트 보호",
      routeFullDescription: "설정, AI 파일, pre-push 보호, 릴리스 검사를 구성합니다.",
      routeHook: "pre-push 보호",
      routeHookDescription: "보호된 git push 경로를 설치합니다.",
      routeQuickstart: "빠른 설정",
      routeQuickstartDescription: "설정을 만들고 doctor와 demo를 실행합니다.",
      routeRelease: "릴리스 준비",
      routeReleaseDescription: "패키지 메타데이터와 브랜치 정책을 점검합니다.",
      startPrompt: "AIGate 시작 루트를 선택하세요",
      startPromptHint: "화살표 키로 이동하고 Enter를 누르세요.",
      startStepBranch: "브랜치 전략 추천",
      startStepDemo: "안내형 데모 표시",
      startStepDoctor: "doctor 실행",
      startStepHook: "pre-push hook 설치",
      startStepInit: "AIGate 설정 생성",
      startStepIntegrate: "AI 연동 파일 생성",
      startStepRelease: "릴리스 준비 검사",
      startTitle: "AIGate start",
      steps: "단계",
      stderr: "stderr",
      stdout: "stdout",
      summary: "요약",
      supportedProviders: "지원 제공자",
      supportedRoutes: "지원 루트",
      testTitle: "AIGate test",
      unknownProvider: "알 수 없는 AI 제공자:",
      unknownRoute: "알 수 없는 시작 루트:"
    },
    ja: {
      agent: "エージェント",
      aiTestTitle: "AIGate aitest",
      branch: "ブランチ",
      command: "コマンド",
      duration: "所要時間",
      error: "エラー",
      exitCode: "終了コード",
      gitGate: "Git ゲート",
      mode: "モード",
      next: "次の手順",
      none: "なし",
      notDetected: "未検出",
      output: "出力",
      projectCommand: "プロジェクトコマンド",
      prompt: "プロンプト",
      provider: "Provider",
      report: "レポート",
      route: "ルート",
      routeAi: "AI エージェント設定",
      routeAiDescription: "Codex、Gemini、Claude の指示ファイルを作成します。",
      routeFull: "フルプロジェクトガード",
      routeFullDescription: "設定、AI ファイル、pre-push ガード、リリースチェックを構成します。",
      routeHook: "pre-push ガード",
      routeHookDescription: "保護された git push 経路をインストールします。",
      routeQuickstart: "クイック設定",
      routeQuickstartDescription: "設定を作成し、doctor と demo を実行します。",
      routeRelease: "リリース準備",
      routeReleaseDescription: "パッケージメタデータとブランチポリシーを確認します。",
      startPrompt: "AIGate 開始ルートを選択してください",
      startPromptHint: "矢印キーで移動し Enter を押してください。",
      startStepBranch: "ブランチ戦略を推薦",
      startStepDemo: "ガイド付きデモを表示",
      startStepDoctor: "doctor を実行",
      startStepHook: "pre-push hook をインストール",
      startStepInit: "AIGate 設定を作成",
      startStepIntegrate: "AI 連携ファイルを作成",
      startStepRelease: "リリース準備を確認",
      startTitle: "AIGate start",
      steps: "手順",
      stderr: "stderr",
      stdout: "stdout",
      summary: "要約",
      supportedProviders: "対応 provider",
      supportedRoutes: "対応ルート",
      testTitle: "AIGate test",
      unknownProvider: "不明な AI provider:",
      unknownRoute: "不明な開始ルート:"
    },
    zh: {
      agent: "Agent",
      aiTestTitle: "AIGate aitest",
      branch: "分支",
      command: "命令",
      duration: "耗时",
      error: "错误",
      exitCode: "退出码",
      gitGate: "Git 关卡",
      mode: "模式",
      next: "下一步",
      none: "无",
      notDetected: "未检测到",
      output: "输出",
      projectCommand: "项目命令",
      prompt: "提示",
      provider: "Provider",
      report: "报告",
      route: "路由",
      routeAi: "AI agent 设置",
      routeAiDescription: "创建 Codex、Gemini 和 Claude 指令文件。",
      routeFull: "完整项目守护",
      routeFullDescription: "配置设置、AI 文件、pre-push 守护和发布检查。",
      routeHook: "pre-push 守护",
      routeHookDescription: "安装受保护的 git push 路径。",
      routeQuickstart: "快速设置",
      routeQuickstartDescription: "创建配置，运行 doctor 并显示 demo。",
      routeRelease: "发布就绪",
      routeReleaseDescription: "检查包元数据和分支策略。",
      startPrompt: "选择 AIGate 启动路由",
      startPromptHint: "使用方向键移动并按 Enter。",
      startStepBranch: "推荐分支策略",
      startStepDemo: "显示引导 demo",
      startStepDoctor: "运行 doctor",
      startStepHook: "安装 pre-push hook",
      startStepInit: "创建 AIGate 配置",
      startStepIntegrate: "创建 AI 集成文件",
      startStepRelease: "检查发布就绪状态",
      startTitle: "AIGate start",
      steps: "步骤",
      stderr: "stderr",
      stdout: "stdout",
      summary: "摘要",
      supportedProviders: "支持的 provider",
      supportedRoutes: "支持的路由",
      testTitle: "AIGate test",
      unknownProvider: "未知 AI provider:",
      unknownRoute: "未知启动路由:"
    }
  }[language] ?? automationLabels("en");
}

function automationStatus(status, language) {
  const statuses = {
    en: {
      ACTION_REQUIRED: "ACTION_REQUIRED",
      AI_APPLIED: "AI_APPLIED",
      BLOCK: "BLOCK",
      DONE: "DONE",
      DRY_RUN: "DRY RUN",
      FAIL: "FAIL",
      FAILED: "FAILED",
      PASS: "PASS",
      PENDING: "PENDING",
      READY: "READY",
      SKIPPED: "SKIPPED",
      WARN: "WARN"
    },
    ko: {
      ACTION_REQUIRED: "조치 필요",
      AI_APPLIED: "AI 적용 완료",
      BLOCK: "차단",
      DONE: "완료",
      DRY_RUN: "미리보기",
      FAIL: "실패",
      FAILED: "실패",
      PASS: "통과",
      PENDING: "대기",
      READY: "준비 완료",
      SKIPPED: "건너뜀",
      WARN: "주의"
    },
    ja: {
      ACTION_REQUIRED: "対応が必要",
      AI_APPLIED: "AI 適用済み",
      BLOCK: "ブロック",
      DONE: "完了",
      DRY_RUN: "ドライラン",
      FAIL: "失敗",
      FAILED: "失敗",
      PASS: "通過",
      PENDING: "待機",
      READY: "準備完了",
      SKIPPED: "スキップ",
      WARN: "注意"
    },
    zh: {
      ACTION_REQUIRED: "需要处理",
      AI_APPLIED: "AI 已应用",
      BLOCK: "阻塞",
      DONE: "完成",
      DRY_RUN: "预演",
      FAIL: "失败",
      FAILED: "失败",
      PASS: "通过",
      PENDING: "待处理",
      READY: "就绪",
      SKIPPED: "已跳过",
      WARN: "警告"
    }
  };
  return statuses[language]?.[status] ?? statuses.en[status] ?? statusLabel(status, language);
}

function translateAutomationMode(mode, language) {
  const values = {
    en: { apply: "apply", "dry-run": "dry run" },
    ko: { apply: "적용", "dry-run": "미리보기" },
    ja: { apply: "適用", "dry-run": "ドライラン" },
    zh: { apply: "应用", "dry-run": "预演" }
  };
  return values[language]?.[mode] ?? values.en[mode] ?? mode;
}

function translateAutomationSteps(steps, language) {
  return steps.map((step) => translateAutomationStep(step, language));
}

function translateAutomationStep(step, language) {
  return {
    ko: {
      "AI remediation prompt was written.": "AI 수정 프롬프트를 작성했습니다.",
      "Add a package.json test, test:ci, or ci script.": "package.json에 test, test:ci 또는 ci script를 추가하세요.",
      "Resolve AIGate git-ready blockers first.": "먼저 AIGate git-ready 차단 사유를 해결하세요.",
      "Review the AI agent output.": "AI 에이전트 출력을 검토하세요.",
      "Run aigate aitest after blockers are fixed.": "차단 사유를 해결한 뒤 aigate aitest를 실행하세요.",
      "Run aigate aitest to generate an AI remediation prompt.": "AI 수정 프롬프트를 만들려면 aigate aitest를 실행하세요.",
      "Run aigate git-ready": "aigate git-ready를 실행하세요.",
      "Run aigate push -u origin <branch> when ready.": "준비되면 aigate push -u origin <branch>를 실행하세요.",
      "Run aigate test --command \"npm test\" when the command exists.": "명령이 준비되면 aigate test --command \"npm test\"를 실행하세요.",
      "Run aigate test again after the agent finishes.": "에이전트가 끝나면 aigate test를 다시 실행하세요.",
      "Tests already pass.": "테스트가 이미 통과했습니다.",
      "aigate git-ready": "aigate git-ready",
      "aigate push -u origin <branch>": "aigate push -u origin <branch>"
    },
    ja: {
      "AI remediation prompt was written.": "AI 修正プロンプトを書き込みました。",
      "Add a package.json test, test:ci, or ci script.": "package.json に test、test:ci、または ci script を追加してください。",
      "Resolve AIGate git-ready blockers first.": "先に AIGate git-ready の blocker を解消してください。",
      "Review the AI agent output.": "AI エージェントの出力を確認してください。",
      "Run aigate aitest after blockers are fixed.": "blocker 解消後に aigate aitest を実行してください。",
      "Run aigate aitest to generate an AI remediation prompt.": "AI 修正プロンプトを生成するには aigate aitest を実行してください。",
      "Run aigate git-ready": "aigate git-ready を実行してください。",
      "Run aigate push -u origin <branch> when ready.": "準備できたら aigate push -u origin <branch> を実行してください。",
      "Run aigate test --command \"npm test\" when the command exists.": "コマンドが用意できたら aigate test --command \"npm test\" を実行してください。",
      "Run aigate test again after the agent finishes.": "エージェント完了後に aigate test を再実行してください。",
      "Tests already pass.": "テストはすでに通過しています。",
      "aigate git-ready": "aigate git-ready",
      "aigate push -u origin <branch>": "aigate push -u origin <branch>"
    },
    zh: {
      "AI remediation prompt was written.": "已写入 AI 修复提示。",
      "Add a package.json test, test:ci, or ci script.": "在 package.json 中添加 test、test:ci 或 ci script。",
      "Resolve AIGate git-ready blockers first.": "先解决 AIGate git-ready blockers。",
      "Review the AI agent output.": "检查 AI agent 输出。",
      "Run aigate aitest after blockers are fixed.": "blockers 修复后运行 aigate aitest。",
      "Run aigate aitest to generate an AI remediation prompt.": "运行 aigate aitest 生成 AI 修复提示。",
      "Run aigate git-ready": "运行 aigate git-ready。",
      "Run aigate push -u origin <branch> when ready.": "准备好后运行 aigate push -u origin <branch>。",
      "Run aigate test --command \"npm test\" when the command exists.": "命令可用后运行 aigate test --command \"npm test\"。",
      "Run aigate test again after the agent finishes.": "agent 完成后再次运行 aigate test。",
      "Tests already pass.": "测试已经通过。",
      "aigate git-ready": "aigate git-ready",
      "aigate push -u origin <branch>": "aigate push -u origin <branch>"
    }
  }[language]?.[step] ?? step;
}

function translateAiTestText(key, language, values = {}) {
  const text = {
    en: {
      agentNotFound: "{provider} CLI was not detected. Install it or pass --agent-command."
    },
    ko: {
      agentNotFound: "{provider} CLI가 감지되지 않았습니다. 설치하거나 --agent-command를 지정하세요."
    },
    ja: {
      agentNotFound: "{provider} CLI が見つかりません。インストールするか --agent-command を指定してください。"
    },
    zh: {
      agentNotFound: "未检测到 {provider} CLI。请安装它或传入 --agent-command。"
    }
  }[language]?.[key] ?? {
    agentNotFound: "{provider} CLI was not detected. Install it or pass --agent-command."
  }[key] ?? key;

  return text.replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) => (
    Object.hasOwn(values, name) ? String(values[name]) : `{${name}}`
  ));
}

function buildGitReadyResult() {
  const status = buildGitStatus();
  const evaluation = buildEvaluation();
  const analysis = buildChangeAnalysis();
  const blockers = [];
  const warnings = [];

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
    warnings.push(`Project foundation score is ${evaluation.score}/100; recommended minimum is 80.`);
  }

  return {
    command: "git-ready",
    status: blockers.length ? "BLOCK" : "READY",
    branch: status.branch,
    changedFiles: analysis.paths.length,
    changedPaths: analysis.paths,
    projectScore: evaluation.score,
    secretFindings: analysis.secretFindings,
    blockers,
    warnings,
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
    result.warnings?.length ? t(language, "gitReady.warnings") : t(language, "gitReady.warningsNone"),
    ...(result.warnings ?? []).map((warning) => `- ${translateWarning(warning, language)}`),
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
  const output = renderReport(report, format, language);

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
    const output = renderProjectEvaluationReport(evaluation, format, language);

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
    const mark = statusLabel(check.pass ? "PASS" : "TODO", language);
    return `- ${mark}: ${translateEvaluationCheckName(check.name, language)}`;
  });
  const categoryRows = evaluation.categories.map((category) => (
    `- ${translateEvaluationCategory(category.name, language)}: ${category.score}/${category.weight}`
  ));
  const labels = evaluationLabels(language);
  const signalRows = evaluation.deepSignals
    ? [
        "",
        `${labels.deepSignals}:`,
        `- ${labels.commitsInspected}: ${evaluation.deepSignals.commitCount}`,
        `- ${labels.branchesDetected}: ${evaluation.deepSignals.branchCount}`,
        `- ${labels.tagsDetected}: ${evaluation.deepSignals.tagCount}`,
        `- ${labels.releaseWorkflows}: ${evaluation.deepSignals.releaseWorkflowCount}`
      ]
    : [];

  return [
    `${labels.textTitle}: ${evaluation.score}/100 (${evaluation.grade})`,
    "",
    `${labels.categories}:`,
    ...categoryRows,
    "",
    `${labels.checks}:`,
    ...rows,
    ...signalRows,
    "",
    `${labels.recommendation}: ${translateRecommendation(evaluation.recommendation, language)}`
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

  if (options.compare) {
    const comparison = buildBranchStrategyComparison(options, strategy);
    const output = options.format === "json"
      ? JSON.stringify({
          command: "branch-strategy",
          comparison
        }, null, 2)
      : renderBranchStrategyComparison(comparison, language);

    if (options.output) {
      mkdirSync(dirname(options.output), { recursive: true });
      writeFileSync(options.output, `${output}\n`, "utf8");
      return t(language, "common.wrote", { path: options.output });
    }

    return output;
  }

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

  const output = options.format === "json"
    ? JSON.stringify(strategy, null, 2)
    : [
    t(language, "branchStrategy.recommended", { strategy: translateStrategyName(strategy.name, language) }),
    t(language, "branchStrategy.reason", { reason: translateBranchReason(strategy, language) }),
    "",
    t(language, "branchStrategy.branches"),
    ...strategy.branches.map((branch) => `- ${branch.name}: ${translateBranchUse(branch.use, language)}`)
  ];

  if (Array.isArray(output) && options.github) {
    output.push("", t(language, "branchStrategy.githubProtection"), ...strategy.githubProtection.map((rule) => `- ${translateGithubProtection(rule, language)}`));
  }

  if (Array.isArray(output) && strategy.generatedOutputs.length) {
    output.push("", t(language, "branchStrategy.outputs"), ...strategy.generatedOutputs.map((file) => `- ${file}`));
  }

  const rendered = Array.isArray(output) ? output.join("\n") : output;

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${rendered}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return rendered;
}

function commandAuditReport(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const format = options.format ?? "markdown";
  const report = buildAuditReport();
  const output = renderAuditReport(report, format, language);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

function commandComplianceReport(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const format = options.format ?? "markdown";
  const report = buildComplianceReport();
  const output = renderComplianceReport(report, format, language);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

function commandDashboard(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }
  const outputPath = options.output ?? join(".aigate", "reports", "dashboard.html");
  const output = renderDashboard(buildComplianceReport(), language);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${output}\n`, "utf8");
  return t(language, "common.wrote", { path: outputPath });
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
      ...notificationPlanLines(language)
    ].join("\n");
  }

  if (subcommand === "test") {
    const lines = [
      t(language, "notify.test", { event }),
      t(language, "notify.target", { channel })
    ];
    const originalExitCode = process.exitCode;
    const result = sendNotification(event, channel, options, language);
    lines.push(result);
    if (channel === "terminal") {
      process.exitCode = originalExitCode;
      lines.push(t(language, "notify.ready"));
    }
    return lines.join("\n");
  }

  if (subcommand === "send") {
    return sendNotification(event, channel, options, language);
  }

  process.exitCode = 1;
  return t(language, "notify.usage");
}

function sendNotification(event, channel, options, language = "en") {
  const readiness = buildGitReadyResult();
  const payload = {
    event,
    channel,
    branch: git(["branch", "--show-current"]) || "unknown",
    status: readiness.status,
    statusLabel: statusLabel(readiness.status, language),
    changedFiles: readiness.changedFiles,
    projectScore: readiness.projectScore,
    secretFindings: readiness.secretFindings.length,
    blockers: readiness.blockers.map((blocker) => translateBlocker(blocker, language)),
    warnings: (readiness.warnings ?? []).map((warning) => translateWarning(warning, language)),
    recommendation: translateRecommendation(readiness.recommendation, language),
    generatedAt: new Date().toISOString()
  };

  if (channel === "terminal") {
    return [
      t(language, "notify.terminal", { event }),
      t(language, "check.branch", { branch: payload.branch }),
      t(language, "notify.status", { status: statusLabel(payload.status, language) })
    ].join("\n");
  }

  const requiredEnv = requiredNotificationEnv(channel, options);
  const missingEnv = requiredEnv.filter((item) => !item.value);

  if (options.dryRun) {
    const dryRunPayload = {
      event,
      channel,
      requiredEnv: requiredEnv.map((item) => item.name),
      missingEnv: missingEnv.map((item) => item.name),
      payload: buildNotificationPayload(payload, channel, language)
    };

    if (options.format === "json") {
      return JSON.stringify(dryRunPayload, null, 2);
    }

    return t(language, "notify.wouldSend", {
      event,
      channel,
      env: dryRunPayload.requiredEnv.join(", ")
    });
  }

  if (missingEnv.length > 0) {
    process.exitCode = 1;
    return [
      t(language, "notify.missingWebhook", { env: missingEnv.map((item) => item.name).join(", ") }),
      t(language, "notify.webhookHint", { env: missingEnv.map((item) => item.name).join(", ") })
    ].join("\n");
  }

  if (channel === "linear") {
    return sendLinearIssue(payload, options, language);
  }

  if (channel === "jira") {
    return sendJiraIssue(payload, options, language);
  }

  const webhookUrl = requiredEnv[0]?.value;
  const result = postJson(webhookUrl, buildNotificationPayload(payload, channel, language));

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return result.stderr.trim() || t(language, "notify.failed", { channel });
  }

  return t(language, "notify.sent", { event, channel });
}

function requiredNotificationEnv(channel, options = {}) {
  if (channel === "email") {
    return [
      envRequirement(options.webhookEnv ?? "AIGATE_EMAIL_WEBHOOK_URL", options.webhookUrl)
    ];
  }

  if (channel === "linear") {
    return [
      envRequirement("AIGATE_LINEAR_API_KEY", options.linearApiKey),
      envRequirement("AIGATE_LINEAR_TEAM_ID", options.linearTeamId ?? options.teamId)
    ];
  }

  if (channel === "jira") {
    return [
      envRequirement("AIGATE_JIRA_BASE_URL", options.jiraBaseUrl),
      envRequirement("AIGATE_JIRA_EMAIL", options.jiraEmail),
      envRequirement("AIGATE_JIRA_API_TOKEN", options.jiraApiToken),
      envRequirement("AIGATE_JIRA_PROJECT_KEY", options.jiraProjectKey ?? options.projectKey)
    ];
  }

  return [
    envRequirement(options.webhookEnv ?? defaultWebhookEnv(channel), options.webhookUrl)
  ];
}

function envRequirement(name, overrideValue) {
  return {
    name,
    value: overrideValue ?? process.env[name]
  };
}

function sendLinearIssue(payload, options = {}, language = "en") {
  const linearCredential = options.linearApiKey ?? process.env.AIGATE_LINEAR_API_KEY;
  const teamId = options.linearTeamId ?? options.teamId ?? process.env.AIGATE_LINEAR_TEAM_ID;
  const body = {
    query: "mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }",
    variables: {
      input: {
        teamId,
        title: notificationIssueTitle(payload, language),
        description: notificationIssueDescription(payload, language)
      }
    }
  };
  const result = postJson("https://api.linear.app/graphql", body, [
    ["Authorization", linearCredential]
  ]);

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return result.stderr.trim() || t(language, "notify.failed", { channel: "linear" });
  }

  return t(language, "notify.sent", { event: payload.event, channel: "linear" });
}

function sendJiraIssue(payload, options = {}, language = "en") {
  const baseUrl = String(options.jiraBaseUrl ?? process.env.AIGATE_JIRA_BASE_URL).replace(/\/$/, "");
  const email = options.jiraEmail ?? process.env.AIGATE_JIRA_EMAIL;
  const apiToken = options.jiraApiToken ?? process.env.AIGATE_JIRA_API_TOKEN;
  const projectKey = options.jiraProjectKey ?? options.projectKey ?? process.env.AIGATE_JIRA_PROJECT_KEY;
  const issueType = options.jiraIssueType ?? options.issueType ?? process.env.AIGATE_JIRA_ISSUE_TYPE ?? "Task";
  const body = {
    fields: {
      project: {
        key: projectKey
      },
      summary: notificationIssueTitle(payload, language),
      description: jiraDescriptionDocument(payload, language),
      issuetype: {
        name: issueType
      }
    }
  };
  const result = postJson(`${baseUrl}/rest/api/3/issue`, body, [
    ["Authorization", `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`]
  ]);

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return result.stderr.trim() || t(language, "notify.failed", { channel: "jira" });
  }

  return t(language, "notify.sent", { event: payload.event, channel: "jira" });
}

function postJson(url, body, headers = []) {
  return spawnSync("curl", [
    "-sS",
    "-X",
    "POST",
    "-H",
    "Content-Type: application/json",
    ...headers.flatMap(([name, value]) => ["-H", `${name}: ${value}`]),
    "--data",
    JSON.stringify(body),
    url
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function buildNotificationPayload(payload, channel, language = "en") {
  const text = notificationText(payload, language);

  if (channel === "email") {
    return {
      to: process.env.AIGATE_EMAIL_TO ?? "",
      subject: notificationIssueTitle(payload, language),
      text: notificationIssueDescription(payload, language),
      aigate: payload
    };
  }

  if (channel === "linear") {
    return {
      query: "mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }",
      variables: {
        input: {
          teamId: process.env.AIGATE_LINEAR_TEAM_ID ?? "<linear-team-id>",
          title: notificationIssueTitle(payload, language),
          description: notificationIssueDescription(payload, language)
        }
      },
      aigate: payload
    };
  }

  if (channel === "jira") {
    return {
      fields: {
        project: {
          key: process.env.AIGATE_JIRA_PROJECT_KEY ?? "<jira-project-key>"
        },
        summary: notificationIssueTitle(payload, language),
        description: jiraDescriptionDocument(payload, language),
        issuetype: {
          name: process.env.AIGATE_JIRA_ISSUE_TYPE ?? "Task"
        }
      },
      aigate: payload
    };
  }

  if (channel === "slack") {
    return {
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${text}*`
          }
        },
        {
          type: "section",
          fields: notificationFields(payload, language).map((field) => ({
            type: "mrkdwn",
            text: `*${field.label}*\n${field.value}`
          }))
        },
        ...(payload.blockers.length
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${notificationBlockerTitle(language)}*\n${payload.blockers.map((blocker) => `• ${blocker}`).join("\n")}`
                }
              }
            ]
          : [])
      ],
      aigate: payload
    };
  }

  if (channel === "discord") {
    return {
      content: text,
      embeds: [
        {
          title: text,
          color: payload.status === "BLOCK" ? 0xd73a49 : 0x2ea44f,
          fields: notificationFields(payload, language).map((field) => ({
            name: field.label,
            value: String(field.value),
            inline: true
          })),
          description: payload.blockers.length ? payload.blockers.map((blocker) => `- ${blocker}`).join("\n") : payload.recommendation
        }
      ],
      aigate: payload
    };
  }

  if (channel === "teams") {
    return {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: text,
      themeColor: payload.status === "BLOCK" ? "D73A49" : "2EA44F",
      title: text,
      sections: [
        {
          facts: notificationFields(payload, language).map((field) => ({
            name: field.label,
            value: String(field.value)
          })),
          text: payload.blockers.length ? payload.blockers.map((blocker) => `- ${blocker}`).join("\n") : payload.recommendation
        }
      ],
      aigate: payload
    };
  }

  return {
    text,
    ...payload
  };
}

function notificationIssueTitle(payload, language = "en") {
  const label = notificationText(payload, language);
  if (payload.status !== "BLOCK") {
    return label;
  }

  return {
    ko: `${label} 조치 필요`,
    ja: `${label} 対応が必要`,
    zh: `${label} 需要处理`
  }[language] ?? `${label} requires action`;
}

function notificationIssueDescription(payload, language = "en") {
  const labels = notificationFields(payload, language);
  const issueLabels = notificationIssueLabels(language);
  const blockers = payload.blockers.length
    ? payload.blockers.map((blocker) => `- ${blocker}`).join("\n")
    : `- ${issueLabels.none}`;
  const warnings = payload.warnings.length
    ? payload.warnings.map((warning) => `- ${warning}`).join("\n")
    : `- ${issueLabels.none}`;

  return [
    notificationText(payload, language),
    "",
    ...labels.map((field) => `- ${field.label}: ${field.value}`),
    "",
    `${issueLabels.blockers}:`,
    blockers,
    "",
    `${issueLabels.warnings}:`,
    warnings,
    "",
    `${issueLabels.recommendation}: ${payload.recommendation}`,
    `${issueLabels.generated}: ${payload.generatedAt}`
  ].join("\n");
}

function notificationIssueLabels(language = "en") {
  return {
    ko: {
      blockers: "차단 사유",
      warnings: "주의 사항",
      recommendation: "권장 사항",
      generated: "생성 시각",
      none: "없음"
    },
    ja: {
      blockers: "ブロック理由",
      warnings: "警告",
      recommendation: "推奨事項",
      generated: "生成時刻",
      none: "なし"
    },
    zh: {
      blockers: "阻止原因",
      warnings: "警告",
      recommendation: "建议",
      generated: "生成时间",
      none: "无"
    }
  }[language] ?? {
    blockers: "Blockers",
    warnings: "Warnings",
    recommendation: "Recommendation",
    generated: "Generated",
    none: "none"
  };
}

function jiraDescriptionDocument(payload, language = "en") {
  const description = notificationIssueDescription(payload, language);
  return {
    type: "doc",
    version: 1,
    content: description.split("\n").map((line) => ({
      type: "paragraph",
      content: line
        ? [
            {
              type: "text",
              text: line
            }
          ]
        : []
    }))
  };
}

function notificationText(payload, language = "en") {
  if (language === "ko") {
    return `AIGate ${payload.event}: ${payload.statusLabel} (${payload.branch})`;
  }

  if (language === "ja") {
    return `AIGate ${payload.event}: ${payload.statusLabel} (${payload.branch})`;
  }

  if (language === "zh") {
    return `AIGate ${payload.event}: ${payload.statusLabel} (${payload.branch})`;
  }

  return `AIGate ${payload.event}: ${payload.status} on ${payload.branch}`;
}

function notificationFields(payload, language = "en") {
  return [
    { label: notificationLabel(t(language, "gitReady.branch", { branch: "" })), value: payload.branch },
    { label: notificationLabel(t(language, "notify.status", { status: "" })), value: payload.statusLabel },
    { label: notificationLabel(t(language, "gitReady.changedFiles", { count: "" })), value: payload.changedFiles },
    { label: notificationLabel(t(language, "gitReady.secretFindings", { count: "" })), value: payload.secretFindings },
    { label: notificationLabel(t(language, "gitReady.projectScore", { score: "" })), value: `${payload.projectScore}/100` }
  ];
}

function notificationBlockerTitle(language = "en") {
  return t(language, "gitReady.blockers").replace(/:$/, "");
}

function notificationLabel(value) {
  return String(value).replace(/[:：].*$/, "").trim();
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
    const pathFinding = sensitivePathFinding(filePath);
    if (pathFinding) {
      findings.push(pathFinding);
    }

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

function sensitivePathFinding(filePath) {
  if (!isSensitiveAuthStatePath(filePath)) {
    return null;
  }

  return {
    ruleId: "sensitive-auth-state",
    label: "Sensitive authentication state file",
    file: filePath,
    line: 1,
    excerpt: "[redacted path-based finding]"
  };
}

function isSensitiveAuthStatePath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return /(^|\/)(playwright|\.playwright)\/\.auth\/.*\.json$/i.test(normalized) ||
    /(^|\/)\.auth\/.*\.json$/i.test(normalized) ||
    /(^|\/)(auth|cookies|session|storage-state|storageState)\.json$/i.test(normalized) ||
    /(^|\/).*storage[-_]?state.*\.json$/i.test(normalized);
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
  const changedPaths = insideGitRepository ? getChangedPaths() : [];
  const highRisk = [...changedFiles, ...changedPaths].some((line) => (
    /(\.env|secret|token|private[_-]?key)/i.test(line) || isSensitiveAuthStatePath(line)
  ));

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
    { category: "documentation", name: "Changelog exists", pass: existsSync("CHANGELOG.md") },
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
      "Do not require mandatory approvals by default; enable reviews per repository policy.",
      "Require the CI test job before merging.",
      "Require conversation resolution.",
      "Block force pushes and branch deletion."
    ],
    generatedOutputs: [
      ".aigate/generated-branch-strategy.md",
      ".aigate/branch-strategy-policy.json",
      ".aigate/policy-packs/README.md",
      ".aigate/policy-packs/branch-protection.json",
      ".aigate/policy-packs/pr-quality.json",
      ".aigate/policy-packs/release-channels.json",
      ".aigate/policy-packs/ai-collaboration.json",
      "docs/release-process.md",
      "docs/hotfix-process.md",
      ".github/pull_request_template.aigate.md",
      ".github/CODEOWNERS.aigate"
    ]
  };
}

function buildBranchStrategyComparison(options = {}, recommendedStrategy = buildBranchStrategy(options)) {
  const candidates = [
    "GitHub Flow with release channels",
    "Trunk-Based Development",
    "Hybrid Flow",
    "Git Flow"
  ];

  const proposals = candidates
    .map((strategyName) => buildBranchStrategyProposal(strategyName, recommendedStrategy))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));

  return {
    command: "branch-strategy compare",
    recommended: recommendedStrategy.name,
    signals: recommendedStrategy.signals,
    proposals
  };
}

function buildBranchStrategyProposal(strategyName, recommendedStrategy) {
  const signals = recommendedStrategy.signals;
  const teamSize = signals.teamSize ?? 0;
  const releaseCadence = signals.releaseCadence ?? "auto";
  let score = 50;

  if (strategyName === recommendedStrategy.name) {
    score += 15;
  }

  if (strategyName === "GitHub Flow with release channels") {
    if (!teamSize || teamSize <= 5) score += 10;
    if (["on-demand", "continuous", "daily", "auto"].includes(releaseCadence)) score += 8;
  }

  if (strategyName === "Trunk-Based Development") {
    if (signals.hasCi) score += 10;
    if (!teamSize || teamSize <= 10) score += 8;
    if (["continuous", "daily"].includes(releaseCadence)) score += 10;
    if (["monthly", "quarterly", "scheduled"].includes(releaseCadence)) score -= 12;
  }

  if (strategyName === "Hybrid Flow") {
    if (teamSize >= 6 && teamSize <= 15) score += 12;
    if (["weekly", "biweekly"].includes(releaseCadence)) score += 10;
    if (signals.hasCi) score += 4;
  }

  if (strategyName === "Git Flow") {
    if (teamSize >= 12) score += 12;
    if (["monthly", "quarterly", "scheduled"].includes(releaseCadence)) score += 10;
    if (signals.branchCount >= 6) score += 8;
  }

  return {
    name: strategyName,
    recommended: strategyName === recommendedStrategy.name,
    score: clampScore(score),
    branches: branchRulesForStrategy(strategyName),
    bestFor: strategyBestFor(strategyName),
    strengths: strategyStrengths(strategyName),
    risks: strategyRisks(strategyName),
    migration: strategyMigrationSteps(strategyName),
    policyFit: strategyPolicyFit(strategyName)
  };
}

function clampScore(score) {
  return Math.max(45, Math.min(95, score));
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

function strategyBestFor(strategyName) {
  return {
    "GitHub Flow with release channels": "small teams, public OSS projects, and on-demand releases",
    "Trunk-Based Development": "teams with strong CI, small pull requests, and very frequent releases",
    "Hybrid Flow": "growing teams that need fast feature work plus planned stabilization",
    "Git Flow": "larger teams, scheduled releases, and strict production governance"
  }[strategyName];
}

function strategyStrengths(strategyName) {
  return {
    "GitHub Flow with release channels": [
      "Simple branch model for public contributors.",
      "Release channels separate npm latest, next, beta, and canary.",
      "Works well for small teams and fast merges."
    ],
    "Trunk-Based Development": [
      "Keeps main close to production at all times.",
      "Fits strong CI and short-lived changes.",
      "Reduces long-running branch drift."
    ],
    "Hybrid Flow": [
      "Balances fast feature work with planned release stabilization.",
      "Gives larger changes an integration branch without requiring full Git Flow.",
      "Preserves release/* and hotfix/* escape hatches."
    ],
    "Git Flow": [
      "Clear separation between production, integration, release, and hotfix work.",
      "Fits scheduled releases and larger teams.",
      "Makes npm channel governance explicit."
    ]
  }[strategyName] ?? [];
}

function strategyRisks(strategyName) {
  return {
    "GitHub Flow with release channels": [
      "Can become noisy if large teams queue many changes at once.",
      "Needs disciplined release tagging because there is no develop branch."
    ],
    "Trunk-Based Development": [
      "Requires strong automated tests and small pull requests.",
      "Can feel too strict for teams that need long stabilization windows."
    ],
    "Hybrid Flow": [
      "Needs clear rules for when develop is used.",
      "May drift if integration branches stay open too long."
    ],
    "Git Flow": [
      "Adds process overhead for small or fast-moving teams.",
      "Long-lived develop branches can hide integration risk."
    ]
  }[strategyName] ?? [];
}

function strategyMigrationSteps(strategyName) {
  return {
    "GitHub Flow with release channels": [
      "Protect main and require AIGate checks before merge.",
      "Use feature/*, fix/*, docs/*, chore/*, and codex/* for focused work.",
      "Publish npm releases from main tags and use dist-tags for channels."
    ],
    "Trunk-Based Development": [
      "Keep pull requests small enough to merge quickly into main.",
      "Add short/* only for changes that will merge within a day.",
      "Use release/* only when a production hardening window is unavoidable."
    ],
    "Hybrid Flow": [
      "Keep main stable and use develop only for planned integration.",
      "Use feature/* and codex/* branches for focused work.",
      "Create release/* branches for stabilization and hotfix/* for urgent fixes."
    ],
    "Git Flow": [
      "Create develop as the next-release integration branch.",
      "Route feature/* and codex/* branches into develop.",
      "Cut release/* from develop, then merge release and hotfix work back to main."
    ]
  }[strategyName] ?? [];
}

function strategyPolicyFit(strategyName) {
  return {
    "GitHub Flow with release channels": "Use main branch protection, required AIGate checks, and tag-driven npm release channels.",
    "Trunk-Based Development": "Use strict main protection, fast required checks, and short-lived branch age limits.",
    "Hybrid Flow": "Use main protection, optional develop protection, release/* stabilization rules, and AI collaboration policy packs.",
    "Git Flow": "Use protected main/develop/release/*/hotfix/* rules with explicit release and hotfix ownership."
  }[strategyName];
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
    { name: "CHANGELOG documents package version", pass: changelogDocumentsVersion(version) },
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

  if (!checks.find((check) => check.name === "CHANGELOG documents package version")?.pass) {
    nextSteps.push(`Document ${version} in CHANGELOG.md before tagging the release.`);
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

function changelogDocumentsVersion(version) {
  if (!version || !existsSync("CHANGELOG.md")) {
    return false;
  }

  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const escapedVersion = escapeRegExp(version);
  return new RegExp(`^##\\s+v?${escapedVersion}(?:\\s|$)`, "m").test(changelog);
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

function buildComplianceReport() {
  const evaluation = buildEvaluation({ deep: true });
  const releaseCheck = buildReleaseCheck();
  const audit = buildAuditReport();
  const controls = [
    {
      id: "repository-foundation",
      title: "Repository foundation",
      pass: evaluation.score >= 80,
      evidence: `${evaluation.score}/100 (${evaluation.grade})`
    },
    {
      id: "release-readiness",
      title: "Release readiness",
      pass: ["READY", "RELEASED"].includes(releaseCheck.status),
      evidence: releaseCheck.status
    },
    {
      id: "security-policy",
      title: "Security policy and scanning",
      pass: evaluation.checks.some((check) => check.name === "Security policy exists" && check.pass) &&
        evaluation.checks.some((check) => check.name === "Security scanning is documented" && check.pass),
      evidence: "SECURITY.md, security scanning docs, and Scorecard workflow"
    },
    {
      id: "change-control",
      title: "Change control",
      pass: evaluation.checks.some((check) => check.name === "Pull request template exists" && check.pass) &&
        evaluation.checks.some((check) => check.name === "CODEOWNERS exists" && check.pass),
      evidence: "pull request template and CODEOWNERS"
    },
    {
      id: "operational-docs",
      title: "Operational documentation",
      pass: evaluation.deepSignals?.hasReleaseProcessDocs === true &&
        evaluation.deepSignals?.hasHotfixFlowDocs === true,
      evidence: "release and hotfix process docs"
    },
    {
      id: "audit-findings",
      title: "Audit findings",
      pass: audit.findings.length === 0,
      evidence: `${audit.findings.length} finding(s)`
    }
  ];

  return {
    command: "compliance-report",
    generatedAt: new Date().toISOString(),
    branch: git(["branch", "--show-current"]) || "unknown",
    status: controls.every((control) => control.pass) ? "PASS" : "ACTION_REQUIRED",
    projectScore: evaluation.score,
    projectGrade: evaluation.grade,
    releaseStatus: releaseCheck.status,
    controls,
    recommendations: controls
      .filter((control) => !control.pass)
      .map((control) => `Resolve control: ${control.title}`)
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
    changedFiles: analysis.paths.length,
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

  if (analysis.paths.includes(".aigate/settings.json")) {
    actions.push("Move local AIGate settings out of the commit or add them to .gitignore.");
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

function renderReport(report, format, language = "en") {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  if (format === "html") {
    return renderHtmlReport(report, language);
  }

  if (format === "sarif") {
    return JSON.stringify(renderSarifReport(report), null, 2);
  }

  return renderMarkdownReport(report, language);
}

function renderMarkdownReport(report, language = "en") {
  const labels = reportLabels(language);
  const reportType = translateReportType(report.type, language);
  const lines = [
    `# ${labels.title(reportType)}`,
    "",
    `- ${labels.status}: ${statusLabel(report.status, language)}`,
    `- ${labels.riskScore}: ${report.riskScore}/100`,
    `- ${labels.prReadinessScore}: ${report.prReadinessScore}/100`,
    `- ${labels.branch}: ${report.branch}`,
    `- ${labels.changedFiles}: ${report.changedFiles}`,
    `- ${labels.secretFindingsCount}: ${report.secretFindings.length}`,
    `- ${labels.projectScore}: ${report.projectScore}/100 (${report.projectGrade})`,
    `- ${labels.recommendation}: ${translateRecommendation(report.recommendation, language)}`,
    "",
    `## ${labels.changedPaths}`,
    "",
    ...(report.changedPaths.length ? report.changedPaths.map((path) => `- ${path}`) : [`- ${labels.none}`]),
    "",
    `## ${labels.secretFindings}`,
    "",
    ...(report.secretFindings.length
      ? report.secretFindings.map((finding) => formatFindingLine(finding, language))
      : [`- ${labels.none}`]),
    "",
    `## ${labels.recommendedActions}`,
    "",
    ...report.recommendedActions.map((action) => `- ${translateReportAction(action, language)}`)
  ];

  if (report.type === "weekly") {
    lines.push(
      "",
      `## ${labels.weeklyTeamSignals}`,
      "",
      `- ${labels.projectGrade}: ${report.projectGrade}`,
      `- ${labels.changedPathsInWorkspace}: ${report.changedPaths.length}`,
      `- ${labels.releaseStatus}: ${statusLabel(buildReleaseCheck().status, language)}`
    );
  }

  if (report.type === "risk") {
    lines.push(
      "",
      `## ${labels.riskSignals}`,
      "",
      `- ${labels.highRiskFileSignal}: ${report.riskScore >= 65 ? labels.yes : labels.no}`,
      `- ${labels.secretFindingsCount}: ${report.secretFindings.length}`,
      `- ${labels.suggestedVerdict}: ${statusLabel(report.finalVerdict, language)}`
    );
  }

  return lines.join("\n");
}

function renderHtmlReport(report, language = "en") {
  const labels = reportLabels(language);
  const reportType = translateReportType(report.type, language);
  return [
    "<!doctype html>",
    "<html>",
    "<head><meta charset=\"utf-8\"><title>AIGate report</title></head>",
    "<body>",
    `<h1>${escapeHtml(labels.title(reportType))}</h1>`,
    "<ul>",
    `<li>${escapeHtml(labels.status)}: ${escapeHtml(statusLabel(report.status, language))}</li>`,
    `<li>${escapeHtml(labels.riskScore)}: ${report.riskScore}/100</li>`,
    `<li>${escapeHtml(labels.prReadinessScore)}: ${report.prReadinessScore}/100</li>`,
    `<li>${escapeHtml(labels.branch)}: ${escapeHtml(report.branch)}</li>`,
    `<li>${escapeHtml(labels.changedFiles)}: ${report.changedFiles}</li>`,
    `<li>${escapeHtml(labels.secretFindingsCount)}: ${report.secretFindings.length}</li>`,
    `<li>${escapeHtml(labels.projectScore)}: ${report.projectScore}/100 (${escapeHtml(report.projectGrade)})</li>`,
    `<li>${escapeHtml(labels.recommendation)}: ${escapeHtml(translateRecommendation(report.recommendation, language))}</li>`,
    "</ul>",
    `<h2>${escapeHtml(labels.recommendedActions)}</h2>`,
    "<ul>",
    ...report.recommendedActions.map((action) => `<li>${escapeHtml(translateReportAction(action, language))}</li>`),
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

function renderProjectEvaluationReport(evaluation, format, language = "en") {
  if (format === "json") {
    return JSON.stringify(evaluation, null, 2);
  }

  const labels = evaluationLabels(language);

  if (format === "html") {
    return [
      "<!doctype html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${escapeHtml(labels.title)}</title></head>`,
      "<body>",
      `<h1>${escapeHtml(labels.title)}</h1>`,
      `<p>${escapeHtml(labels.score)}: ${evaluation.score}/100 (${escapeHtml(evaluation.grade)})</p>`,
      `<h2>${escapeHtml(labels.categories)}</h2>`,
      "<ul>",
      ...evaluation.categories.map((category) => (
        `<li>${escapeHtml(translateEvaluationCategory(category.name, language))}: ${category.score}/${category.weight}</li>`
      )),
      "</ul>",
      `<h2>${escapeHtml(labels.checks)}</h2>`,
      "<ul>",
      ...evaluation.checks.map((check) => (
        `<li>${escapeHtml(statusLabel(check.pass ? "PASS" : "TODO", language))}: ${escapeHtml(translateEvaluationCheckName(check.name, language))}</li>`
      )),
      "</ul>",
      `<p>${escapeHtml(labels.recommendation)}: ${escapeHtml(translateRecommendation(evaluation.recommendation, language))}</p>`,
      "</body>",
      "</html>"
    ].join("\n");
  }

  return [
    `# ${labels.title}`,
    "",
    `- ${labels.score}: ${evaluation.score}/100`,
    `- ${labels.grade}: ${evaluation.grade}`,
    `- ${labels.recommendation}: ${translateRecommendation(evaluation.recommendation, language)}`,
    "",
    `## ${labels.categories}`,
    "",
    ...evaluation.categories.map((category) => `- ${translateEvaluationCategory(category.name, language)}: ${category.score}/${category.weight}`),
    "",
    `## ${labels.checks}`,
    "",
    ...evaluation.checks.map((check) => `- ${statusLabel(check.pass ? "PASS" : "TODO", language)}: ${translateEvaluationCheckName(check.name, language)}`),
    ...(evaluation.deepSignals
      ? [
          "",
          `## ${labels.deepSignals}`,
          "",
          `- ${labels.commitsInspected}: ${evaluation.deepSignals.commitCount}`,
          `- ${labels.branchesDetected}: ${evaluation.deepSignals.branchCount}`,
          `- ${labels.tagsDetected}: ${evaluation.deepSignals.tagCount}`,
          `- ${labels.releaseWorkflows}: ${evaluation.deepSignals.releaseWorkflowCount}`,
          `- ${labels.releaseProcessDocs}: ${evaluation.deepSignals.hasReleaseProcessDocs ? labels.yes : labels.no}`,
          `- ${labels.hotfixProcessDocs}: ${evaluation.deepSignals.hasHotfixFlowDocs ? labels.yes : labels.no}`
        ]
      : [])
  ].join("\n");
}

function renderAuditReport(report, format, language = "en") {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const labels = auditLabels(language);

  if (format === "html") {
    return [
      "<!doctype html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${escapeHtml(labels.title)}</title></head>`,
      "<body>",
      `<h1>${escapeHtml(labels.title)}</h1>`,
      `<p>${escapeHtml(labels.status)}: ${escapeHtml(statusLabel(report.status, language))}</p>`,
      `<p>${escapeHtml(labels.projectScore)}: ${report.projectScore}/100 (${escapeHtml(report.projectGrade)})</p>`,
      `<p>${escapeHtml(labels.releaseStatus)}: ${escapeHtml(statusLabel(report.releaseStatus, language))}</p>`,
      `<h2>${escapeHtml(labels.findings)}</h2>`,
      "<ul>",
      ...(report.findings.length
        ? report.findings.map((finding) => `<li>${escapeHtml(translateAuditFinding(finding, language))}</li>`)
        : [`<li>${escapeHtml(labels.none)}</li>`]),
      "</ul>",
      "</body>",
      "</html>"
    ].join("\n");
  }

  return [
    `# ${labels.title}`,
    "",
    `- ${labels.status}: ${statusLabel(report.status, language)}`,
    `- ${labels.branch}: ${report.branch}`,
    `- ${labels.projectScore}: ${report.projectScore}/100 (${report.projectGrade})`,
    `- ${labels.releaseStatus}: ${statusLabel(report.releaseStatus, language)}`,
    "",
    `## ${labels.findings}`,
    "",
    ...(report.findings.length
      ? report.findings.map((finding) => `- ${translateAuditFinding(finding, language)}`)
      : [`- ${labels.none}`]),
    "",
    `## ${labels.recentCommits}`,
    "",
    ...(report.recentCommits.length ? report.recentCommits.map((commit) => `- ${commit}`) : [`- ${labels.none}`]),
    "",
    `## ${labels.recommendations}`,
    "",
    ...report.recommendations.map((recommendation) => `- ${translateAuditRecommendation(recommendation, language)}`)
  ].join("\n");
}

function renderComplianceReport(report, format, language = "en") {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const labels = complianceLabels(language);

  if (format === "html") {
    return [
      "<!doctype html>",
      "<html>",
      `<head><meta charset="utf-8"><title>${escapeHtml(labels.title)}</title></head>`,
      "<body>",
      `<h1>${escapeHtml(labels.title)}</h1>`,
      `<p>${escapeHtml(labels.status)}: ${escapeHtml(statusLabel(report.status, language))}</p>`,
      `<p>${escapeHtml(labels.projectScore)}: ${report.projectScore}/100 (${escapeHtml(report.projectGrade)})</p>`,
      `<p>${escapeHtml(labels.releaseStatus)}: ${escapeHtml(statusLabel(report.releaseStatus, language))}</p>`,
      `<h2>${escapeHtml(labels.controls)}</h2>`,
      "<ul>",
      ...report.controls.map((control) => `<li>${escapeHtml(statusLabel(control.pass ? "PASS" : "TODO", language))}: ${escapeHtml(translateComplianceControl(control.title, language))} - ${escapeHtml(translateComplianceEvidence(control, language))}</li>`),
      "</ul>",
      "</body>",
      "</html>"
    ].join("\n");
  }

  return [
    `# ${labels.title}`,
    "",
    `- ${labels.status}: ${statusLabel(report.status, language)}`,
    `- ${labels.branch}: ${report.branch}`,
    `- ${labels.projectScore}: ${report.projectScore}/100 (${report.projectGrade})`,
    `- ${labels.releaseStatus}: ${statusLabel(report.releaseStatus, language)}`,
    "",
    `## ${labels.controls}`,
    "",
    ...report.controls.map((control) => `- ${statusLabel(control.pass ? "PASS" : "TODO", language)}: ${translateComplianceControl(control.title, language)} - ${translateComplianceEvidence(control, language)}`),
    "",
    `## ${labels.recommendations}`,
    "",
    ...(report.recommendations.length
      ? report.recommendations.map((recommendation) => `- ${translateComplianceRecommendation(recommendation, language)}`)
      : [`- ${labels.none}`])
  ].join("\n");
}

function renderDashboard(report, language = "en") {
  const labels = complianceLabels(language);
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeHtml(labels.dashboardTitle)}</title>`,
    "<style>",
    "body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;padding:32px;background:#f6f8fa;color:#24292f}",
    "main{max-width:960px;margin:0 auto;background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:24px}",
    ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}",
    ".metric{border:1px solid #d0d7de;border-radius:8px;padding:14px;background:#f6f8fa}",
    ".pass{color:#1a7f37}.todo{color:#cf222e}",
    "li{margin:8px 0}",
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    `<h1>${escapeHtml(labels.dashboardTitle)}</h1>`,
    `<p>${escapeHtml(labels.generatedAt)}: ${escapeHtml(report.generatedAt)}</p>`,
    '<section class="grid">',
    `<div class="metric"><strong>${escapeHtml(labels.status)}</strong><br>${escapeHtml(statusLabel(report.status, language))}</div>`,
    `<div class="metric"><strong>${escapeHtml(labels.projectScore)}</strong><br>${report.projectScore}/100 (${escapeHtml(report.projectGrade)})</div>`,
    `<div class="metric"><strong>${escapeHtml(labels.releaseStatus)}</strong><br>${escapeHtml(statusLabel(report.releaseStatus, language))}</div>`,
    `<div class="metric"><strong>${escapeHtml(labels.branch)}</strong><br>${escapeHtml(report.branch)}</div>`,
    "</section>",
    `<h2>${escapeHtml(labels.controls)}</h2>`,
    "<ul>",
    ...report.controls.map((control) => `<li class="${control.pass ? "pass" : "todo"}">${escapeHtml(statusLabel(control.pass ? "PASS" : "TODO", language))}: ${escapeHtml(translateComplianceControl(control.title, language))} - ${escapeHtml(translateComplianceEvidence(control, language))}</li>`),
    "</ul>",
    "</main>",
    "</body>",
    "</html>"
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

function renderBranchStrategyComparison(comparison, language = "en") {
  const labels = branchStrategyComparisonLabels(language);
  const lines = [
    `# ${labels.title}`,
    "",
    `${labels.recommended}: ${translateStrategyName(comparison.recommended, language)}`,
    `${labels.signals}: ${renderStrategySignals(comparison.signals, language)}`
  ];

  for (const proposal of comparison.proposals) {
    lines.push(
      "",
      `## ${translateStrategyName(proposal.name, language)}${proposal.recommended ? ` (${labels.recommended})` : ""}`,
      "",
      `- ${labels.score}: ${proposal.score}/100`,
      `- ${labels.bestFor}: ${translateStrategyComparisonText(proposal.bestFor, language)}`,
      `- ${labels.policyFit}: ${translateStrategyComparisonText(proposal.policyFit, language)}`,
      "",
      `### ${labels.branches}`,
      "",
      ...proposal.branches.map((branch) => `- \`${branch.name}\`: ${translateBranchUse(branch.use, language)}`),
      "",
      `### ${labels.strengths}`,
      "",
      ...proposal.strengths.map((item) => `- ${translateStrategyComparisonText(item, language)}`),
      "",
      `### ${labels.risks}`,
      "",
      ...proposal.risks.map((item) => `- ${translateStrategyComparisonText(item, language)}`),
      "",
      `### ${labels.migration}`,
      "",
      ...proposal.migration.map((item) => `- ${translateStrategyComparisonText(item, language)}`)
    );
  }

  return lines.join("\n");
}

function branchStrategyComparisonLabels(language = "en") {
  return {
    en: {
      title: "Branch Strategy Proposals",
      recommended: "Recommended strategy",
      signals: "Signals",
      score: "Fit score",
      bestFor: "Best for",
      policyFit: "Policy fit",
      branches: "Branches",
      strengths: "Strengths",
      risks: "Risks",
      migration: "Migration steps",
      teamSize: "team size",
      releaseCadence: "release cadence",
      ci: "CI",
      branchCount: "branches",
      yes: "yes",
      no: "no"
    },
    ko: {
      title: "브랜치 전략 제안 비교",
      recommended: "권장 전략",
      signals: "판단 신호",
      score: "적합 점수",
      bestFor: "적합한 상황",
      policyFit: "정책 적용",
      branches: "브랜치",
      strengths: "강점",
      risks: "위험",
      migration: "전환 단계",
      teamSize: "팀 규모",
      releaseCadence: "릴리스 주기",
      ci: "CI",
      branchCount: "브랜치 수",
      yes: "예",
      no: "아니오"
    },
    ja: {
      title: "ブランチ戦略提案の比較",
      recommended: "推奨戦略",
      signals: "判断シグナル",
      score: "適合スコア",
      bestFor: "適した状況",
      policyFit: "ポリシー適合",
      branches: "ブランチ",
      strengths: "強み",
      risks: "リスク",
      migration: "移行手順",
      teamSize: "チームサイズ",
      releaseCadence: "リリース頻度",
      ci: "CI",
      branchCount: "ブランチ数",
      yes: "はい",
      no: "いいえ"
    },
    zh: {
      title: "分支策略提案比较",
      recommended: "推荐策略",
      signals: "判断信号",
      score: "适配分数",
      bestFor: "适用场景",
      policyFit: "政策适配",
      branches: "分支",
      strengths: "优势",
      risks: "风险",
      migration: "迁移步骤",
      teamSize: "团队规模",
      releaseCadence: "发布节奏",
      ci: "CI",
      branchCount: "分支数",
      yes: "是",
      no: "否"
    }
  }[language] ?? branchStrategyComparisonLabels("en");
}

function renderStrategySignals(signals, language = "en") {
  const labels = branchStrategyComparisonLabels(language);
  const autoValue = {
    en: "auto",
    ko: "자동",
    ja: "自動",
    zh: "自动"
  }[language] ?? "auto";
  return [
    `${labels.teamSize}: ${signals.teamSize ?? autoValue}`,
    `${labels.releaseCadence}: ${translateStrategySignalValue(signals.releaseCadence, language)}`,
    `${labels.ci}: ${signals.hasCi ? labels.yes : labels.no}`,
    `${labels.branchCount}: ${signals.branchCount}`
  ].join(", ");
}

function buildBranchStrategyFiles(strategy, outputDir, language = "en") {
  const policyPacks = buildBranchPolicyPacks(strategy);
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
        githubProtection: strategy.githubProtection,
        policyPacks: policyPacks.map((pack) => pack.path)
      }, null, 2)}\n`
    },
    {
      path: join(outputDir, ".aigate", "policy-packs", "README.md"),
      content: renderPolicyPackReadme(strategy, policyPacks, language)
    },
    ...policyPacks.map((pack) => ({
      path: join(outputDir, pack.path),
      content: `${JSON.stringify(pack.content, null, 2)}\n`
    })),
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

function buildBranchPolicyPacks(strategy) {
  return [
    {
      path: ".aigate/policy-packs/branch-protection.json",
      content: {
        version: 1,
        id: "branch-protection",
        strategy: strategy.name,
        appliesTo: ["main", "develop", "release/*", "hotfix/*"],
        requiredChecks: ["test (20)", "test (22)", "aigate git-ready"],
        rules: [
          {
            id: "pull-request-required",
            severity: "block",
            description: "Require a pull request before merging protected branches."
          },
          {
            id: "review-policy",
            severity: "warn",
            minimumApprovals: 0,
            description: "Reviews are encouraged, but mandatory approving reviews are not required by default."
          },
          {
            id: "conversation-resolution-required",
            severity: "block",
            description: "Require all review conversations to be resolved before merge."
          },
          {
            id: "force-push-blocked",
            severity: "block",
            description: "Block force pushes and protected branch deletion."
          }
        ]
      }
    },
    {
      path: ".aigate/policy-packs/pr-quality.json",
      content: {
        version: 1,
        id: "pr-quality",
        strategy: strategy.name,
        requiredSections: ["Summary", "Risk", "Validation", "Release Impact"],
        validationCommands: ["npm run ci", "aigate git-ready", "aigate pr-check"],
        riskLabels: ["low-risk", "security-sensitive", "release-impact", "migration"],
        rules: [
          {
            id: "focused-change",
            severity: "warn",
            description: "Keep pull requests focused on one behavior or documentation goal."
          },
          {
            id: "validation-evidence",
            severity: "block",
            description: "Include validation commands or explain why validation is not applicable."
          },
          {
            id: "release-impact-stated",
            severity: "warn",
            description: "State whether the change affects releases, package behavior, or migrations."
          }
        ]
      }
    },
    {
      path: ".aigate/policy-packs/release-channels.json",
      content: {
        version: 1,
        id: "release-channels",
        strategy: strategy.name,
        stableBranch: "main",
        tagPattern: "v*.*.*",
        npmDistTags: {
          latest: "stable releases",
          next: "release candidates",
          beta: "beta validation",
          canary: "high-frequency experimental builds"
        },
        requiredBeforeTag: ["npm run ci", "aigate release-check --npm", "Release workflow dry_run=true"],
        rules: [
          {
            id: "tag-after-ci",
            severity: "block",
            description: "Create release tags only after CI and release-check pass."
          },
          {
            id: "document-release",
            severity: "warn",
            description: "Keep CHANGELOG and GitHub Release notes aligned with the published package."
          }
        ]
      }
    },
    {
      path: ".aigate/policy-packs/ai-collaboration.json",
      content: {
        version: 1,
        id: "ai-collaboration",
        strategy: strategy.name,
        assistantBranches: ["codex/*", "feature/*", "fix/*", "docs/*", "chore/*"],
        requiredContext: ["README.md", ".aigate.yml", "docs/branch-strategy.md", "docs/git-upload-workflow.md"],
        guardCommands: ["aigate git-ready", "npm run ci"],
        rules: [
          {
            id: "no-unreviewed-main-changes",
            severity: "block",
            description: "AI-assisted changes must go through a branch and pull request before main."
          },
          {
            id: "preserve-user-work",
            severity: "block",
            description: "Do not revert unrelated user changes while preparing an AI-assisted branch."
          },
          {
            id: "document-validation",
            severity: "warn",
            description: "Summarize validation commands and release impact in the pull request body."
          }
        ]
      }
    }
  ];
}

function renderPolicyPackReadme(strategy, policyPacks, language = "en") {
  const files = policyPacks.map((pack) => `- \`${pack.path}\``);

  if (language === "ko") {
    return [
      "# AIGate 정책 팩",
      "",
      `권장 전략: ${translateStrategyName(strategy.name, language)}`,
      "",
      "이 디렉터리는 브랜치 보호, PR 품질, 릴리스 채널, AI 협업 규칙을 팀 정책으로 적용하기 위한 초안입니다.",
      "",
      "## 포함 파일",
      "",
      ...files,
      "",
      "## 사용 방법",
      "",
      "1. JSON 파일의 규칙을 팀 정책에 맞게 검토합니다.",
      "2. GitHub branch protection, PR template, release workflow 설정에 반영합니다.",
      "3. 변경 후 `npm run ci`와 `aigate git-ready`를 실행합니다.",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      "# AIGate ポリシーパック",
      "",
      `推奨戦略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "このディレクトリは、ブランチ保護、PR 品質、リリースチャンネル、AI 協業ルールをチームポリシーとして適用するための草案です。",
      "",
      "## 含まれるファイル",
      "",
      ...files,
      "",
      "## 使い方",
      "",
      "1. JSON ファイルのルールをチーム方針に合わせて確認します。",
      "2. GitHub branch protection、PR template、release workflow 設定へ反映します。",
      "3. 変更後に `npm run ci` と `aigate git-ready` を実行します。",
      ""
    ].join("\n");
  }

  if (language === "zh") {
    return [
      "# AIGate 政策包",
      "",
      `推荐策略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "此目录提供分支保护、PR 质量、发布渠道和 AI 协作规则的团队政策草案。",
      "",
      "## 包含文件",
      "",
      ...files,
      "",
      "## 使用方式",
      "",
      "1. 按团队政策审查 JSON 文件中的规则。",
      "2. 应用到 GitHub branch protection、PR template 和 release workflow 设置。",
      "3. 变更后运行 `npm run ci` 和 `aigate git-ready`。",
      ""
    ].join("\n");
  }

  return [
    "# AIGate Policy Packs",
    "",
    `Recommended strategy: ${strategy.name}`,
    "",
    "This directory contains draft team policies for branch protection, pull request quality, release channels, and AI collaboration.",
    "",
    "## Files",
    "",
    ...files,
    "",
    "## How To Use",
    "",
    "1. Review each JSON rule set against your team policy.",
    "2. Apply matching settings to GitHub branch protection, pull request templates, and release workflows.",
    "3. Run `npm run ci` and `aigate git-ready` after changes.",
    ""
  ].join("\n");
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
      "5. npm Trusted Publishing 설정 후 릴리스 워크플로로 npm 패키지를 배포합니다.",
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
      "4. 安定リリースは `vX.Y.Z` タグで示します。",
      "5. npm Trusted Publishing 設定後、リリースワークフローで npm パッケージを公開します。",
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
      "5. 配置 npm Trusted Publishing 后，通过发布工作流发布 npm 包。",
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
      "5. 검사와 리뷰 통과 후 패치 릴리스를 배포합니다.",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      "# Hotfix プロセス",
      "",
      `推奨戦略: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main` または最新の安定タグから `hotfix/<short-description>` ブランチを作成します。",
      "2. 変更は最小限かつ集中した範囲に保ちます。",
      "3. `npm run ci`、`aigate git-ready`、必要な回帰確認を実行します。",
      "4. ロールバックメモを含めて `main` 向け PR を作成します。",
      "5. チェックとレビュー通過後にパッチリリースを公開します。",
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
      "5. 检查和评审通过后发布补丁版本。",
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
      "- [ ] リリースまたは移行変更",
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
      "- [ ] 新しい設定または移行が必要",
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
      "aigate test",
      "aigate git-ready",
      "aigate aitest",
      "aigate push --dry-run origin <branch>"
    ],
    branchStrategy: "GitHub Flow with release channels",
    requiredChecks: [
      "test (20)",
      "test (22)"
    ]
  };
}

function buildIntegrationFiles(providers, outputDir, manifest, language = "en") {
  const files = [
    {
      path: join(outputDir, ".aigate", "integrations.json"),
      content: `${JSON.stringify(manifest, null, 2)}\n`
    },
    {
      path: join(outputDir, ".aigate", "integrations", "README.md"),
      content: renderIntegrationReadme(providers, language)
    }
  ];

  if (providers.includes("codex")) {
    files.push(
      {
        path: join(outputDir, "AGENTS.md"),
        content: renderCodexInstructions(language)
      },
      {
        path: join(outputDir, ".aigate", "integrations", "codex.md"),
        content: renderProviderInstructions("Codex", language)
      }
    );
  }

  if (providers.includes("gemini")) {
    files.push(
      {
        path: join(outputDir, "GEMINI.md"),
        content: renderGeminiInstructions(language)
      },
      {
        path: join(outputDir, ".aigate", "integrations", "gemini.md"),
        content: renderProviderInstructions("Gemini", language)
      }
    );
  }

  if (providers.includes("claude")) {
    files.push(
      {
        path: join(outputDir, "CLAUDE.md"),
        content: renderClaudeInstructions(language)
      },
      {
        path: join(outputDir, ".aigate", "integrations", "claude.md"),
        content: renderProviderInstructions("Claude Code", language)
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

function renderIntegrationReadme(providers, language = "en") {
  if (language === "ko") {
    return [
      "# AIGate AI 연동",
      "",
      "이 디렉터리는 AIGate가 생성한 AI 어시스턴트용 지침을 담습니다.",
      "",
      "활성 제공자:",
      "",
      ...providers.map((provider) => `- ${provider}`),
      "",
      "필수 로컬 검사:",
      "",
      "```sh",
      "npm run ci",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "테스트가 실패하면 `aigate aitest`로 AI 수정 프롬프트를 생성하세요.",
      "",
      "`aigate integrate all --force`로 이 파일들을 다시 생성할 수 있습니다."
    ].join("\n") + "\n";
  }

  if (language === "ja") {
    return [
      "# AIGate AI 連携",
      "",
      "このディレクトリには、AIGate が生成した AI アシスタント向け指示が含まれます。",
      "",
      "有効なプロバイダー:",
      "",
      ...providers.map((provider) => `- ${provider}`),
      "",
      "必須ローカルチェック:",
      "",
      "```sh",
      "npm run ci",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "テストが失敗したら `aigate aitest` で AI 修正プロンプトを生成してください。",
      "",
      "`aigate integrate all --force` でこれらのファイルを再生成できます。"
    ].join("\n") + "\n";
  }

  if (language === "zh") {
    return [
      "# AIGate AI 集成",
      "",
      "此目录包含 AIGate 生成的 AI 助手指令。",
      "",
      "已启用提供方:",
      "",
      ...providers.map((provider) => `- ${provider}`),
      "",
      "必需本地检查:",
      "",
      "```sh",
      "npm run ci",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "如果测试失败，请运行 `aigate aitest` 生成 AI 修复提示。",
      "",
      "使用 `aigate integrate all --force` 可重新生成这些文件。"
    ].join("\n") + "\n";
  }

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
    "aigate test",
    "aigate git-ready",
    "```",
    "",
    "If tests fail, run `aigate aitest` to generate an AI remediation prompt.",
    "",
    "Use `aigate integrate all --force` to regenerate these files."
  ].join("\n") + "\n";
}

function renderCodexInstructions(language = "en") {
  return [
    language === "ko" ? "# AIGate Codex 지침" : language === "ja" ? "# AIGate Codex 指示" : language === "zh" ? "# AIGate Codex 指令" : "# AIGate Codex Instructions",
    "",
    providerIntro("Codex", language),
    "",
    ...renderSharedAssistantInstructions(language)
  ].join("\n") + "\n";
}

function renderGeminiInstructions(language = "en") {
  return [
    language === "ko" ? "# AIGate Gemini 지침" : language === "ja" ? "# AIGate Gemini 指示" : language === "zh" ? "# AIGate Gemini 指令" : "# AIGate Gemini Instructions",
    "",
    providerIntro("Gemini", language),
    "",
    ...renderSharedAssistantInstructions(language)
  ].join("\n") + "\n";
}

function renderClaudeInstructions(language = "en") {
  return [
    language === "ko" ? "# AIGate Claude Code 지침" : language === "ja" ? "# AIGate Claude Code 指示" : language === "zh" ? "# AIGate Claude Code 指令" : "# AIGate Claude Code Instructions",
    "",
    providerIntro("Claude Code", language),
    "",
    ...renderSharedAssistantInstructions(language)
  ].join("\n") + "\n";
}

function renderProviderInstructions(providerName, language = "en") {
  return [
    language === "ko" ? `# ${providerName} 연동` : language === "ja" ? `# ${providerName} 連携` : language === "zh" ? `# ${providerName} 集成` : `# ${providerName} Integration`,
    "",
    providerGuideIntro(providerName, language),
    "",
    ...renderSharedAssistantInstructions(language)
  ].join("\n") + "\n";
}

function providerIntro(providerName, language) {
  return {
    ko: `${providerName}로 이 저장소를 작업할 때 이 지침을 사용하세요.`,
    ja: `${providerName} でこのリポジトリを扱うときは、この指示を使用してください。`,
    zh: `使用 ${providerName} 处理此仓库时，请遵循这些指令。`
  }[language] ?? `Use these instructions when working on this repository with ${providerName}.`;
}

function providerGuideIntro(providerName, language) {
  return {
    ko: `AIGate는 AI 어시스턴트가 관리자와 같은 Git 워크플로를 따르도록 이 ${providerName} 연동 가이드를 생성했습니다.`,
    ja: `AIGate は、AI アシスタントがメンテナーと同じ Git ワークフローに従えるよう、この ${providerName} 連携ガイドを生成しました。`,
    zh: `AIGate 生成此 ${providerName} 集成指南，让 AI 助手遵循与维护者相同的 Git 工作流。`
  }[language] ?? `AIGate generated this ${providerName} integration guide so the assistant can follow the same Git workflow as maintainers.`;
}

function renderSharedAssistantInstructions(language = "en") {
  if (language === "ko") {
    return [
      "## 저장소 컨텍스트",
      "",
      "- 제품: AIGate AI Git 워크플로 보호 CLI.",
      "- 기본 브랜치: `main`.",
      "- 변경은 작업 브랜치를 사용하고 `main`에 직접 푸시하지 않습니다.",
      "- Conventional Commit 메시지로 범위가 명확한 커밋을 선호합니다.",
      "",
      "## 편집 전",
      "",
      "- `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, `docs/git-upload-workflow.md`를 읽습니다.",
      "- `git status --short --branch`로 현재 브랜치를 확인합니다.",
      "- 명시 요청이 없으면 생성 리포트와 로컬 설정은 커밋하지 않습니다.",
      "",
      "## 검증",
      "",
      "제안, 푸시, 병합 전에 다음 명령을 실행합니다:",
      "",
      "```sh",
      "npm run ci",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "테스트가 실패하면 `aigate aitest`로 AI 수정 프롬프트를 생성하고, 명시적으로 허용된 경우에만 `aigate aitest --apply --provider <provider>`를 실행합니다.",
      "",
      "## 푸시 워크플로",
      "",
      "AIGate의 보호 푸시 래퍼를 사용합니다:",
      "",
      "```sh",
      "aigate push -u origin <branch>",
      "```",
      "",
      "원격 변경 없이 미리 보려면:",
      "",
      "```sh",
      "aigate push --dry-run origin <branch>",
      "```",
      "",
      "## PR 규칙",
      "",
      "- 대상은 `main`입니다.",
      "- 요약, 이유, 검증, 릴리스 영향을 포함합니다.",
      "- 필수 검사: `test (20)`, `test (22)`.",
      "- 저장소의 현재 review 정책을 따르고 대화를 해결한 뒤 병합합니다."
    ];
  }

  if (language === "ja") {
    return [
      "## リポジトリコンテキスト",
      "",
      "- 製品: AIGate AI Git ワークフロー保護 CLI.",
      "- デフォルトブランチ: `main`.",
      "- 変更には作業ブランチを使い、`main` へ直接プッシュしません。",
      "- Conventional Commit メッセージで範囲を絞ったコミットを推奨します。",
      "",
      "## 編集前",
      "",
      "- `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, `docs/git-upload-workflow.md` を読みます。",
      "- `git status --short --branch` で現在のブランチを確認します。",
      "- 明示されない限り、生成レポートとローカル設定はコミットしません。",
      "",
      "## 検証",
      "",
      "提案、プッシュ、マージ前に次のコマンドを実行します:",
      "",
      "```sh",
      "npm run ci",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "テストが失敗した場合は `aigate aitest` で AI 修正プロンプトを生成し、明示的に許可された場合のみ `aigate aitest --apply --provider <provider>` を実行します。",
      "",
      "## プッシュワークフロー",
      "",
      "AIGate の保護付きプッシュラッパーを使用します:",
      "",
      "```sh",
      "aigate push -u origin <branch>",
      "```",
      "",
      "リモートを変更せずにプレビューするには:",
      "",
      "```sh",
      "aigate push --dry-run origin <branch>",
      "```",
      "",
      "## PR ルール",
      "",
      "- 対象は `main` です。",
      "- 概要、理由、検証、リリース影響を含めます。",
      "- 必須チェック: `test (20)`, `test (22)`.",
      "- リポジトリの現在の review policy に従い、会話を解決してからマージします。"
    ];
  }

  if (language === "zh") {
    return [
      "## 仓库上下文",
      "",
      "- 产品: AIGate AI Git 工作流守护 CLI.",
      "- 默认分支: `main`.",
      "- 使用工作分支进行变更，不要直接推送到 `main`。",
      "- 优先使用 Conventional Commit，并保持提交范围清晰。",
      "",
      "## 编辑前",
      "",
      "- 阅读 `README.md`, `.aigate.yml`, `docs/branch-strategy.md`, `docs/git-upload-workflow.md`。",
      "- 使用 `git status --short --branch` 检查当前分支。",
      "- 除非明确要求，不要提交生成报告和本地设置。",
      "",
      "## 验证",
      "",
      "在提议、推送或合并前运行以下命令:",
      "",
      "```sh",
      "npm run ci",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "如果测试失败，请用 `aigate aitest` 生成 AI 修复提示；只有在明确允许时才运行 `aigate aitest --apply --provider <provider>`。",
      "",
      "## 推送工作流",
      "",
      "使用 AIGate 的受保护推送封装命令:",
      "",
      "```sh",
      "aigate push -u origin <branch>",
      "```",
      "",
      "不修改远端，仅预览:",
      "",
      "```sh",
      "aigate push --dry-run origin <branch>",
      "```",
      "",
      "## PR 规则",
      "",
      "- 目标分支是 `main`。",
      "- 包含摘要、原因、验证和发布影响。",
      "- 必需检查: `test (20)`, `test (22)`。",
      "- 遵循仓库当前 review policy，并在解决对话后再合并。"
    ];
  }

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
    "aigate test",
    "aigate git-ready",
    "```",
    "",
    "If tests fail, run `aigate aitest` to generate an AI remediation prompt; only run `aigate aitest --apply --provider <provider>` when explicitly allowed.",
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
    "- Follow the repository's current review policy and resolve conversations before merge."
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

function translateWarning(warning, language) {
  if (language === "en") {
    return warning;
  }

  const scoreMatch = warning.match(/^Project foundation score is (\d+)\/100; recommended minimum is 80\.$/);
  if (scoreMatch) {
    return {
      ko: `프로젝트 기반 점수는 ${scoreMatch[1]}/100이며 권장 기준은 80입니다.`,
      ja: `プロジェクト基盤スコアは ${scoreMatch[1]}/100 で、推奨基準は 80 です。`,
      zh: `项目基础分为 ${scoreMatch[1]}/100，建议最低为 80。`
    }[language] ?? warning;
  }

  return warning;
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
      ko: "로컬 변경사항에 민감 정보가 포함될 수 있는 파일명이 있습니다.",
      ja: "ローカル変更に機密情報を含む可能性があるファイル名があります。",
      zh: "本地变更中存在可能包含敏感信息的文件名。"
    }[language] ?? blocker;
  }

  const secretCountMatch = blocker.match(/^(\d+) possible secret finding\(s\) detected in changed files\.$/);
  if (secretCountMatch) {
    return {
      ko: `변경 파일에서 민감 정보 의심 항목 ${secretCountMatch[1]}개가 감지됐습니다.`,
      ja: `変更ファイルで機密情報の疑いがある項目を ${secretCountMatch[1]} 件検出しました。`,
      zh: `在变更文件中检测到 ${secretCountMatch[1]} 个疑似敏感信息。`
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

function reportLabels(language) {
  return REPORT_LABELS[language] ?? REPORT_LABELS.en;
}

function translateReportAction(action, language) {
  return REPORT_ACTION_TRANSLATIONS[language]?.[action] ?? action;
}

function translateFindingLabel(label, language) {
  return FINDING_LABEL_TRANSLATIONS[language]?.[label] ?? label;
}

function translateReportType(type, language) {
  return REPORT_TYPE_TRANSLATIONS[language]?.[type] ?? type;
}

function formatFindingLine(finding, language) {
  const label = translateFindingLabel(finding.label, language);
  if (language === "ko" || language === "ja" || language === "zh") {
    return `- ${label}: ${finding.file}:${finding.line}`;
  }

  return `- ${label} in ${finding.file}:${finding.line}`;
}

function evaluationLabels(language) {
  return EVALUATION_LABELS[language] ?? EVALUATION_LABELS.en;
}

function translateEvaluationCategory(category, language) {
  return EVALUATION_CATEGORY_TRANSLATIONS[language]?.[category] ?? category;
}

function translateEvaluationCheckName(name, language) {
  return EVALUATION_CHECK_TRANSLATIONS[language]?.[name] ?? name;
}

function auditLabels(language) {
  return AUDIT_LABELS[language] ?? AUDIT_LABELS.en;
}

function complianceLabels(language) {
  return COMPLIANCE_LABELS[language] ?? COMPLIANCE_LABELS.en;
}

function translateComplianceControl(title, language) {
  return COMPLIANCE_CONTROL_TRANSLATIONS[language]?.[title] ?? title;
}

function translateComplianceEvidence(control, language) {
  if (control.id === "release-readiness") {
    return statusLabel(control.evidence, language);
  }

  if (control.id === "security-policy") {
    return {
      ko: "SECURITY.md, 보안 스캔 문서, Scorecard 워크플로",
      ja: "SECURITY.md、セキュリティスキャン文書、Scorecard ワークフロー",
      zh: "SECURITY.md、安全扫描文档、Scorecard 工作流"
    }[language] ?? control.evidence;
  }

  if (control.id === "change-control") {
    return {
      ko: "PR 템플릿과 CODEOWNERS",
      ja: "PR テンプレートと CODEOWNERS",
      zh: "PR 模板和 CODEOWNERS"
    }[language] ?? control.evidence;
  }

  if (control.id === "operational-docs") {
    return {
      ko: "릴리스와 핫픽스 프로세스 문서",
      ja: "リリースとホットフィックスのプロセス文書",
      zh: "发布和热修复流程文档"
    }[language] ?? control.evidence;
  }

  if (control.id === "audit-findings") {
    const count = Number.parseInt(control.evidence, 10);
    if (!Number.isNaN(count)) {
      return {
        ko: `감사 발견 항목 ${count}개`,
        ja: `監査検出事項 ${count} 件`,
        zh: `审计发现 ${count} 项`
      }[language] ?? control.evidence;
    }
  }

  return control.evidence;
}

function translateComplianceRecommendation(recommendation, language) {
  const controlMatch = recommendation.match(/^Resolve control: (.+)$/);
  if (controlMatch) {
    const control = translateComplianceControl(controlMatch[1], language);
    return {
      ko: `통제 항목 해결: ${control}`,
      ja: `統制項目を解決: ${control}`,
      zh: `解决控制项: ${control}`
    }[language] ?? recommendation;
  }

  return recommendation;
}

function translateAuditRecommendation(recommendation, language) {
  return AUDIT_RECOMMENDATION_TRANSLATIONS[language]?.[recommendation] ?? recommendation;
}

function translateAuditFinding(finding, language) {
  const severity = translateSeverity(finding.severity, language);
  const area = translateAuditArea(finding.area, language);
  const message = translateFindingMessage(finding, language);
  return `${severity} ${area}: ${message}`;
}

function translateSeverity(severity, language) {
  if (language === "ko") {
    return { high: "높음", medium: "중간", low: "낮음" }[severity] ?? severity;
  }

  if (language === "ja") {
    return { high: "高", medium: "中", low: "低" }[severity] ?? severity;
  }

  if (language === "zh") {
    return { high: "高", medium: "中", low: "低" }[severity] ?? severity;
  }

  return severity;
}

function translateAuditArea(area, language) {
  if (area === "readiness") {
    return { ko: "준비 상태", ja: "準備状態", zh: "就绪状态" }[language] ?? area;
  }

  if (area === "release") {
    return { ko: "릴리스", ja: "リリース", zh: "发布" }[language] ?? area;
  }

  return translateEvaluationCategory(area, language);
}

function translateFindingMessage(finding, language) {
  if (finding.area === "readiness") {
    return translateBlocker(finding.message, language);
  }

  if (finding.area === "release") {
    return translateReleaseCheckName(finding.message, language);
  }

  return translateEvaluationCheckName(finding.message, language);
}

function notificationPlanLines(language) {
  if (language === "ko") {
    return [
      "- MVP: 터미널",
      "- V1: Slack",
      "- V1.5: Discord 및 Teams",
      "- V2: 이메일, Linear, Jira 알림 및 이슈 생성"
    ];
  }

  if (language === "ja") {
    return [
      "- MVP: ターミナル",
      "- V1: Slack",
      "- V1.5: Discord と Teams",
      "- V2: メール、Linear、Jira 通知と issue 作成"
    ];
  }

  if (language === "zh") {
    return [
      "- MVP: 终端",
      "- V1: Slack",
      "- V1.5: Discord 和 Teams",
      "- V2: 邮件、Linear、Jira 通知与 issue 创建"
    ];
  }

  return [
    "- MVP: terminal",
    "- V1: Slack",
    "- V1.5: Discord and Teams",
    "- V2: email, Linear, and Jira notification and issue creation"
  ];
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

function translateStrategySignalValue(value, language) {
  if (language === "en") {
    return value;
  }

  return {
    ko: {
      auto: "자동",
      daily: "매일",
      continuous: "상시",
      "on-demand": "필요 시",
      weekly: "매주",
      biweekly: "격주",
      monthly: "매월",
      quarterly: "분기별",
      scheduled: "정기"
    },
    ja: {
      auto: "自動",
      daily: "毎日",
      continuous: "継続的",
      "on-demand": "必要時",
      weekly: "毎週",
      biweekly: "隔週",
      monthly: "毎月",
      quarterly: "四半期ごと",
      scheduled: "定期"
    },
    zh: {
      auto: "自动",
      daily: "每日",
      continuous: "持续",
      "on-demand": "按需",
      weekly: "每周",
      biweekly: "每两周",
      monthly: "每月",
      quarterly: "每季度",
      scheduled: "定期"
    }
  }[language]?.[value] ?? value;
}

function translateStrategyComparisonText(value, language) {
  if (language === "en") {
    return value;
  }

  return STRATEGY_COMPARISON_TRANSLATIONS[language]?.[value] ?? value;
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
      ja: `${tagMatch[1]} タグが存在`,
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
      ja: `${match[1]}@${match[2]} はすでに npm にあります。リリース記録として ${match[3]} タグを作成してください。`,
      zh: `${match[1]}@${match[2]} 已在 npm 上。请创建 ${match[3]} 标签来记录发布。`
    }[language] ?? step;
  }

  match = step.match(/^(.+)@([^@ ]+) is not on npm yet; create release tag (v\S+) to publish with Trusted Publishing\.$/);
  if (match) {
    return {
      ko: `${match[1]}@${match[2]}는 아직 npm에 없습니다. Trusted Publishing으로 배포하려면 ${match[3]} 태그를 생성하세요.`,
      ja: `${match[1]}@${match[2]} はまだ npm にありません。Trusted Publishing で公開するには ${match[3]} タグを作成してください。`,
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
      ja: `npm Trusted Publishing 設定後に ${match[1]} リリースタグを作成してください。`,
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
      ko: `npm 레지스트리 조회 오류를 확인하세요: ${match[1]}`,
      ja: `npm レジストリ照会エラーを確認してください: ${match[1]}`,
      zh: `请检查 npm 注册表查询错误: ${match[1]}`
    }[language] ?? step;
  }

  match = step.match(/^Document (.+) in CHANGELOG\.md before tagging the release\.$/);
  if (match) {
    return {
      ko: `릴리스 태그 생성 전에 CHANGELOG.md에 ${match[1]} 항목을 작성하세요.`,
      ja: `リリースタグを作成する前に CHANGELOG.md に ${match[1]} の項目を記載してください。`,
      zh: `创建发布标签前，请在 CHANGELOG.md 中记录 ${match[1]}。`
    }[language] ?? step;
  }

  return {
    ko: {
      "Run release-check --npm to confirm npm registry publication state.": "npm 레지스트리 배포 상태를 확인하려면 release-check --npm을 실행하세요.",
      "Ensure release workflow publishes with npm provenance.": "릴리스 워크플로가 npm provenance로 배포하는지 확인하세요.",
      "Run npm run ci before tagging a release.": "릴리스 태그 생성 전에 npm run ci를 실행하세요.",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "릴리스 workflow_dispatch dry_run 입력으로 npm publish dry-run을 실행하세요."
    },
    ja: {
      "Run release-check --npm to confirm npm registry publication state.": "npm レジストリの公開状態を確認するには release-check --npm を実行してください。",
      "Ensure release workflow publishes with npm provenance.": "リリースワークフローが npm provenance 付きで公開することを確認してください。",
      "Run npm run ci before tagging a release.": "リリースタグを作成する前に npm run ci を実行してください。",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "リリース workflow_dispatch の dry_run 入力で npm publish dry-run を実行してください。"
    },
    zh: {
      "Run release-check --npm to confirm npm registry publication state.": "运行 release-check --npm 确认 npm 注册表发布状态。",
      "Ensure release workflow publishes with npm provenance.": "确保发布工作流使用 npm provenance 发布。",
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
      arg.startsWith("--notify-channel=") ||
      arg.startsWith("--webhook-env=") ||
      arg.startsWith("--webhook-url=") ||
      arg.startsWith("--issue-type=") ||
      arg.startsWith("--jira-api-token=") ||
      arg.startsWith("--jira-base-url=") ||
      arg.startsWith("--jira-email=") ||
      arg.startsWith("--jira-issue-type=") ||
      arg.startsWith("--linear-team-id=") ||
      arg.startsWith("--linear-api-key=") ||
      arg.startsWith("--jira-project-key=") ||
      arg.startsWith("--project-key=") ||
      arg.startsWith("--team-id=")
    ) {
      continue;
    }

    if (
      arg === "--language" ||
      arg === "--notify-channel" ||
      arg === "--webhook-env" ||
      arg === "--webhook-url" ||
      arg === "--issue-type" ||
      arg === "--jira-api-token" ||
      arg === "--jira-base-url" ||
      arg === "--jira-email" ||
      arg === "--jira-issue-type" ||
      arg === "--linear-team-id" ||
      arg === "--linear-api-key" ||
      arg === "--jira-project-key" ||
      arg === "--project-key" ||
      arg === "--team-id"
    ) {
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
    "--history",
    "--issue-type",
    "--jira-api-token",
    "--jira-base-url",
    "--jira-email",
    "--jira-issue-type",
    "--jira-project-key",
    "--language",
    "--linear-api-key",
    "--linear-team-id",
    "--name",
    "--notify-channel",
    "--output",
    "--output-dir",
    "--owner",
    "--pr",
    "--release",
    "--route",
    "--provider",
    "--script",
    "--command",
    "--agent-command",
    "--team-size",
    "--details-url",
    "--timeout",
    "--title",
    "--type",
    "--project-key",
    "--team-id",
    "--webhook-env",
    "--webhook-url"
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

main(process.argv.slice(2)).catch((error) => {
  printError(error?.message ?? String(error));
  process.exitCode = 1;
});

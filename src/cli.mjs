#!/usr/bin/env node
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { commandDemo, commandDoctor, commandInstallHook } from "./commands/first-run.mjs";
import { commandGithub } from "./commands/github-reporting.mjs";
import { commandTrends } from "./commands/trends.mjs";

const CLI_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(CLI_DIR);
const VERSION = readPackageVersion();
const CONFIG_SCHEMA_VERSION = 1;
const SUPPORTED_LANGUAGES = ["en", "ko", "ja", "zh"];
const SUPPORTED_INTEGRATIONS = ["codex", "gemini", "claude"];
const START_ROUTE_IDS = ["default", "quickstart", "oss", "ai", "hook", "release", "full"];
const AI_TEST_PROVIDERS = ["codex", "claude", "gemini"];
const AI_ROOT_FILE_MODES = ["protect", "sidecar", "overwrite"];
const DEFAULT_WORK_BRANCHES = ["codex/*", "feature/*", "feat/*", "fix/*", "docs/*", "chore/*"];
const AIGATE_HOOK_MARKER = "AIGate pre-push hook";
const DEFAULT_SETTINGS = {
  version: 1,
  language: "en",
  projectType: "auto",
  hosting: "auto",
  ciProvider: "auto",
  packageManager: "auto",
  distribution: "auto",
  defaultBranch: "main",
  targetBranch: "main",
  branchStrategy: "auto",
  protectedBranches: [],
  workBranches: [...DEFAULT_WORK_BRANCHES],
  requiredChecks: [],
  qualityCommands: [],
  aiProviders: [],
  aiRootFiles: "protect",
  serverEnforcement: {
    gitlab: {
      onlyAllowMergeIfPipelineSucceeds: "auto"
    },
    github: {
      requiredChecksEnforced: "auto"
    }
  }
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
    "action.deleted": "deleted",
    "action.missing": "missing",
    "action.protected": "protected",
    "action.skipped": "skipped",
    "action.updated": "updated",
    "action.would-create": "would create",
    "action.would-delete": "would delete",
    "action.would-update": "would update",
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
    "check.sensitiveRemovals": "Sensitive removals: {count}",
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
    "gitReady.sensitiveRemovals": "Sensitive removals: {count}",
    "gitReady.status": "AIGate git-ready: {status}",
    "gitReady.warnings": "Warnings:",
    "gitReady.warningsNone": "Warnings: none",
    "init.complete": "AIGate init complete",
    "maintenance.cleanTitle": "AIGate clean",
    "maintenance.forceHint": "Re-run with --force to delete files.",
    "maintenance.mode": "Mode: {mode}",
    "maintenance.next": "Next: {next}",
    "maintenance.outputDir": "Output directory: {path}",
    "maintenance.resetTitle": "AIGate reset",
    "maintenance.status": "{title}: {status}",
    "maintenance.targets": "Targets:",
    "maintenance.uninstallTitle": "AIGate uninstall",
    "integrate.complete": "AIGate AI integration files",
    "integrate.next": "Next: review the generated instruction files and run the listed validation commands.",
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
    "release.registryNotApplicable": "npm registry: not applicable ({reason})",
    "release.registryNotPublished": "npm registry: {packageName}@{version} not published",
    "release.registryPublished": "npm registry: published {packageName}@{version}",
    "release.registryFailed": "npm registry: lookup failed ({error})",
    "release.status": "AIGate release-check: {status}",
    "release.version": "Version: {version}",
    "settings.complete": "AIGate setup complete",
    "settings.file": "Settings file: {path}",
    "settings.profile": "Project profile: type={type}, hosting={hosting}, ci={ciProvider}, package manager={packageManager}",
    "settings.title": "AIGate settings",
    "settings.workflow": "Workflow: distribution={distribution}, target={targetBranch}, work branches={workBranches}, checks={requiredChecks}, commands={qualityCommands}, AI={aiProviders}, root AI files={aiRootFiles}",
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
    "action.deleted": "삭제",
    "action.missing": "없음",
    "action.protected": "보호됨",
    "action.skipped": "건너뜀",
    "action.updated": "갱신",
    "action.would-create": "생성 예정",
    "action.would-delete": "삭제 예정",
    "action.would-update": "갱신 예정",
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
    "check.sensitiveRemovals": "민감 파일 제거: {count}",
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
    "gitReady.sensitiveRemovals": "민감 파일 제거: {count}",
    "gitReady.status": "AIGate 준비 검사: {status}",
    "gitReady.warnings": "주의 사항:",
    "gitReady.warningsNone": "주의 사항: 없음",
    "init.complete": "AIGate 초기화 완료",
    "maintenance.cleanTitle": "AIGate clean",
    "maintenance.forceHint": "파일을 삭제하려면 --force로 다시 실행하세요.",
    "maintenance.mode": "모드: {mode}",
    "maintenance.next": "다음 단계: {next}",
    "maintenance.outputDir": "출력 디렉터리: {path}",
    "maintenance.resetTitle": "AIGate reset",
    "maintenance.status": "{title}: {status}",
    "maintenance.targets": "대상:",
    "maintenance.uninstallTitle": "AIGate uninstall",
    "integrate.complete": "AIGate AI 연동 파일 생성",
    "integrate.next": "다음 단계: 생성된 지침 파일을 검토하고 적힌 검증 명령을 실행하세요.",
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
    "release.registryNotApplicable": "npm 레지스트리: 해당 없음 ({reason})",
    "release.registryNotPublished": "npm 레지스트리: {packageName}@{version} 미배포",
    "release.registryPublished": "npm 레지스트리: {packageName}@{version} 배포됨",
    "release.registryFailed": "npm 레지스트리: 조회 실패 ({error})",
    "release.status": "AIGate 릴리스 검사: {status}",
    "release.version": "버전: {version}",
    "settings.complete": "AIGate 설정 완료",
    "settings.file": "설정 파일: {path}",
    "settings.profile": "프로젝트 프로필: 유형={type}, 호스팅={hosting}, CI={ciProvider}, 패키지 매니저={packageManager}",
    "settings.title": "AIGate 설정",
    "settings.workflow": "워크플로: 배포={distribution}, 대상={targetBranch}, 작업 브랜치={workBranches}, 체크={requiredChecks}, 명령={qualityCommands}, AI={aiProviders}, 루트 AI 파일={aiRootFiles}",
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
    "action.deleted": "削除",
    "action.missing": "なし",
    "action.protected": "保護",
    "action.skipped": "スキップ",
    "action.updated": "更新",
    "action.would-create": "作成予定",
    "action.would-delete": "削除予定",
    "action.would-update": "更新予定",
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
    "check.sensitiveRemovals": "機密ファイル削除: {count}",
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
    "gitReady.sensitiveRemovals": "機密ファイル削除: {count}",
    "gitReady.status": "AIGate 準備チェック: {status}",
    "gitReady.warnings": "警告:",
    "gitReady.warningsNone": "警告: なし",
    "init.complete": "AIGate 初期化完了",
    "maintenance.cleanTitle": "AIGate clean",
    "maintenance.forceHint": "ファイルを削除するには --force で再実行してください。",
    "maintenance.mode": "モード: {mode}",
    "maintenance.next": "次の手順: {next}",
    "maintenance.outputDir": "出力ディレクトリ: {path}",
    "maintenance.resetTitle": "AIGate reset",
    "maintenance.status": "{title}: {status}",
    "maintenance.targets": "対象:",
    "maintenance.uninstallTitle": "AIGate uninstall",
    "integrate.complete": "AIGate AI 連携ファイル",
    "integrate.next": "次の手順: 生成された指示ファイルを確認し、記載された検証コマンドを実行してください。",
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
    "release.registryNotApplicable": "npm レジストリ: 対象外 ({reason})",
    "release.registryNotPublished": "npm レジストリ: {packageName}@{version} は未公開",
    "release.registryPublished": "npm レジストリ: {packageName}@{version} は公開済み",
    "release.registryFailed": "npm レジストリ: 照会失敗 ({error})",
    "release.status": "AIGate リリースチェック: {status}",
    "release.version": "バージョン: {version}",
    "settings.complete": "AIGate 設定完了",
    "settings.file": "設定ファイル: {path}",
    "settings.profile": "プロジェクトプロファイル: 種別={type}, hosting={hosting}, CI={ciProvider}, package manager={packageManager}",
    "settings.title": "AIGate 設定",
    "settings.workflow": "ワークフロー: distribution={distribution}, target={targetBranch}, 作業ブランチ={workBranches}, checks={requiredChecks}, commands={qualityCommands}, AI={aiProviders}, ルートAIファイル={aiRootFiles}",
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
    "action.deleted": "已删除",
    "action.missing": "不存在",
    "action.protected": "受保护",
    "action.skipped": "已跳过",
    "action.updated": "已更新",
    "action.would-create": "将创建",
    "action.would-delete": "将删除",
    "action.would-update": "将更新",
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
    "check.sensitiveRemovals": "敏感文件移除: {count}",
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
    "gitReady.sensitiveRemovals": "敏感文件移除: {count}",
    "gitReady.status": "AIGate 就绪检查: {status}",
    "gitReady.warnings": "警告:",
    "gitReady.warningsNone": "警告: 无",
    "init.complete": "AIGate 初始化完成",
    "maintenance.cleanTitle": "AIGate clean",
    "maintenance.forceHint": "要删除文件，请使用 --force 重新运行。",
    "maintenance.mode": "模式: {mode}",
    "maintenance.next": "下一步: {next}",
    "maintenance.outputDir": "输出目录: {path}",
    "maintenance.resetTitle": "AIGate reset",
    "maintenance.status": "{title}: {status}",
    "maintenance.targets": "目标:",
    "maintenance.uninstallTitle": "AIGate uninstall",
    "integrate.complete": "AIGate AI 集成文件",
    "integrate.next": "下一步: 检查生成的说明文件并运行其中列出的验证命令。",
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
    "release.registryNotApplicable": "npm 注册表: 不适用 ({reason})",
    "release.registryNotPublished": "npm 注册表: {packageName}@{version} 尚未发布",
    "release.registryPublished": "npm 注册表: {packageName}@{version} 已发布",
    "release.registryFailed": "npm 注册表: 查询失败 ({error})",
    "release.status": "AIGate 发布检查: {status}",
    "release.version": "版本: {version}",
    "settings.complete": "AIGate 设置完成",
    "settings.file": "设置文件: {path}",
    "settings.profile": "项目配置: 类型={type}, 托管={hosting}, CI={ciProvider}, 包管理器={packageManager}",
    "settings.title": "AIGate 设置",
    "settings.workflow": "工作流: distribution={distribution}, target={targetBranch}, 工作分支={workBranches}, 检查={requiredChecks}, 命令={qualityCommands}, AI={aiProviders}, 根 AI 文件={aiRootFiles}",
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
    NA: "N/A",
    PASS: "PASS",
    READY: "READY",
    RELEASED: "RELEASED",
    TODO: "TODO",
    WARN: "WARN"
  },
  ko: {
    ACTION_REQUIRED: "조치 필요",
    BLOCK: "차단",
    NA: "해당 없음",
    PASS: "통과",
    READY: "준비 완료",
    RELEASED: "배포 완료",
    TODO: "할 일",
    WARN: "주의"
  },
  ja: {
    ACTION_REQUIRED: "対応が必要",
    BLOCK: "ブロック",
    NA: "対象外",
    PASS: "通過",
    READY: "準備完了",
    RELEASED: "公開済み",
    TODO: "未対応",
    WARN: "注意"
  },
  zh: {
    ACTION_REQUIRED: "需要处理",
    BLOCK: "阻塞",
    NA: "不适用",
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
    "Commit sensitive file removals and rotate exposed credentials if they were already in history.": "민감 파일 제거를 커밋하고, 이미 이력에 노출된 자격 증명은 회전하세요.",
    "Commit sensitive file removals and rotate credentials that were exposed in Git history.": "민감 파일 제거를 커밋하고, Git 이력에 노출된 자격 증명은 회전하세요.",
    "Commit sensitive file removals; no Git history exposure was detected.": "민감 파일 제거를 커밋하세요. Git 이력 노출은 감지되지 않았습니다.",
    "Complete missing foundations that match this private app profile.": "이 private 앱 프로필에 맞는 부족한 기반 항목을 보완하세요.",
    "Run AIGate test, commit focused changes, push the branch, and open a pull request.": "AIGate test를 실행하고, 범위가 명확한 커밋을 만든 뒤 브랜치를 푸시하고 PR을 여세요.",
    "Open a focused branch and pull request after tests pass.": "테스트 통과 후 범위가 명확한 브랜치와 PR을 여세요.",
    "Resolve blockers before committing, pushing, or opening a pull request.": "커밋, 푸시, PR 생성 전에 차단 사유를 해결하세요.",
    "Repository foundations are ready for the next MVP slice.": "저장소 기반이 다음 MVP 단계를 진행할 준비가 됐습니다.",
    "Complete the missing repository foundations before public release.": "공개 릴리스 전에 부족한 저장소 기반 항목을 보완하세요."
  },
  ja: {
    "No local changes detected.": "ローカル変更はありません。",
    "Run AIGate inside a Git repository.": "AIGate は Git リポジトリ内で実行してください。",
    "Review possible secret-bearing files before commit or push.": "コミットまたはプッシュ前に機密情報を含む可能性があるファイルを確認してください。",
    "Commit sensitive file removals and rotate exposed credentials if they were already in history.": "機密ファイル削除をコミットし、すでに履歴に露出した認証情報はローテーションしてください。",
    "Commit sensitive file removals and rotate credentials that were exposed in Git history.": "機密ファイル削除をコミットし、Git 履歴に露出した認証情報はローテーションしてください。",
    "Commit sensitive file removals; no Git history exposure was detected.": "機密ファイル削除をコミットしてください。Git 履歴への露出は検出されていません。",
    "Complete missing foundations that match this private app profile.": "この private app profile に合う不足基盤項目を補完してください。",
    "Run AIGate test, commit focused changes, push the branch, and open a pull request.": "AIGate test を実行し、焦点を絞ったコミットを作成してブランチを push し、PR を開いてください。",
    "Open a focused branch and pull request after tests pass.": "テスト通過後、範囲を絞ったブランチと PR を作成してください。",
    "Resolve blockers before committing, pushing, or opening a pull request.": "コミット、プッシュ、PR 作成の前にブロッカーを解消してください。",
    "Repository foundations are ready for the next MVP slice.": "リポジトリ基盤は次の MVP スライスに進める状態です。",
    "Complete the missing repository foundations before public release.": "公開リリース前に不足しているリポジトリ基盤を整備してください。"
  },
  zh: {
    "No local changes detected.": "未检测到本地变更。",
    "Run AIGate inside a Git repository.": "请在 Git 仓库内运行 AIGate。",
    "Review possible secret-bearing files before commit or push.": "提交或推送前，请检查可能包含敏感信息的文件。",
    "Commit sensitive file removals and rotate exposed credentials if they were already in history.": "提交敏感文件移除；如果凭据已进入历史记录，请轮换它们。",
    "Commit sensitive file removals and rotate credentials that were exposed in Git history.": "提交敏感文件移除，并轮换已暴露在 Git 历史中的凭据。",
    "Commit sensitive file removals; no Git history exposure was detected.": "提交敏感文件移除；未检测到 Git 历史暴露。",
    "Complete missing foundations that match this private app profile.": "补齐符合此 private app 配置的缺失基础项。",
    "Run AIGate test, commit focused changes, push the branch, and open a pull request.": "运行 AIGate test，提交聚焦变更，推送分支并打开 PR。",
    "Open a focused branch and pull request after tests pass.": "测试通过后，创建范围清晰的分支和 PR。",
    "Resolve blockers before committing, pushing, or opening a pull request.": "提交、推送或创建 PR 前，请先解决阻塞原因。",
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
    "merge request target branch": "merge request 대상 브랜치",
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
    "merge request target branch": "merge request 対象ブランチ",
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
    "merge request target branch": "merge request 目标分支",
    "release stabilization": "发布稳定"
  }
};

const BRANCH_REASON_TRANSLATIONS = {
  ko: {
    "AIGate needs fast public contribution flow": "AIGate에는 빠른 공개 기여 흐름이 필요합니다",
    "repository needs a clear contribution flow": "저장소에는 명확한 기여 흐름이 필요합니다",
    "private app workflow benefits from focused merge requests": "private 앱 워크플로에는 범위가 명확한 merge request가 효과적입니다",
    "package releases may need channel control for stable and prerelease versions": "패키지 릴리스에는 stable 및 prerelease 버전 채널 제어가 필요할 수 있습니다",
    "npm channel control for latest, next, beta, and canary releases": "latest, next, beta, canary 릴리스를 위한 npm 채널 제어가 필요합니다",
    "CI-backed pull request protection is already present": "CI 기반 PR 보호가 이미 준비되어 있습니다",
    "CI-backed merge protection is already present": "CI 기반 merge 보호가 이미 준비되어 있습니다",
    "release documentation and package metadata exist": "릴리스 문서와 패키지 메타데이터가 존재합니다"
  },
  ja: {
    "AIGate needs fast public contribution flow": "AIGate には高速な公開コントリビューションフローが必要です",
    "repository needs a clear contribution flow": "リポジトリには明確な貢献フローが必要です",
    "private app workflow benefits from focused merge requests": "private app ワークフローには焦点を絞った merge request が有効です",
    "package releases may need channel control for stable and prerelease versions": "パッケージリリースには stable と prerelease のチャンネル制御が必要になる場合があります",
    "npm channel control for latest, next, beta, and canary releases": "latest、next、beta、canary リリース向けの npm チャンネル制御が必要です",
    "CI-backed pull request protection is already present": "CI による PR 保護がすでにあります",
    "CI-backed merge protection is already present": "CI による merge 保護がすでにあります",
    "release documentation and package metadata exist": "リリース文書とパッケージメタデータがあります"
  },
  zh: {
    "AIGate needs fast public contribution flow": "AIGate 需要快速的公开贡献流程",
    "repository needs a clear contribution flow": "仓库需要清晰的贡献流程",
    "private app workflow benefits from focused merge requests": "private app 工作流适合使用范围聚焦的 merge request",
    "package releases may need channel control for stable and prerelease versions": "包发布可能需要为 stable 和 prerelease 版本控制频道",
    "npm channel control for latest, next, beta, and canary releases": "需要为 latest、next、beta、canary 发布控制 npm 频道",
    "CI-backed pull request protection is already present": "已经具备基于 CI 的 PR 保护",
    "CI-backed merge protection is already present": "已经具备基于 CI 的 merge 保护",
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
    "Use feature/*, feat/*, fix/*, docs/*, chore/*, and codex/* for focused work.": "집중된 작업에는 feature/*, feat/*, fix/*, docs/*, chore/*, codex/*를 사용합니다.",
    "Publish npm releases from main tags and use dist-tags for channels.": "main 태그에서 npm 릴리스를 배포하고 채널에는 dist-tag를 사용합니다.",
    "Keep pull requests small enough to merge quickly into main.": "PR을 main에 빠르게 병합할 수 있을 만큼 작게 유지합니다.",
    "Add short/* only for changes that will merge within a day.": "하루 안에 병합될 변경에만 short/*를 사용합니다.",
    "Use release/* only when a production hardening window is unavoidable.": "프로덕션 안정화 기간이 불가피할 때만 release/*를 사용합니다.",
    "Keep main stable and use develop only for planned integration.": "main은 안정적으로 유지하고 develop은 계획된 통합에만 사용합니다.",
    "Use feature/*, feat/*, and codex/* branches for focused work.": "집중된 작업에는 feature/*, feat/*, codex/* 브랜치를 사용합니다.",
    "Create release/* branches for stabilization and hotfix/* for urgent fixes.": "안정화에는 release/*, 긴급 수정에는 hotfix/* 브랜치를 만듭니다.",
    "Create develop as the next-release integration branch.": "develop을 다음 릴리스 통합 브랜치로 만듭니다.",
    "Route feature/*, feat/*, and codex/* branches into develop.": "feature/*, feat/*, codex/* 브랜치는 develop으로 병합합니다.",
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
    "Use feature/*, feat/*, fix/*, docs/*, chore/*, and codex/* for focused work.": "集中した作業には feature/*、feat/*、fix/*、docs/*、chore/*、codex/* を使います。",
    "Publish npm releases from main tags and use dist-tags for channels.": "main のタグから npm リリースを公開し、チャンネルには dist-tag を使います。",
    "Keep pull requests small enough to merge quickly into main.": "PR は main へ素早くマージできる大きさに保ちます。",
    "Add short/* only for changes that will merge within a day.": "1 日以内にマージする変更にだけ short/* を使います。",
    "Use release/* only when a production hardening window is unavoidable.": "本番安定化期間が避けられない場合だけ release/* を使います。",
    "Keep main stable and use develop only for planned integration.": "main は安定させ、develop は計画的な統合にだけ使います。",
    "Use feature/*, feat/*, and codex/* branches for focused work.": "集中した作業には feature/*、feat/*、codex/* ブランチを使います。",
    "Create release/* branches for stabilization and hotfix/* for urgent fixes.": "安定化には release/*、緊急修正には hotfix/* ブランチを作成します。",
    "Create develop as the next-release integration branch.": "develop を次回リリースの統合ブランチとして作成します。",
    "Route feature/*, feat/*, and codex/* branches into develop.": "feature/*、feat/*、codex/* ブランチは develop に統合します。",
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
    "Use feature/*, feat/*, fix/*, docs/*, chore/*, and codex/* for focused work.": "聚焦工作使用 feature/*、feat/*、fix/*、docs/*、chore/* 和 codex/*。",
    "Publish npm releases from main tags and use dist-tags for channels.": "从 main 标签发布 npm，并使用 dist-tag 管理频道。",
    "Keep pull requests small enough to merge quickly into main.": "保持 PR 足够小，以便快速合并到 main。",
    "Add short/* only for changes that will merge within a day.": "仅对一天内会合并的变更使用 short/*。",
    "Use release/* only when a production hardening window is unavoidable.": "只有无法避免生产加固窗口时才使用 release/*。",
    "Keep main stable and use develop only for planned integration.": "保持 main 稳定，仅将 develop 用于计划内集成。",
    "Use feature/*, feat/*, and codex/* branches for focused work.": "聚焦工作使用 feature/*、feat/* 和 codex/* 分支。",
    "Create release/* branches for stabilization and hotfix/* for urgent fixes.": "稳定期创建 release/*，紧急修复创建 hotfix/*。",
    "Create develop as the next-release integration branch.": "将 develop 创建为下一版本集成分支。",
    "Route feature/*, feat/*, and codex/* branches into develop.": "将 feature/*、feat/* 和 codex/* 分支合入 develop。",
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
    sensitiveRemovals: "Sensitive Removals",
    sensitiveRemovalsCount: "Sensitive removals",
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
    sensitiveRemovals: "민감 파일 제거",
    sensitiveRemovalsCount: "민감 파일 제거",
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
    sensitiveRemovals: "機密ファイル削除",
    sensitiveRemovalsCount: "機密ファイル削除",
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
    sensitiveRemovals: "敏感文件移除",
    sensitiveRemovalsCount: "敏感文件移除",
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
    "Commit sensitive file removals and rotate exposed credentials if they were already in history.": "민감 파일 제거를 커밋하고, 이미 이력에 노출된 자격 증명은 회전하세요.",
    "Split large changes into smaller pull requests.": "큰 변경은 더 작은 PR로 나누세요.",
    "Complete missing repository foundation checks.": "부족한 저장소 기반 점검 항목을 보완하세요.",
    "Include validation commands and release impact in the pull request body.": "PR 본문에 검증 명령과 릴리스 영향을 포함하세요.",
    "Run tests, keep the change focused, and open a pull request.": "테스트를 실행하고 변경 범위를 집중시킨 뒤 PR을 여세요.",
    "Move local AIGate settings out of the commit or add them to .gitignore.": "로컬 AIGate 설정은 커밋에서 빼거나 .gitignore에 추가하세요."
  },
  ja: {
    "Remove or rotate suspected secrets before commit or push.": "コミットまたはプッシュ前に疑わしい機密情報を削除またはローテーションしてください。",
    "Commit sensitive file removals and rotate exposed credentials if they were already in history.": "機密ファイル削除をコミットし、すでに履歴に露出した認証情報はローテーションしてください。",
    "Split large changes into smaller pull requests.": "大きな変更は小さな PR に分割してください。",
    "Complete missing repository foundation checks.": "不足しているリポジトリ基盤チェックを整備してください。",
    "Include validation commands and release impact in the pull request body.": "PR 本文に検証コマンドとリリース影響を含めてください。",
    "Run tests, keep the change focused, and open a pull request.": "テストを実行し、変更範囲を絞って PR を作成してください。",
    "Move local AIGate settings out of the commit or add them to .gitignore.": "ローカル AIGate 設定はコミットから外すか .gitignore に追加してください。"
  },
  zh: {
    "Remove or rotate suspected secrets before commit or push.": "提交或推送前，请移除或轮换疑似敏感信息。",
    "Commit sensitive file removals and rotate exposed credentials if they were already in history.": "提交敏感文件移除；如果凭据已进入历史记录，请轮换它们。",
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
      ["reset", "Reset AIGate config, settings, and report folders."],
      ["clean", "Delete generated AIGate reports and local state."],
      ["uninstall", "Remove AIGate config, state, and owned hooks."],
      ["delete", "Alias for `aigate clean`."],
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
      ["ai report", "Explain current problems, strengths, direction, and AI handoff steps."],
      ["ai-report", "Alias for `aigate ai report`."],
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
      ["--route <name>", "Start route: default, quickstart, oss, ai, hook, release, or full."],
      ["--ask-steps", "Ask whether to run each start step."],
      ["--steps <ids>", "Run only selected start step ids, comma-separated."],
      ["--project-type <auto|app|package>", "Override auto-detected project type for evaluation and release checks."],
      ["--hosting <auto|github|gitlab|other>", "Override repository hosting provider."],
      ["--ci-provider <auto|github|gitlab|other>", "Override CI provider used by repository checks."],
      ["--package-manager <auto|npm|pnpm|yarn|bun>", "Override package manager detection."],
      ["--distribution <auto|none|npm>", "Set release distribution mode for generated config."],
      ["--target-branch <branch>", "Set the PR/MR target branch for generated AI instructions."],
      ["--protected-branches <list>", "Set protected branches, comma-separated."],
      ["--work-branches <list>", "Set allowed work branch patterns, comma-separated."],
      ["--required-checks <list>", "Set required CI/check names, comma-separated."],
      ["--quality-command <shell>", "Set the primary local quality command."],
      ["--gitlab-pipeline-must-succeed <true|false|verified>", "Record declared or verified GitLab required-pipeline evidence."],
      ["--github-required-checks-enforced <true|false|verified>", "Record declared or verified GitHub required-check evidence."],
      ["--providers <list>", "Set default AI integration providers, comma-separated."],
      ["--ai-root-files <protect|sidecar|overwrite>", "Set how integrate handles root AGENTS/GEMINI/CLAUDE files."],
      ["--branch-strategy <name>", "Pin branch strategy: github-flow, gitlab-flow, trunk, hybrid, or git-flow."],
      ["--provider <name>", "AI provider: auto, codex, claude, gemini, or all."],
      ["--script <name>", "npm script name for aigate test or aitest."],
      ["--command <shell>", "Custom shell command for aigate test or aitest."],
      ["--agent-command <shell>", "Custom AI agent command for aitest or ai report --apply."],
      ["--prompt-output <path>", "Write the AI report handoff prompt to a custom path."],
      ["--pre-push", "Install or target the pre-push Git hook."],
      ["--include-ai-files", "Also target generated AGENTS/GEMINI/CLAUDE files for uninstall."],
      ["--overwrite-ai-files", "Allow integrate --force to overwrite existing root AGENTS/GEMINI/CLAUDE files."],
      ["--github-files", "Also target generated GitHub helper templates during clean."],
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
      ["reset", "AIGate 설정, settings, 리포트 폴더를 초기화합니다."],
      ["clean", "생성된 AIGate 리포트와 로컬 상태를 삭제합니다."],
      ["uninstall", "AIGate 설정, 상태, 소유 hook을 제거합니다."],
      ["delete", "`aigate clean` 별칭입니다."],
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
      ["ai report", "현재 문제점, 잘된 점, 방향성, AI 전달 단계를 설명합니다."],
      ["ai-report", "`aigate ai report` 별칭입니다."],
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
      ["--route <name>", "시작 루트입니다: default, quickstart, oss, ai, hook, release, full."],
      ["--ask-steps", "start 단계마다 실행 여부를 묻습니다."],
      ["--steps <ids>", "쉼표로 구분한 start 단계 id만 실행합니다."],
      ["--project-type <auto|app|package>", "평가와 릴리스 검사에 사용할 프로젝트 유형을 지정합니다."],
      ["--hosting <auto|github|gitlab|other>", "저장소 호스팅 제공자를 지정합니다."],
      ["--ci-provider <auto|github|gitlab|other>", "저장소 점검에 사용할 CI 제공자를 지정합니다."],
      ["--package-manager <auto|npm|pnpm|yarn|bun>", "패키지 매니저 감지를 지정합니다."],
      ["--distribution <auto|none|npm>", "생성 설정의 배포 방식을 지정합니다."],
      ["--target-branch <branch>", "생성 AI 지침의 PR/MR 대상 브랜치를 지정합니다."],
      ["--protected-branches <list>", "보호 브랜치를 쉼표로 지정합니다."],
      ["--work-branches <list>", "허용할 작업 브랜치 패턴을 쉼표로 지정합니다."],
      ["--required-checks <list>", "필수 CI/check 이름을 쉼표로 지정합니다."],
      ["--quality-command <shell>", "기본 로컬 품질 검증 명령을 지정합니다."],
      ["--gitlab-pipeline-must-succeed <true|false|verified>", "GitLab 필수 pipeline 증거를 선언 또는 검증 값으로 기록합니다."],
      ["--github-required-checks-enforced <true|false|verified>", "GitHub 필수 check 증거를 선언 또는 검증 값으로 기록합니다."],
      ["--providers <list>", "기본 AI 연동 provider를 쉼표로 지정합니다."],
      ["--ai-root-files <protect|sidecar|overwrite>", "integrate가 루트 AGENTS/GEMINI/CLAUDE 파일을 다루는 방식을 지정합니다."],
      ["--branch-strategy <name>", "브랜치 전략을 고정합니다: github-flow, gitlab-flow, trunk, hybrid, git-flow."],
      ["--provider <name>", "AI 제공자입니다: auto, codex, claude, gemini, all."],
      ["--script <name>", "aigate test 또는 aitest에서 사용할 npm script 이름입니다."],
      ["--command <shell>", "aigate test 또는 aitest에서 사용할 사용자 지정 shell 명령입니다."],
      ["--agent-command <shell>", "aitest 또는 ai report --apply에서 사용할 사용자 지정 AI 에이전트 명령입니다."],
      ["--prompt-output <path>", "AI report 전달 프롬프트를 지정한 경로에 저장합니다."],
      ["--pre-push", "pre-push Git hook을 설치하거나 대상으로 지정합니다."],
      ["--include-ai-files", "uninstall에서 생성된 AGENTS/GEMINI/CLAUDE 파일도 대상으로 포함합니다."],
      ["--overwrite-ai-files", "integrate --force가 기존 루트 AGENTS/GEMINI/CLAUDE 파일을 덮어쓸 수 있게 합니다."],
      ["--github-files", "clean에서 생성된 GitHub 보조 템플릿도 대상으로 포함합니다."],
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
      ["reset", "AIGate 設定、settings、レポートフォルダを初期化します。"],
      ["clean", "生成済み AIGate レポートとローカル状態を削除します。"],
      ["uninstall", "AIGate 設定、状態、所有 hook を削除します。"],
      ["delete", "`aigate clean` のエイリアスです。"],
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
      ["ai report", "現在の問題、良い点、方向性、AI 引き継ぎ手順を説明します。"],
      ["ai-report", "`aigate ai report` のエイリアスです。"],
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
      ["--route <name>", "開始ルート: default, quickstart, oss, ai, hook, release, full。"],
      ["--ask-steps", "start の各手順を実行するか確認します。"],
      ["--steps <ids>", "カンマ区切りの start 手順 id だけを実行します。"],
      ["--project-type <auto|app|package>", "評価とリリースチェックに使うプロジェクト種別を指定します。"],
      ["--hosting <auto|github|gitlab|other>", "リポジトリ hosting provider を指定します。"],
      ["--ci-provider <auto|github|gitlab|other>", "リポジトリチェックで使う CI provider を指定します。"],
      ["--package-manager <auto|npm|pnpm|yarn|bun>", "package manager 検出を指定します。"],
      ["--distribution <auto|none|npm>", "生成設定の distribution mode を指定します。"],
      ["--target-branch <branch>", "生成 AI 指示の PR/MR 対象ブランチを指定します。"],
      ["--protected-branches <list>", "保護ブランチをカンマ区切りで指定します。"],
      ["--work-branches <list>", "許可する作業ブランチパターンをカンマ区切りで指定します。"],
      ["--required-checks <list>", "必須 CI/check 名をカンマ区切りで指定します。"],
      ["--quality-command <shell>", "主要なローカル品質チェックコマンドを指定します。"],
      ["--gitlab-pipeline-must-succeed <true|false|verified>", "GitLab required pipeline の証拠を宣言または検証済み値として記録します。"],
      ["--github-required-checks-enforced <true|false|verified>", "GitHub required check の証拠を宣言または検証済み値として記録します。"],
      ["--providers <list>", "デフォルト AI 連携 provider をカンマ区切りで指定します。"],
      ["--ai-root-files <protect|sidecar|overwrite>", "integrate が root の AGENTS/GEMINI/CLAUDE ファイルを扱う方法を指定します。"],
      ["--branch-strategy <name>", "ブランチ戦略を固定します: github-flow, gitlab-flow, trunk, hybrid, git-flow。"],
      ["--provider <name>", "AI provider: auto, codex, claude, gemini, all。"],
      ["--script <name>", "aigate test または aitest で使う npm script 名です。"],
      ["--command <shell>", "aigate test または aitest で使うカスタム shell コマンドです。"],
      ["--agent-command <shell>", "aitest または ai report --apply で使うカスタム AI エージェントコマンドです。"],
      ["--prompt-output <path>", "AI report 引き継ぎプロンプトを指定パスへ保存します。"],
      ["--pre-push", "pre-push Git hook をインストールまたは対象にします。"],
      ["--include-ai-files", "uninstall で生成済み AGENTS/GEMINI/CLAUDE ファイルも対象にします。"],
      ["--overwrite-ai-files", "integrate --force が既存 root AGENTS/GEMINI/CLAUDE files を上書きできるようにします。"],
      ["--github-files", "clean で生成済み GitHub helper template も対象にします。"],
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
      ["reset", "重置 AIGate 配置、settings 和报告目录。"],
      ["clean", "删除生成的 AIGate 报告和本地状态。"],
      ["uninstall", "移除 AIGate 配置、状态和自有 hook。"],
      ["delete", "`aigate clean` 的别名。"],
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
      ["ai report", "说明当前问题、做得好的部分、方向和 AI 交接步骤。"],
      ["ai-report", "`aigate ai report` 的别名。"],
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
      ["--route <name>", "启动路由: default, quickstart, oss, ai, hook, release, full。"],
      ["--ask-steps", "逐步询问是否运行每个 start 步骤。"],
      ["--steps <ids>", "仅运行逗号分隔的 start 步骤 id。"],
      ["--project-type <auto|app|package>", "指定评估和发布检查使用的项目类型。"],
      ["--hosting <auto|github|gitlab|other>", "指定仓库托管服务。"],
      ["--ci-provider <auto|github|gitlab|other>", "指定仓库检查使用的 CI 服务。"],
      ["--package-manager <auto|npm|pnpm|yarn|bun>", "指定包管理器检测结果。"],
      ["--distribution <auto|none|npm>", "设置生成配置的发布模式。"],
      ["--target-branch <branch>", "设置生成 AI 指令中的 PR/MR 目标分支。"],
      ["--protected-branches <list>", "用逗号指定受保护分支。"],
      ["--work-branches <list>", "用逗号指定允许的工作分支模式。"],
      ["--required-checks <list>", "用逗号指定必需 CI/check 名称。"],
      ["--quality-command <shell>", "设置主要本地质量检查命令。"],
      ["--gitlab-pipeline-must-succeed <true|false|verified>", "记录声明或已验证的 GitLab required pipeline 证据。"],
      ["--github-required-checks-enforced <true|false|verified>", "记录声明或已验证的 GitHub required check 证据。"],
      ["--providers <list>", "用逗号指定默认 AI 集成 provider。"],
      ["--ai-root-files <protect|sidecar|overwrite>", "设置 integrate 如何处理根目录 AGENTS/GEMINI/CLAUDE 文件。"],
      ["--branch-strategy <name>", "固定分支策略: github-flow, gitlab-flow, trunk, hybrid, git-flow。"],
      ["--provider <name>", "AI provider: auto, codex, claude, gemini, all。"],
      ["--script <name>", "aigate test 或 aitest 使用的 npm script 名称。"],
      ["--command <shell>", "aigate test 或 aitest 使用的自定义 shell 命令。"],
      ["--agent-command <shell>", "aitest 或 ai report --apply 使用的自定义 AI agent 命令。"],
      ["--prompt-output <path>", "将 AI report 交接提示写入指定路径。"],
      ["--pre-push", "安装或指定 pre-push Git hook。"],
      ["--include-ai-files", "uninstall 时也包含生成的 AGENTS/GEMINI/CLAUDE 文件。"],
      ["--overwrite-ai-files", "允许 integrate --force 覆盖已有 root AGENTS/GEMINI/CLAUDE 文件。"],
      ["--github-files", "clean 时也包含生成的 GitHub helper 模板。"],
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
    "Merge request template exists": "MR 템플릿 존재",
    "CODEOWNERS exists": "CODEOWNERS 존재",
    "Contribution guide exists": "기여 가이드 존재",
    "Issue templates exist": "Issue 템플릿 존재",
    "AI assistant instructions exist": "AI 어시스턴트 지침 존재",
    "Test directory exists": "테스트 디렉터리 존재",
    "Project test command exists": "프로젝트 테스트 명령 존재",
    "CI gate script exists": "CI 게이트 스크립트 존재",
    "CI workflow exists": "CI 워크플로 존재",
    "AIGate CI gate exists": "AIGate CI 게이트 존재",
    "AIGate server enforcement exists": "AIGate 서버 강제 적용 존재",
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
    "Merge request template exists": "MR テンプレートが存在",
    "CODEOWNERS exists": "CODEOWNERS が存在",
    "Contribution guide exists": "コントリビューションガイドが存在",
    "Issue templates exist": "Issue テンプレートが存在",
    "AI assistant instructions exist": "AI アシスタント指示が存在",
    "Test directory exists": "テストディレクトリが存在",
    "Project test command exists": "プロジェクトテストコマンドが存在",
    "CI gate script exists": "CI ゲートスクリプトが存在",
    "CI workflow exists": "CI ワークフローが存在",
    "AIGate CI gate exists": "AIGate CI ゲートが存在",
    "AIGate server enforcement exists": "AIGate サーバー強制が存在",
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
    "Merge request template exists": "MR 模板存在",
    "CODEOWNERS exists": "CODEOWNERS 存在",
    "Contribution guide exists": "贡献指南存在",
    "Issue templates exist": "Issue 模板存在",
    "AI assistant instructions exist": "AI 助手指令存在",
    "Test directory exists": "测试目录存在",
    "Project test command exists": "项目测试命令存在",
    "CI gate script exists": "CI 关卡脚本存在",
    "CI workflow exists": "CI 工作流存在",
    "AIGate CI gate exists": "AIGate CI 关卡存在",
    "AIGate server enforcement exists": "AIGate 服务器强制存在",
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

function checkStatus(check) {
  if (check.applicable === false) {
    return "NA";
  }

  return check.pass ? "PASS" : "TODO";
}

function checkNeedsAction(check) {
  if (!check) {
    return false;
  }

  return check.applicable !== false && !check.pass;
}

function checkPassed(check) {
  if (!check) {
    return false;
  }

  return check.applicable !== false && check.pass;
}

function evaluationHasPassedCheck(evaluation, names) {
  return evaluation.checks.some((check) => names.includes(check.name) && checkPassed(check));
}

function formatCheckLine(check, translateName, language) {
  const reason = check.status === "NA" && check.reason
    ? ` (${translateNotApplicableReason(check.reason, language)})`
    : "";
  return `- ${statusLabel(check.status ?? checkStatus(check), language)}: ${translateName(check.name, language)}${reason}`;
}

function languageName(language) {
  return LANGUAGE_NAMES[language] ?? language;
}

const commands = {
  init: commandInit,
  reset: commandReset,
  clean: commandClean,
  uninstall: commandUninstall,
  delete: commandClean,
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
  ai: commandAi,
  "ai-report": commandAiReport,
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
    readAigateConfig,
    readJsonFile,
    renderPullRequestTemplateDraft,
    renderReport,
    resolveLanguage,
    statusLabel,
    t,
    unsupportedLanguage,
    version: VERSION
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
  const profile = detectProjectProfile(packageJson, options);
  const files = [
    {
      path: options.config ?? join(outputDir, ".aigate.yml"),
      content: renderDefaultConfig(packageJson, options)
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
    t(language, "common.next", { next: profile.hosting === "github" ? "aigate evaluate-project && aigate branch-strategy --github" : "aigate evaluate-project && aigate branch-strategy" })
  ];

  return lines.join("\n");
}

function commandReset(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const outputDir = options.outputDir ?? ".";
  const packageJson = readJsonFile("package.json");
  const settings = {
    ...DEFAULT_SETTINGS,
    language
  };
  const files = [
    {
      path: options.config ?? join(outputDir, ".aigate.yml"),
      content: renderDefaultConfig(packageJson, options)
    },
    {
      path: scopedSettingsPath(outputDir),
      content: `${JSON.stringify(settings, null, 2)}\n`
    },
    {
      path: join(outputDir, ".aigate", "reports", ".gitkeep"),
      content: ""
    }
  ];
  const targets = options.dryRun
    ? previewProjectFiles(files)
    : writeProjectFiles(files, true);
  const result = {
    command: "reset",
    status: options.dryRun ? "DRY_RUN" : "DONE",
    mode: options.dryRun ? "dry-run" : "apply",
    outputDir,
    targets,
    next: "aigate doctor"
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderMaintenanceResult(result, language);
}

function commandClean(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const outputDir = options.outputDir ?? ".";
  const previewOnly = Boolean(options.dryRun || !options.force);
  const targets = applyDeleteTargets(buildCleanTargets(outputDir, options), previewOnly);
  const result = {
    command: "clean",
    status: previewOnly ? "DRY_RUN" : targets.some((target) => target.action === "protected") ? "WARN" : "DONE",
    mode: previewOnly ? "dry-run" : "apply",
    outputDir,
    targets,
    next: previewOnly ? "aigate clean --force" : "aigate doctor"
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderMaintenanceResult(result, language);
}

function commandUninstall(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const outputDir = options.outputDir ?? ".";
  const previewOnly = Boolean(options.dryRun || !options.force);
  const targets = applyDeleteTargets(buildUninstallTargets(outputDir, options), previewOnly);
  const result = {
    command: "uninstall",
    status: previewOnly ? "DRY_RUN" : targets.some((target) => target.action === "protected") ? "WARN" : "DONE",
    mode: previewOnly ? "dry-run" : "apply",
    outputDir,
    targets,
    next: previewOnly ? "aigate uninstall --force" : "aigate doctor"
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderMaintenanceResult(result, language);
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
    sensitiveRemovals: analysis.sensitiveRemovals,
    tracked: status.insideGitRepository,
    recommendation: analysis.secretFindings.length
      ? "Review possible secret-bearing files before commit or push."
      : analysis.sensitiveRemovals.length
        ? "Commit sensitive file removals and rotate exposed credentials if they were already in history."
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
    t(language, "check.sensitiveRemovals", { count: result.sensitiveRemovals.length }),
    t(language, "check.recommendation", { recommendation: translateRecommendation(result.recommendation, language) })
  ].join("\n");
}

function commandGitReady(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const result = buildGitReadyResult(options);
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
  const report = buildReport("pr", options);
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

  let selectedStepIds = parseStartStepSelection(options.steps);
  if (!selectedStepIds && shouldPromptStartSteps(route, options)) {
    const previewSteps = buildStartStepCalls(route, provider, language, {
      force: Boolean(options.force),
      outputDir: options.outputDir ?? ".",
      owner: options.owner,
      projectType: options.projectType,
      hosting: options.hosting,
      ciProvider: options.ciProvider,
      packageManager: options.packageManager
    });
    selectedStepIds = await promptStartStepChoices(previewSteps, language);
  }

  const result = executeStartRoute(route, {
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    outputDir: options.outputDir ?? ".",
    owner: options.owner,
    projectType: options.projectType,
    hosting: options.hosting,
    ciProvider: options.ciProvider,
    packageManager: options.packageManager,
    provider,
    selectedStepIds
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

async function commandAiTest(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  if (isMissingOptionValue(options.provider)) {
    process.exitCode = 1;
    return renderAiTestError("missing-provider", language);
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
      emitAiApplyProgress("start", language, {
        provider: provider.name,
        promptPath,
        command: agentCommand.display,
        stream: options.format !== "json"
      });
      result.agent = await runAgentCommand(agentCommand, prompt, {
        stream: options.format !== "json"
      });
      emitAiApplyProgress("finish", language, {
        exitCode: result.agent.exitCode,
        durationMs: result.agent.durationMs,
        stream: options.format !== "json"
      });
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

function commandAi(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const action = firstPositionalArg(args) ?? "report";
  if (action !== "report") {
    process.exitCode = 1;
    return renderAiReportError("unknown-action", language, { action });
  }

  return commandAiReport(args);
}

async function commandAiReport(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  if (isMissingOptionValue(options.provider)) {
    process.exitCode = 1;
    return renderAiReportError("missing-provider", language);
  }

  const provider = resolveAiTestProvider(options.provider ?? "auto");
  if (!provider) {
    process.exitCode = 1;
    return renderAiReportError("unknown-provider", language, { provider: options.provider });
  }

  const report = buildAiProjectReport(options, language);
  report.ai = {
    provider: provider.name,
    providerInstalled: provider.installed,
    applied: false,
    promptPath: null,
    agent: null
  };

  if (options.apply) {
    const promptPath = options.promptOutput ?? join(".aigate", "reports", "ai-report-prompt.md");
    mkdirSync(dirname(promptPath), { recursive: true });
    writeFileSync(promptPath, `${report.prompt}\n`, "utf8");
    report.ai.promptPath = promptPath;

    const agentCommand = resolveAgentCommand(provider, options, report.prompt);
    if (!agentCommand) {
      report.status = "BLOCK";
      report.ai.agent = {
        status: "SKIPPED",
        command: null,
        exitCode: 1,
        stdout: "",
        stderr: translateAiTestText("agentNotFound", language, { provider: provider.name })
      };
    } else {
      emitAiApplyProgress("start", language, {
        provider: provider.name,
        promptPath,
        command: agentCommand.display,
        stream: options.format !== "json"
      });
      report.ai.agent = await runAgentCommand(agentCommand, report.prompt, {
        stream: options.format !== "json"
      });
      emitAiApplyProgress("finish", language, {
        exitCode: report.ai.agent.exitCode,
        durationMs: report.ai.agent.durationMs,
        stream: options.format !== "json"
      });
      report.ai.applied = report.ai.agent.exitCode === 0;
      report.status = report.ai.applied ? "AI_APPLIED" : "BLOCK";
    }
  }

  const output = options.format === "json"
    ? JSON.stringify(report, null, 2)
    : renderAiProjectReport(report, language);

  if (report.status === "BLOCK") {
    process.exitCode = 1;
  }

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return t(language, "common.wrote", { path: options.output });
  }

  return output;
}

function commandSetup(args) {
  const options = parseOptions(args);
  const currentSettings = normalizeSettings(readSettings());
  const language = normalizeLanguage(options.language ?? currentSettings.language ?? DEFAULT_SETTINGS.language);
  const projectType = settingValue(options.projectType, currentSettings.projectType, normalizeProjectType, "auto");
  const hosting = settingValue(options.hosting, currentSettings.hosting, normalizeHosting, "auto");
  const ciProvider = settingValue(options.ciProvider, currentSettings.ciProvider, normalizeCiProvider, "auto");
  const packageManager = settingValue(options.packageManager, currentSettings.packageManager, normalizePackageManager, "auto");
  const distribution = settingValue(options.distribution, currentSettings.distribution, normalizeDistribution, "auto");
  const defaultBranch = branchSettingValue(options.defaultBranch, currentSettings.defaultBranch, "main");
  const targetBranch = branchSettingValue(options.targetBranch ?? options.base, currentSettings.targetBranch, defaultBranch);
  const branchStrategy = settingValue(options.branchStrategy, currentSettings.branchStrategy, normalizeBranchStrategySetting, "auto");
  const protectedBranches = listSettingValue(options.protectedBranches ?? options.protectedBranch, currentSettings.protectedBranches);
  const workBranches = listSettingValue(options.workBranches ?? options.workBranch, currentSettings.workBranches);
  const requiredChecks = listSettingValue(options.requiredChecks ?? options.requiredCheck, currentSettings.requiredChecks);
  const qualityCommands = listSettingValue(options.qualityCommands ?? options.qualityCommand, currentSettings.qualityCommands);
  const aiProviders = integrationProviderListSetting(
    options.aiProviders ?? options.providers ?? options.provider,
    currentSettings.aiProviders
  );
  const aiRootFiles = aiRootFilesSettingValue(options.aiRootFiles ?? options.rootAiFiles, currentSettings.aiRootFiles);
  const serverEnforcement = serverEnforcementSetting(options, currentSettings);

  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    ...currentSettings,
    language,
    projectType,
    hosting,
    ciProvider,
    packageManager,
    distribution,
    defaultBranch,
    targetBranch,
    branchStrategy,
    protectedBranches,
    workBranches,
    requiredChecks,
    qualityCommands,
    aiProviders,
    aiRootFiles,
    serverEnforcement
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
    t(language, "language.label", { language: languageName(language) }),
    t(language, "settings.profile", settings),
    t(language, "settings.workflow", settingsSummary(settings))
  ].join("\n");
}

function commandSettings(args) {
  const options = parseOptions(args);
  const settings = normalizeSettings(readSettings());
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
    t(language, "language.label", { language: languageName(settings.language) }),
    t(language, "settings.profile", settings),
    t(language, "settings.workflow", settingsSummary(settings))
  ].join("\n");
}

function commandIntegrate(args) {
  const options = parseOptions(args);
  const settings = normalizeSettings(readSettings());
  const providerArg = firstPositionalArg(args) ?? (settings.aiProviders.length ? settings.aiProviders.join(",") : "all");
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
  const packageJson = readJsonFile("package.json");
  const profile = detectProjectProfile(packageJson, options);
  const manifest = buildIntegrationManifest(providers, profile, packageJson, options);
  const aiRootFiles = options.overwriteAiFiles
    ? "overwrite"
    : aiRootFilesSettingValue(options.aiRootFiles ?? options.rootAiFiles, settings.aiRootFiles);
  const files = buildIntegrationFiles(providers, outputDir, manifest, language, { aiRootFiles });
  const results = writeIntegrationFiles(files, Boolean(options.force), {
    overwriteProtected: Boolean(options.overwriteAiFiles || options.writeRootAiFiles || aiRootFiles === "overwrite")
  });

  if (options.format === "json") {
    return JSON.stringify({
      command: "integrate",
      providers,
      outputDir,
      aiRootFiles,
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

function commandRepositoryStarterFiles(args) {
  const options = parseOptions(args);
  const language = resolveLanguage(options);
  if (!language) {
    return unsupportedLanguage(options.language);
  }

  const outputDir = options.outputDir ?? ".";
  const owner = normalizeCodeownersOwner(options.owner);
  const packageJson = readJsonFile("package.json");
  const profile = detectProjectProfile(packageJson, options);
  const files = buildRepositoryStarterFiles(outputDir, language, packageJson, owner, profile);
  const results = writeProjectFiles(files, Boolean(options.force), {
    overwriteProtected: Boolean(options.overwriteAiFiles || options.writeRootAiFiles)
  });

  if (options.format === "json") {
    return JSON.stringify({
      command: "repo-files",
      outputDir,
      owner,
      hosting: profile.hosting,
      files: results
    }, null, 2);
  }

  const labels = repositoryStarterLabels(language);
  return [
    labels.complete,
    `${labels.outputDir}: ${outputDir}`,
    `${labels.owner}: ${owner}`,
    ...results.map((result) => `- ${translateIntegrationAction(result.action, language)}: ${result.path}`),
    t(language, "common.next", { next: "aigate ai report && aigate pr-check" })
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

function shouldPromptStartSteps(route, options) {
  if (options.format || options.dryRun || options.steps) {
    return false;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false;
  }

  return route === "default" || Boolean(options.askSteps);
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

async function promptStartStepChoices(steps, language) {
  const labels = automationLabels(language);
  const selectedIds = [];
  process.stdout.write(`\n${labels.startStepPrompt}\n${labels.startStepPromptHint}\n\n`);

  for (const step of steps) {
    const answer = await promptStartYesNo(`${labels.startStepQuestion} ${step.title} (${step.command})`, true);
    if (answer) {
      selectedIds.push(step.id);
    }
  }

  process.stdout.write("\n");
  return selectedIds;
}

function promptStartYesNo(question, defaultValue = true) {
  const suffix = defaultValue ? " [Y/n] " : " [y/N] ";
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${question}${suffix}`, (answer) => {
      rl.close();
      const normalized = String(answer ?? "").trim().toLowerCase();
      if (!normalized) {
        resolve(defaultValue);
        return;
      }

      resolve(["y", "yes", "예", "네", "ㅇ", "はい", "是"].includes(normalized));
    });
  });
}

function executeStartRoute(routeId, options, language) {
  const profile = detectProjectProfile(readJsonFile("package.json"), options);
  const route = startRouteDefinitions(language, profile).find((item) => item.id === routeId);
  const stepCalls = buildStartStepCalls(routeId, options.provider, language, {
    force: options.force,
    outputDir: options.outputDir ?? ".",
    owner: options.owner,
    projectType: options.projectType,
    hosting: options.hosting,
    ciProvider: options.ciProvider,
    packageManager: options.packageManager
  });
  const selectedStepIds = options.selectedStepIds ? new Set(options.selectedStepIds) : null;
  const unknownStepIds = selectedStepIds
    ? [...selectedStepIds].filter((id) => !stepCalls.some((step) => step.id === id))
    : [];

  if (unknownStepIds.length) {
    return {
      command: "start",
      status: "BLOCK",
      mode: options.dryRun ? "dry-run" : "apply",
      route: routeId,
      title: route?.title ?? routeId,
      outputDir: options.outputDir ?? ".",
      owner: normalizeCodeownersOwner(options.owner),
      provider: options.provider,
      steps: [],
      next: [],
      error: renderStartError("unknown-step", language, {
        step: unknownStepIds.join(", "),
        supportedSteps: stepCalls.map((step) => step.id).join(", ")
      })
    };
  }

  const steps = [];

  for (const step of stepCalls) {
    if (selectedStepIds && !selectedStepIds.has(step.id)) {
      steps.push({
        id: step.id,
        title: step.title,
        command: step.command,
        status: "SKIPPED",
        exitCode: 0,
        output: ""
      });
      continue;
    }

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
    outputDir: options.outputDir ?? ".",
    owner: normalizeCodeownersOwner(options.owner),
    provider: options.provider,
    selectedSteps: selectedStepIds ? [...selectedStepIds] : "all",
    steps,
    next: route?.next ?? []
  };
}

function buildStartStepCalls(routeId, provider, language, options = {}) {
  const force = Boolean(options.force);
  const outputDir = options.outputDir ?? ".";
  const owner = normalizeCodeownersOwner(options.owner);
  const baseArgs = ["--language", language];
  const profileArgs = projectProfileOptionArgs(options);
  const outputArgs = outputDir === "." ? [] : ["--output-dir", outputDir];
  const ownerArgs = owner ? ["--owner", owner] : [];
  const forceArgs = force ? ["--force"] : [];
  const integrationProvider = provider ?? "all";
  const outputDirText = outputDir === "." ? "" : ` --output-dir ${quoteArgs([outputDir])[0]}`;
  const ownerText = owner ? ` --owner ${quoteArgs([owner])[0]}` : "";
  const profileText = profileArgs.length ? ` ${quoteArgs(profileArgs).join(" ")}` : "";
  const profile = detectProjectProfile(readJsonFile("package.json"), options);
  const branchArgs = profile.hosting === "github" ? ["--github", ...baseArgs, ...profileArgs] : [...baseArgs, ...profileArgs];
  const branchCommand = `${profile.hosting === "github" ? "aigate branch-strategy --github" : "aigate branch-strategy"}${profileText}`;
  const steps = {
    init: {
      id: "init",
      title: automationLabels(language).startStepInit,
      command: `aigate init${outputDirText}${profileText}${force ? " --force" : ""}`,
      run: () => commandInit([...baseArgs, ...profileArgs, ...outputArgs, ...forceArgs])
    },
    integrate: {
      id: "integrate",
      title: automationLabels(language).startStepIntegrate,
      command: `aigate integrate ${integrationProvider}${outputDirText}${force ? " --force" : ""}`,
      run: () => commandIntegrate([integrationProvider, ...baseArgs, ...outputArgs, ...forceArgs])
    },
    repoFiles: {
      id: "repo-files",
      title: automationLabels(language).startStepRepoFiles,
      command: `aigate start --route oss${outputDirText}${ownerText}${profileText}${force ? " --force" : ""}`,
      run: () => commandRepositoryStarterFiles([...baseArgs, ...profileArgs, ...outputArgs, ...ownerArgs, ...forceArgs])
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
      run: () => commandReleaseCheck([...baseArgs, ...profileArgs])
    },
    aiReport: {
      id: "ai-report",
      title: automationLabels(language).startStepAiReport,
      command: "aigate ai report",
      run: () => commandAiReport([...baseArgs, ...profileArgs])
    },
    branch: {
      id: "branch-strategy",
      title: automationLabels(language).startStepBranch,
      command: branchCommand,
      run: () => commandBranchStrategy(branchArgs)
    }
  };

  return {
    default: [steps.init, steps.repoFiles, steps.integrate, steps.hook, steps.doctor, steps.aiReport, steps.branch],
    quickstart: [steps.init, steps.doctor, steps.demo],
    oss: [steps.init, steps.repoFiles, steps.doctor, steps.branch],
    ai: [steps.init, steps.integrate, steps.doctor],
    hook: [steps.init, steps.hook, steps.doctor],
    release: [steps.release, steps.branch],
    full: [steps.init, steps.integrate, steps.repoFiles, steps.hook, steps.doctor, steps.release]
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
  if (result.error) {
    return result.error;
  }

  return [
    `${labels.startTitle}: ${automationStatus(result.status, language)}`,
    `${labels.route}: ${result.title}`,
    `${labels.mode}: ${translateAutomationMode(result.mode, language)}`,
    `${labels.outputDir}: ${result.outputDir}`,
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

  if (kind === "unknown-step") {
    return `${labels.error}: ${labels.unknownStep} ${values.step}\n${labels.supportedSteps}: ${values.supportedSteps}`;
  }

  return `${labels.error}: ${labels.unknownRoute} ${values.route}\n${labels.supportedRoutes}: ${START_ROUTE_IDS.join(", ")}`;
}

function parseStartStepSelection(value) {
  if (value === undefined || value === null || value === false) {
    return null;
  }

  const text = String(value).trim();
  if (!text || text === "all") {
    return null;
  }

  if (text === "none") {
    return [];
  }

  return text.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
}

function summarizeStepOutput(output, language) {
  const text = String(output ?? "").trim();
  if (!text) {
    return automationLabels(language).none;
  }

  return text.split(/\r?\n/).find((line) => line.trim())?.trim() ?? automationLabels(language).none;
}

function startRouteDefinitions(language, profile = {}) {
  const labels = automationLabels(language);
  const setupNext = profile.hosting === "gitlab"
    ? "Review .gitlab templates and commit only useful files"
    : "aigate github setup --dry-run";
  return [
    {
      id: "default",
      title: labels.routeDefault,
      description: labels.routeDefaultDescription,
      next: [
        "aigate ai report",
        "aigate test",
        "aigate git-ready"
      ]
    },
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
      id: "oss",
      title: labels.routeOss,
      description: labels.routeOssDescription,
      next: [
        "aigate ai report",
        setupNext,
        "aigate pr-check"
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
    return customShellCommand(options.command, "custom-command");
  }

  const packageJson = readJsonFile("package.json");
  const profile = detectProjectProfile(packageJson, options);
  const workflow = resolveWorkflowSettings(options, profile, packageJson);
  if (!options.script && workflow.qualityCommands.length) {
    return customShellCommand(workflow.qualityCommands[0], "configured-quality-command");
  }

  return discoverProjectTestCommand(packageJson, profile, options.script);
}

function customShellCommand(command, source = "custom-command") {
  return {
    source,
    display: String(command),
    executable: String(command),
    args: [],
    shell: true
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
      "Add a package.json test, test:ci, or ci script in the root or a workspace package.",
      "Run aigate test --command \"<your test command>\" when the command is custom."
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

function isMissingOptionValue(value) {
  return value === true || value === "";
}

async function runAgentCommand(command, prompt, options = {}) {
  const startedAt = Date.now();
  const timeoutMs = 10 * 60 * 1000;
  const stream = Boolean(options.stream);

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    const child = spawn(command.executable, command.args, {
      cwd: process.cwd(),
      env: process.env,
      shell: Boolean(command.shell),
      stdio: ["pipe", "pipe", "pipe"]
    });

    const finish = (exitCode, extraStderr = "") => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      const finalExitCode = typeof exitCode === "number" ? exitCode : 1;
      if (extraStderr) {
        stderr += extraStderr;
      }
      resolve({
        status: finalExitCode === 0 ? "DONE" : "FAILED",
        command: command.display,
        exitCode: finalExitCode,
        durationMs: Date.now() - startedAt,
        stdout: truncateOutput(stdout),
        stderr: truncateOutput(stderr)
      });
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (stream) {
        process.stderr.write(text);
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (stream) {
        process.stderr.write(text);
      }
    });

    child.stdin.on("error", () => {
      // Some AI CLIs can exit before reading stdin after printing an immediate error.
    });

    child.on("error", (error) => {
      finish(1, error?.message ? `${error.message}\n` : "");
    });

    child.on("close", (code, signal) => {
      if (timedOut) {
        finish(1, `AI agent timed out after ${timeoutMs}ms.\n`);
        return;
      }
      const exitCode = code ?? (signal ? 1 : 0);
      finish(exitCode);
    });

    const input = command.input ?? prompt;
    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

function emitAiApplyProgress(kind, language, values = {}) {
  if (!values.stream) {
    return;
  }

  const labels = aiApplyProgressLabels(language);
  if (kind === "start") {
    process.stderr.write([
      `${labels.title}: ${labels.start}`,
      `- ${labels.provider}: ${values.provider}`,
      `- ${labels.prompt}: ${values.promptPath}`,
      `- ${labels.command}: ${values.command}`,
      `- ${labels.output}: ${labels.streaming}`,
      ""
    ].join("\n"));
    return;
  }

  process.stderr.write([
    "",
    `${labels.title}: ${labels.finish}`,
    `- ${labels.exitCode}: ${values.exitCode}`,
    `- ${labels.duration}: ${values.durationMs}ms`,
    ""
  ].join("\n"));
}

function aiApplyProgressLabels(language = "en") {
  return {
    en: {
      command: "Command",
      duration: "Duration",
      exitCode: "Exit code",
      finish: "agent finished",
      output: "Agent output",
      prompt: "Prompt",
      provider: "Provider",
      start: "running agent",
      streaming: "streaming below",
      title: "AIGate AI apply"
    },
    ko: {
      command: "명령",
      duration: "소요 시간",
      exitCode: "종료 코드",
      finish: "에이전트 실행 완료",
      output: "에이전트 출력",
      prompt: "프롬프트",
      provider: "제공자",
      start: "에이전트 실행 중",
      streaming: "아래에 실시간 표시",
      title: "AIGate AI 적용"
    },
    ja: {
      command: "コマンド",
      duration: "所要時間",
      exitCode: "終了コード",
      finish: "エージェント実行完了",
      output: "エージェント出力",
      prompt: "プロンプト",
      provider: "Provider",
      start: "エージェント実行中",
      streaming: "下にリアルタイム表示",
      title: "AIGate AI 適用"
    },
    zh: {
      command: "命令",
      duration: "耗时",
      exitCode: "退出码",
      finish: "agent 执行完成",
      output: "Agent 输出",
      prompt: "提示",
      provider: "Provider",
      start: "正在运行 agent",
      streaming: "在下方实时显示",
      title: "AIGate AI 应用"
    }
  }[language] ?? aiApplyProgressLabels("en");
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
      `${labels.exitCode}: ${result.agent.exitCode}`,
      `${labels.duration}: ${result.agent.durationMs}ms`
    );
    if (result.agent.stdout.trim()) {
      lines.push("", `${labels.stdout}:`, result.agent.stdout.trim());
    }
    if (result.agent.stderr.trim()) {
      lines.push("", `${labels.stderr}:`, result.agent.stderr.trim());
    }
  }

  lines.push("", `${labels.next}:`, ...result.next.map((step) => `- ${step}`));
  return lines.join("\n");
}

function renderAiTestError(kind, language, values = {}) {
  const labels = automationLabels(language);
  if (kind === "missing-provider") {
    return `${labels.error}: ${labels.missingProvider}\n${labels.supportedProviders}: auto, codex, claude, gemini`;
  }

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
      missingProvider: "--provider requires a value.",
      mode: "Mode",
      next: "Next",
      none: "none",
      notDetected: "not detected",
      output: "Output",
      outputDir: "Output directory",
      projectCommand: "Project command",
      prompt: "Prompt",
      provider: "Provider",
      report: "Report",
      route: "Route",
      routeDefault: "Default setup",
      routeDefaultDescription: "Review recommended steps and run only what you need.",
      routeAi: "AI agent setup",
      routeAiDescription: "Create Codex, Gemini, and Claude instruction files.",
      routeFull: "Full project guard",
      routeFullDescription: "Set config, AI files, pre-push guard, and release checks.",
      routeHook: "Pre-push guard",
      routeHookDescription: "Install the guarded git push path.",
      routeOss: "Open source setup",
      routeOssDescription: "Create README, contribution docs, issue templates, PR template, and CODEOWNERS.",
      routeQuickstart: "Quick setup",
      routeQuickstartDescription: "Create config, run doctor, and show the demo.",
      routeRelease: "Release readiness",
      routeReleaseDescription: "Check package metadata and branch policy.",
      startPrompt: "Choose an AIGate start route",
      startPromptHint: "Use arrow keys and press Enter.",
      startStepAiReport: "Create AI project report",
      startStepBranch: "Recommend branch strategy",
      startStepDemo: "Show guided demo",
      startStepDoctor: "Run doctor",
      startStepHook: "Install pre-push hook",
      startStepInit: "Create AIGate config",
      startStepIntegrate: "Create AI integration files",
      startStepPrompt: "Choose default setup steps",
      startStepPromptHint: "Press Enter to run a step, or type n to skip it.",
      startStepQuestion: "Run this step?",
      startStepRepoFiles: "Create repository starter files",
      startStepRelease: "Check release readiness",
      startTitle: "AIGate start",
      steps: "Steps",
      stderr: "stderr",
      stdout: "stdout",
      summary: "Summary",
      supportedProviders: "Supported providers",
      supportedRoutes: "Supported routes",
      supportedSteps: "Supported steps",
      testTitle: "AIGate test",
      unknownProvider: "Unknown AI provider:",
      unknownRoute: "Unknown start route:",
      unknownStep: "Unknown start step:"
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
      missingProvider: "--provider 값이 필요합니다.",
      mode: "모드",
      next: "다음 단계",
      none: "없음",
      notDetected: "감지되지 않음",
      output: "출력",
      outputDir: "출력 디렉터리",
      projectCommand: "프로젝트 명령",
      prompt: "프롬프트",
      provider: "제공자",
      report: "리포트",
      route: "루트",
      routeDefault: "기본 설정",
      routeDefaultDescription: "추천 단계를 확인하며 필요한 것만 실행합니다.",
      routeAi: "AI 에이전트 설정",
      routeAiDescription: "Codex, Gemini, Claude 지침 파일을 생성합니다.",
      routeFull: "전체 프로젝트 보호",
      routeFullDescription: "설정, AI 파일, pre-push 보호, 릴리스 검사를 구성합니다.",
      routeHook: "pre-push 보호",
      routeHookDescription: "보호된 git push 경로를 설치합니다.",
      routeOss: "오픈소스 설정",
      routeOssDescription: "README, 기여 문서, 이슈 템플릿, PR 템플릿, CODEOWNERS를 생성합니다.",
      routeQuickstart: "빠른 설정",
      routeQuickstartDescription: "설정을 만들고 doctor와 demo를 실행합니다.",
      routeRelease: "릴리스 준비",
      routeReleaseDescription: "패키지 메타데이터와 브랜치 정책을 점검합니다.",
      startPrompt: "AIGate 시작 루트를 선택하세요",
      startPromptHint: "화살표 키로 이동하고 Enter를 누르세요.",
      startStepAiReport: "AI 프로젝트 리포트 생성",
      startStepBranch: "브랜치 전략 추천",
      startStepDemo: "안내형 데모 표시",
      startStepDoctor: "doctor 실행",
      startStepHook: "pre-push hook 설치",
      startStepInit: "AIGate 설정 생성",
      startStepIntegrate: "AI 연동 파일 생성",
      startStepPrompt: "기본 설정 단계를 선택하세요",
      startStepPromptHint: "Enter는 실행, n은 건너뜀입니다.",
      startStepQuestion: "이 단계를 실행할까요?",
      startStepRepoFiles: "저장소 시작 파일 생성",
      startStepRelease: "릴리스 준비 검사",
      startTitle: "AIGate start",
      steps: "단계",
      stderr: "stderr",
      stdout: "stdout",
      summary: "요약",
      supportedProviders: "지원 제공자",
      supportedRoutes: "지원 루트",
      supportedSteps: "지원 단계",
      testTitle: "AIGate test",
      unknownProvider: "알 수 없는 AI 제공자:",
      unknownRoute: "알 수 없는 시작 루트:",
      unknownStep: "알 수 없는 start 단계:"
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
      missingProvider: "--provider には値が必要です。",
      mode: "モード",
      next: "次の手順",
      none: "なし",
      notDetected: "未検出",
      output: "出力",
      outputDir: "出力ディレクトリ",
      projectCommand: "プロジェクトコマンド",
      prompt: "プロンプト",
      provider: "Provider",
      report: "レポート",
      route: "ルート",
      routeDefault: "デフォルト設定",
      routeDefaultDescription: "推奨手順を確認し、必要なものだけ実行します。",
      routeAi: "AI エージェント設定",
      routeAiDescription: "Codex、Gemini、Claude の指示ファイルを作成します。",
      routeFull: "フルプロジェクトガード",
      routeFullDescription: "設定、AI ファイル、pre-push ガード、リリースチェックを構成します。",
      routeHook: "pre-push ガード",
      routeHookDescription: "保護された git push 経路をインストールします。",
      routeOss: "オープンソース設定",
      routeOssDescription: "README、貢献文書、issue テンプレート、PR テンプレート、CODEOWNERS を作成します。",
      routeQuickstart: "クイック設定",
      routeQuickstartDescription: "設定を作成し、doctor と demo を実行します。",
      routeRelease: "リリース準備",
      routeReleaseDescription: "パッケージメタデータとブランチポリシーを確認します。",
      startPrompt: "AIGate 開始ルートを選択してください",
      startPromptHint: "矢印キーで移動し Enter を押してください。",
      startStepAiReport: "AI プロジェクトレポートを作成",
      startStepBranch: "ブランチ戦略を推薦",
      startStepDemo: "ガイド付きデモを表示",
      startStepDoctor: "doctor を実行",
      startStepHook: "pre-push hook をインストール",
      startStepInit: "AIGate 設定を作成",
      startStepIntegrate: "AI 連携ファイルを作成",
      startStepPrompt: "デフォルト設定の手順を選択してください",
      startStepPromptHint: "Enter で実行、n でスキップします。",
      startStepQuestion: "この手順を実行しますか?",
      startStepRepoFiles: "リポジトリ初期ファイルを作成",
      startStepRelease: "リリース準備を確認",
      startTitle: "AIGate start",
      steps: "手順",
      stderr: "stderr",
      stdout: "stdout",
      summary: "要約",
      supportedProviders: "対応 provider",
      supportedRoutes: "対応ルート",
      supportedSteps: "対応手順",
      testTitle: "AIGate test",
      unknownProvider: "不明な AI provider:",
      unknownRoute: "不明な開始ルート:",
      unknownStep: "不明な start 手順:"
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
      missingProvider: "--provider 需要一个值。",
      mode: "模式",
      next: "下一步",
      none: "无",
      notDetected: "未检测到",
      output: "输出",
      outputDir: "输出目录",
      projectCommand: "项目命令",
      prompt: "提示",
      provider: "Provider",
      report: "报告",
      route: "路由",
      routeDefault: "默认设置",
      routeDefaultDescription: "检查推荐步骤，并只运行需要的部分。",
      routeAi: "AI agent 设置",
      routeAiDescription: "创建 Codex、Gemini 和 Claude 指令文件。",
      routeFull: "完整项目守护",
      routeFullDescription: "配置设置、AI 文件、pre-push 守护和发布检查。",
      routeHook: "pre-push 守护",
      routeHookDescription: "安装受保护的 git push 路径。",
      routeOss: "开源设置",
      routeOssDescription: "创建 README、贡献文档、issue 模板、PR 模板和 CODEOWNERS。",
      routeQuickstart: "快速设置",
      routeQuickstartDescription: "创建配置，运行 doctor 并显示 demo。",
      routeRelease: "发布就绪",
      routeReleaseDescription: "检查包元数据和分支策略。",
      startPrompt: "选择 AIGate 启动路由",
      startPromptHint: "使用方向键移动并按 Enter。",
      startStepAiReport: "创建 AI 项目报告",
      startStepBranch: "推荐分支策略",
      startStepDemo: "显示引导 demo",
      startStepDoctor: "运行 doctor",
      startStepHook: "安装 pre-push hook",
      startStepInit: "创建 AIGate 配置",
      startStepIntegrate: "创建 AI 集成文件",
      startStepPrompt: "选择默认设置步骤",
      startStepPromptHint: "按 Enter 运行步骤，输入 n 跳过。",
      startStepQuestion: "运行此步骤吗?",
      startStepRepoFiles: "创建仓库起始文件",
      startStepRelease: "检查发布就绪状态",
      startTitle: "AIGate start",
      steps: "步骤",
      stderr: "stderr",
      stdout: "stdout",
      summary: "摘要",
      supportedProviders: "支持的 provider",
      supportedRoutes: "支持的路由",
      supportedSteps: "支持的步骤",
      testTitle: "AIGate test",
      unknownProvider: "未知 AI provider:",
      unknownRoute: "未知启动路由:",
      unknownStep: "未知 start 步骤:"
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
      "Add a package.json test, test:ci, or ci script in the root or a workspace package.": "루트 또는 워크스페이스 package.json에 test, test:ci 또는 ci script를 추가하세요.",
      "Resolve AIGate git-ready blockers first.": "먼저 AIGate git-ready 차단 사유를 해결하세요.",
      "Review the AI agent output.": "AI 에이전트 출력을 검토하세요.",
      "Run aigate aitest after blockers are fixed.": "차단 사유를 해결한 뒤 aigate aitest를 실행하세요.",
      "Run aigate aitest to generate an AI remediation prompt.": "AI 수정 프롬프트를 만들려면 aigate aitest를 실행하세요.",
      "Run aigate git-ready": "aigate git-ready를 실행하세요.",
      "Run aigate push -u origin <branch> when ready.": "준비되면 aigate push -u origin <branch>를 실행하세요.",
      "Run aigate test --command \"<your test command>\" when the command is custom.": "사용자 지정 명령이라면 aigate test --command \"<테스트 명령>\"을 실행하세요.",
      "Run aigate test --command \"npm test\" when the command exists.": "명령이 준비되면 aigate test --command \"npm test\"를 실행하세요.",
      "Run aigate test again after the agent finishes.": "에이전트가 끝나면 aigate test를 다시 실행하세요.",
      "Tests already pass.": "테스트가 이미 통과했습니다.",
      "aigate git-ready": "aigate git-ready",
      "aigate push -u origin <branch>": "aigate push -u origin <branch>"
    },
    ja: {
      "AI remediation prompt was written.": "AI 修正プロンプトを書き込みました。",
      "Add a package.json test, test:ci, or ci script.": "package.json に test、test:ci、または ci script を追加してください。",
      "Add a package.json test, test:ci, or ci script in the root or a workspace package.": "ルートまたはワークスペース package.json に test、test:ci、または ci script を追加してください。",
      "Resolve AIGate git-ready blockers first.": "先に AIGate git-ready の blocker を解消してください。",
      "Review the AI agent output.": "AI エージェントの出力を確認してください。",
      "Run aigate aitest after blockers are fixed.": "blocker 解消後に aigate aitest を実行してください。",
      "Run aigate aitest to generate an AI remediation prompt.": "AI 修正プロンプトを生成するには aigate aitest を実行してください。",
      "Run aigate git-ready": "aigate git-ready を実行してください。",
      "Run aigate push -u origin <branch> when ready.": "準備できたら aigate push -u origin <branch> を実行してください。",
      "Run aigate test --command \"<your test command>\" when the command is custom.": "カスタムコマンドの場合は aigate test --command \"<test command>\" を実行してください。",
      "Run aigate test --command \"npm test\" when the command exists.": "コマンドが用意できたら aigate test --command \"npm test\" を実行してください。",
      "Run aigate test again after the agent finishes.": "エージェント完了後に aigate test を再実行してください。",
      "Tests already pass.": "テストはすでに通過しています。",
      "aigate git-ready": "aigate git-ready",
      "aigate push -u origin <branch>": "aigate push -u origin <branch>"
    },
    zh: {
      "AI remediation prompt was written.": "已写入 AI 修复提示。",
      "Add a package.json test, test:ci, or ci script.": "在 package.json 中添加 test、test:ci 或 ci script。",
      "Add a package.json test, test:ci, or ci script in the root or a workspace package.": "在根目录或工作区 package.json 中添加 test、test:ci 或 ci script。",
      "Resolve AIGate git-ready blockers first.": "先解决 AIGate git-ready blockers。",
      "Review the AI agent output.": "检查 AI agent 输出。",
      "Run aigate aitest after blockers are fixed.": "blockers 修复后运行 aigate aitest。",
      "Run aigate aitest to generate an AI remediation prompt.": "运行 aigate aitest 生成 AI 修复提示。",
      "Run aigate git-ready": "运行 aigate git-ready。",
      "Run aigate push -u origin <branch> when ready.": "准备好后运行 aigate push -u origin <branch>。",
      "Run aigate test --command \"<your test command>\" when the command is custom.": "如果使用自定义命令，请运行 aigate test --command \"<test command>\"。",
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

function buildGitReadyResult(options = {}) {
  const status = buildGitStatus();
  const evaluation = buildEvaluation(options);
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

  if (analysis.sensitiveRemovals.length) {
    warnings.push(sensitiveRemovalWarning(analysis.sensitiveRemovals));
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
    sensitiveRemovals: analysis.sensitiveRemovals,
    blockers,
    warnings,
    recommendation: blockers.length
      ? "Resolve blockers before committing, pushing, or opening a pull request."
      : "Run AIGate test, commit focused changes, push the branch, and open a pull request."
  };
}

function sensitiveRemovalWarning(sensitiveRemovals) {
  const exposedCount = sensitiveRemovals.filter((finding) => finding.exposedInHistory).length;
  if (exposedCount) {
    return `${sensitiveRemovals.length} sensitive file removal(s) detected; ${exposedCount} had Git history exposure, so commit the removal and rotate exposed credentials.`;
  }

  return `${sensitiveRemovals.length} sensitive file removal(s) detected; commit the removal. No Git history exposure was detected.`;
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
    t(language, "gitReady.sensitiveRemovals", { count: result.sensitiveRemovals.length }),
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
  const report = buildReport(type, options);
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
  const evaluation = buildEvaluation({
    deep: Boolean(options.deep),
    projectType: options.projectType,
    hosting: options.hosting,
    ciProvider: options.ciProvider,
    packageManager: options.packageManager
  });

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

  const rows = evaluation.checks.map((check) => formatCheckLine(check, translateEvaluationCheckName, language));
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
  const check = buildReleaseCheck({
    checkNpm: Boolean(options.npm),
    projectType: options.projectType,
    hosting: options.hosting,
    ciProvider: options.ciProvider,
    packageManager: options.packageManager
  });

  if (options.format === "json") {
    return JSON.stringify(check, null, 2);
  }

  const rows = check.checks.map((item) => formatCheckLine(item, translateReleaseCheckName, language));
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
    const profile = detectProjectProfile(readJsonFile("package.json"), options);
    const files = buildBranchStrategyFiles(strategy, options.outputDir ?? ".", language, profile);
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
  const entries = getChangedEntries();
  const paths = entries.map((entry) => entry.path);
  return {
    entries,
    paths,
    secretFindings: scanSecrets(entries),
    sensitiveRemovals: sensitiveRemovalFindings(entries)
  };
}

function getChangedPaths() {
  return getChangedEntries().map((entry) => entry.path);
}

function getChangedEntries() {
  const outputs = [
    git(["diff", "--name-status", "HEAD"]),
    git(["diff", "--name-status", "--cached"])
  ];
  const entries = new Map();

  for (const entry of outputs
    .flatMap((output) => (output ?? "").split("\n"))
    .map(parseNameStatusEntry)
    .filter(Boolean)
    .filter((entry) => !entry.path.startsWith(".git/"))) {
    addChangeEntry(entries, entry.path, entry.status);
  }

  for (const path of (git(["ls-files", "--others", "--exclude-standard"]) ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !item.startsWith(".git/"))) {
    addChangeEntry(entries, path, "??");
  }

  return [...entries.entries()].map(([path, statuses]) => ({
    path,
    statuses,
    action: statuses.every((status) => status.startsWith("D")) ? "deleted" : "active"
  }));
}

function parseNameStatusEntry(line) {
  const parts = line.trim().split(/\t+/).filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const status = parts[0];
  const path = status.startsWith("R") || status.startsWith("C")
    ? parts[2] ?? parts[1]
    : parts[1];

  return path ? { status, path } : null;
}

function addChangeEntry(entries, path, status) {
  const statuses = entries.get(path) ?? [];
  statuses.push(status);
  entries.set(path, statuses);
}

function scanSecrets(entries) {
  const findings = [];

  for (const entry of normalizeChangeEntries(entries)) {
    const filePath = entry.path;
    const pathFinding = sensitivePathFinding(filePath);
    if (pathFinding && entry.action !== "deleted") {
      findings.push(pathFinding);
    }

    if (entry.action === "deleted" || !existsSync(filePath) || !isScannableFile(filePath)) {
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

function sensitiveRemovalFindings(entries) {
  return normalizeChangeEntries(entries)
    .filter((entry) => entry.action === "deleted")
    .map((entry) => sensitivePathFinding(entry.path))
    .filter(Boolean)
    .map((finding) => ({
      ...finding,
      disposition: "removed",
      exposedInHistory: pathExistsInGitHistory(finding.file)
    }));
}

function pathExistsInGitHistory(filePath) {
  return Boolean((git(["log", "--all", "--format=%H", "--", filePath]) ?? "").trim());
}

function normalizeChangeEntries(entries) {
  return entries.map((entry) => (
    typeof entry === "string" ? { path: entry, statuses: ["?"], action: "active" } : entry
  ));
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
  const changedEntries = insideGitRepository ? getChangedEntries() : [];
  const changedPaths = changedEntries.map((entry) => entry.path);
  const highRisk = changedEntries.some((entry) => entry.action !== "deleted" && isHighRiskPath(entry.path));

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
    changedEntries,
    riskLevel: highRisk ? "high" : changedFiles.length ? "medium" : "low",
    recommendation
  };
}

function isHighRiskPath(filePath) {
  return /(\.env|secret|token|private[_-]?key)/i.test(filePath) || isSensitiveAuthStatePath(filePath);
}

function buildEvaluation(options = {}) {
  const packageJson = readJsonFile("package.json");
  const profile = detectProjectProfile(packageJson, options);
  const enforcement = detectAigateEnforcement(profile, packageJson);
  const githubOnlyReason = "GitHub-specific check is not required for this repository profile.";
  const publicOnlyReason = "Public repository governance check is not required for a private app profile.";
  const packageOnlyReason = "Package release check is not required for an app profile.";
  const check = (category, name, pass, checkOptions = {}) => makeCheck(category, name, pass, checkOptions);
  const reviewTemplateCheckName = profile.hosting === "gitlab" ? "Merge request template exists" : "Pull request template exists";
  const checks = [
    check("git_workflow", "AIGate configuration exists", existsSync(".aigate.yml")),
    check("git_workflow", "Branch strategy is documented", existsSync(join("docs", "branch-strategy.md"))),
    check("git_workflow", "Git upload workflow is documented", existsSync(join("docs", "git-upload-workflow.md"))),
    check("git_workflow", reviewTemplateCheckName, hasPullRequestTemplate(profile)),
    check("git_workflow", "CODEOWNERS exists", hasCodeowners()),
    check("pr_quality", "Contribution guide exists", existsSync("CONTRIBUTING.md"), {
      applicable: profile.visibility !== "private" || existsSync("CONTRIBUTING.md"),
      reason: publicOnlyReason
    }),
    check("pr_quality", "Issue templates exist", hasIssueTemplates(profile), {
      applicable: profile.visibility !== "private" || hasIssueTemplates(profile),
      reason: publicOnlyReason
    }),
    check("pr_quality", "AI assistant instructions exist", hasAiAssistantInstructions()),
    check("testing", "Test directory exists", hasTestDirectory()),
    check("testing", "Project test command exists", hasTestScript(packageJson)),
    check("testing", "CI gate script exists", hasCiGateScript(packageJson)),
    check("ci_cd", "CI workflow exists", hasCiWorkflow(profile)),
    check("ci_cd", "AIGate CI gate exists", enforcement.ciGateExists, {
      applicable: hasCiWorkflow(profile),
      reason: "AIGate CI gate requires a CI workflow.",
      value: enforcement.ciGateValue
    }),
    check("ci_cd", "AIGate server enforcement exists", enforcement.serverEnforced, {
      applicable: enforcement.ciGateExists,
      reason: "AIGate server enforcement requires a CI gate first.",
      value: enforcement.serverReason
    }),
    check("ci_cd", "Release workflow exists", hasReleaseWorkflow(profile), {
      applicable: profile.kind === "package" || hasReleaseWorkflow(profile),
      reason: packageOnlyReason
    }),
    check("ci_cd", "Dependabot exists", existsSync(join(".github", "dependabot.yml")), {
      applicable: profile.hosting === "github" || existsSync(join(".github", "dependabot.yml")),
      reason: githubOnlyReason
    }),
    check("security", "Security policy exists", existsSync("SECURITY.md")),
    check("security", "Security scanning is documented", hasSecurityScanningDocumentation()),
    check("security", "OpenSSF Scorecard workflow exists", existsSync(join(".github", "workflows", "scorecard.yml")), {
      applicable: (profile.hosting === "github" && profile.visibility !== "private") || existsSync(join(".github", "workflows", "scorecard.yml")),
      reason: profile.hosting === "github" ? publicOnlyReason : githubOnlyReason
    }),
    check("documentation", "README exists", existsSync("README.md")),
    check("documentation", "License exists", existsSync("LICENSE"), {
      applicable: profile.visibility !== "private" || existsSync("LICENSE"),
      reason: publicOnlyReason
    }),
    check("documentation", "Changelog exists", existsSync("CHANGELOG.md"), {
      applicable: profile.kind === "package" || existsSync("CHANGELOG.md"),
      reason: packageOnlyReason
    }),
    check("documentation", "Roadmap exists", existsSync(join("docs", "roadmap.md")), {
      applicable: profile.visibility !== "private" || existsSync(join("docs", "roadmap.md")),
      reason: publicOnlyReason
    }),
    check("maintainability", "Package metadata exists", existsSync("package.json")),
    check("maintainability", "Support policy exists", existsSync("SUPPORT.md"), {
      applicable: profile.visibility !== "private" || existsSync("SUPPORT.md"),
      reason: publicOnlyReason
    }),
    check("maintainability", "Governance exists", existsSync("GOVERNANCE.md"), {
      applicable: profile.visibility !== "private" || existsSync("GOVERNANCE.md"),
      reason: publicOnlyReason
    })
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
    const applicableChecks = categoryChecks.filter((check) => check.applicable !== false);
    const passed = applicableChecks.filter((check) => check.pass).length;
    const total = applicableChecks.length;
    return {
      name,
      weight,
      passed,
      total,
      skipped: categoryChecks.length - total,
      score: total === 0 ? weight : Math.round((passed / total) * weight)
    };
  });
  const score = categories.reduce((sum, category) => sum + category.score, 0);
  const grade = gradeForScore(score);
  const privateApp = profile.visibility === "private" && profile.kind === "app";
  const recommendation = score === 100
    ? "Repository foundations are ready for the next MVP slice."
    : privateApp
      ? "Complete missing foundations that match this private app profile."
      : "Complete the missing repository foundations before public release.";
  const evaluation = {
    score,
    grade,
    profile,
    categories,
    checks,
    enforcement,
    recommendation
  };

  if (options.deep) {
    evaluation.deepSignals = buildDeepSignals();
  }

  return evaluation;
}

function makeCheck(category, name, pass, options = {}) {
  const applicable = options.applicable !== false;
  const check = {
    category,
    name,
    pass: applicable ? Boolean(pass) : false,
    applicable
  };

  if (!applicable && options.reason) {
    check.reason = options.reason;
  }

  if (options.value !== undefined) {
    check.value = options.value;
  }

  check.status = checkStatus(check);
  return check;
}

function detectProjectProfile(packageJson = readJsonFile("package.json"), options = {}) {
  const profileOptions = resolveProjectProfileOptions(options);
  const packageManager = normalizePackageManager(profileOptions.packageManager) ?? detectPackageManager(packageJson);
  const repositoryUrl = String(packageJson.repository?.url ?? packageJson.repository ?? git(["remote", "get-url", "origin"]) ?? "");
  const hosting = normalizeHosting(profileOptions.hosting) ?? detectHosting(repositoryUrl);
  const visibility = packageJson.private === true ? "private" : "public";
  const explicitType = normalizeProjectType(profileOptions.projectType);
  const explicitCiProvider = normalizeCiProvider(profileOptions.ciProvider);
  const npmEntrypoint = hasNpmEntrypoint(packageJson);
  const appSignals = packageJson.private === true ||
    existsSync("pnpm-workspace.yaml") ||
    Boolean(packageJson.workspaces) ||
    existsSync("apps") ||
    Boolean(packageJson.scripts?.dev || packageJson.scripts?.start);
  const kind = explicitType ?? (appSignals && !npmEntrypoint ? "app" : "package");
  const ciProvider = explicitCiProvider ?? (existsSync(".gitlab-ci.yml")
    ? "gitlab"
    : existsSync(join(".github", "workflows"))
      ? "github"
      : hosting);

  return {
    kind,
    visibility,
    hosting,
    ciProvider,
    packageManager,
    npmEntrypoint,
    publishableNpmPackage: kind === "package" && packageJson.private !== true,
    privatePackage: packageJson.private === true
  };
}

function resolveProjectProfileOptions(options = {}) {
  const settings = readSettings();
  const config = readCurrentAigateConfig(options.config ?? ".aigate.yml");
  const projectConfig = config.project ?? {};

  return {
    projectType: options.projectType ?? settings.projectType ?? settings.project?.type ?? projectConfig.type,
    hosting: options.hosting ?? settings.hosting ?? settings.project?.hosting ?? projectConfig.hosting,
    ciProvider: options.ciProvider ?? settings.ciProvider ?? settings.project?.ciProvider ?? projectConfig.ciProvider,
    packageManager: options.packageManager ?? settings.packageManager ?? settings.project?.packageManager ?? projectConfig.packageManager
  };
}

function resolveWorkflowSettings(options = {}, profile = {}, packageJson = readJsonFile("package.json")) {
  const settings = normalizeSettings(readSettings());
  const config = readCurrentAigateConfig(options.config ?? ".aigate.yml");
  const projectConfig = config.project ?? {};
  const branchConfig = config.branchStrategy ?? {};
  const defaultBranch = branchSettingValue(
    options.defaultBranch ?? settings.defaultBranch ?? projectConfig.defaultBranch,
    "main"
  );
  const targetBranch = branchSettingValue(
    options.targetBranch ?? options.base ?? settings.targetBranch ?? projectConfig.targetBranch,
    defaultBranch
  );
  const protectedBranches = listSettingValue(
    options.protectedBranches ?? options.protectedBranch ?? branchConfig.protectedBranches,
    settings.protectedBranches
  );
  const workBranches = listSettingValue(
    options.workBranches ?? options.workBranch ?? branchConfig.workBranches,
    settings.workBranches
  );
  const requiredChecks = listSettingValue(options.requiredChecks ?? options.requiredCheck, settings.requiredChecks);
  const qualityCommands = listSettingValue(options.qualityCommands ?? options.qualityCommand, settings.qualityCommands);
  const aiProviders = integrationProviderListSetting(
    options.aiProviders ?? options.providers ?? options.provider,
    settings.aiProviders
  );
  const distribution = settingValue(options.distribution, settings.distribution, normalizeDistribution, "auto");
  const branchStrategy = settingValue(options.branchStrategy, settings.branchStrategy, normalizeBranchStrategySetting, "auto");

  return {
    defaultBranch,
    targetBranch,
    protectedBranches,
    workBranches,
    requiredChecks,
    qualityCommands,
    aiProviders,
    distribution,
    branchStrategy,
    profile,
    packageName: packageJson.name ?? ""
  };
}

function readCurrentAigateConfig(filePath = ".aigate.yml") {
  const config = readAigateConfig(filePath);

  if (isStaleGeneratedAigateConfig(config)) {
    return {};
  }

  return config;
}

function isStaleGeneratedAigateConfig(config = {}) {
  const generatedVersion = generatedByVersion(config.generatedBy);
  return Boolean(generatedVersion && generatedVersion !== VERSION);
}

function generatedByVersion(value) {
  const match = String(value ?? "").match(/\baigate\s+([0-9][^\s]*)/i);
  return match?.[1] ?? null;
}

function normalizeProjectType(value) {
  const normalized = String(value ?? "auto").trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return null;
  }

  return ["app", "package"].includes(normalized) ? normalized : null;
}

function normalizeHosting(value) {
  const normalized = String(value ?? "auto").trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return null;
  }

  return ["github", "gitlab", "other", "unknown"].includes(normalized) ? normalized : null;
}

function normalizeCiProvider(value) {
  return normalizeHosting(value);
}

function normalizePackageManager(value) {
  const normalized = String(value ?? "auto").trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return null;
  }

  return ["npm", "pnpm", "yarn", "bun", "unknown"].includes(normalized) ? normalized : null;
}

function settingValue(optionValue, currentValue, normalize, fallback = "auto") {
  const value = optionValue ?? currentValue ?? fallback;
  const text = String(value ?? fallback).trim().toLowerCase();
  if (!text || text === "auto") {
    return "auto";
  }

  return normalize(text) ?? fallback;
}

function normalizeSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    distribution: normalizeDistribution(settings.distribution) ?? DEFAULT_SETTINGS.distribution,
    defaultBranch: branchSettingValue(settings.defaultBranch, DEFAULT_SETTINGS.defaultBranch),
    targetBranch: branchSettingValue(settings.targetBranch, settings.defaultBranch ?? DEFAULT_SETTINGS.targetBranch),
    branchStrategy: normalizeBranchStrategySetting(settings.branchStrategy) ?? DEFAULT_SETTINGS.branchStrategy,
    protectedBranches: normalizeListSetting(settings.protectedBranches),
    workBranches: normalizeListSetting(settings.workBranches).length
      ? normalizeListSetting(settings.workBranches)
      : [...DEFAULT_WORK_BRANCHES],
    requiredChecks: normalizeListSetting(settings.requiredChecks),
    qualityCommands: normalizeListSetting(settings.qualityCommands),
    aiProviders: normalizeIntegrationProviderList(settings.aiProviders),
    aiRootFiles: normalizeAiRootFilesMode(settings.aiRootFiles) ?? DEFAULT_SETTINGS.aiRootFiles,
    serverEnforcement: serverEnforcementSetting({}, settings)
  };
}

function settingsSummary(settings = {}) {
  const normalized = normalizeSettings(settings);
  return {
    ...normalized,
    workBranches: normalized.workBranches.length ? normalized.workBranches.join(", ") : DEFAULT_WORK_BRANCHES.join(", "),
    requiredChecks: normalized.requiredChecks.length ? normalized.requiredChecks.join(", ") : "auto",
    qualityCommands: normalized.qualityCommands.length ? normalized.qualityCommands.join(", ") : "auto",
    aiProviders: normalized.aiProviders.length ? normalized.aiProviders.join(", ") : "all"
  };
}

function branchSettingValue(optionValue, currentValue, fallback = "main") {
  const value = optionValue ?? currentValue ?? fallback;
  const text = String(value ?? fallback).trim();
  return text && text.toLowerCase() !== "auto" ? text : fallback;
}

function listSettingValue(optionValue, currentValue = []) {
  if (optionValue === undefined || optionValue === null) {
    return normalizeListSetting(currentValue);
  }

  return normalizeListSetting(optionValue);
}

function normalizeListSetting(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  const text = String(value ?? "").trim();
  if (!text || ["auto", "none", "false", "off"].includes(text.toLowerCase())) {
    return [];
  }

  return [...new Set(text.split(/\s*,\s*/).map((item) => item.trim()).filter(Boolean))];
}

function integrationProviderListSetting(optionValue, currentValue = []) {
  if (optionValue === undefined || optionValue === null) {
    return normalizeIntegrationProviderList(currentValue);
  }

  return normalizeIntegrationProviderList(optionValue);
}

function aiRootFilesSettingValue(optionValue, currentValue = DEFAULT_SETTINGS.aiRootFiles) {
  const value = optionValue ?? currentValue ?? DEFAULT_SETTINGS.aiRootFiles;
  return normalizeAiRootFilesMode(value) ?? DEFAULT_SETTINGS.aiRootFiles;
}

function serverEnforcementSetting(options = {}, currentSettings = {}) {
  const current = currentSettings.serverEnforcement ?? {};
  const gitlabPipeline = setupBooleanSettingValue(
    options.gitlabPipelineMustSucceed ?? options.gitlabPipelineRequired ?? options.gitlabRequiredPipeline,
    current.gitlab?.onlyAllowMergeIfPipelineSucceeds
  );
  const githubRequiredChecks = setupBooleanSettingValue(
    options.githubRequiredChecksEnforced ?? options.githubRequiredChecks,
    current.github?.requiredChecksEnforced
  );

  return {
    ...current,
    gitlab: {
      ...(current.gitlab ?? {}),
      onlyAllowMergeIfPipelineSucceeds: gitlabPipeline
    },
    github: {
      ...(current.github ?? {}),
      requiredChecksEnforced: githubRequiredChecks
    }
  };
}

function setupBooleanSettingValue(optionValue, currentValue) {
  if (optionValue === undefined) {
    return currentValue ?? "auto";
  }

  if (String(optionValue ?? "").trim().toLowerCase() === "verified") {
    return "verified";
  }

  const normalized = normalizeBooleanEvidence(optionValue);
  return normalized.known ? normalized.value : "auto";
}

function normalizeIntegrationProviderList(value) {
  const providers = normalizeListSetting(value);
  if (providers.some((provider) => provider.toLowerCase() === "all")) {
    return [...SUPPORTED_INTEGRATIONS];
  }

  return [...new Set(providers
    .map((provider) => provider.toLowerCase())
    .filter((provider) => SUPPORTED_INTEGRATIONS.includes(provider)))];
}

function normalizeAiRootFilesMode(value) {
  const normalized = String(value ?? DEFAULT_SETTINGS.aiRootFiles).trim().toLowerCase().replace(/[_\s]+/g, "-");
  const aliases = {
    protected: "protect",
    keep: "protect",
    safe: "protect",
    "sidecar-only": "sidecar",
    skip: "sidecar",
    none: "sidecar",
    off: "sidecar",
    false: "sidecar",
    replace: "overwrite",
    force: "overwrite"
  };
  const mode = aliases[normalized] ?? normalized;
  return AI_ROOT_FILE_MODES.includes(mode) ? mode : null;
}

function normalizeDistribution(value) {
  const normalized = String(value ?? "auto").trim().toLowerCase();
  if (!normalized || normalized === "auto") {
    return "auto";
  }

  return ["none", "npm"].includes(normalized) ? normalized : null;
}

function normalizeBranchStrategySetting(value) {
  if (value === undefined || value === null) {
    return "auto";
  }

  return normalizeBranchStrategyName(value) ?? (String(value).trim().toLowerCase() === "auto" ? "auto" : null);
}

function normalizeBranchStrategyName(value) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  const aliases = {
    "github-flow": "GitHub Flow with release channels",
    "github": "GitHub Flow with release channels",
    "gitlab-flow": "GitLab Flow with merge requests",
    "gitlab": "GitLab Flow with merge requests",
    "trunk": "Trunk-Based Development",
    "trunk-based": "Trunk-Based Development",
    "trunk-based-development": "Trunk-Based Development",
    "hybrid": "Hybrid Flow",
    "hybrid-flow": "Hybrid Flow",
    "git-flow": "Git Flow",
    "gitflow": "Git Flow"
  };

  return aliases[normalized] ?? null;
}

function projectProfileOptionArgs(options = {}) {
  const pairs = [
    ["--project-type", options.projectType],
    ["--hosting", options.hosting],
    ["--ci-provider", options.ciProvider],
    ["--package-manager", options.packageManager]
  ];

  return pairs.flatMap(([name, value]) => (
    value === undefined || value === null || value === false ? [] : [name, String(value)]
  ));
}

function detectHosting(url) {
  const value = String(url ?? "").toLowerCase();
  if (value.includes("github.com")) {
    return "github";
  }

  if (value.includes("gitlab")) {
    return "gitlab";
  }

  return value ? "other" : "unknown";
}

function detectPackageManager(packageJson = readJsonFile("package.json")) {
  const declared = String(packageJson.packageManager ?? "").split("@")[0].trim().toLowerCase();
  if (["npm", "pnpm", "yarn", "bun"].includes(declared)) {
    return declared;
  }

  if (existsSync("pnpm-lock.yaml")) {
    return "pnpm";
  }

  if (existsSync("yarn.lock")) {
    return "yarn";
  }

  if (existsSync("bun.lockb") || existsSync("bun.lock")) {
    return "bun";
  }

  if (existsSync("package-lock.json")) {
    return "npm";
  }

  return "unknown";
}

function pathExistsAny(paths) {
  return paths.some((path) => existsSync(path));
}

function hasPullRequestTemplate(profile) {
  const githubTemplates = [
    join(".github", "pull_request_template.md"),
    join(".github", "PULL_REQUEST_TEMPLATE.md"),
    join(".github", "PULL_REQUEST_TEMPLATE")
  ];
  const gitlabTemplates = [
    join(".gitlab", "merge_request_templates"),
    join(".gitlab", "merge_request_template.md")
  ];
  if (profile.hosting === "gitlab") {
    return pathExistsAny(gitlabTemplates);
  }

  if (profile.hosting === "github") {
    return pathExistsAny(githubTemplates);
  }

  return pathExistsAny([...githubTemplates, ...gitlabTemplates]);
}

function hasIssueTemplates(profile) {
  const githubTemplates = [join(".github", "ISSUE_TEMPLATE")];
  const gitlabTemplates = [join(".gitlab", "issue_templates")];
  if (profile.hosting === "gitlab") {
    return pathExistsAny(gitlabTemplates);
  }

  if (profile.hosting === "github") {
    return pathExistsAny(githubTemplates);
  }

  return pathExistsAny([...githubTemplates, ...gitlabTemplates]);
}

function hasCodeowners() {
  return pathExistsAny([
    join(".github", "CODEOWNERS"),
    join(".gitlab", "CODEOWNERS"),
    join("docs", "CODEOWNERS"),
    "CODEOWNERS"
  ]);
}

function hasAiAssistantInstructions() {
  return pathExistsAny([
    "AGENTS.md",
    "GEMINI.md",
    "CLAUDE.md",
    join(".aigate", "integrations", "codex.md"),
    join(".aigate", "integrations", "gemini.md"),
    join(".aigate", "integrations", "claude.md")
  ]);
}

function hasSecurityScanningDocumentation() {
  if (pathExistsAny([
    join("docs", "security-scanning.md"),
    join("docs", "security.md"),
    join(".gitlab", "security-scanning.md")
  ])) {
    return true;
  }

  return fileMatchesAny("SECURITY.md", [/aigate report --format sarif/i, /\bsarif\b/i, /\bgitleaks\b/i, /detect-secrets/i]) ||
    fileMatchesAny(".gitlab-ci.yml", [/\bgitleaks\b/i, /detect-secrets/i, /aigate report --format sarif/i, /\bsast\b/i]) ||
    fileMatchesAny(join(".github", "workflows", "scorecard.yml"), [/scorecard/i]);
}

function hasTestDirectory() {
  return pathExistsAny(["test", "tests", "__tests__", join("src", "__tests__"), "playwright"]) ||
    hasNestedDirectory(["apps", "packages", "services"], ["test", "tests", "__tests__", "playwright"]);
}

function hasTestScript(packageJson = readJsonFile("package.json")) {
  return Boolean(discoverProjectTestCommand(packageJson, detectProjectProfile(packageJson)));
}

function hasCiGateScript(packageJson = readJsonFile("package.json")) {
  const profile = detectProjectProfile(packageJson);
  return Boolean(resolveWorkflowSettings({}, profile, packageJson).qualityCommands.length || discoverValidationCommand(packageJson, profile));
}

function hasNestedDirectory(baseDirs, names) {
  return baseDirs.some((baseDir) => {
    if (!existsSync(baseDir)) {
      return false;
    }

    try {
      return readdirSync(baseDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .some((entry) => names.some((name) => existsSync(join(baseDir, entry.name, name))));
    } catch {
      return false;
    }
  });
}

function discoverProjectTestCommand(packageJson = readJsonFile("package.json"), profile = detectProjectProfile(packageJson), requestedScript = null) {
  const packageManager = profile.packageManager ?? detectPackageManager(packageJson);
  const rootScripts = packageJson.scripts ?? {};
  const rootScript = requestedScript ?? selectScriptName(rootScripts, ["ci", "test:ci", "test", "e2e", "test:e2e", "playwright"]);

  if (rootScript && rootScripts[rootScript]) {
    return packageManagerCommand(packageManager, rootScript, {
      source: "root-script"
    });
  }

  const turboTask = requestedScript ?? detectTurboTask(["test", "e2e", "test:e2e", "playwright"]);
  if (turboTask && hasTurboRunner(packageJson)) {
    return turboCommand(packageManager, turboTask);
  }

  const workspaceScript = requestedScript
    ? workspacePackagesWithScript(requestedScript)[0]?.script
    : selectWorkspaceScript(["ci", "test:ci", "test", "e2e", "test:e2e", "playwright"]);

  if (workspaceScript) {
    return workspaceScriptCommand(packageManager, workspaceScript);
  }

  return null;
}

function discoverValidationCommand(packageJson = readJsonFile("package.json"), profile = detectProjectProfile(packageJson)) {
  const packageManager = profile.packageManager ?? detectPackageManager(packageJson);
  const rootScripts = packageJson.scripts ?? {};
  const rootScript = selectScriptName(rootScripts, ["ci", "test:ci", "git:ready", "test", "frontend-test", "e2e", "test:e2e"]);

  if (rootScript) {
    return packageManagerCommand(packageManager, rootScript, {
      source: "root-script"
    });
  }

  const turboTask = detectTurboTask(["ci", "test", "e2e", "test:e2e"]);
  if (turboTask && hasTurboRunner(packageJson)) {
    return turboCommand(packageManager, turboTask);
  }

  const workspaceScript = selectWorkspaceScript(["ci", "test:ci", "test", "frontend-test", "e2e", "test:e2e"]);
  return workspaceScript ? workspaceScriptCommand(packageManager, workspaceScript) : null;
}

function selectScriptName(scripts = {}, preferredNames = []) {
  for (const name of preferredNames) {
    if (scripts[name]) {
      return name;
    }
  }

  return Object.keys(scripts).find((name) => name.endsWith(":test") || name.includes("test"));
}

function detectTurboTask(preferredNames = []) {
  if (!existsSync("turbo.json")) {
    return null;
  }

  const turbo = readJsonFile("turbo.json");
  const tasks = turbo.tasks ?? turbo.pipeline ?? {};
  for (const name of preferredNames) {
    if (tasks[name]) {
      return name;
    }
  }

  return Object.keys(tasks).find((name) => name.endsWith(":test") || name.includes("test")) ?? null;
}

function hasTurboRunner(packageJson = readJsonFile("package.json")) {
  return Boolean(
    hasPackageDependency(packageJson, "turbo") ||
    existsSync(join("node_modules", ".bin", "turbo")) ||
    existsSync(join("node_modules", ".bin", "turbo.cmd"))
  );
}

function hasPackageDependency(packageJson = {}, dependencyName) {
  return [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies
  ].some((dependencies) => Boolean(dependencies?.[dependencyName]));
}

function selectWorkspaceScript(preferredNames = []) {
  const packages = workspacePackages();
  for (const script of preferredNames) {
    if (packages.some((workspacePackage) => workspacePackage.scripts[script])) {
      return script;
    }
  }

  return packages.flatMap((workspacePackage) => Object.keys(workspacePackage.scripts))
    .find((script) => script.endsWith(":test") || script.includes("test")) ?? null;
}

function workspacePackagesWithScript(script) {
  return workspacePackages().filter((workspacePackage) => workspacePackage.scripts[script]);
}

function workspacePackages(packageJson = readJsonFile("package.json")) {
  const packagePaths = workspacePackageJsonPaths(packageJson);
  return packagePaths.map((packagePath) => {
    const workspacePackageJson = readJsonFile(packagePath);
    return {
      path: packagePath,
      packageJson: workspacePackageJson,
      scripts: workspacePackageJson.scripts ?? {}
    };
  }).filter((workspacePackage) => Object.keys(workspacePackage.packageJson).length);
}

function workspacePackageJsonPaths(packageJson = readJsonFile("package.json")) {
  const patterns = workspacePatterns(packageJson);
  const paths = new Set();

  for (const pattern of patterns) {
    for (const packagePath of expandWorkspacePattern(pattern)) {
      paths.add(packagePath);
    }
  }

  return [...paths].filter((packagePath) => existsSync(packagePath));
}

function workspacePatterns(packageJson = readJsonFile("package.json")) {
  const patterns = [];
  const workspaces = packageJson.workspaces;

  if (Array.isArray(workspaces)) {
    patterns.push(...workspaces);
  } else if (Array.isArray(workspaces?.packages)) {
    patterns.push(...workspaces.packages);
  }

  if (existsSync("pnpm-workspace.yaml")) {
    patterns.push(...parsePnpmWorkspacePatterns(readFileSync("pnpm-workspace.yaml", "utf8")));
  }

  if (existsSync("turbo.json") || existsSync("apps") || existsSync("packages")) {
    patterns.push("apps/*", "packages/*");
  }

  return [...new Set(patterns.map(cleanWorkspacePattern).filter(Boolean).filter((pattern) => !pattern.startsWith("!")))];
}

function parsePnpmWorkspacePatterns(content) {
  const patterns = [];
  let inPackages = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (/^packages:\s*$/.test(line.trim())) {
      inPackages = true;
      continue;
    }

    if (inPackages && /^\S/.test(line) && !/^packages:\s*$/.test(line.trim())) {
      inPackages = false;
    }

    const match = inPackages ? line.match(/^\s*-\s*(.+?)\s*$/) : null;
    if (match) {
      patterns.push(match[1]);
    }
  }

  return patterns;
}

function cleanWorkspacePattern(pattern) {
  return String(pattern ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/package\.json$/, "")
    .replace(/\/$/, "");
}

function expandWorkspacePattern(pattern) {
  const clean = cleanWorkspacePattern(pattern);
  if (!clean || clean.includes("**")) {
    return [];
  }

  const starIndex = clean.indexOf("*");
  if (starIndex === -1) {
    return [join(clean, "package.json")];
  }

  const base = clean.slice(0, starIndex).replace(/\/$/, "");
  if (!base || !existsSync(base)) {
    return [];
  }

  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(base, entry.name, "package.json"));
  } catch {
    return [];
  }
}

function packageManagerCommand(packageManager, script, { source = "package-script" } = {}) {
  const pm = normalizedPackageManagerForCommand(packageManager);
  return {
    source,
    script,
    display: packageManagerScriptCommand(pm, script),
    executable: pm,
    args: packageManagerScriptArgs(pm, script),
    shell: false
  };
}

function workspaceScriptCommand(packageManager, script) {
  const pm = normalizedPackageManagerForCommand(packageManager);
  if (pm === "pnpm") {
    return {
      source: "workspace-script",
      script,
      display: `pnpm -r run ${script}`,
      executable: "pnpm",
      args: ["-r", "run", script],
      shell: false
    };
  }

  if (pm === "yarn") {
    return {
      source: "workspace-script",
      script,
      display: `yarn workspaces foreach run ${script}`,
      executable: "yarn",
      args: ["workspaces", "foreach", "run", script],
      shell: false
    };
  }

  if (pm === "bun") {
    return {
      source: "workspace-script",
      script,
      display: `bun run --filter '*' ${script}`,
      executable: "bun",
      args: ["run", "--filter", "*", script],
      shell: false
    };
  }

  return {
    source: "workspace-script",
    script,
    display: `npm run ${script} --workspaces`,
    executable: "npm",
    args: ["run", script, "--workspaces"],
    shell: false
  };
}

function turboCommand(packageManager, task) {
  const pm = normalizedPackageManagerForCommand(packageManager);
  if (pm === "npm") {
    return {
      source: "turbo-task",
      script: task,
      display: `npx turbo run ${task}`,
      executable: "npx",
      args: ["turbo", "run", task],
      shell: false
    };
  }

  return {
    source: "turbo-task",
    script: task,
    display: `${pm} turbo run ${task}`,
    executable: pm,
    args: ["turbo", "run", task],
    shell: false
  };
}

function packageManagerScriptArgs(packageManager, script) {
  if (packageManager === "yarn") {
    return [script];
  }

  if (script === "test") {
    return ["test"];
  }

  return ["run", script];
}

function normalizedPackageManagerForCommand(packageManager) {
  return ["npm", "pnpm", "yarn", "bun"].includes(packageManager) ? packageManager : "npm";
}

function hasCiWorkflow(profile) {
  if (profile.ciProvider === "gitlab") {
    return existsSync(".gitlab-ci.yml");
  }

  if (profile.ciProvider === "github") {
    return existsSync(join(".github", "workflows", "ci.yml"));
  }

  return existsSync(join(".github", "workflows", "ci.yml")) || existsSync(".gitlab-ci.yml");
}

function hasAigateCiGate(profile) {
  return detectAigateEnforcement(profile).ciGateExists;
}

function detectAigateEnforcement(profile, packageJson = readJsonFile("package.json")) {
  const provider = profile.ciProvider ?? profile.hosting ?? "unknown";
  const workflowFiles = ciWorkflowFiles(profile);
  const ciGate = detectAigateCiGate(profile, packageJson, workflowFiles);
  const server = detectAigateServerEnforcement({ provider, ciGate });

  return {
    provider,
    ciGateExists: ciGate.exists,
    ciGateValue: ciGate.value,
    ciGateFiles: ciGate.files,
    ciGateJobs: ciGate.jobs,
    serverEnforced: server.pass,
    serverReason: server.reason,
    serverEvidence: server.evidence,
    level: server.pass ? "server" : ciGate.exists ? "ci-advisory" : "advisory"
  };
}

function ciWorkflowFiles(profile) {
  if (profile.ciProvider === "gitlab") {
    return gitlabWorkflowFiles();
  }

  if (profile.ciProvider === "github") {
    return githubWorkflowFiles();
  }

  return [
    ...githubWorkflowFiles(),
    ...gitlabWorkflowFiles()
  ];
}

function detectAigateCiGate(profile, packageJson, workflowFiles = ciWorkflowFiles(profile)) {
  if (profile.ciProvider === "gitlab") {
    const jobs = gitlabAigateGateJobs(workflowFiles, packageJson);
    return {
      exists: jobs.length > 0,
      value: jobs.length ? `gitlab jobs: ${jobs.map((job) => job.name).join(", ")}` : "missing",
      files: [...new Set(jobs.map((job) => job.filePath))],
      jobs
    };
  }

  const files = workflowFiles.filter((filePath) => fileContainsAigateGate(filePath, packageJson));
  return {
    exists: files.length > 0,
    value: files.length ? `workflow files: ${files.join(", ")}` : "missing",
    files,
    jobs: []
  };
}

function detectAigateServerEnforcement({ provider, ciGate }) {
  if (!ciGate.exists) {
    return {
      pass: false,
      reason: "AIGate CI gate is missing.",
      evidence: "missing-ci-gate"
    };
  }

  if (provider === "gitlab") {
    const blockingJobs = ciGate.jobs.filter((job) => job.blocking);
    const projectSetting = gitlabPipelineMustSucceedEvidence();

    if (!blockingJobs.length) {
      return {
        pass: false,
        reason: "GitLab AIGate job is manual, allow_failure, or not matched to merge requests.",
        evidence: "gitlab-job-not-blocking"
      };
    }

    if (projectSetting.value !== true) {
      return {
        pass: false,
        reason: projectSetting.known
          ? "GitLab only_allow_merge_if_pipeline_succeeds is false."
          : "GitLab only_allow_merge_if_pipeline_succeeds is not verified.",
        evidence: projectSetting.source
      };
    }

    if (!projectSetting.verified) {
      return {
        pass: false,
        reason: "GitLab only_allow_merge_if_pipeline_succeeds is declared but not live/API verified.",
        evidence: projectSetting.source
      };
    }

    return {
      pass: true,
      reason: `GitLab required pipeline with blocking AIGate job: ${blockingJobs.map((job) => job.name).join(", ")}`,
      evidence: projectSetting.source
    };
  }

  if (provider === "github") {
    const requiredChecks = githubRequiredChecksEvidence();
    return requiredChecks.value === true && requiredChecks.verified
      ? {
          pass: true,
          reason: "GitHub branch protection required checks are configured for the AIGate gate.",
          evidence: requiredChecks.source
        }
      : {
          pass: false,
          reason: requiredChecks.known && requiredChecks.value === true
            ? "GitHub branch protection required checks are declared but not live/API verified."
            : requiredChecks.known
              ? "GitHub branch protection required checks do not include the AIGate gate."
              : "GitHub branch protection required checks are not verified.",
          evidence: requiredChecks.source
        };
  }

  return {
    pass: false,
    reason: "Server-side required checks are not verified for this CI provider.",
    evidence: "unknown-provider"
  };
}

function gitlabWorkflowFiles() {
  if (!existsSync(".gitlab-ci.yml")) {
    return [];
  }

  return collectGitlabWorkflowFiles(".gitlab-ci.yml", new Set());
}

function collectGitlabWorkflowFiles(filePath, seen) {
  if (seen.has(filePath) || !existsSync(filePath)) {
    return [];
  }

  seen.add(filePath);
  const content = readFileSync(filePath, "utf8");
  return [
    filePath,
    ...gitlabLocalIncludes(content).flatMap((includePath) => collectGitlabWorkflowFiles(includePath, seen))
  ];
}

function gitlabLocalIncludes(content) {
  const includes = [];
  const localPattern = /\blocal:\s*['"]?([^'"\s#]+)['"]?/g;
  let match;

  while ((match = localPattern.exec(content)) !== null) {
    includes.push(normalizeGitlabLocalIncludePath(match[1]));
  }

  const inlinePattern = /^\s*-\s*['"]([^'"]+\.ya?ml)['"]\s*$/gm;
  while ((match = inlinePattern.exec(content)) !== null) {
    includes.push(normalizeGitlabLocalIncludePath(match[1]));
  }

  const singlePattern = /^include:\s*['"]([^'"]+\.ya?ml)['"]\s*$/gm;
  while ((match = singlePattern.exec(content)) !== null) {
    includes.push(normalizeGitlabLocalIncludePath(match[1]));
  }

  return [...new Set(includes)].filter(Boolean);
}

function normalizeGitlabLocalIncludePath(filePath) {
  return String(filePath ?? "").trim().replace(/^\//, "");
}

function gitlabAigateGateJobs(workflowFiles, packageJson) {
  const scripts = packageJson.scripts ?? {};
  return workflowFiles.flatMap((filePath) => {
    if (!existsSync(filePath)) {
      return [];
    }

    return gitlabJobBlocks(readFileSync(filePath, "utf8"))
      .filter((job) => commandRunsAigateGate(job.block, scripts))
      .map((job) => ({
        ...job,
        filePath,
        allowFailure: gitlabJobAllowsFailure(job.block),
        manual: gitlabJobIsManual(job.block),
        mergeRequestMatched: gitlabJobMatchesMergeRequest(job.block),
        blocking: gitlabJobIsBlocking(job.block)
      }));
  });
}

const GITLAB_RESERVED_TOP_LEVEL_KEYS = new Set([
  "after_script",
  "before_script",
  "cache",
  "default",
  "image",
  "include",
  "pages",
  "services",
  "stages",
  "variables",
  "workflow"
]);

function gitlabJobBlocks(content) {
  const jobs = [];
  const lines = String(content ?? "").split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9_.-]+):\s*(?:#.*)?$/);
    if (match) {
      if (current) {
        jobs.push(current);
      }

      const name = match[1];
      current = GITLAB_RESERVED_TOP_LEVEL_KEYS.has(name) || name.startsWith(".")
        ? null
        : { name, block: `${line}\n` };
      continue;
    }

    if (current) {
      current.block += `${line}\n`;
    }
  }

  if (current) {
    jobs.push(current);
  }

  return jobs;
}

function gitlabJobAllowsFailure(block) {
  return /^\s*allow_failure:\s*true\b/im.test(block);
}

function gitlabJobIsManual(block) {
  return /^\s*when:\s*manual\b/im.test(block);
}

function gitlabJobMatchesMergeRequest(block) {
  if (!/^\s*(rules|only|except):\s*$/im.test(block)) {
    return true;
  }

  if (/^\s*except:\s*(?:\[.*\bmerge_requests\b.*\]|.*\bmerge_requests\b.*)$/im.test(block)) {
    return false;
  }

  return /\b(merge_request_event|merge_requests|CI_MERGE_REQUEST)\b/i.test(block);
}

function gitlabJobIsBlocking(block) {
  return !gitlabJobAllowsFailure(block) && !gitlabJobIsManual(block) && gitlabJobMatchesMergeRequest(block);
}

function gitlabPipelineMustSucceedEvidence() {
  const settings = readSettings();
  const configured = firstConfiguredEvidence([
    { source: "settings", value: settings.serverEnforcement?.gitlab?.onlyAllowMergeIfPipelineSucceeds },
    { source: "settings", value: settings.enforcement?.gitlab?.onlyAllowMergeIfPipelineSucceeds },
    { source: "settings", value: settings.gitlab?.onlyAllowMergeIfPipelineSucceeds },
    { source: "env:AIGATE_GITLAB_PIPELINE_MUST_SUCCEED", value: process.env.AIGATE_GITLAB_PIPELINE_MUST_SUCCEED }
  ]);
  const normalized = normalizeBooleanEvidence(configured?.value);

  return normalized.known
    ? { ...normalized, source: evidenceSource(configured.source, normalized) }
    : { known: false, value: null, source: "unverified" };
}

function githubRequiredChecksEvidence() {
  const settings = readSettings();
  const configured = firstConfiguredEvidence([
    { source: "settings", value: settings.serverEnforcement?.github?.requiredChecksEnforced },
    { source: "settings", value: settings.enforcement?.github?.requiredChecksEnforced },
    { source: "settings", value: settings.github?.requiredChecksEnforced },
    { source: "env:AIGATE_GITHUB_REQUIRED_CHECKS_ENFORCED", value: process.env.AIGATE_GITHUB_REQUIRED_CHECKS_ENFORCED }
  ]);
  const normalized = normalizeBooleanEvidence(configured?.value);

  return normalized.known
    ? { ...normalized, source: evidenceSource(configured.source, normalized) }
    : { known: false, value: null, source: "unverified" };
}

function firstConfiguredEvidence(candidates) {
  return candidates.find(({ value }) => value !== undefined && value !== null && value !== "");
}

function normalizeBooleanEvidence(value) {
  const normalizedText = String(value ?? "").trim().toLowerCase();
  if (["verified", "verified:true", "api:true", "live:true"].includes(normalizedText)) {
    return { known: true, value: true, verified: true };
  }

  if (typeof value === "boolean") {
    return { known: true, value, verified: false };
  }

  if (["true", "1", "yes", "on", "required", "enforced"].includes(normalizedText)) {
    return { known: true, value: true, verified: false };
  }

  if (["false", "0", "no", "off", "optional", "disabled"].includes(normalizedText)) {
    return { known: true, value: false, verified: false };
  }

  return { known: false, value: null, verified: false };
}

function evidenceSource(source, evidence) {
  if (!evidence.value) {
    return source;
  }

  return evidence.verified ? `verified:${source}` : `declared:${source}`;
}

function githubWorkflowFiles() {
  const workflowsDir = join(".github", "workflows");
  if (!existsSync(workflowsDir)) {
    return [];
  }

  try {
    return readdirSync(workflowsDir)
      .filter((entry) => /\.(ya?ml)$/i.test(entry))
      .map((entry) => join(workflowsDir, entry));
  } catch {
    return [];
  }
}

function fileContainsAigateGate(filePath, packageJson) {
  if (!existsSync(filePath)) {
    return false;
  }

  const content = readFileSync(filePath, "utf8");
  if (/\baigate\s+git-ready\b/i.test(content) ||
      /\baigate-cli\s+git-ready\b/i.test(content) ||
      /\bnode\s+src\/cli\.mjs\s+git-ready\b/i.test(content) ||
      /\bcommand:\s*['"]?git-ready['"]?/i.test(content)) {
    return true;
  }

  const scripts = packageJson.scripts ?? {};
  return Object.entries(scripts).some(([name, command]) => (
    workflowRunsScript(content, name) && commandRunsAigateGate(command, scripts)
  ));
}

function workflowRunsScript(content, scriptName) {
  return packageManagerRunsScript(content, scriptName);
}

function commandRunsAigateGate(command, scripts = {}, seen = new Set()) {
  const text = String(command ?? "");
  if (/\baigate\s+git-ready\b/i.test(text) ||
      /\baigate-cli\s+git-ready\b/i.test(text) ||
      /\bnode\s+src\/cli\.mjs\s+git-ready\b/i.test(text)) {
    return true;
  }

  for (const referenced of referencedScripts(text, scripts)) {
    if (seen.has(referenced)) {
      continue;
    }
    seen.add(referenced);
    if (commandRunsAigateGate(scripts[referenced], scripts, seen)) {
      return true;
    }
  }

  return false;
}

function referencedScripts(command, scripts = {}) {
  const text = String(command ?? "");
  return Object.keys(scripts).filter((name) => (
    packageManagerRunsScript(text, name)
  ));
}

function packageManagerRunsScript(content, scriptName) {
  const escaped = escapeRegExp(scriptName);
  const npmDirectScripts = ["test", "start", "stop", "restart"];
  return new RegExp(`\\bnpm\\s+run\\s+${escaped}\\b`, "i").test(content) ||
    (npmDirectScripts.includes(scriptName) && new RegExp(`\\bnpm\\s+${escaped}\\b`, "i").test(content)) ||
    new RegExp(`\\b(pnpm|yarn|bun)\\s+(?:run\\s+)?${escaped}\\b`, "i").test(content);
}

function hasReleaseWorkflow(profile = {}) {
  if (profile.ciProvider === "github") {
    return existsSync(join(".github", "workflows", "release.yml"));
  }

  if (profile.ciProvider !== "gitlab" && existsSync(join(".github", "workflows", "release.yml"))) {
    return true;
  }

  if (!existsSync(".gitlab-ci.yml")) {
    return false;
  }

  const gitlabCi = readFileSync(".gitlab-ci.yml", "utf8");
  return /\b(release|publish|deploy)\b/i.test(gitlabCi);
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
  const profile = detectProjectProfile(packageJson, options);
  const workflow = resolveWorkflowSettings(options, profile, packageJson);
  const hasCi = hasCiWorkflow(profile);
  const hasReleaseDocs = existsSync(join("docs", "roadmap.md"));
  const hasDevelopWorkflow = hasDevelopWorkflowSignal();
  const branchNames = (git(["branch", "--all", "--format=%(refname:short)"]) ?? "")
    .split("\n")
    .map((branch) => branch.trim())
    .filter(Boolean);
  const teamSize = Number.parseInt(options.teamSize ?? "0", 10) || null;
  const releaseCadence = String(options.release ?? "auto").trim().toLowerCase();
  const selectedStrategy = normalizeBranchStrategyName(workflow.branchStrategy) ?? selectBranchStrategy({
    branchNames,
    hasCi,
    hasDevelopWorkflow: hasDevelopWorkflow || workflow.targetBranch === "develop",
    teamSize,
    releaseCadence,
    profile
  });
  const reasonParts = [];

  if (profile.visibility === "private" && profile.kind === "app") {
    reasonParts.push("private app workflow benefits from focused merge requests");
  } else {
    reasonParts.push("repository needs a clear contribution flow");
  }

  if (profile.kind === "package" && workflow.distribution !== "none") {
    reasonParts.push("package releases may need channel control for stable and prerelease versions");
  }

  if (hasCi) {
    reasonParts.push("CI-backed merge protection is already present");
  }

  if (hasReleaseDocs || (profile.kind === "package" && packageJson.name)) {
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
      hasDevelopWorkflow: hasDevelopWorkflow || workflow.targetBranch === "develop",
      targetBranch: workflow.targetBranch,
      hasReleaseDocs,
      teamSize,
      releaseCadence,
      branchCount: branchNames.length,
      changedPaths: getChangedPaths().length
    },
    branches: branchRulesForWorkflow(selectedStrategy, workflow.targetBranch, workflow.workBranches),
    githubProtection: [
      profile.hosting === "gitlab" ? "Require a merge request before merging into main." : "Require pull request before merging into main.",
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
      ...(profile.kind === "package" && workflow.distribution !== "none" ? [".aigate/policy-packs/release-channels.json"] : []),
      ".aigate/policy-packs/ai-collaboration.json",
      "docs/release-process.md",
      "docs/hotfix-process.md",
      ...(profile.hosting === "gitlab"
        ? [".gitlab/merge_request_templates/aigate.md", ".gitlab/CODEOWNERS"]
        : [".github/pull_request_template.aigate.md", ".github/CODEOWNERS.aigate"])
    ]
  };
}

function branchRulesForWorkflow(strategyName, targetBranch = "main", workBranches = DEFAULT_WORK_BRANCHES) {
  const branches = branchRulesForStrategy(strategyName, workBranches);
  const target = String(targetBranch ?? "").trim();
  if (!target || target === "main" || branches.some((branch) => branch.name === target)) {
    return branches;
  }

  const mainIndex = branches.findIndex((branch) => branch.name === "main");
  const insertAt = mainIndex >= 0 ? mainIndex + 1 : 0;
  return [
    ...branches.slice(0, insertAt),
    { name: target, use: "merge request target branch" },
    ...branches.slice(insertAt)
  ];
}

function buildBranchStrategyComparison(options = {}, recommendedStrategy = buildBranchStrategy(options)) {
  const packageJson = readJsonFile("package.json");
  const profile = detectProjectProfile(packageJson, options);
  const candidates = [
    profile.hosting === "gitlab" ? "GitLab Flow with merge requests" : "GitHub Flow with release channels",
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

function selectBranchStrategy({ branchNames, hasCi, hasDevelopWorkflow = false, teamSize, releaseCadence, profile = {} }) {
  const hasDevelop = branchNames.some((branch) => branch === "develop" || branch.endsWith("/develop"));
  const hasReleaseBranches = branchNames.some((branch) => /(^|\/)release\//.test(branch));

  if (hasDevelop || hasDevelopWorkflow || hasReleaseBranches || teamSize >= 12 || ["monthly", "quarterly", "scheduled"].includes(releaseCadence)) {
    return "Git Flow";
  }

  if (hasCi && teamSize && teamSize <= 10 && ["daily", "continuous", "on-demand"].includes(releaseCadence)) {
    return "Trunk-Based Development";
  }

  if (teamSize && teamSize >= 6 && ["weekly", "biweekly"].includes(releaseCadence)) {
    return "Hybrid Flow";
  }

  return profile.hosting === "gitlab" ? "GitLab Flow with merge requests" : "GitHub Flow with release channels";
}

function hasDevelopWorkflowSignal() {
  const files = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".aigate.yml", join("docs", "branch-strategy.md"), join("docs", "git-upload-workflow.md")];
  return files.some((filePath) => {
    if (!existsSync(filePath)) {
      return false;
    }

    const content = readFileSync(filePath, "utf8");
    return /(?:target-branch|target_branch|base|into)\s+develop\b/i.test(content) ||
      /(?:merge request|pull request|PR|MR).{0,80}\bdevelop\b/i.test(content);
  });
}

function branchRulesForStrategy(strategyName, workBranches = DEFAULT_WORK_BRANCHES) {
  const commonBranches = normalizeListSetting(workBranches).map((branch) => ({
    name: branch,
    use: workBranchDescription(branch)
  }));

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

  if (strategyName === "GitLab Flow with merge requests") {
    return [
      { name: "main", use: "protected stable source of truth" },
      ...commonBranches,
      { name: "release/*", use: "optional release stabilization" },
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

function workBranchDescription(branch) {
  return {
    "codex/*": "AI-assisted implementation branches",
    "feature/*": "user-facing feature branches",
    "feat/*": "short feature branches",
    "fix/*": "bug fix branches",
    "docs/*": "documentation-only branches",
    "chore/*": "maintenance and tooling branches"
  }[branch] ?? "focused work branches";
}

function strategyBestFor(strategyName) {
  return {
    "GitHub Flow with release channels": "small teams, public OSS projects, and on-demand releases",
    "GitLab Flow with merge requests": "private apps, GitLab-hosted teams, and merge-request based delivery",
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
    "GitLab Flow with merge requests": [
      "Fits GitLab merge requests, CODEOWNERS, and pipeline protection.",
      "Avoids npm and GitHub Actions assumptions for private apps.",
      "Keeps main protected while allowing focused feature branches."
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
    "GitLab Flow with merge requests": [
      "Needs a real GitLab CI pipeline or a clear local gate before merge.",
      "Release and deployment ownership should be documented separately for apps."
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
      "Use feature/*, feat/*, fix/*, docs/*, chore/*, and codex/* for focused work.",
      "Publish npm releases from main tags and use dist-tags for channels."
    ],
    "GitLab Flow with merge requests": [
      "Protect main and require merge requests before merge.",
      "Use feature/*, feat/*, fix/*, docs/*, chore/*, and codex/* for focused work.",
      "Run GitLab CI or AIGate local gates before merge."
    ],
    "Trunk-Based Development": [
      "Keep pull requests small enough to merge quickly into main.",
      "Add short/* only for changes that will merge within a day.",
      "Use release/* only when a production hardening window is unavoidable."
    ],
    "Hybrid Flow": [
      "Keep main stable and use develop only for planned integration.",
      "Use feature/*, feat/*, and codex/* branches for focused work.",
      "Create release/* branches for stabilization and hotfix/* for urgent fixes."
    ],
    "Git Flow": [
      "Create develop as the next-release integration branch.",
      "Route feature/*, feat/*, and codex/* branches into develop.",
      "Cut release/* from develop, then merge release and hotfix work back to main."
    ]
  }[strategyName] ?? [];
}

function strategyPolicyFit(strategyName) {
  return {
    "GitHub Flow with release channels": "Use main branch protection, required AIGate checks, and tag-driven npm release channels.",
    "GitLab Flow with merge requests": "Use protected branches, merge request templates, GitLab CI pipelines, and AIGate local gates.",
    "Trunk-Based Development": "Use strict main protection, fast required checks, and short-lived branch age limits.",
    "Hybrid Flow": "Use main protection, optional develop protection, release/* stabilization rules, and AI collaboration policy packs.",
    "Git Flow": "Use protected main/develop/release/*/hotfix/* rules with explicit release and hotfix ownership."
  }[strategyName];
}

function buildReleaseCheck(options = {}) {
  const packageJson = readJsonFile("package.json");
  const profile = detectProjectProfile(packageJson, options);
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
  const npmPackageRelease = profile.kind === "package";
  const publicNpmRelease = npmPackageRelease && packageJson.private !== true;
  const requireReleaseTag = options.requireReleaseTag !== false;
  const npmOnlyReason = "npm package release check is not required for this repository profile.";
  const tagOnlyReason = "Release tag check is only required during explicit release readiness checks.";
  const npmLockReason = `${profile.packageManager} project does not use package-lock.json.`;
  const githubOnlyReason = "GitHub Trusted Publishing check is not required for this repository hosting provider.";
  const packageCheck = (name, pass, checkOptions = {}) => makeCheck("release", name, pass, checkOptions);
  const checks = [
    packageCheck("package.json exists", existsSync("package.json")),
    packageCheck("package-lock.json version matches package.json", readJsonFile("package-lock.json").version === version, {
      applicable: publicNpmRelease && profile.packageManager === "npm",
      reason: profile.packageManager === "npm" ? npmOnlyReason : npmLockReason
    }),
    packageCheck("package is not marked private", packageJson.private !== true, {
      applicable: npmPackageRelease,
      reason: npmOnlyReason
    }),
    packageCheck("package has a valid npm package name", isValidNpmPackageName(packageName), {
      applicable: publicNpmRelease,
      reason: npmOnlyReason
    }),
    packageCheck("package version is not 0.0.0", version !== "0.0.0", {
      applicable: npmPackageRelease,
      reason: npmOnlyReason
    }),
    packageCheck("package declares npm entrypoint or bin", hasNpmEntrypoint(packageJson), {
      applicable: publicNpmRelease,
      reason: npmOnlyReason
    }),
    packageCheck("publishConfig access is public", packageJson.publishConfig?.access === "public", {
      applicable: publicNpmRelease,
      reason: npmOnlyReason
    }),
    packageCheck("release workflow exists", hasReleaseWorkflow(profile), {
      applicable: publicNpmRelease || hasReleaseWorkflow(profile),
      reason: npmOnlyReason
    }),
    packageCheck("release workflow uses npm provenance", fileIncludes(join(".github", "workflows", "release.yml"), "--provenance"), {
      applicable: publicNpmRelease && profile.hosting === "github",
      reason: profile.hosting === "github" ? npmOnlyReason : githubOnlyReason
    }),
    packageCheck("release workflow disables package manager cache", fileIncludes(join(".github", "workflows", "release.yml"), "package-manager-cache: false"), {
      applicable: publicNpmRelease && profile.hosting === "github",
      reason: profile.hosting === "github" ? npmOnlyReason : githubOnlyReason
    }),
    packageCheck("README documents npm install command", readmeDocumentsNpmInstall(packageName), {
      applicable: publicNpmRelease,
      reason: npmOnlyReason
    }),
    packageCheck("CHANGELOG documents package version", changelogDocumentsVersion(version), {
      applicable: publicNpmRelease,
      reason: npmOnlyReason
    }),
    packageCheck(`${expectedTag} tag exists`, hasExpectedTag, {
      applicable: publicNpmRelease && requireReleaseTag,
      reason: publicNpmRelease ? tagOnlyReason : npmOnlyReason
    })
  ];
  const registry = options.checkNpm && publicNpmRelease
    ? lookupNpmPublication(packageName, version)
    : { checked: false, applicable: publicNpmRelease, reason: publicNpmRelease ? undefined : npmOnlyReason };
  const localReady = checks.every((check) => !checkNeedsAction(check));
  const status = localReady && registry.checked && registry.published
    ? "RELEASED"
    : (localReady ? "READY" : "ACTION_REQUIRED");
  const nextSteps = [];

  if (!publicNpmRelease) {
    nextSteps.push("No npm package publication is required for the detected app/private repository profile.");
  } else if (requireReleaseTag && !hasExpectedTag) {
    if (registry.checked && registry.published) {
      nextSteps.push(`${packageName}@${version} is already on npm; create release tag ${expectedTag} to record the release.`);
    } else if (registry.checked && registry.packageExists) {
      nextSteps.push(`${packageName}@${version} is not on npm yet; create release tag ${expectedTag} to publish with Trusted Publishing.`);
    } else if (profile.hosting === "github") {
      nextSteps.push(`If ${packageName} is not on npm yet, enable npm account 2FA and create it with: npm publish --access public`);
      nextSteps.push(`Configure trusted publishing after the package exists: npx npm@latest trust github ${packageName} --file release.yml --repo ${repositoryForCommand} --allow-publish --yes`);
      nextSteps.push(`Create release tag ${expectedTag} after npm Trusted Publishing is configured.`);
    } else {
      nextSteps.push(`If ${packageName} is not on npm yet, create it with: npm publish --access public`);
      nextSteps.push("Configure release automation in your CI provider before tagging a release.");
      nextSteps.push(`Create release tag ${expectedTag} after package publishing is configured.`);
    }
  }

  if (registry.checked && registry.published && hasExpectedTag) {
    nextSteps.push(`${packageName}@${version} is released; bump package.json before the next npm release.`);
  }

  if (registry.checked && registry.error) {
    nextSteps.push(`Review npm registry lookup error: ${registry.error}`);
  }

  if (publicNpmRelease && !registry.checked) {
    nextSteps.push("Run release-check --npm to confirm npm registry publication state.");
  }

  if (checkNeedsAction(checks.find((check) => check.name === "release workflow uses npm provenance"))) {
    nextSteps.push("Ensure release workflow publishes with npm provenance.");
  }

  if (checkNeedsAction(checks.find((check) => check.name === "CHANGELOG documents package version"))) {
    nextSteps.push(`Document ${version} in CHANGELOG.md before tagging the release.`);
  }

  if (publicNpmRelease && requireReleaseTag) {
    nextSteps.push("Run npm run ci before tagging a release.");
    nextSteps.push("Run npm publish dry-run through the Release workflow_dispatch dry_run input.");
  }

  return {
    command: "release-check",
    status,
    profile,
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
  if (registry?.applicable === false) {
    return t(language, "release.registryNotApplicable", {
      reason: translateNotApplicableReason(registry.reason, language)
    });
  }

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
      .filter((check) => checkNeedsAction(check))
      .map((check) => ({
        severity: check.name.includes("tag exists") ? "medium" : "high",
        area: "release",
        message: check.name
      })),
    ...evaluation.checks
      .filter((check) => checkNeedsAction(check))
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
      pass: evaluation.checks.some((check) => check.name === "Security policy exists" && checkPassed(check)) &&
        evaluation.checks.some((check) => check.name === "Security scanning is documented" && checkPassed(check)),
      evidence: "SECURITY.md, security scanning docs, and Scorecard workflow"
    },
    {
      id: "change-control",
      title: "Change control",
      pass: evaluationHasPassedCheck(evaluation, ["Pull request template exists", "Merge request template exists"]) &&
        evaluation.checks.some((check) => check.name === "CODEOWNERS exists" && checkPassed(check)),
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

function buildAiProjectReport(options = {}, language = "en") {
  const gitStatus = buildGitStatus();
  const evaluation = buildEvaluation({
    deep: true,
    projectType: options.projectType,
    hosting: options.hosting,
    ciProvider: options.ciProvider,
    packageManager: options.packageManager
  });
  const analysis = buildChangeAnalysis();
  const releaseCheck = buildReleaseCheck({
    checkNpm: Boolean(options.npm),
    requireReleaseTag: Boolean(options.npm),
    projectType: options.projectType,
    hosting: options.hosting,
    ciProvider: options.ciProvider,
    packageManager: options.packageManager
  });
  const branchStrategy = buildBranchStrategy(options);
  const problems = buildAiReportProblems({ gitStatus, evaluation, analysis, releaseCheck }, language);
  const strengths = buildAiReportStrengths({ evaluation, releaseCheck, branchStrategy }, language);
  const direction = buildAiReportDirection({ evaluation, releaseCheck, branchStrategy }, language);
  const suggestedCommands = buildAiReportCommands({ evaluation, releaseCheck }, language);
  const status = problems.some((problem) => problem.severity === "high")
    ? "ACTION_REQUIRED"
    : problems.length
      ? "WARN"
      : "PASS";
  const report = {
    command: "ai report",
    generatedAt: new Date().toISOString(),
    status,
    branch: gitStatus.branch,
    changedFiles: analysis.paths.length,
    secretFindings: analysis.secretFindings.length,
    sensitiveRemovals: analysis.sensitiveRemovals.length,
    projectScore: evaluation.score,
    projectGrade: evaluation.grade,
    releaseStatus: releaseCheck.status,
    recommendedStrategy: branchStrategy.name,
    problems,
    strengths,
    direction,
    suggestedCommands,
    checks: evaluation.checks,
    releaseChecks: releaseCheck.checks
  };

  report.prompt = renderAiProjectReportPrompt(report, language);
  return report;
}

function buildAiReportProblems({ gitStatus, evaluation, analysis, releaseCheck }, language = "en") {
  const problems = [];

  if (!gitStatus.insideGitRepository) {
    problems.push(aiReportProblem("high", "git", aiReportText("notGitRepo", language), "git init"));
  }

  if (analysis.secretFindings.length) {
    problems.push(aiReportProblem(
      "high",
      "security",
      aiReportText("secretFindings", language, { count: analysis.secretFindings.length }),
      "aigate report --format sarif"
    ));
  }

  if (analysis.sensitiveRemovals.length) {
    const exposedCount = analysis.sensitiveRemovals.filter((finding) => finding.exposedInHistory).length;
    problems.push(aiReportProblem(
      "medium",
      "security",
      exposedCount
        ? aiReportText("sensitiveRemovals", language, { count: analysis.sensitiveRemovals.length, exposedCount })
        : aiReportText("sensitiveRemovalsNoHistory", language, { count: analysis.sensitiveRemovals.length }),
      "git status"
    ));
  }

  if (gitStatus.riskLevel === "high") {
    problems.push(aiReportProblem("high", "security", aiReportText("highRiskFiles", language), "aigate check"));
  }

  if (analysis.paths.length > 20) {
    problems.push(aiReportProblem("medium", "git", aiReportText("largeChange", language, { count: analysis.paths.length }), "aigate pr-check"));
  }

  for (const check of evaluation.checks.filter((item) => checkNeedsAction(item)).slice(0, 8)) {
    const severity = ["testing", "ci_cd", "security"].includes(check.category) ? "high" : "medium";
    problems.push(aiReportProblem(
      severity,
      check.category,
      aiReportText("missingFoundation", language, { check: translateEvaluationCheckName(check.name, language) }),
      aiReportCommandForEvaluationCheck(check.name)
    ));
  }

  for (const check of releaseCheck.checks.filter((item) => checkNeedsAction(item)).slice(0, 5)) {
    problems.push(aiReportProblem(
      check.name.includes("tag exists") ? "medium" : "high",
      "release",
      aiReportText("releaseCheck", language, { check: translateReleaseCheckName(check.name, language) }),
      "aigate release-check"
    ));
  }

  if (releaseCheck.registry?.applicable !== false && releaseCheck.registry?.checked && releaseCheck.registry.published === false) {
    problems.push(aiReportProblem(
      "medium",
      "release",
      aiReportText("npmNotPublished", language, {
        packageName: releaseCheck.packageName,
        version: releaseCheck.version
      }),
      "aigate release-check --npm"
    ));
  }

  return dedupeAiReportItems(problems);
}

function buildAiReportStrengths({ evaluation, releaseCheck, branchStrategy }, language = "en") {
  const highValueChecks = [
    "README exists",
    "License exists",
    "Changelog exists",
    "Contribution guide exists",
    "Issue templates exist",
    "Pull request template exists",
    "Merge request template exists",
    "AI assistant instructions exist",
    "Test directory exists",
    "Project test command exists",
    "CI workflow exists",
    "AIGate CI gate exists",
    "AIGate server enforcement exists",
    "Release workflow exists",
    "Security policy exists",
    "Security scanning is documented"
  ];
  const strengths = evaluation.checks
    .filter((check) => checkPassed(check) && highValueChecks.includes(check.name))
    .slice(0, 10)
    .map((check) => ({
      area: check.category,
      message: aiReportText("foundationPass", language, {
        check: translateEvaluationCheckName(check.name, language)
      })
    }));

  if (["READY", "RELEASED"].includes(releaseCheck.status)) {
    strengths.push({
      area: "release",
      message: aiReportText("releaseReady", language)
    });
  }

  strengths.push({
    area: "branch",
    message: aiReportText("strategyReady", language, {
      strategy: translateStrategyName(branchStrategy.name, language)
    })
  });

  if (!strengths.length) {
    strengths.push({
      area: "foundation",
      message: aiReportText("bootstrapAvailable", language)
    });
  }

  return strengths;
}

function buildAiReportDirection({ evaluation, releaseCheck, branchStrategy }, language = "en") {
  const privateApp = evaluation.profile?.visibility === "private" && evaluation.profile?.kind === "app";
  const missingChecks = new Set(evaluation.checks.filter((check) => checkNeedsAction(check)).map((check) => check.name));
  const direction = [];

  if (evaluation.score < 80) {
    direction.push(aiReportText(privateApp ? "directionRaiseInternalScore" : "directionRaiseScore", language));
  }

  if (privateApp && ["README exists", "Pull request template exists", "Merge request template exists", "CODEOWNERS exists"].some((name) => missingChecks.has(name))) {
    direction.push(aiReportText("directionInternalWorkflow", language));
  } else if (!privateApp && ["README exists", "Issue templates exist", "Pull request template exists", "Merge request template exists", "Contribution guide exists"].some((name) => missingChecks.has(name))) {
    direction.push(aiReportText("directionOss", language));
  }

  if (missingChecks.has("AI assistant instructions exist")) {
    direction.push(aiReportText("directionAi", language));
  }

  if (["Project test command exists", "CI workflow exists", "AIGate CI gate exists", "AIGate server enforcement exists"].some((name) => missingChecks.has(name))) {
    direction.push(aiReportText("directionTests", language));
  }

  if (releaseCheck.status === "ACTION_REQUIRED") {
    direction.push(aiReportText("directionRelease", language));
  }

  direction.push(aiReportText("directionStrategy", language, {
    strategy: translateStrategyName(branchStrategy.name, language)
  }));
  direction.push(aiReportText("directionAiPolicy", language));

  return dedupeStrings(direction);
}

function buildAiReportCommands({ evaluation, releaseCheck }, language = "en") {
  const privateApp = evaluation.profile?.visibility === "private" && evaluation.profile?.kind === "app";
  const profileFlags = profileOptionFlags(evaluation.profile);
  const settings = normalizeSettings(readSettings());
  const providerArg = settings.aiProviders.length ? settings.aiProviders.join(",") : "all";
  const missingChecks = new Set(evaluation.checks.filter((check) => checkNeedsAction(check)).map((check) => check.name));
  const commands = [];

  if (["README exists", "Issue templates exist", "Pull request template exists", "Merge request template exists", "CODEOWNERS exists", "Contribution guide exists", "License exists", "Roadmap exists"].some((name) => missingChecks.has(name))) {
    const needsOwner = missingChecks.has("CODEOWNERS exists");
    const internalFilesCommand = `aigate start --route default --steps repo-files${profileFlags}${needsOwner ? " --owner @your-org/team" : ""}`;
    commands.push(privateApp
      ? aiReportCommand(internalFilesCommand, aiReportText("commandInternalFiles", language))
      : aiReportCommand("aigate start --route oss", aiReportText("commandOss", language)));
  }

  if (missingChecks.has("AI assistant instructions exist")) {
    commands.push(aiReportCommand(`aigate start --route ai --provider ${providerArg}`, aiReportText("commandAi", language)));
  }

  commands.push(aiReportCommand("aigate ai report --output .aigate/reports/ai-report.md", aiReportText("commandReport", language)));
  commands.push(aiReportCommand("aigate test", aiReportText("commandTest", language)));
  commands.push(aiReportCommand("aigate aitest --provider codex", aiReportText("commandAiTest", language)));

  if (releaseCheck.status === "ACTION_REQUIRED") {
    commands.push(aiReportCommand("aigate release-check --npm", aiReportText("commandRelease", language)));
  }

  commands.push(aiReportCommand("aigate git-ready", aiReportText("commandGate", language)));
  return dedupeAiReportCommands(commands);
}

function aiReportProblem(severity, area, message, command) {
  return { severity, area, message, command };
}

function aiReportCommand(command, reason) {
  return { command, reason };
}

function aiReportCommandForEvaluationCheck(name) {
  const profile = detectProjectProfile();
  const settings = normalizeSettings(readSettings());
  const providerArg = settings.aiProviders.length ? settings.aiProviders.join(",") : "all";
  const profileFlags = profileOptionFlags(profile);
  const repoFilesCommand = profile.visibility === "private" && profile.kind === "app"
    ? `aigate start --route default --steps repo-files${profileFlags}`
    : "aigate start --route oss";
  const ciCommand = profile.hosting === "gitlab"
    ? "aigate setup --hosting gitlab --ci-provider gitlab"
    : "aigate github check --format json";
  const commands = {
    "AIGate configuration exists": "aigate init",
    "Branch strategy is documented": "aigate branch-strategy --apply",
    "Git upload workflow is documented": repoFilesCommand,
    "Pull request template exists": repoFilesCommand,
    "Merge request template exists": repoFilesCommand,
    "CODEOWNERS exists": `${repoFilesCommand} --owner @your-org/team`,
    "Contribution guide exists": repoFilesCommand,
    "Issue templates exist": repoFilesCommand,
    "AI assistant instructions exist": `aigate start --route ai --provider ${providerArg}`,
    "Test directory exists": "aigate test",
    "Project test command exists": "aigate test",
    "CI gate script exists": "aigate test",
    "CI workflow exists": ciCommand,
    "AIGate CI gate exists": "aigate install-hook --pre-push",
    "AIGate server enforcement exists": profile.hosting === "gitlab"
      ? "aigate setup --gitlab-pipeline-must-succeed true"
      : "aigate setup --github-required-checks-enforced true",
    "Release workflow exists": "aigate release-check",
    "Dependabot exists": "aigate ai report",
    "Security policy exists": repoFilesCommand,
    "Security scanning is documented": "aigate report --format sarif",
    "OpenSSF Scorecard workflow exists": "aigate audit-report",
    "README exists": repoFilesCommand,
    "License exists": repoFilesCommand,
    "Changelog exists": repoFilesCommand,
    "Roadmap exists": repoFilesCommand,
    "Package metadata exists": "npm init",
    "Support policy exists": repoFilesCommand,
    "Governance exists": "aigate audit-report"
  };
  return commands[name] ?? "aigate ai report";
}

function profileOptionFlags(profile = {}) {
  const flags = [];
  if (profile.hosting && !["unknown", "auto"].includes(profile.hosting)) {
    flags.push(`--hosting ${profile.hosting}`);
  }
  if (profile.ciProvider && !["unknown", "auto"].includes(profile.ciProvider)) {
    flags.push(`--ci-provider ${profile.ciProvider}`);
  }
  if (profile.kind && !["unknown", "auto"].includes(profile.kind)) {
    flags.push(`--project-type ${profile.kind}`);
  }
  if (profile.packageManager && !["unknown", "auto"].includes(profile.packageManager)) {
    flags.push(`--package-manager ${profile.packageManager}`);
  }
  return flags.length ? ` ${flags.join(" ")}` : "";
}

function dedupeAiReportItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.severity}:${item.area}:${item.message}:${item.command}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeAiReportCommands(commands) {
  const seen = new Set();
  return commands.filter((item) => {
    if (seen.has(item.command)) {
      return false;
    }
    seen.add(item.command);
    return true;
  });
}

function dedupeStrings(values) {
  return [...new Set(values)];
}

function renderAiProjectReport(report, language = "en") {
  const labels = aiReportLabels(language);
  const lines = [
    `# ${labels.title}`,
    "",
    `- ${labels.status}: ${automationStatus(report.status, language)}`,
    `- ${labels.branch}: ${report.branch}`,
    `- ${labels.changedFiles}: ${report.changedFiles}`,
    `- ${labels.secretFindings}: ${report.secretFindings}`,
    `- ${labels.sensitiveRemovals}: ${report.sensitiveRemovals ?? 0}`,
    `- ${labels.projectScore}: ${report.projectScore}/100 (${report.projectGrade})`,
    `- ${labels.releaseStatus}: ${automationStatus(report.releaseStatus, language)}`,
    `- ${labels.recommendedStrategy}: ${translateStrategyName(report.recommendedStrategy, language)}`,
    "",
    `## ${labels.problems}`,
    "",
    ...(report.problems.length
      ? report.problems.map((problem) => `- ${severityLabel(problem.severity, language)} ${translateAuditArea(problem.area, language)}: ${problem.message}${problem.command ? ` (${labels.command}: \`${problem.command}\`)` : ""}`)
      : [`- ${labels.none}`]),
    "",
    `## ${labels.strengths}`,
    "",
    ...report.strengths.map((strength) => `- ${translateAuditArea(strength.area, language)}: ${strength.message}`),
    "",
    `## ${labels.direction}`,
    "",
    ...report.direction.map((item) => `- ${item}`),
    "",
    `## ${labels.commands}`,
    "",
    ...report.suggestedCommands.map((item) => `- \`${item.command}\`: ${item.reason}`),
    "",
    `## ${labels.aiHandoff}`,
    "",
    `- ${labels.provider}: ${report.ai?.provider ?? "auto"} (${report.ai?.providerInstalled ? labels.installed : labels.notInstalled})`,
    `- ${labels.applyMode}: ${report.ai?.applied ? labels.yes : labels.no}`
  ];

  if (report.ai?.promptPath) {
    lines.push(`- ${labels.prompt}: ${report.ai.promptPath}`);
  }

  if (report.ai?.agent) {
    lines.push(
      `- ${labels.agent}: ${automationStatus(report.ai.agent.exitCode === 0 ? "PASS" : "FAILED", language)}`,
      `- ${labels.command}: \`${report.ai.agent.command ?? labels.notInstalled}\``,
      `- ${labels.duration}: ${report.ai.agent.durationMs}ms`,
      `- ${labels.exitCode}: ${report.ai.agent.exitCode}`
    );
    if (report.ai.agent.stdout.trim()) {
      lines.push("", `### ${labels.stdout}`, "", "```text", report.ai.agent.stdout.trim(), "```");
    }
    if (report.ai.agent.stderr.trim()) {
      lines.push("", `### ${labels.stderr}`, "", "```text", report.ai.agent.stderr.trim(), "```");
    }
  } else {
    lines.push(`- ${labels.next}: ${labels.applyHint}`);
  }

  return lines.join("\n");
}

function renderAiProjectReportPrompt(report, language = "en") {
  const labels = aiReportLabels(language);
  return [
    `# ${labels.title}`,
    "",
    aiReportText("promptIntro", language),
    "",
    `- ${labels.status}: ${automationStatus(report.status, language)}`,
    `- ${labels.branch}: ${report.branch}`,
    `- ${labels.projectScore}: ${report.projectScore}/100 (${report.projectGrade})`,
    `- ${labels.recommendedStrategy}: ${translateStrategyName(report.recommendedStrategy, language)}`,
    "",
    `## ${labels.problems}`,
    "",
    ...(report.problems.length
      ? report.problems.map((problem) => `- ${severityLabel(problem.severity, language)} ${translateAuditArea(problem.area, language)}: ${problem.message}`)
      : [`- ${labels.none}`]),
    "",
    `## ${labels.strengths}`,
    "",
    ...report.strengths.map((strength) => `- ${translateAuditArea(strength.area, language)}: ${strength.message}`),
    "",
    `## ${labels.direction}`,
    "",
    ...report.direction.map((item) => `- ${item}`),
    "",
    `## ${labels.commands}`,
    "",
    ...report.suggestedCommands.map((item) => `- \`${item.command}\`: ${item.reason}`),
    "",
    aiReportText("promptRules", language)
  ].join("\n");
}

function renderAiReportError(kind, language, values = {}) {
  const labels = aiReportLabels(language);
  if (kind === "missing-provider") {
    return `${labels.error}: ${labels.missingProvider}\n${labels.supportedProviders}: auto, codex, claude, gemini`;
  }

  if (kind === "unknown-provider") {
    return `${labels.error}: ${labels.unknownProvider} ${values.provider}\n${labels.supportedProviders}: auto, codex, claude, gemini`;
  }

  return `${labels.error}: ${labels.unknownAction} ${values.action}\n${labels.supportedActions}: report`;
}

function aiReportLabels(language = "en") {
  return {
    en: {
      agent: "Agent",
      aiHandoff: "AI Handoff",
      applyHint: "Use `aigate ai report --apply --provider codex` only when you want AIGate to run an AI agent.",
      applyMode: "Applied",
      branch: "Branch",
      changedFiles: "Changed files",
      command: "Command",
      commands: "Suggested Commands",
      direction: "Direction",
      duration: "Duration",
      error: "Error",
      exitCode: "Exit code",
      installed: "installed",
      missingProvider: "--provider requires a value.",
      next: "Next",
      no: "no",
      none: "No current problem detected by local checks.",
      notInstalled: "not installed",
      problems: "Current Problems",
      projectScore: "Project score",
      prompt: "Prompt",
      provider: "Provider",
      recommendedStrategy: "Recommended strategy",
      releaseStatus: "Release status",
      secretFindings: "Secret findings",
      sensitiveRemovals: "Sensitive removals",
      status: "Status",
      strengths: "What Is Working",
      stderr: "Agent stderr",
      stdout: "Agent stdout",
      supportedActions: "Supported AI actions",
      supportedProviders: "Supported providers",
      title: "AIGate AI Report",
      unknownAction: "Unknown AI action:",
      unknownProvider: "Unknown AI provider:",
      yes: "yes"
    },
    ko: {
      agent: "에이전트",
      aiHandoff: "AI 전달",
      applyHint: "AIGate가 AI 에이전트를 실행하길 원할 때만 `aigate ai report --apply --provider codex`를 사용하세요.",
      applyMode: "적용 여부",
      branch: "브랜치",
      changedFiles: "변경 파일",
      command: "명령",
      commands: "추천 명령어",
      direction: "방향성",
      duration: "소요 시간",
      error: "오류",
      exitCode: "종료 코드",
      installed: "설치됨",
      missingProvider: "--provider 값이 필요합니다.",
      next: "다음 단계",
      no: "아니오",
      none: "로컬 검사에서 현재 문제점이 감지되지 않았습니다.",
      notInstalled: "설치되지 않음",
      problems: "현재 문제점",
      projectScore: "프로젝트 점수",
      prompt: "프롬프트",
      provider: "제공자",
      recommendedStrategy: "권장 전략",
      releaseStatus: "릴리스 상태",
      secretFindings: "민감 정보 탐지",
      sensitiveRemovals: "민감 파일 제거",
      status: "상태",
      strengths: "잘된 점",
      stderr: "에이전트 stderr",
      stdout: "에이전트 stdout",
      supportedActions: "지원 AI 작업",
      supportedProviders: "지원 제공자",
      title: "AIGate AI 리포트",
      unknownAction: "알 수 없는 AI 작업:",
      unknownProvider: "알 수 없는 AI 제공자:",
      yes: "예"
    },
    ja: {
      agent: "エージェント",
      aiHandoff: "AI 引き継ぎ",
      applyHint: "AIGate に AI エージェントを実行させたい場合のみ `aigate ai report --apply --provider codex` を使ってください。",
      applyMode: "適用",
      branch: "ブランチ",
      changedFiles: "変更ファイル",
      command: "コマンド",
      commands: "推奨コマンド",
      direction: "方向性",
      duration: "所要時間",
      error: "エラー",
      exitCode: "終了コード",
      installed: "インストール済み",
      missingProvider: "--provider には値が必要です。",
      next: "次の手順",
      no: "いいえ",
      none: "ローカルチェックで現在の問題は検出されていません。",
      notInstalled: "未インストール",
      problems: "現在の問題",
      projectScore: "プロジェクトスコア",
      prompt: "プロンプト",
      provider: "Provider",
      recommendedStrategy: "推奨戦略",
      releaseStatus: "リリース状態",
      secretFindings: "機密情報検出",
      sensitiveRemovals: "機密ファイル削除",
      status: "状態",
      strengths: "良い点",
      stderr: "エージェント stderr",
      stdout: "エージェント stdout",
      supportedActions: "対応 AI アクション",
      supportedProviders: "対応 provider",
      title: "AIGate AI レポート",
      unknownAction: "不明な AI アクション:",
      unknownProvider: "不明な AI provider:",
      yes: "はい"
    },
    zh: {
      agent: "Agent",
      aiHandoff: "AI 交接",
      applyHint: "只有在希望 AIGate 运行 AI agent 时才使用 `aigate ai report --apply --provider codex`。",
      applyMode: "已应用",
      branch: "分支",
      changedFiles: "变更文件",
      command: "命令",
      commands: "建议命令",
      direction: "方向",
      duration: "耗时",
      error: "错误",
      exitCode: "退出码",
      installed: "已安装",
      missingProvider: "--provider 需要一个值。",
      next: "下一步",
      no: "否",
      none: "本地检查未发现当前问题。",
      notInstalled: "未安装",
      problems: "当前问题",
      projectScore: "项目分数",
      prompt: "提示",
      provider: "Provider",
      recommendedStrategy: "推荐策略",
      releaseStatus: "发布状态",
      secretFindings: "敏感信息发现",
      sensitiveRemovals: "敏感文件移除",
      status: "状态",
      strengths: "做得好的部分",
      stderr: "Agent stderr",
      stdout: "Agent stdout",
      supportedActions: "支持的 AI 操作",
      supportedProviders: "支持的 provider",
      title: "AIGate AI 报告",
      unknownAction: "未知 AI 操作:",
      unknownProvider: "未知 AI provider:",
      yes: "是"
    }
  }[language] ?? aiReportLabels("en");
}

function severityLabel(severity, language = "en") {
  return {
    en: { high: "HIGH", medium: "MEDIUM", low: "LOW" },
    ko: { high: "높음", medium: "중간", low: "낮음" },
    ja: { high: "高", medium: "中", low: "低" },
    zh: { high: "高", medium: "中", low: "低" }
  }[language]?.[severity] ?? severity;
}

function aiReportText(key, language = "en", values = {}) {
  const table = {
    en: {
      bootstrapAvailable: "AIGate can bootstrap missing repository foundations with `aigate start --route oss`.",
      commandAi: "Create AI assistant instructions for Codex, Gemini, and Claude Code.",
      commandAiTest: "Create a focused AI remediation prompt from failing tests.",
      commandGate: "Run the final local gate before commit, push, or PR.",
      commandInternalFiles: "Create internal repository starter files such as the detected MR/PR template and CODEOWNERS.",
      commandOss: "Create README, issue templates, PR template, CODEOWNERS, and OSS docs.",
      commandRelease: "Confirm package metadata, tag, workflow, and npm state.",
      commandReport: "Save this AI report for PRs, handoffs, or release notes.",
      commandTest: "Run Git readiness and the detected project test command.",
      directionAi: "Align AI assistants with repository rules so Codex, Gemini, and Claude Code follow the same workflow.",
      directionAiPolicy: "Keep AI-generated work on focused branches and run `aigate test` or `aigate aitest` before push.",
      directionInternalWorkflow: "Prepare internal repository workflow files such as README, MR/PR template, and CODEOWNERS for the detected hosting provider.",
      directionOss: "Open the public contribution funnel with README, issue templates, PR template, CODEOWNERS, and contribution docs.",
      directionRaiseInternalScore: "Raise the project foundation score against the detected private app profile; do not add public OSS artifacts only for the score.",
      directionRaiseScore: "Raise the project foundation score to at least 80 before public promotion.",
      directionRelease: "Finish release-check items before creating a release tag or publishing package changes.",
      directionStrategy: `Use ${values.strategy ?? "the recommended strategy"} as the branch policy baseline.`,
      directionTests: "Make test and CI commands easy to run so contributors can validate changes before review.",
      foundationPass: `${values.check} is present.`,
      highRiskFiles: "Local changes include file names that may contain secrets or auth state.",
      largeChange: `The workspace has ${values.count} changed paths; split work if the PR becomes hard to review.`,
      missingFoundation: `Missing foundation: ${values.check}.`,
      notGitRepo: "AIGate is not running inside a Git repository.",
      npmNotPublished: `${values.packageName}@${values.version} is not published to npm yet.`,
      promptIntro: "Use this brief to improve the repository with focused, minimal changes.",
      promptRules: "Rules: preserve unrelated user work, do not push directly to main, avoid broad refactors, run validation, and summarize files changed.",
      releaseCheck: `Release check needs attention: ${values.check}.`,
      releaseReady: "Release metadata and workflow checks are ready.",
      secretFindings: `${values.count} possible secret finding(s) were detected.`,
      sensitiveRemovals: `${values.count} sensitive file removal(s) were detected; ${values.exposedCount ?? values.count} had Git history exposure, so rotate exposed credentials after committing the removal.`,
      sensitiveRemovalsNoHistory: `${values.count} sensitive file removal(s) were detected; commit the removal. No Git history exposure was detected.`,
      strategyReady: `Branch strategy recommendation is available: ${values.strategy}.`
    },
    ko: {
      bootstrapAvailable: "`aigate start --route oss`로 부족한 저장소 기반 파일을 만들 수 있습니다.",
      commandAi: "Codex, Gemini, Claude Code용 AI 어시스턴트 지침을 생성합니다.",
      commandAiTest: "실패한 테스트를 바탕으로 집중된 AI 수정 프롬프트를 만듭니다.",
      commandGate: "커밋, 푸시, PR 전에 마지막 로컬 게이트를 실행합니다.",
      commandInternalFiles: "감지된 호스팅 프로필에 맞는 MR/PR 템플릿과 CODEOWNERS 같은 내부 저장소 시작 파일을 생성합니다.",
      commandOss: "README, 이슈 템플릿, PR 템플릿, CODEOWNERS, 오픈소스 문서를 생성합니다.",
      commandRelease: "패키지 메타데이터, 태그, 워크플로, npm 상태를 확인합니다.",
      commandReport: "이 AI 리포트를 PR, 인수인계, 릴리스 노트용으로 저장합니다.",
      commandTest: "Git 준비 상태와 감지된 프로젝트 테스트 명령을 실행합니다.",
      directionAi: "Codex, Gemini, Claude Code가 같은 워크플로를 따르도록 AI 어시스턴트 지침을 맞추세요.",
      directionAiPolicy: "AI 생성 작업은 집중된 브랜치에서 진행하고 push 전 `aigate test` 또는 `aigate aitest`를 실행하세요.",
      directionInternalWorkflow: "감지된 호스팅 제공자에 맞게 README, MR/PR 템플릿, CODEOWNERS 같은 내부 저장소 워크플로 파일을 준비하세요.",
      directionOss: "README, 이슈 템플릿, PR 템플릿, CODEOWNERS, 기여 문서로 공개 기여 흐름을 여세요.",
      directionRaiseInternalScore: "감지된 private 앱 프로필 기준으로 프로젝트 기반 점수를 올리세요. 점수만 위해 공개 OSS 산출물을 추가하지 마세요.",
      directionRaiseScore: "공개 홍보 전에 프로젝트 기반 점수를 최소 80 이상으로 올리세요.",
      directionRelease: "릴리스 태그 생성이나 패키지 변경 배포 전에 release-check 항목을 마무리하세요.",
      directionStrategy: `${values.strategy ?? "권장 전략"}을 브랜치 정책 기준으로 사용하세요.`,
      directionTests: "기여자가 리뷰 전 검증할 수 있도록 test와 CI 명령을 쉽게 실행 가능하게 만드세요.",
      foundationPass: `${values.check} 항목이 준비되어 있습니다.`,
      highRiskFiles: "로컬 변경사항에 민감 정보나 인증 상태가 들어갈 수 있는 파일명이 있습니다.",
      largeChange: `현재 변경 경로가 ${values.count}개입니다. PR 리뷰가 어려워지면 작업을 나누세요.`,
      missingFoundation: `부족한 기반 항목: ${values.check}.`,
      notGitRepo: "AIGate가 Git 저장소 안에서 실행되고 있지 않습니다.",
      npmNotPublished: `${values.packageName}@${values.version}은 아직 npm에 배포되지 않았습니다.`,
      promptIntro: "이 브리프를 사용해 저장소를 작고 집중된 변경으로 개선하세요.",
      promptRules: "규칙: 관련 없는 사용자 작업은 보존하고, main에 직접 push하지 말고, 큰 리팩터링을 피하고, 검증을 실행한 뒤 변경 파일을 요약하세요.",
      releaseCheck: `릴리스 검사 조치 필요: ${values.check}.`,
      releaseReady: "릴리스 메타데이터와 워크플로 검사가 준비되어 있습니다.",
      secretFindings: `민감 정보 의심 항목 ${values.count}개가 감지됐습니다.`,
      sensitiveRemovals: `민감 파일 제거 ${values.count}개가 감지됐습니다. 이 중 ${values.exposedCount ?? values.count}개는 Git 이력에 노출됐으니 제거 커밋 후 노출된 자격 증명을 회전하세요.`,
      sensitiveRemovalsNoHistory: `민감 파일 제거 ${values.count}개가 감지됐습니다. 제거를 커밋하세요. Git 이력 노출은 감지되지 않았습니다.`,
      strategyReady: `브랜치 전략 추천이 준비되어 있습니다: ${values.strategy}.`
    },
    ja: {
      bootstrapAvailable: "`aigate start --route oss` で不足しているリポジトリ基盤を作成できます。",
      commandAi: "Codex、Gemini、Claude Code 用の AI アシスタント指示を作成します。",
      commandAiTest: "失敗したテストから焦点を絞った AI 修正プロンプトを作成します。",
      commandGate: "コミット、プッシュ、PR 前の最後のローカルゲートを実行します。",
      commandInternalFiles: "検出された hosting profile に合わせて MR/PR テンプレートや CODEOWNERS などの内部リポジトリ初期ファイルを作成します。",
      commandOss: "README、issue テンプレート、PR テンプレート、CODEOWNERS、OSS 文書を作成します。",
      commandRelease: "パッケージメタデータ、タグ、workflow、npm 状態を確認します。",
      commandReport: "この AI レポートを PR、引き継ぎ、リリースノート用に保存します。",
      commandTest: "Git 準備状態と検出したプロジェクトテストコマンドを実行します。",
      directionAi: "Codex、Gemini、Claude Code が同じワークフローに従うよう AI アシスタント指示を揃えます。",
      directionAiPolicy: "AI 生成作業は焦点を絞ったブランチで進め、push 前に `aigate test` または `aigate aitest` を実行します。",
      directionInternalWorkflow: "検出された hosting provider に合わせて README、MR/PR template、CODEOWNERS など内部リポジトリのワークフローファイルを準備します。",
      directionOss: "README、issue テンプレート、PR テンプレート、CODEOWNERS、貢献文書で公開貢献導線を開きます。",
      directionRaiseInternalScore: "検出された private app profile に対してプロジェクト基盤スコアを上げます。スコアのためだけに公開 OSS 成果物を追加しないでください。",
      directionRaiseScore: "公開プロモーション前にプロジェクト基盤スコアを 80 以上へ上げます。",
      directionRelease: "リリースタグ作成やパッケージ変更公開の前に release-check 項目を完了します。",
      directionStrategy: `${values.strategy ?? "推奨戦略"} をブランチポリシーの基準として使います。`,
      directionTests: "コントリビューターがレビュー前に検証できるよう test と CI コマンドを実行しやすくします。",
      foundationPass: `${values.check} が用意されています。`,
      highRiskFiles: "ローカル変更に機密情報や認証状態を含む可能性があるファイル名があります。",
      largeChange: `変更パスが ${values.count} 件あります。PR レビューが難しくなる場合は作業を分割してください。`,
      missingFoundation: `不足している基盤: ${values.check}.`,
      notGitRepo: "AIGate が Git リポジトリ内で実行されていません。",
      npmNotPublished: `${values.packageName}@${values.version} はまだ npm に公開されていません。`,
      promptIntro: "このブリーフを使い、リポジトリを小さく焦点の合った変更で改善してください。",
      promptRules: "ルール: 無関係なユーザー作業を保持し、main へ直接 push せず、大きなリファクタリングを避け、検証を実行し、変更ファイルを要約してください。",
      releaseCheck: `リリースチェックで対応が必要: ${values.check}.`,
      releaseReady: "リリースメタデータと workflow チェックは準備済みです。",
      secretFindings: `機密情報の疑いがある項目を ${values.count} 件検出しました。`,
      sensitiveRemovals: `機密ファイル削除を ${values.count} 件検出しました。このうち ${values.exposedCount ?? values.count} 件は Git 履歴に露出しているため、削除コミット後に露出した認証情報をローテーションしてください。`,
      sensitiveRemovalsNoHistory: `機密ファイル削除を ${values.count} 件検出しました。削除をコミットしてください。Git 履歴への露出は検出されていません。`,
      strategyReady: `ブランチ戦略推薦があります: ${values.strategy}.`
    },
    zh: {
      bootstrapAvailable: "可以用 `aigate start --route oss` 创建缺失的仓库基础文件。",
      commandAi: "为 Codex、Gemini 和 Claude Code 创建 AI 助手指令。",
      commandAiTest: "根据失败测试创建聚焦的 AI 修复提示。",
      commandGate: "在提交、推送或 PR 前运行最终本地关卡。",
      commandInternalFiles: "根据检测到的托管配置创建 MR/PR 模板和 CODEOWNERS 等内部仓库起始文件。",
      commandOss: "创建 README、issue 模板、PR 模板、CODEOWNERS 和开源文档。",
      commandRelease: "确认包元数据、标签、workflow 和 npm 状态。",
      commandReport: "保存此 AI 报告，用于 PR、交接或发布说明。",
      commandTest: "运行 Git 就绪检查和检测到的项目测试命令。",
      directionAi: "让 Codex、Gemini 和 Claude Code 遵循相同工作流。",
      directionAiPolicy: "AI 生成的工作应放在聚焦分支，并在 push 前运行 `aigate test` 或 `aigate aitest`。",
      directionInternalWorkflow: "根据检测到的托管服务准备 README、MR/PR 模板和 CODEOWNERS 等内部仓库工作流文件。",
      directionOss: "用 README、issue 模板、PR 模板、CODEOWNERS 和贡献文档打开公开贡献入口。",
      directionRaiseInternalScore: "按检测到的 private app 配置提高项目基础分；不要只为了分数添加公开 OSS 产物。",
      directionRaiseScore: "公开推广前把项目基础分提高到至少 80。",
      directionRelease: "创建发布标签或发布包变更前完成 release-check 项。",
      directionStrategy: `将 ${values.strategy ?? "推荐策略"} 作为分支政策基线。`,
      directionTests: "让测试和 CI 命令易于运行，方便贡献者在评审前验证。",
      foundationPass: `${values.check} 已就绪。`,
      highRiskFiles: "本地变更包含可能带有敏感信息或认证状态的文件名。",
      largeChange: `当前有 ${values.count} 个变更路径；如果 PR 难以评审，请拆分工作。`,
      missingFoundation: `缺失基础项: ${values.check}.`,
      notGitRepo: "AIGate 未在 Git 仓库内运行。",
      npmNotPublished: `${values.packageName}@${values.version} 尚未发布到 npm。`,
      promptIntro: "使用此简报，以聚焦且最小的变更改进仓库。",
      promptRules: "规则: 保留无关用户工作，不要直接 push 到 main，避免大范围重构，运行验证，并总结变更文件。",
      releaseCheck: `发布检查需要处理: ${values.check}.`,
      releaseReady: "发布元数据和 workflow 检查已就绪。",
      secretFindings: `检测到 ${values.count} 个疑似敏感信息项。`,
      sensitiveRemovals: `检测到 ${values.count} 个敏感文件移除，其中 ${values.exposedCount ?? values.count} 个已暴露在 Git 历史中；提交移除后请轮换暴露的凭据。`,
      sensitiveRemovalsNoHistory: `检测到 ${values.count} 个敏感文件移除。请提交移除；未检测到 Git 历史暴露。`,
      strategyReady: `分支策略建议已可用: ${values.strategy}.`
    }
  };

  return table[language]?.[key] ?? table.en[key] ?? key;
}

function buildReport(type, options = {}) {
  const status = buildGitStatus();
  const evaluation = buildEvaluation(options);
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
    sensitiveRemovals: analysis.sensitiveRemovals,
    projectScore: evaluation.score,
    projectGrade: evaluation.grade,
    checks: evaluation.checks,
    branchAnalysis: buildBranchStrategy(),
    recommendedActions: recommendedActionsForReport(status, evaluation, analysis, type),
    recommendation: analysis.secretFindings.length
      ? "Review possible secret-bearing files before commit or push."
    : analysis.sensitiveRemovals.length
        ? sensitiveRemovalRecommendation(analysis.sensitiveRemovals)
        : status.recommendation
  };
}

function sensitiveRemovalRecommendation(sensitiveRemovals) {
  return sensitiveRemovals.some((finding) => finding.exposedInHistory)
    ? "Commit sensitive file removals and rotate credentials that were exposed in Git history."
    : "Commit sensitive file removals; no Git history exposure was detected.";
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
  } else if (analysis.sensitiveRemovals.length) {
    actions.push(sensitiveRemovalRecommendation(analysis.sensitiveRemovals));
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
    `- ${labels.sensitiveRemovalsCount}: ${report.sensitiveRemovals?.length ?? 0}`,
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
    `## ${labels.sensitiveRemovals}`,
    "",
    ...(report.sensitiveRemovals?.length
      ? report.sensitiveRemovals.map((finding) => formatFindingLine(finding, language))
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
      `- ${labels.sensitiveRemovalsCount}: ${report.sensitiveRemovals?.length ?? 0}`,
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
    `<li>${escapeHtml(labels.sensitiveRemovalsCount)}: ${report.sensitiveRemovals?.length ?? 0}</li>`,
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
        `<li>${escapeHtml(statusLabel(check.status ?? checkStatus(check), language))}: ${escapeHtml(translateEvaluationCheckName(check.name, language))}</li>`
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
    ...evaluation.checks.map((check) => formatCheckLine(check, translateEvaluationCheckName, language)),
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

function buildBranchStrategyFiles(strategy, outputDir, language = "en", profile = {}) {
  const policyPacks = buildBranchPolicyPacks(strategy, profile);
  const packageJson = readJsonFile("package.json");
  const validationCommands = buildValidationCommands(packageJson, profile);
  const sharedFiles = [
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
      content: renderPolicyPackReadme(strategy, policyPacks, language, profile, validationCommands)
    },
    ...policyPacks.map((pack) => ({
      path: join(outputDir, pack.path),
      content: `${JSON.stringify(pack.content, null, 2)}\n`
    })),
    {
      path: join(outputDir, "docs", "release-process.md"),
      content: renderReleaseProcess(strategy, language, profile, validationCommands)
    },
    {
      path: join(outputDir, "docs", "hotfix-process.md"),
      content: renderHotfixProcess(strategy, language, validationCommands)
    }
  ];

  if (profile.hosting === "gitlab") {
    return [
      ...sharedFiles,
      {
        path: join(outputDir, ".gitlab", "merge_request_templates", "aigate.md"),
        content: renderPullRequestTemplateDraft(language, validationCommands)
      },
      {
        path: join(outputDir, ".gitlab", "CODEOWNERS"),
        content: "* @LeeHueeng\n"
      }
    ];
  }

  return [
    ...sharedFiles,
    {
      path: join(outputDir, ".github", "pull_request_template.aigate.md"),
      content: renderPullRequestTemplateDraft(language, validationCommands)
    },
    {
      path: join(outputDir, ".github", "CODEOWNERS.aigate"),
      content: "* @LeeHueeng\n"
    }
  ];
}

function buildBranchPolicyPacks(strategy, profile = {}) {
  const packageJson = readJsonFile("package.json");
  const validationCommands = buildValidationCommands(packageJson, profile);
  const workflow = resolveWorkflowSettings({}, profile, packageJson);
  const requiredChecks = requiredChecksForProfile(profile);
  const protectedBranches = effectiveProtectedBranches(strategy, workflow);
  const packs = [
    {
      path: ".aigate/policy-packs/branch-protection.json",
      content: {
        version: 1,
        id: "branch-protection",
        strategy: strategy.name,
        appliesTo: protectedBranches,
        requiredChecks,
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
        validationCommands: [...validationCommands, "aigate pr-check"],
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
      path: ".aigate/policy-packs/ai-collaboration.json",
      content: {
        version: 1,
        id: "ai-collaboration",
        strategy: strategy.name,
        assistantBranches: workflow.workBranches,
        requiredContext: ["README.md", ".aigate.yml", "docs/branch-strategy.md", "docs/git-upload-workflow.md"],
        guardCommands: validationCommands,
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

  if (profile.kind === "package") {
    packs.splice(2, 0, {
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
        requiredBeforeTag: [...validationCommands, "aigate release-check --npm", "Release workflow dry_run=true"],
        rules: [
          {
            id: "tag-after-ci",
            severity: "block",
            description: "Create release tags only after CI and release-check pass."
          },
          {
            id: "document-release",
            severity: "warn",
            description: "Keep CHANGELOG and release notes aligned with the published package."
          }
        ]
      }
    });
  }

  return packs;
}

function effectiveProtectedBranches(strategy = {}, workflow = {}) {
  const configured = normalizeListSetting(workflow.protectedBranches);
  if (configured.length) {
    return configured;
  }

  const branches = (strategy.branches ?? [])
    .map((branch) => branch.name)
    .filter((branch) => ["main", "develop"].includes(branch));
  const targetBranch = String(workflow.targetBranch ?? "").trim();
  if (targetBranch && !branches.includes(targetBranch)) {
    branches.push(targetBranch);
  }

  return [...new Set(branches.length ? branches : ["main"])];
}

function renderPolicyPackReadme(strategy, policyPacks, language = "en", profile = {}, validationCommands = ["aigate git-ready"]) {
  const files = policyPacks.map((pack) => `- \`${pack.path}\``);
  const platformLabel = profile.hosting === "gitlab" ? "GitLab" : profile.hosting === "github" ? "GitHub" : "hosting provider";
  const validationBlock = [
    "```sh",
    ...validationCommands,
    "```"
  ];

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
      `2. ${platformLabel} branch protection, PR/MR template, CI 설정에 반영합니다.`,
      "3. 변경 후 아래 검증 명령을 실행합니다.",
      "",
      ...validationBlock,
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
      `2. ${platformLabel} branch protection、PR/MR template、CI 設定へ反映します。`,
      "3. 変更後に次の検証コマンドを実行します。",
      "",
      ...validationBlock,
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
      `2. 应用到 ${platformLabel} branch protection、PR/MR template 和 CI 设置。`,
      "3. 变更后运行以下验证命令。",
      "",
      ...validationBlock,
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
    `2. Apply matching settings to ${platformLabel} branch protection, PR/MR templates, and CI.`,
    "3. Run these validation commands after changes.",
    "",
    ...validationBlock,
    ""
  ].join("\n");
}

function renderReleaseProcess(strategy, language = "en", profile = {}, validationCommands = ["aigate git-ready"]) {
  const validation = formatInlineCodeList(validationCommands);
  const packageRelease = profile.kind === "package";
  if (language === "ko") {
    return [
      "# 릴리스 프로세스",
      "",
      `권장 전략: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main`은 PR을 통해 항상 배포 가능한 상태로 유지합니다.",
      `2. 릴리스 준비 전에 ${validation}를 실행합니다.`,
      "3. 별도 안정화가 필요할 때만 `release/vX.Y.Z`를 생성합니다.",
      "4. 안정 릴리스는 `vX.Y.Z` 태그로 표시합니다.",
      packageRelease
        ? "5. npm Trusted Publishing 설정 후 릴리스 워크플로로 npm 패키지를 배포합니다."
        : "5. 앱 배포, 운영 공지, 롤백 계획을 팀의 실제 CI/CD에 맞춰 기록합니다.",
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
      `2. リリース準備前に ${validation} を実行します。`,
      "3. 個別の安定化が必要な場合のみ `release/vX.Y.Z` を作成します。",
      "4. 安定リリースは `vX.Y.Z` タグで示します。",
      packageRelease
        ? "5. npm Trusted Publishing 設定後、リリースワークフローで npm パッケージを公開します。"
        : "5. アプリのデプロイ、運用告知、ロールバック計画を実際の CI/CD に合わせて記録します。",
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
      `2. 发布准备前运行 ${validation}。`,
      "3. 仅在需要单独稳定时创建 `release/vX.Y.Z`。",
      "4. 稳定发布使用 `vX.Y.Z` 标签。",
      packageRelease
        ? "5. 配置 npm Trusted Publishing 后，通过发布工作流发布 npm 包。"
        : "5. 按团队真实 CI/CD 记录应用部署、运营通知和回滚计划。",
      ""
    ].join("\n");
  }

  return [
    "# Release Process",
    "",
    `Recommended strategy: ${strategy.name}`,
    "",
    "1. Keep `main` releasable through pull requests.",
    `2. Run ${validation} before release preparation.`,
    "3. Create `release/vX.Y.Z` only when stabilization needs a separate branch.",
    "4. Tag stable releases as `vX.Y.Z`.",
    packageRelease
      ? "5. Publish npm packages through the Release workflow after npm Trusted Publishing is configured."
      : "5. Record app deployment, operations notes, and rollback steps against the team's real CI/CD.",
    ""
  ].join("\n");
}

function renderHotfixProcess(strategy, language = "en", validationCommands = ["aigate git-ready"]) {
  const validation = formatInlineCodeList(validationCommands);
  if (language === "ko") {
    return [
      "# Hotfix 프로세스",
      "",
      `권장 전략: ${translateStrategyName(strategy.name, language)}`,
      "",
      "1. `main` 또는 최신 안정 태그에서 `hotfix/<short-description>` 브랜치를 만듭니다.",
      "2. 변경 범위를 최소화하고 집중합니다.",
      `3. ${validation}와 필요한 회귀 검사를 실행합니다.`,
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
      `3. ${validation} と必要な回帰確認を実行します。`,
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
      `3. 运行 ${validation} 和必要的回归检查。`,
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
    `3. Run ${validation} and a focused regression check.`,
    "4. Open a pull request into `main` with rollback notes.",
    "5. Publish a patch release after checks and review pass.",
    ""
  ].join("\n");
}

function renderPullRequestTemplateDraft(language = "en", validationCommands = ["aigate git-ready"]) {
  const validationChecklist = [...new Set([...validationCommands, "aigate pr-check"])]
    .map((command) => `- [ ] \`${command}\``);
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
      ...validationChecklist,
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
      ...validationChecklist,
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
      ...validationChecklist,
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
    ...validationChecklist,
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

function buildRepositoryStarterFiles(outputDir, language = "en", packageJson = {}, owner = "@maintainers", profile = {}) {
  const projectName = packageJson.name ?? "my-project";
  const strategy = buildBranchStrategy({
    projectType: profile.kind,
    hosting: profile.hosting,
    ciProvider: profile.ciProvider,
    packageManager: profile.packageManager
  });
  const validationCommands = buildValidationCommands(packageJson, profile);
  const sharedFiles = [
    {
      path: join(outputDir, "README.md"),
      content: renderStarterReadme(projectName, language, profile, validationCommands)
    },
    {
      path: join(outputDir, "CONTRIBUTING.md"),
      content: renderStarterContributing(language, validationCommands)
    },
    {
      path: join(outputDir, "SECURITY.md"),
      content: renderStarterSecurity(language)
    },
    {
      path: join(outputDir, "SUPPORT.md"),
      content: renderStarterSupport(language)
    },
    {
      path: join(outputDir, "CHANGELOG.md"),
      content: renderStarterChangelog(language)
    },
    {
      path: join(outputDir, "docs", "roadmap.md"),
      content: renderStarterRoadmap(language)
    },
    {
      path: join(outputDir, "docs", "branch-strategy.md"),
      content: `${renderBranchStrategyMarkdown(strategy, language)}\n`
    },
    {
      path: join(outputDir, "docs", "git-upload-workflow.md"),
      content: renderStarterGitUploadWorkflow(language)
    }
  ];

  if (profile.hosting === "gitlab") {
    return [
      ...sharedFiles,
      {
        path: join(outputDir, ".gitlab", "issue_templates", "bug.md"),
        content: renderGitLabIssueTemplate("bug", language)
      },
      {
        path: join(outputDir, ".gitlab", "issue_templates", "feature.md"),
        content: renderGitLabIssueTemplate("feature", language)
      },
      {
        path: join(outputDir, ".gitlab", "merge_request_templates", "default.md"),
        content: renderPullRequestTemplateDraft(language, validationCommands)
      },
      {
        path: join(outputDir, ".gitlab", "CODEOWNERS"),
        content: `* ${owner}\n`
      }
    ];
  }

  return [
    ...sharedFiles,
    {
      path: join(outputDir, ".github", "ISSUE_TEMPLATE", "bug_report.yml"),
      content: renderIssueTemplate("bug", language)
    },
    {
      path: join(outputDir, ".github", "ISSUE_TEMPLATE", "feature_request.yml"),
      content: renderIssueTemplate("feature", language)
    },
    {
      path: join(outputDir, ".github", "ISSUE_TEMPLATE", "config.yml"),
      content: renderIssueTemplateConfig(language)
    },
    {
      path: join(outputDir, ".github", "DISCUSSION_TEMPLATE", "ideas.yml"),
      content: renderDiscussionIdeasTemplate(language)
    },
    {
      path: join(outputDir, ".github", "pull_request_template.md"),
      content: renderPullRequestTemplateDraft(language, validationCommands)
    },
    {
      path: join(outputDir, ".github", "CODEOWNERS"),
      content: `* ${owner}\n`
    }
  ];
}

function normalizeCodeownersOwner(owner) {
  const value = String(owner ?? "").trim();
  if (!value) {
    return "@maintainers";
  }

  return value.startsWith("@") ? value : `@${value}`;
}

function repositoryStarterLabels(language = "en") {
  return {
    en: {
      complete: "AIGate open-source starter files",
      outputDir: "Output directory",
      owner: "CODEOWNERS owner"
    },
    ko: {
      complete: "AIGate 오픈소스 시작 파일",
      outputDir: "출력 디렉터리",
      owner: "CODEOWNERS 소유자"
    },
    ja: {
      complete: "AIGate オープンソース初期ファイル",
      outputDir: "出力ディレクトリ",
      owner: "CODEOWNERS オーナー"
    },
    zh: {
      complete: "AIGate 开源起始文件",
      outputDir: "输出目录",
      owner: "CODEOWNERS 所有者"
    }
  }[language] ?? repositoryStarterLabels("en");
}

function renderStarterReadme(projectName, language = "en", profile = {}, validationCommands = ["aigate git-ready"]) {
  const title = projectNameToTitle(projectName);
  const packageManager = ["npm", "pnpm", "yarn", "bun"].includes(profile.packageManager) ? profile.packageManager : "npm";
  const installCommand = `${packageManager} install`;
  if (language === "ko") {
    return [
      `# ${title}`,
      "",
      "프로젝트의 목적, 핵심 기능, 설치 방법을 여기에 정리하세요.",
      "",
      "## 빠른 시작",
      "",
      "```sh",
      installCommand,
      ...validationCommands,
      "```",
      "",
      "## 개발 워크플로",
      "",
      "```sh",
      "aigate start --route quickstart",
      "aigate ai report",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "## 기여",
      "",
      "기여 전 `CONTRIBUTING.md`를 읽고 PR에는 검증 명령과 릴리스 영향을 적어주세요.",
      "",
      "## 라이선스",
      "",
      "라이선스 정보를 `LICENSE`에 추가하세요.",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      `# ${title}`,
      "",
      "プロジェクトの目的、主要機能、インストール方法をここにまとめてください。",
      "",
      "## クイックスタート",
      "",
      "```sh",
      installCommand,
      ...validationCommands,
      "```",
      "",
      "## 開発ワークフロー",
      "",
      "```sh",
      "aigate start --route quickstart",
      "aigate ai report",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "## コントリビュート",
      "",
      "貢献前に `CONTRIBUTING.md` を読み、PR には検証コマンドとリリース影響を記載してください。",
      "",
      "## ライセンス",
      "",
      "ライセンス情報を `LICENSE` に追加してください。",
      ""
    ].join("\n");
  }

  if (language === "zh") {
    return [
      `# ${title}`,
      "",
      "在这里说明项目目标、核心功能和安装方式。",
      "",
      "## 快速开始",
      "",
      "```sh",
      installCommand,
      ...validationCommands,
      "```",
      "",
      "## 开发工作流",
      "",
      "```sh",
      "aigate start --route quickstart",
      "aigate ai report",
      "aigate test",
      "aigate git-ready",
      "```",
      "",
      "## 贡献",
      "",
      "贡献前请阅读 `CONTRIBUTING.md`，并在 PR 中写明验证命令和发布影响。",
      "",
      "## 许可证",
      "",
      "请在 `LICENSE` 中补充许可证信息。",
      ""
    ].join("\n");
  }

  return [
    `# ${title}`,
    "",
    "Describe the project purpose, main features, and installation path here.",
    "",
    "## Quick Start",
    "",
    "```sh",
    installCommand,
    ...validationCommands,
    "```",
    "",
    "## Development Workflow",
    "",
    "```sh",
    "aigate start --route quickstart",
    "aigate ai report",
    "aigate test",
    "aigate git-ready",
    "```",
    "",
    "## Contributing",
    "",
    "Read `CONTRIBUTING.md` before contributing, and include validation commands and release impact in each pull request.",
    "",
    "## License",
    "",
    "Add license details in `LICENSE`.",
    ""
  ].join("\n");
}

function renderStarterContributing(language = "en", validationCommands = ["aigate git-ready"]) {
  if (language === "ko") {
    return [
      "# 기여 가이드",
      "",
      "1. 이슈를 열어 문제나 제안을 먼저 공유합니다.",
      "2. `feature/*`, `feat/*`, `fix/*`, `docs/*`, `chore/*`, `codex/*` 브랜치를 사용합니다.",
      "3. 변경 전후에 아래 명령을 실행합니다.",
      "",
      "```sh",
      "aigate ai report",
      ...validationCommands,
      "```",
      "",
      "4. PR에는 요약, 검증, 릴리스 영향을 포함합니다.",
      ""
    ].join("\n");
  }

  if (language === "ja") {
    return [
      "# コントリビューションガイド",
      "",
      "1. まず issue で問題や提案を共有します。",
      "2. `feature/*`, `feat/*`, `fix/*`, `docs/*`, `chore/*`, `codex/*` ブランチを使います。",
      "3. 変更前後に次を実行します。",
      "",
      "```sh",
      "aigate ai report",
      ...validationCommands,
      "```",
      "",
      "4. PR には概要、検証、リリース影響を含めます。",
      ""
    ].join("\n");
  }

  if (language === "zh") {
    return [
      "# 贡献指南",
      "",
      "1. 先通过 issue 分享问题或建议。",
      "2. 使用 `feature/*`, `feat/*`, `fix/*`, `docs/*`, `chore/*`, `codex/*` 分支。",
      "3. 在变更前后运行以下命令。",
      "",
      "```sh",
      "aigate ai report",
      ...validationCommands,
      "```",
      "",
      "4. PR 中包含摘要、验证和发布影响。",
      ""
    ].join("\n");
  }

  return [
    "# Contributing",
    "",
    "1. Open an issue first for bugs, proposals, or unclear work.",
    "2. Use `feature/*`, `feat/*`, `fix/*`, `docs/*`, `chore/*`, or `codex/*` branches.",
    "3. Run these commands before and after changes.",
    "",
    "```sh",
    "aigate ai report",
    ...validationCommands,
    "```",
    "",
    "4. Include summary, validation, and release impact in each pull request.",
    ""
  ].join("\n");
}

function renderStarterSecurity(language = "en") {
  if (language === "ko") {
    return "# 보안 정책\n\n보안 취약점은 공개 이슈 대신 관리자에게 비공개로 제보해주세요.\n\n```sh\naigate report --format sarif\n```\n";
  }

  if (language === "ja") {
    return "# セキュリティポリシー\n\nセキュリティ脆弱性は公開 issue ではなく、メンテナーへ非公開で報告してください。\n\n```sh\naigate report --format sarif\n```\n";
  }

  if (language === "zh") {
    return "# 安全政策\n\n请不要在公开 issue 中报告安全漏洞，请私下联系维护者。\n\n```sh\naigate report --format sarif\n```\n";
  }

  return "# Security Policy\n\nPlease report security vulnerabilities privately to the maintainers instead of opening a public issue.\n\n```sh\naigate report --format sarif\n```\n";
}

function renderStarterSupport(language = "en") {
  if (language === "ko") {
    return "# 지원\n\n질문은 Discussions를, 재현 가능한 버그는 Bug report 이슈 템플릿을 사용하세요.\n";
  }

  if (language === "ja") {
    return "# サポート\n\n質問は Discussions、再現可能なバグは Bug report issue テンプレートを使用してください。\n";
  }

  if (language === "zh") {
    return "# 支持\n\n问题请使用 Discussions，可复现 bug 请使用 Bug report issue 模板。\n";
  }

  return "# Support\n\nUse Discussions for questions and the Bug report issue template for reproducible bugs.\n";
}

function renderStarterChangelog(language = "en") {
  if (language === "ko") {
    return "# 변경 기록\n\n## 미배포\n\n- 초기 공개 저장소 기반 파일을 추가했습니다.\n";
  }

  if (language === "ja") {
    return "# 変更履歴\n\n## 未リリース\n\n- 初期公開リポジトリ基盤ファイルを追加しました。\n";
  }

  if (language === "zh") {
    return "# 变更日志\n\n## 未发布\n\n- 添加初始公开仓库基础文件。\n";
  }

  return "# Changelog\n\n## Unreleased\n\n- Add initial public repository foundation files.\n";
}

function renderStarterRoadmap(language = "en") {
  if (language === "ko") {
    return "# 로드맵\n\n## 진행 중\n\n- 첫 사용자 온보딩 개선\n- 테스트와 릴리스 자동화 강화\n\n## 계획\n\n- 더 많은 예제와 통합 문서\n- 팀 대시보드와 알림 정책\n";
  }

  if (language === "ja") {
    return "# ロードマップ\n\n## 進行中\n\n- 初回ユーザーのオンボーディング改善\n- テストとリリース自動化の強化\n\n## 計画\n\n- 追加の例と連携ドキュメント\n- チームダッシュボードと通知ポリシー\n";
  }

  if (language === "zh") {
    return "# 路线图\n\n## 进行中\n\n- 改善首次用户引导\n- 强化测试和发布自动化\n\n## 计划\n\n- 更多示例和集成文档\n- 团队仪表盘和通知政策\n";
  }

  return "# Roadmap\n\n## In Progress\n\n- Improve first-user onboarding\n- Strengthen test and release automation\n\n## Planned\n\n- More examples and integration docs\n- Team dashboards and notification policy\n";
}

function renderStarterGitUploadWorkflow(language = "en") {
  if (language === "ko") {
    return "# Git 업로드 워크플로\n\n```sh\ngit switch -c feature/my-work\naigate ai report\naigate test\naigate git-ready\ngit add <files>\ngit commit -m \"feat: short summary\"\naigate push -u origin feature/my-work\naigate pr-check\n```\n";
  }

  if (language === "ja") {
    return "# Git アップロードワークフロー\n\n```sh\ngit switch -c feature/my-work\naigate ai report\naigate test\naigate git-ready\ngit add <files>\ngit commit -m \"feat: short summary\"\naigate push -u origin feature/my-work\naigate pr-check\n```\n";
  }

  if (language === "zh") {
    return "# Git 上传工作流\n\n```sh\ngit switch -c feature/my-work\naigate ai report\naigate test\naigate git-ready\ngit add <files>\ngit commit -m \"feat: short summary\"\naigate push -u origin feature/my-work\naigate pr-check\n```\n";
  }

  return "# Git Upload Workflow\n\n```sh\ngit switch -c feature/my-work\naigate ai report\naigate test\naigate git-ready\ngit add <files>\ngit commit -m \"feat: short summary\"\naigate push -u origin feature/my-work\naigate pr-check\n```\n";
}

function renderIssueTemplate(type, language = "en") {
  const labels = issueTemplateLabels(type, language);
  return [
    `name: ${quoteYamlScalar(labels.name)}`,
    `description: ${quoteYamlScalar(labels.description)}`,
    `title: ${quoteYamlScalar(labels.title)}`,
    `labels: [${labels.labels.map((label) => quoteYamlScalar(label)).join(", ")}]`,
    "body:",
    "  - type: markdown",
    "    attributes:",
    `      value: ${quoteYamlScalar(labels.intro)}`,
    "  - type: textarea",
    "    id: context",
    "    attributes:",
    `      label: ${quoteYamlScalar(labels.context)}`,
    `      description: ${quoteYamlScalar(labels.contextDescription)}`,
    "    validations:",
    "      required: true",
    "  - type: textarea",
    "    id: validation",
    "    attributes:",
    `      label: ${quoteYamlScalar(labels.validation)}`,
    `      description: ${quoteYamlScalar(labels.validationDescription)}`,
    "      value: |",
    "        aigate ai report",
    "        aigate test",
    "        aigate git-ready",
    "    validations:",
    "      required: false",
    ""
  ].join("\n");
}

function renderGitLabIssueTemplate(type, language = "en") {
  const labels = issueTemplateLabels(type, language);
  return [
    `# ${labels.name}`,
    "",
    labels.intro,
    "",
    `## ${labels.context}`,
    "",
    "<!-- " + labels.contextDescription + " -->",
    "",
    `## ${labels.validation}`,
    "",
    "<!-- " + labels.validationDescription + " -->",
    "",
    "```sh",
    "aigate ai report",
    "aigate test",
    "aigate git-ready",
    "```",
    ""
  ].join("\n");
}

function issueTemplateLabels(type, language = "en") {
  const bug = type === "bug";
  const table = {
    en: {
      name: bug ? "Bug report" : "Feature request",
      description: bug ? "Report a reproducible problem." : "Suggest a focused improvement.",
      title: bug ? "[Bug]: " : "[Feature]: ",
      labels: bug ? ["bug", "needs-triage"] : ["enhancement", "needs-triage"],
      intro: bug ? "Thanks for reporting a reproducible problem." : "Thanks for proposing an improvement.",
      context: bug ? "What happened?" : "What should change?",
      contextDescription: bug ? "Include reproduction steps, expected behavior, and actual behavior." : "Describe the user need and the smallest useful change.",
      validation: "Validation",
      validationDescription: "Paste relevant AIGate or test output."
    },
    ko: {
      name: bug ? "버그 제보" : "기능 제안",
      description: bug ? "재현 가능한 문제를 제보합니다." : "집중된 개선 사항을 제안합니다.",
      title: bug ? "[버그]: " : "[기능]: ",
      labels: bug ? ["bug", "needs-triage"] : ["enhancement", "needs-triage"],
      intro: bug ? "재현 가능한 문제를 알려주셔서 감사합니다." : "개선 제안을 남겨주셔서 감사합니다.",
      context: bug ? "무슨 일이 있었나요?" : "무엇이 바뀌어야 하나요?",
      contextDescription: bug ? "재현 단계, 기대 동작, 실제 동작을 적어주세요." : "사용자 필요와 가장 작은 유용한 변경을 설명해주세요.",
      validation: "검증",
      validationDescription: "관련 AIGate 또는 테스트 출력을 붙여주세요."
    },
    ja: {
      name: bug ? "バグ報告" : "機能提案",
      description: bug ? "再現可能な問題を報告します。" : "焦点を絞った改善を提案します。",
      title: bug ? "[Bug]: " : "[Feature]: ",
      labels: bug ? ["bug", "needs-triage"] : ["enhancement", "needs-triage"],
      intro: bug ? "再現可能な問題の報告ありがとうございます。" : "改善提案ありがとうございます。",
      context: bug ? "何が起きましたか?" : "何を変更すべきですか?",
      contextDescription: bug ? "再現手順、期待動作、実際の動作を書いてください。" : "ユーザーの必要性と最小の有用な変更を説明してください。",
      validation: "検証",
      validationDescription: "関連する AIGate またはテスト出力を貼ってください。"
    },
    zh: {
      name: bug ? "Bug 报告" : "功能建议",
      description: bug ? "报告可复现的问题。" : "建议聚焦的改进。",
      title: bug ? "[Bug]: " : "[Feature]: ",
      labels: bug ? ["bug", "needs-triage"] : ["enhancement", "needs-triage"],
      intro: bug ? "感谢你报告可复现的问题。" : "感谢你提出改进建议。",
      context: bug ? "发生了什么?" : "应该改变什么?",
      contextDescription: bug ? "请写出复现步骤、预期行为和实际行为。" : "请描述用户需求和最小可用改动。",
      validation: "验证",
      validationDescription: "粘贴相关 AIGate 或测试输出。"
    }
  };
  return table[language] ?? table.en;
}

function renderIssueTemplateConfig(language = "en") {
  const links = {
    en: ["Ask a question", "Use Discussions for questions and design ideas."],
    ko: ["질문하기", "질문과 설계 아이디어는 Discussions를 사용하세요."],
    ja: ["質問する", "質問や設計アイデアは Discussions を使用してください。"],
    zh: ["提问", "问题和设计想法请使用 Discussions。"]
  }[language] ?? ["Ask a question", "Use Discussions for questions and design ideas."];

  return [
    "blank_issues_enabled: false",
    "contact_links:",
    "  - name: " + quoteYamlScalar(links[0]),
    "    url: https://github.com/<owner>/<repo>/discussions",
    "    about: " + quoteYamlScalar(links[1]),
    ""
  ].join("\n");
}

function renderDiscussionIdeasTemplate(language = "en") {
  const labels = {
    en: ["Idea", "Share an idea or direction.", "[Idea]: ", "What is the idea?", "What problem does it solve?"],
    ko: ["아이디어", "아이디어나 방향성을 공유합니다.", "[아이디어]: ", "아이디어는 무엇인가요?", "어떤 문제를 해결하나요?"],
    ja: ["アイデア", "アイデアや方向性を共有します。", "[Idea]: ", "アイデアは何ですか?", "どの問題を解決しますか?"],
    zh: ["想法", "分享想法或方向。", "[Idea]: ", "这个想法是什么?", "它解决什么问题?"]
  }[language] ?? ["Idea", "Share an idea or direction.", "[Idea]: ", "What is the idea?", "What problem does it solve?"];

  return [
    `title: ${quoteYamlScalar(labels[2])}`,
    `labels: [${quoteYamlScalar("idea")}]`,
    "body:",
    "  - type: markdown",
    "    attributes:",
    `      value: ${quoteYamlScalar(labels[1])}`,
    "  - type: textarea",
    "    id: idea",
    "    attributes:",
    `      label: ${quoteYamlScalar(labels[3])}`,
    "    validations:",
    "      required: true",
    "  - type: textarea",
    "    id: problem",
    "    attributes:",
    `      label: ${quoteYamlScalar(labels[4])}`,
    ""
  ].join("\n");
}

function projectNameToTitle(projectName) {
  return String(projectName || "my-project")
    .replace(/^@[^/]+\//, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "My Project";
}

function projectDisplayName(projectName) {
  const rawName = String(projectName ?? "").trim();
  if (["@aigate/cli", "aigate-cli"].includes(rawName)) {
    return "AIGate";
  }

  return projectNameToTitle(rawName || "my-project");
}

function resolveIntegrationProviders(providerArg) {
  const providers = normalizeListSetting(providerArg).map((provider) => provider.toLowerCase());
  if (!providers.length || providers.includes("all")) {
    return [...SUPPORTED_INTEGRATIONS];
  }

  if (providers.every((provider) => SUPPORTED_INTEGRATIONS.includes(provider))) {
    return [...new Set(providers)];
  }

  return null;
}

function buildIntegrationManifest(providers, profile = {}, packageJson = readJsonFile("package.json"), options = {}) {
  const workflow = resolveWorkflowSettings(options, profile, packageJson);
  const validationCommands = buildValidationCommands(packageJson, profile, options);
  const branchStrategy = buildBranchStrategy({
    projectType: profile.kind,
    hosting: profile.hosting,
    ciProvider: profile.ciProvider,
    packageManager: profile.packageManager,
    branchStrategy: workflow.branchStrategy,
    targetBranch: workflow.targetBranch
  });
  return {
    version: 1,
    generatedBy: `aigate ${VERSION}`,
    project: {
      name: projectDisplayName(packageJson.name ?? "my-project"),
      packageName: packageJson.name ?? ""
    },
    profile: {
      type: profile.kind ?? "unknown",
      hosting: profile.hosting ?? "unknown",
      ciProvider: profile.ciProvider ?? "unknown",
      packageManager: profile.packageManager ?? "unknown"
    },
    workflow: {
      defaultBranch: workflow.defaultBranch,
      targetBranch: workflow.targetBranch,
      protectedBranches: effectiveProtectedBranches(branchStrategy, workflow),
      workBranches: workflow.workBranches,
      distribution: workflow.distribution
    },
    providers,
    requiredCommands: [...new Set([
      ...validationCommands,
      "aigate test",
      "aigate aitest",
      "aigate push --dry-run origin <branch>"
    ])],
    validationCommands,
    branchStrategy: branchStrategy.name,
    requiredChecks: requiredChecksForProfile(profile, options)
  };
}

function buildValidationCommands(packageJson = readJsonFile("package.json"), profile = detectProjectProfile(packageJson), options = {}) {
  const workflow = resolveWorkflowSettings(options, profile, packageJson);
  if (workflow.qualityCommands.length) {
    return [...new Set([...workflow.qualityCommands, "aigate git-ready"])];
  }

  const commands = [];
  const validationCommand = discoverValidationCommand(packageJson, profile);
  if (validationCommand) {
    commands.push(validationCommand.display);
  }
  commands.push("aigate git-ready");
  return [...new Set(commands)];
}

function packageManagerScriptCommand(packageManager, script) {
  const pm = ["npm", "pnpm", "yarn", "bun"].includes(packageManager) ? packageManager : "npm";
  if (script === "test") {
    return `${pm} test`;
  }

  return pm === "yarn" ? `yarn ${script}` : `${pm} run ${script}`;
}

function requiredChecksForProfile(profile = {}, options = {}) {
  const workflow = resolveWorkflowSettings(options, profile);
  if (workflow.requiredChecks.length) {
    return [...new Set(workflow.requiredChecks)];
  }

  if (profile.ciProvider === "gitlab" || profile.hosting === "gitlab") {
    return ["GitLab CI pipeline", "aigate git-ready"];
  }

  if (profile.ciProvider === "github" || profile.hosting === "github") {
    return ["GitHub CI workflow", "aigate git-ready"];
  }

  return ["CI pipeline", "aigate git-ready"];
}

function buildIntegrationFiles(providers, outputDir, manifest, language = "en", options = {}) {
  const writeRootAiFiles = aiRootFilesSettingValue(options.aiRootFiles) !== "sidecar";
  const files = [
    {
      path: join(outputDir, ".aigate", "integrations.json"),
      content: `${JSON.stringify(manifest, null, 2)}\n`
    },
    {
      path: join(outputDir, ".aigate", "integrations", "README.md"),
      content: renderIntegrationReadme(providers, manifest, language)
    }
  ];

  if (providers.includes("codex")) {
    if (writeRootAiFiles) {
      files.push({
        path: join(outputDir, "AGENTS.md"),
        content: renderCodexInstructions(language, manifest),
        protectExistingUnlessAigateOwned: true
      });
    }
    files.push(
      {
        path: join(outputDir, ".aigate", "integrations", "codex.md"),
        content: renderProviderInstructions("Codex", language, manifest)
      }
    );
  }

  if (providers.includes("gemini")) {
    if (writeRootAiFiles) {
      files.push({
        path: join(outputDir, "GEMINI.md"),
        content: renderGeminiInstructions(language, manifest),
        protectExistingUnlessAigateOwned: true
      });
    }
    files.push(
      {
        path: join(outputDir, ".aigate", "integrations", "gemini.md"),
        content: renderProviderInstructions("Gemini", language, manifest)
      }
    );
  }

  if (providers.includes("claude")) {
    if (writeRootAiFiles) {
      files.push({
        path: join(outputDir, "CLAUDE.md"),
        content: renderClaudeInstructions(language, manifest),
        protectExistingUnlessAigateOwned: true
      });
    }
    files.push(
      {
        path: join(outputDir, ".aigate", "integrations", "claude.md"),
        content: renderProviderInstructions("Claude Code", language, manifest)
      }
    );
  }

  return files;
}

function writeIntegrationFiles(files, force, options = {}) {
  return files.map((file) => {
    const exists = existsSync(file.path);
    if (
      exists &&
      force &&
      file.protectExistingUnlessAigateOwned &&
      !options.overwriteProtected &&
      !isAigateOwnedRootAiFile(file.path)
    ) {
      return {
        path: file.path,
        action: "protected"
      };
    }

    if (exists && !force) {
      return {
        path: file.path,
        action: "skipped"
      };
    }

    const action = exists ? "updated" : "created";
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, "utf8");

    return {
      path: file.path,
      action
    };
  });
}

function renderIntegrationReadme(providers, manifest, language = "en") {
  const validationCommands = manifest.validationCommands ?? ["aigate git-ready"];
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
      ...validationCommands,
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
      ...validationCommands,
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
      ...validationCommands,
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
    ...validationCommands,
    "```",
    "",
    "If tests fail, run `aigate aitest` to generate an AI remediation prompt.",
    "",
    "Use `aigate integrate all --force` to regenerate these files."
  ].join("\n") + "\n";
}

function renderCodexInstructions(language = "en", manifest = {}) {
  return [
    language === "ko" ? "# AIGate Codex 지침" : language === "ja" ? "# AIGate Codex 指示" : language === "zh" ? "# AIGate Codex 指令" : "# AIGate Codex Instructions",
    "",
    providerIntro("Codex", language),
    "",
    ...renderSharedAssistantInstructions(language, manifest)
  ].join("\n") + "\n";
}

function renderGeminiInstructions(language = "en", manifest = {}) {
  return [
    language === "ko" ? "# AIGate Gemini 지침" : language === "ja" ? "# AIGate Gemini 指示" : language === "zh" ? "# AIGate Gemini 指令" : "# AIGate Gemini Instructions",
    "",
    providerIntro("Gemini", language),
    "",
    ...renderSharedAssistantInstructions(language, manifest)
  ].join("\n") + "\n";
}

function renderClaudeInstructions(language = "en", manifest = {}) {
  return [
    language === "ko" ? "# AIGate Claude Code 지침" : language === "ja" ? "# AIGate Claude Code 指示" : language === "zh" ? "# AIGate Claude Code 指令" : "# AIGate Claude Code Instructions",
    "",
    providerIntro("Claude Code", language),
    "",
    ...renderSharedAssistantInstructions(language, manifest)
  ].join("\n") + "\n";
}

function renderProviderInstructions(providerName, language = "en", manifest = {}) {
  return [
    language === "ko" ? `# ${providerName} 연동` : language === "ja" ? `# ${providerName} 連携` : language === "zh" ? `# ${providerName} 集成` : `# ${providerName} Integration`,
    "",
    providerGuideIntro(providerName, language),
    "",
    ...renderSharedAssistantInstructions(language, manifest)
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

function formatInlineCodeList(items) {
  return items.map((item) => `\`${item}\``).join(", ");
}

function renderSharedAssistantInstructions(language = "en", manifest = {}) {
  const validationCommands = manifest.validationCommands ?? ["aigate git-ready"];
  const requiredChecks = manifest.requiredChecks ?? ["aigate git-ready"];
  const defaultBranch = manifest.workflow?.defaultBranch ?? "main";
  const targetBranch = manifest.workflow?.targetBranch ?? defaultBranch;
  const projectName = manifest.project?.name ?? projectDisplayName(manifest.project?.packageName ?? manifest.packageName ?? "my-project");
  if (language === "ko") {
    return [
      "## 저장소 컨텍스트",
      "",
      `- 제품: ${projectName}.`,
      `- 기본 브랜치: \`${defaultBranch}\`.`,
      `- 변경은 작업 브랜치를 사용하고 \`${targetBranch}\`에 직접 푸시하지 않습니다.`,
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
      ...validationCommands,
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
      `- 대상은 \`${targetBranch}\`입니다.`,
      "- 요약, 이유, 검증, 릴리스 영향을 포함합니다.",
      `- 필수 검사: ${formatInlineCodeList(requiredChecks)}.`,
      "- 저장소의 현재 review 정책을 따르고 대화를 해결한 뒤 병합합니다."
    ];
  }

  if (language === "ja") {
    return [
      "## リポジトリコンテキスト",
      "",
      `- 製品: ${projectName}.`,
      `- デフォルトブランチ: \`${defaultBranch}\`.`,
      `- 変更には作業ブランチを使い、\`${targetBranch}\` へ直接プッシュしません。`,
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
      ...validationCommands,
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
      `- 対象は \`${targetBranch}\` です。`,
      "- 概要、理由、検証、リリース影響を含めます。",
      `- 必須チェック: ${formatInlineCodeList(requiredChecks)}.`,
      "- リポジトリの現在の review policy に従い、会話を解決してからマージします。"
    ];
  }

  if (language === "zh") {
    return [
      "## 仓库上下文",
      "",
      `- 产品: ${projectName}.`,
      `- 默认分支: \`${defaultBranch}\`.`,
      `- 使用工作分支进行变更，不要直接推送到 \`${targetBranch}\`。`,
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
      ...validationCommands,
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
      `- 目标分支是 \`${targetBranch}\`。`,
      "- 包含摘要、原因、验证和发布影响。",
      `- 必需检查: ${formatInlineCodeList(requiredChecks)}。`,
      "- 遵循仓库当前 review policy，并在解决对话后再合并。"
    ];
  }

  return [
    "## Repository Context",
    "",
    `- Product: ${projectName}.`,
    `- Default branch: \`${defaultBranch}\`.`,
    `- Use feature branches for changes; do not push directly to \`${targetBranch}\`.`,
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
    ...validationCommands,
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
    `- Target \`${targetBranch}\`.`,
    "- Include summary, why, validation, and release impact.",
    `- Required checks: ${formatInlineCodeList(requiredChecks)}.`,
    "- Follow the repository's current review policy and resolve conversations before merge."
  ];
}

function renderDefaultConfig(packageJson, options = {}) {
  const projectName = packageJson.name ?? "my-project";
  const profile = detectProjectProfile(packageJson, options);
  const workflow = resolveWorkflowSettings(options, profile, packageJson);
  const shouldRenderNpmDistribution = workflow.distribution === "npm" || (workflow.distribution === "auto" && profile.kind === "package");
  const distributionLines = shouldRenderNpmDistribution ? [
    "",
    "distribution:",
    "  primaryRegistry: npm",
    `  packageName: ${quoteYamlScalar(packageJson.name ?? "aigate-cli")}`,
    "  releaseChannels:",
    "    stable: latest",
    "    candidate: next",
    "    beta: beta",
    "    experimental: canary"
  ] : [];
  const validationCommands = buildValidationCommands(packageJson, profile, options);
  const strategy = buildBranchStrategy(options);
  const protectedBranches = effectiveProtectedBranches(strategy, workflow);
  const requiredChecks = requiredChecksForProfile(profile, options);
  const aiProviders = workflow.aiProviders.length ? workflow.aiProviders : [...SUPPORTED_INTEGRATIONS];
  return [
    `version: ${CONFIG_SCHEMA_VERSION}`,
    `generatedBy: aigate ${VERSION}`,
    "",
    "project:",
    `  name: ${quoteYamlScalar(projectName)}`,
    `  package: ${quoteYamlScalar(packageJson.name ?? "")}`,
    `  defaultBranch: ${quoteYamlScalar(workflow.defaultBranch)}`,
    `  targetBranch: ${quoteYamlScalar(workflow.targetBranch)}`,
    `  type: ${profile.kind}`,
    `  hosting: ${profile.hosting}`,
    `  ciProvider: ${profile.ciProvider}`,
    `  packageManager: ${profile.packageManager}`,
    ...distributionLines,
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
    `  default: ${quoteYamlScalar(workflow.branchStrategy)}`,
    "  protectedBranches:",
    ...protectedBranches.map((branch) => `    - ${branch}`),
    "  workBranches:",
    ...workflow.workBranches.map((branch) => `    - ${branch}`),
    "",
    "aiIntegrations:",
    "  providers:",
    ...aiProviders.map((provider) => `    - ${provider}`),
    "  requiredChecks:",
    ...requiredChecks.map((check) => `    - ${check}`),
    "",
    "qualityGates:",
    "  beforePush:",
    "    minimumProjectScore: 80",
    "    commands:",
    ...validationCommands.map((command) => `      - ${command}`),
    ""
  ].join("\n");
}

function writeProjectFiles(files, force, options = {}) {
  return files.map((file) => {
    const exists = existsSync(file.path);
    if (
      exists &&
      force &&
      file.protectExistingUnlessAigateOwned &&
      !options.overwriteProtected &&
      !isAigateOwnedRootAiFile(file.path)
    ) {
      return {
        path: file.path,
        action: "protected"
      };
    }

    if (exists && !force) {
      return {
        path: file.path,
        action: "skipped"
      };
    }

    const action = exists ? "updated" : "created";
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, "utf8");

    return {
      path: file.path,
      action
    };
  });
}

function isAigateOwnedRootAiFile(filePath) {
  if (!existsSync(filePath)) {
    return false;
  }

  const fileName = filePath.split(/[\\/]/).pop();
  if (!["AGENTS.md", "GEMINI.md", "CLAUDE.md"].includes(fileName)) {
    return false;
  }

  const content = readFileSync(filePath, "utf8");
  return /^# AIGate (Codex|Gemini|Claude Code)(?:\s|$)/m.test(content);
}

function previewProjectFiles(files) {
  return files.map((file) => ({
    path: file.path,
    action: existsSync(file.path) ? "would-update" : "would-create"
  }));
}

function buildCleanTargets(outputDir, options = {}) {
  const targets = [
    deleteTarget(join(outputDir, ".aigate", "reports")),
    deleteTarget(join(outputDir, ".aigate", "generated-branch-strategy.md")),
    deleteTarget(join(outputDir, ".aigate", "branch-strategy-policy.json")),
    deleteTarget(join(outputDir, ".aigate", "branch-strategy-policy-pack.json")),
    deleteTarget(join(outputDir, ".aigate", "reports", "ai-test.md")),
    deleteTarget(join(outputDir, ".aigate", "reports", "ai-report.md"))
  ];

  if (options.githubFiles) {
    targets.push(
      deleteTarget(join(outputDir, ".github", "ISSUE_TEMPLATE")),
      deleteTarget(join(outputDir, ".github", "DISCUSSION_TEMPLATE")),
      deleteTarget(join(outputDir, ".github", "pull_request_template.md")),
      deleteTarget(join(outputDir, ".github", "pull_request_template.aigate.md")),
      deleteTarget(join(outputDir, ".github", "CODEOWNERS")),
      deleteTarget(join(outputDir, ".github", "CODEOWNERS.aigate"))
    );
  }

  return targets;
}

function buildUninstallTargets(outputDir, options = {}) {
  const targets = [
    deleteTarget(options.config ?? join(outputDir, ".aigate.yml")),
    deleteTarget(join(outputDir, ".aigate")),
    deleteTarget(join(outputDir, ".github", "pull_request_template.aigate.md")),
    deleteTarget(join(outputDir, ".github", "CODEOWNERS.aigate"))
  ];
  const hookPath = resolveAigateHookPath();
  if (hookPath) {
    targets.push(deleteTarget(hookPath, { marker: AIGATE_HOOK_MARKER }));
  }

  if (options.includeAiFiles) {
    targets.push(
      deleteTarget(join(outputDir, "AGENTS.md"), { marker: "AIGate" }),
      deleteTarget(join(outputDir, "GEMINI.md"), { marker: "AIGate" }),
      deleteTarget(join(outputDir, "CLAUDE.md"), { marker: "AIGate" })
    );
  }

  return targets;
}

function deleteTarget(path, options = {}) {
  return {
    path,
    marker: options.marker
  };
}

function applyDeleteTargets(targets, previewOnly) {
  return targets.map((target) => {
    if (!existsSync(target.path)) {
      return {
        path: target.path,
        action: "missing"
      };
    }

    if (target.marker && !safeFileIncludes(target.path, target.marker)) {
      return {
        path: target.path,
        action: "protected"
      };
    }

    if (previewOnly) {
      return {
        path: target.path,
        action: "would-delete"
      };
    }

    rmSync(target.path, { recursive: true, force: true });
    return {
      path: target.path,
      action: "deleted"
    };
  });
}

function safeFileIncludes(path, marker) {
  try {
    const stat = statSync(path);
    if (!stat.isFile()) {
      return false;
    }

    return readFileSync(path, "utf8").includes(marker);
  } catch {
    return false;
  }
}

function resolveAigateHookPath() {
  const gitRoot = git(["rev-parse", "--show-toplevel"]);
  if (!gitRoot) {
    return null;
  }

  const hookPath = git(["rev-parse", "--git-path", "hooks/pre-push"]);
  if (!hookPath) {
    return join(gitRoot, ".git", "hooks", "pre-push");
  }

  return isAbsolute(hookPath) ? hookPath : join(gitRoot, hookPath);
}

function scopedSettingsPath(outputDir) {
  const settingsPath = getSettingsPath();
  if (process.env.AIGATE_SETTINGS_PATH || isAbsolute(settingsPath)) {
    return settingsPath;
  }

  return outputDir === "." ? settingsPath : join(outputDir, settingsPath);
}

function renderMaintenanceResult(result, language) {
  const title = maintenanceTitle(result.command, language);
  const lines = [
    t(language, "maintenance.status", { title, status: automationStatus(result.status, language) }),
    t(language, "maintenance.mode", { mode: translateAutomationMode(result.mode, language) }),
    t(language, "maintenance.outputDir", { path: result.outputDir }),
    "",
    t(language, "maintenance.targets"),
    ...result.targets.map((target) => `- ${translateIntegrationAction(target.action, language)}: ${target.path}`),
    "",
    t(language, "maintenance.next", { next: result.next })
  ];

  if (result.mode === "dry-run" && (result.command === "clean" || result.command === "uninstall")) {
    lines.push(t(language, "maintenance.forceHint"));
  }

  return lines.join("\n");
}

function maintenanceTitle(command, language) {
  const key = command === "reset"
    ? "maintenance.resetTitle"
    : command === "uninstall"
      ? "maintenance.uninstallTitle"
      : "maintenance.cleanTitle";
  return t(language, key);
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

function readAigateConfig(filePath = ".aigate.yml") {
  if (!existsSync(filePath)) {
    return {};
  }

  const config = {};
  let section = null;
  let listKey = null;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) {
      continue;
    }

    const topLevelValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (topLevelValueMatch && topLevelValueMatch[2] !== "") {
      section = null;
      listKey = null;
      config[topLevelValueMatch[1]] = parseYamlScalar(topLevelValueMatch[2]);
      continue;
    }

    const sectionMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      listKey = null;
      config[section] ??= {};
      continue;
    }

    const listItemMatch = line.match(/^\s{4}-\s*(.*?)\s*$/);
    if (listItemMatch && section && listKey) {
      config[section][listKey] ??= [];
      if (Array.isArray(config[section][listKey])) {
        config[section][listKey].push(parseYamlScalar(listItemMatch[1]));
      }
      continue;
    }

    const valueMatch = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!valueMatch || !section) {
      continue;
    }

    config[section] ??= {};
    if (valueMatch[2] === "") {
      listKey = valueMatch[1];
      config[section][listKey] = [];
      continue;
    }

    listKey = null;
    config[section][valueMatch[1]] = parseYamlScalar(valueMatch[2]);
  }

  return config;
}

function parseYamlScalar(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1);
    }
  }

  if (text === "true") {
    return true;
  }

  if (text === "false") {
    return false;
  }

  return text;
}

function fileIncludes(filePath, pattern) {
  if (!existsSync(filePath)) {
    return false;
  }

  return readFileSync(filePath, "utf8").includes(pattern);
}

function fileMatchesAny(filePath, patterns) {
  if (!existsSync(filePath)) {
    return false;
  }

  const content = readFileSync(filePath, "utf8");
  return patterns.some((pattern) => pattern.test(content));
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

function translateNotApplicableReason(reason, language) {
  if (!reason || language === "en") {
    return reason ?? "";
  }

  const exact = {
    "GitHub-specific check is not required for this repository profile.": {
      ko: "이 저장소 프로필에는 GitHub 전용 점검이 필요하지 않습니다.",
      ja: "このリポジトリプロファイルでは GitHub 専用チェックは不要です。",
      zh: "此仓库配置不需要 GitHub 专用检查。"
    },
    "Public repository governance check is not required for a private app profile.": {
      ko: "private 앱 프로필에는 공개 저장소 거버넌스 점검이 필요하지 않습니다.",
      ja: "private app プロファイルでは公開リポジトリ向けガバナンスチェックは不要です。",
      zh: "private app 配置不需要公开仓库治理检查。"
    },
    "Package release check is not required for an app profile.": {
      ko: "app 프로필에는 패키지 릴리스 점검이 필요하지 않습니다.",
      ja: "app プロファイルではパッケージリリースチェックは不要です。",
      zh: "app 配置不需要包发布检查。"
    },
    "AIGate CI gate requires a CI workflow.": {
      ko: "AIGate CI 게이트에는 CI 워크플로가 필요합니다.",
      ja: "AIGate CI ゲートには CI ワークフローが必要です。",
      zh: "AIGate CI 关卡需要 CI 工作流。"
    },
    "AIGate server enforcement requires a CI gate first.": {
      ko: "AIGate 서버 강제 적용에는 먼저 CI 게이트가 필요합니다.",
      ja: "AIGate サーバー強制には先に CI ゲートが必要です。",
      zh: "AIGate 服务器强制需要先配置 CI 关卡。"
    },
    "npm package release check is not required for this repository profile.": {
      ko: "이 저장소 프로필에는 npm 패키지 배포 점검이 필요하지 않습니다.",
      ja: "このリポジトリプロファイルでは npm パッケージ公開チェックは不要です。",
      zh: "此仓库配置不需要 npm 包发布检查。"
    },
    "Release tag check is only required during explicit release readiness checks.": {
      ko: "릴리스 태그 점검은 명시적인 릴리스 준비 검사에서만 필요합니다.",
      ja: "リリースタグチェックは明示的なリリース準備チェック時のみ必要です。",
      zh: "发布标签检查仅在显式发布就绪检查中需要。"
    },
    "GitHub Trusted Publishing check is not required for this repository hosting provider.": {
      ko: "이 호스팅 제공자에는 GitHub Trusted Publishing 점검이 필요하지 않습니다.",
      ja: "このホスティングでは GitHub Trusted Publishing チェックは不要です。",
      zh: "此托管服务不需要 GitHub Trusted Publishing 检查。"
    }
  };

  if (exact[reason]?.[language]) {
    return exact[reason][language];
  }

  const lockMatch = reason.match(/^(.+) project does not use package-lock\.json\.$/);
  if (lockMatch) {
    return {
      ko: `${lockMatch[1]} 프로젝트는 package-lock.json을 사용하지 않습니다.`,
      ja: `${lockMatch[1]} プロジェクトは package-lock.json を使用しません。`,
      zh: `${lockMatch[1]} 项目不使用 package-lock.json。`
    }[language] ?? reason;
  }

  return reason;
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

  const removalMatch = warning.match(/^(\d+) sensitive file removal\(s\) detected; commit the removal and rotate credentials if they were already exposed\.$/);
  if (removalMatch) {
    return {
      ko: `민감 파일 제거 ${removalMatch[1]}개가 감지됐습니다. 제거를 커밋하고 이미 노출된 자격 증명은 회전하세요.`,
      ja: `機密ファイル削除を ${removalMatch[1]} 件検出しました。削除をコミットし、すでに露出した認証情報はローテーションしてください。`,
      zh: `检测到 ${removalMatch[1]} 个敏感文件移除。请提交移除，并轮换已经暴露的凭据。`
    }[language] ?? warning;
  }

  const exposedRemovalMatch = warning.match(/^(\d+) sensitive file removal\(s\) detected; (\d+) had Git history exposure, so commit the removal and rotate exposed credentials\.$/);
  if (exposedRemovalMatch) {
    return {
      ko: `민감 파일 제거 ${exposedRemovalMatch[1]}개가 감지됐습니다. 이 중 ${exposedRemovalMatch[2]}개는 Git 이력에 노출됐으니 제거를 커밋하고 노출된 자격 증명을 회전하세요.`,
      ja: `機密ファイル削除を ${exposedRemovalMatch[1]} 件検出しました。このうち ${exposedRemovalMatch[2]} 件は Git 履歴に露出しているため、削除をコミットし、露出した認証情報をローテーションしてください。`,
      zh: `检测到 ${exposedRemovalMatch[1]} 个敏感文件移除，其中 ${exposedRemovalMatch[2]} 个已暴露在 Git 历史中；请提交移除并轮换暴露的凭据。`
    }[language] ?? warning;
  }

  const unexposedRemovalMatch = warning.match(/^(\d+) sensitive file removal\(s\) detected; commit the removal\. No Git history exposure was detected\.$/);
  if (unexposedRemovalMatch) {
    return {
      ko: `민감 파일 제거 ${unexposedRemovalMatch[1]}개가 감지됐습니다. 제거를 커밋하세요. Git 이력 노출은 감지되지 않았습니다.`,
      ja: `機密ファイル削除を ${unexposedRemovalMatch[1]} 件検出しました。削除をコミットしてください。Git 履歴への露出は検出されていません。`,
      zh: `检测到 ${unexposedRemovalMatch[1]} 个敏感文件移除。请提交移除；未检测到 Git 历史暴露。`
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

  if (area === "git") {
    return { ko: "Git", ja: "Git", zh: "Git" }[language] ?? area;
  }

  if (area === "branch") {
    return { ko: "브랜치", ja: "ブランチ", zh: "分支" }[language] ?? area;
  }

  if (area === "foundation") {
    return { ko: "기반", ja: "基盤", zh: "基础" }[language] ?? area;
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
      "GitLab Flow with merge requests": "merge request 기반 GitLab Flow",
      "GitHub Flow with release channels": "릴리스 채널을 포함한 GitHub Flow"
    },
    ja: {
      "Git Flow": "Git Flow",
      "Trunk-Based Development": "Trunk-Based Development",
      "Hybrid Flow": "Hybrid Flow",
      "GitLab Flow with merge requests": "merge request ベースの GitLab Flow",
      "GitHub Flow with release channels": "リリースチャンネル付き GitHub Flow"
    },
    zh: {
      "Git Flow": "Git Flow",
      "Trunk-Based Development": "基于 Trunk 的开发",
      "Hybrid Flow": "混合 Flow",
      "GitLab Flow with merge requests": "基于 merge request 的 GitLab Flow",
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

  match = step.match(/^If (.+) is not on npm yet, create it with: (.+)$/);
  if (match) {
    return {
      ko: `${match[1]}가 아직 npm에 없다면 다음 명령으로 생성하세요: ${match[2]}`,
      ja: `${match[1]} がまだ npm にない場合は、次のコマンドで作成してください: ${match[2]}`,
      zh: `如果 ${match[1]} 尚未在 npm 上，请用以下命令创建: ${match[2]}`
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
      "No npm package publication is required for the detected app/private repository profile.": "감지된 app/private 저장소 프로필에는 npm 패키지 배포가 필요하지 않습니다.",
      "Configure release automation in your CI provider before tagging a release.": "릴리스 태그 생성 전에 사용 중인 CI 제공자에서 릴리스 자동화를 설정하세요.",
      "Run release-check --npm to confirm npm registry publication state.": "npm 레지스트리 배포 상태를 확인하려면 release-check --npm을 실행하세요.",
      "Ensure release workflow publishes with npm provenance.": "릴리스 워크플로가 npm provenance로 배포하는지 확인하세요.",
      "Run npm run ci before tagging a release.": "릴리스 태그 생성 전에 npm run ci를 실행하세요.",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "릴리스 workflow_dispatch dry_run 입력으로 npm publish dry-run을 실행하세요."
    },
    ja: {
      "No npm package publication is required for the detected app/private repository profile.": "検出された app/private リポジトリプロファイルでは npm パッケージ公開は不要です。",
      "Configure release automation in your CI provider before tagging a release.": "リリースタグを作成する前に、利用中の CI でリリース自動化を設定してください。",
      "Run release-check --npm to confirm npm registry publication state.": "npm レジストリの公開状態を確認するには release-check --npm を実行してください。",
      "Ensure release workflow publishes with npm provenance.": "リリースワークフローが npm provenance 付きで公開することを確認してください。",
      "Run npm run ci before tagging a release.": "リリースタグを作成する前に npm run ci を実行してください。",
      "Run npm publish dry-run through the Release workflow_dispatch dry_run input.": "リリース workflow_dispatch の dry_run 入力で npm publish dry-run を実行してください。"
    },
    zh: {
      "No npm package publication is required for the detected app/private repository profile.": "检测到的 app/private 仓库配置不需要 npm 包发布。",
      "Configure release automation in your CI provider before tagging a release.": "创建发布标签前，请在当前 CI 服务中配置发布自动化。",
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
      arg === "--github-files" ||
      arg === "--no-verify" ||
      arg === "--overwrite-ai-files" ||
      arg.startsWith("--dry-run=") ||
      arg.startsWith("--github-files=") ||
      arg.startsWith("--no-verify=") ||
      arg.startsWith("--overwrite-ai-files=") ||
      arg.startsWith("--notify-channel=") ||
      arg.startsWith("--webhook-env=") ||
      arg.startsWith("--webhook-url=") ||
      arg.startsWith("--issue-type=") ||
      arg.startsWith("--hosting=") ||
      arg.startsWith("--ci-provider=") ||
      arg.startsWith("--package-manager=") ||
      arg.startsWith("--project-type=") ||
      arg.startsWith("--distribution=") ||
      arg.startsWith("--target-branch=") ||
      arg.startsWith("--protected-branches=") ||
      arg.startsWith("--work-branches=") ||
      arg.startsWith("--work-branch=") ||
      arg.startsWith("--required-checks=") ||
      arg.startsWith("--quality-command=") ||
      arg.startsWith("--gitlab-pipeline-must-succeed=") ||
      arg.startsWith("--github-required-checks-enforced=") ||
      arg.startsWith("--providers=") ||
      arg.startsWith("--ai-providers=") ||
      arg.startsWith("--ai-root-files=") ||
      arg.startsWith("--root-ai-files=") ||
      arg.startsWith("--branch-strategy=") ||
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
      arg === "--hosting" ||
      arg === "--ci-provider" ||
      arg === "--package-manager" ||
      arg === "--project-type" ||
      arg === "--distribution" ||
      arg === "--target-branch" ||
      arg === "--protected-branches" ||
      arg === "--work-branches" ||
      arg === "--work-branch" ||
      arg === "--required-checks" ||
      arg === "--quality-command" ||
      arg === "--gitlab-pipeline-must-succeed" ||
      arg === "--github-required-checks-enforced" ||
      arg === "--providers" ||
      arg === "--ai-providers" ||
      arg === "--ai-root-files" ||
      arg === "--root-ai-files" ||
      arg === "--branch-strategy" ||
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
    "--ai-providers",
    "--ai-root-files",
    "--branch-strategy",
    "--channel",
    "--ci-provider",
    "--config",
    "--distribution",
    "--event",
    "--format",
    "--gitlab-pipeline-must-succeed",
    "--github-required-checks-enforced",
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
    "--hosting",
    "--package-manager",
    "--protected-branches",
    "--protected-branch",
    "--work-branches",
    "--work-branch",
    "--prompt-output",
    "--pr",
    "--providers",
    "--root-ai-files",
    "--quality-command",
    "--quality-commands",
    "--release",
    "--required-check",
    "--required-checks",
    "--route",
    "--steps",
    "--provider",
    "--project-type",
    "--script",
    "--command",
    "--agent-command",
    "--team-size",
    "--target-branch",
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

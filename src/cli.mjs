#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = dirname(CLI_DIR);
const VERSION = readPackageVersion();
const SUPPORTED_LANGUAGES = ["en", "ko"];
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

const RECOMMENDATIONS_KO = new Map([
  ["No local changes detected.", "로컬 변경사항이 없습니다."],
  ["Run AIGate inside a Git repository.", "Git 저장소 안에서 AIGate를 실행하세요."],
  ["Review possible secret-bearing files before commit or push.", "커밋이나 푸시 전에 secret이 포함될 수 있는 파일을 확인하세요."],
  ["Open a focused branch and pull request after tests pass.", "테스트 통과 후 범위가 분명한 브랜치와 pull request를 만드세요."],
  ["Resolve blockers before committing, pushing, or opening a pull request.", "커밋, 푸시, pull request 생성 전에 차단 사유를 해결하세요."],
  ["Run npm test, commit focused changes, push the branch, and open a pull request.", "npm test를 실행한 뒤 범위가 분명한 변경을 커밋하고 브랜치를 푸시한 다음 pull request를 만드세요."],
  ["Repository foundations are ready for the next MVP slice.", "저장소 기반이 다음 MVP 작업을 진행할 준비가 됐습니다."],
  ["Complete the missing repository foundations before public release.", "공개 릴리스 전에 누락된 저장소 기반을 보완하세요."]
]);

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
  --language <en|ko>       Select output language.
  --output-dir <path>      Select integration output directory.
  --force                  Overwrite generated integration files.
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

  const lines = language === "ko"
    ? [
        "AIGate 초기화 완료",
        ...results.map((result) => `- ${translateIntegrationAction(result.action)}: ${result.path}`),
        "다음 단계: aigate evaluate-project && aigate branch-strategy --github"
      ]
    : [
        "AIGate init complete",
        ...results.map((result) => `- ${result.action}: ${result.path}`),
        "Next: aigate evaluate-project && aigate branch-strategy --github"
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

  if (language === "ko") {
    return [
      `AIGate 검사: ${result.status}`,
      `브랜치: ${result.branch}`,
      `변경 파일: ${result.changedFiles}`,
      `Secret 탐지: ${result.secretFindings.length}`,
      `권장 사항: ${translateRecommendation(result.recommendation, language)}`
    ].join("\n");
  }

  return [
    `AIGate check: ${result.status}`,
    `Branch: ${result.branch}`,
    `Changed files: ${result.changedFiles}`,
    `Secret findings: ${result.secretFindings.length}`,
    `Recommendation: ${result.recommendation}`
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
      appendBlockNotification(lines, options);
      process.exitCode = 1;
      return lines.join("\n");
    }
  } else {
    lines.push(language === "ko"
      ? "AIGate push: --no-verify로 준비 게이트를 건너뜁니다."
      : "AIGate push: readiness gate skipped with --no-verify");
  }

  const gitArgs = ["push", ...pushArgs];
  if (options.dryRun) {
    lines.push(language === "ko"
      ? `실행 예정: git ${gitArgs.join(" ")}`
      : `Would run: git ${gitArgs.join(" ")}`);
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
      appendBlockNotification(lines, options);
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
    lines.push(`Would run: gh ${quoteArgs(ghArgs).join(" ")}`);
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
  const format = options.format ?? "markdown";
  const report = buildReport("pr");
  const output = renderReport(report, format);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return `Wrote ${options.output}`;
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

  if (language === "ko") {
    return [
      "AIGate 설정 완료",
      `설정 파일: ${getSettingsPath()}`,
      `언어: ${language}`
    ].join("\n");
  }

  return [
    "AIGate setup complete",
    `Settings file: ${getSettingsPath()}`,
    `Language: ${language}`
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

  if (language === "ko") {
    return [
      "AIGate 설정",
      `설정 파일: ${getSettingsPath()}`,
      `언어: ${settings.language}`
    ].join("\n");
  }

  return [
    "AIGate settings",
    `Settings file: ${getSettingsPath()}`,
    `Language: ${settings.language}`
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
      `Unsupported integration provider: ${providerArg}`,
      `Supported providers: ${SUPPORTED_INTEGRATIONS.join(", ")}, all`
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

  if (language === "ko") {
    return [
      "AIGate AI 연동 파일 생성",
      `대상: ${providers.join(", ")}`,
      ...results.map((result) => `- ${translateIntegrationAction(result.action)}: ${result.path}`),
      "다음 단계: 생성된 지침 파일을 검토하고 npm run ci를 실행하세요."
    ].join("\n");
  }

  return [
    "AIGate AI integration files",
    `Providers: ${providers.join(", ")}`,
    ...results.map((result) => `- ${result.action}: ${result.path}`),
    "Next: review the generated instruction files and run npm run ci."
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

  if (language === "ko") {
    return [
      `AIGate git-ready: ${result.status === "READY" ? "준비 완료" : "차단"}`,
      `브랜치: ${result.branch}`,
      `변경 파일: ${result.changedFiles}`,
      `Secret 탐지: ${result.secretFindings.length}`,
      `프로젝트 점수: ${result.projectScore}/100`,
      result.blockers.length ? "차단 사유:" : "차단 사유: 없음",
      ...result.blockers.map((blocker) => `- ${translateBlocker(blocker, language)}`),
      `권장 사항: ${translateRecommendation(result.recommendation, language)}`
    ].join("\n");
  }

  return [
    `AIGate git-ready: ${result.status}`,
    `Branch: ${result.branch}`,
    `Changed files: ${result.changedFiles}`,
    `Secret findings: ${result.secretFindings.length}`,
    `Project score: ${result.projectScore}/100`,
    result.blockers.length ? "Blockers:" : "Blockers: none",
    ...result.blockers.map((blocker) => `- ${blocker}`),
    `Recommendation: ${result.recommendation}`
  ].join("\n");
}

function commandReport(args) {
  const options = parseOptions(args);
  const format = options.format ?? "markdown";
  const type = options.type ?? "local";
  const report = buildReport(type);
  const output = renderReport(report, format);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return `Wrote ${options.output}`;
  }

  return output;
}

function commandEvaluateProject(args) {
  const options = parseOptions(args);
  const evaluation = buildEvaluation({ deep: Boolean(options.deep) });

  if (options.report) {
    const format = options.format ?? "markdown";
    const output = renderProjectEvaluationReport(evaluation, format);

    if (options.output) {
      mkdirSync(dirname(options.output), { recursive: true });
      writeFileSync(options.output, `${output}\n`, "utf8");
      return `Wrote ${options.output}`;
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
  const check = buildReleaseCheck();

  if (options.format === "json") {
    return JSON.stringify(check, null, 2);
  }

  const rows = check.checks.map((item) => `- ${item.pass ? "PASS" : "TODO"}: ${item.name}`);

  return [
    `AIGate release-check: ${check.status}`,
    `Package: ${check.packageName}`,
    `Version: ${check.version}`,
    `Release tag: ${check.expectedTag}`,
    "",
    ...rows,
    "",
    "Next steps:",
    ...check.nextSteps.map((step) => `- ${step}`)
  ].join("\n");
}

function commandBranchStrategy(args) {
  const options = parseOptions(args);
  const strategy = buildBranchStrategy(options);

  if (options.generate || options.apply) {
    const files = buildBranchStrategyFiles(strategy, options.outputDir ?? ".");
    const results = writeProjectFiles(files, Boolean(options.force));

    if (options.format === "json") {
      return JSON.stringify({
        command: "branch-strategy",
        strategy,
        files: results
      }, null, 2);
    }

    return [
      options.apply ? "Applied branch strategy files" : "Generated branch strategy files",
      ...results.map((result) => `- ${result.action}: ${result.path}`)
    ].join("\n");
  }

  if (options.format === "json") {
    return JSON.stringify(strategy, null, 2);
  }

  const lines = [
    `Recommended strategy: ${strategy.name}`,
    `Reason: ${strategy.reason}`,
    "",
    "Branches:",
    ...strategy.branches.map((branch) => `- ${branch.name}: ${branch.use}`)
  ];

  if (options.github) {
    lines.push("", "GitHub protection:", ...strategy.githubProtection.map((rule) => `- ${rule}`));
  }

  if (strategy.generatedOutputs.length) {
    lines.push("", "Generated outputs:", ...strategy.generatedOutputs.map((file) => `- ${file}`));
  }

  return lines.join("\n");
}

function commandAuditReport(args) {
  const options = parseOptions(args);
  const format = options.format ?? "markdown";
  const report = buildAuditReport();
  const output = renderAuditReport(report, format);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return `Wrote ${options.output}`;
  }

  return output;
}

function commandNotify(args) {
  const [subcommand, ...rest] = args;
  const options = parseOptions(rest);
  const event = options.event ?? "BLOCK";
  const channel = options.channel ?? "terminal";

  if (subcommand === "setup") {
    return [
      "Notification setup preview",
      "- MVP: terminal",
      "- V1: Slack",
      "- V1.5: Discord and Teams",
      "- V2: email, GitHub PR comments, GitHub Checks"
    ].join("\n");
  }

  if (subcommand === "test") {
    return [
      `Notification test event: ${event}`,
      `Target: ${channel}`,
      "Status: ready"
    ].join("\n");
  }

  if (subcommand === "send") {
    return sendNotification(event, channel, options);
  }

  process.exitCode = 1;
  return "Usage: aigate notify <setup|test|send> [--event BLOCK] [--channel terminal]";
}

function sendNotification(event, channel, options) {
  const payload = {
    event,
    channel,
    branch: git(["branch", "--show-current"]) || "unknown",
    status: buildGitReadyResult().status,
    generatedAt: new Date().toISOString()
  };

  if (channel === "terminal") {
    return [
      `AIGate notification: ${event}`,
      `Branch: ${payload.branch}`,
      `Status: ${payload.status}`
    ].join("\n");
  }

  const webhookEnv = options.webhookEnv ?? defaultWebhookEnv(channel);
  const webhookUrl = process.env[webhookEnv];

  if (!webhookUrl) {
    process.exitCode = 1;
    return [
      `Missing webhook environment variable: ${webhookEnv}`,
      `Set ${webhookEnv} or use --channel terminal.`
    ].join("\n");
  }

  if (options.dryRun) {
    return `Would send ${event} notification to ${channel} using ${webhookEnv}`;
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

  return `Sent ${event} notification to ${channel}`;
}

function appendBlockNotification(lines, options) {
  if (!options.notifyChannel) {
    return;
  }

  const originalExitCode = process.exitCode;
  lines.push("", sendNotification("BLOCK", options.notifyChannel, options));
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

function buildReleaseCheck() {
  const packageJson = readJsonFile("package.json");
  const version = packageJson.version ?? "0.0.0";
  const packageName = packageJson.name ?? "";
  const expectedTag = `v${version}`;
  const tags = (git(["tag", "--list"]) ?? "")
    .split("\n")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const hasExpectedTag = tags.includes(expectedTag);
  const checks = [
    { name: "package.json exists", pass: existsSync("package.json") },
    { name: "package-lock.json version matches package.json", pass: readJsonFile("package-lock.json").version === version },
    { name: "package has a public npm name", pass: /^(@[a-z0-9-]+\/)?aigate(?:-[a-z0-9]+)*$/.test(packageName) },
    { name: "package version is not 0.0.0", pass: version !== "0.0.0" },
    { name: "package exposes aigate bin", pass: Boolean(packageJson.bin?.aigate) },
    { name: "publishConfig access is public", pass: packageJson.publishConfig?.access === "public" },
    { name: "release workflow exists", pass: existsSync(join(".github", "workflows", "release.yml")) },
    { name: "release workflow uses npm provenance", pass: fileIncludes(join(".github", "workflows", "release.yml"), "--provenance") },
    { name: "release workflow disables package manager cache", pass: fileIncludes(join(".github", "workflows", "release.yml"), "package-manager-cache: false") },
    { name: "README documents install channels", pass: fileIncludes("README.md", `npm install -g ${packageName}`) },
    { name: `${expectedTag} tag exists`, pass: hasExpectedTag }
  ];
  const status = checks.every((check) => check.pass) ? "READY" : "ACTION_REQUIRED";
  const nextSteps = [];

  if (!hasExpectedTag) {
    nextSteps.push(`If ${packageName} is not on npm yet, enable npm account 2FA and create it with: npm publish --access public`);
    nextSteps.push(`Configure trusted publishing after the package exists: npx npm@latest trust github ${packageName} --file release.yml --repo LeeHueeng/aigate-ai-git-workflow-guard-cli --allow-publish --yes`);
    nextSteps.push(`Create release tag ${expectedTag} after npm Trusted Publishing is configured.`);
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
    checks,
    nextSteps
  };
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

function renderBranchStrategyMarkdown(strategy) {
  return [
    `# ${strategy.name}`,
    "",
    strategy.reason,
    "",
    "## Branches",
    "",
    ...strategy.branches.map((branch) => `- \`${branch.name}\`: ${branch.use}`),
    "",
    "## GitHub Protection",
    "",
    ...strategy.githubProtection.map((rule) => `- ${rule}`),
    "",
    "## Generated Outputs",
    "",
    ...strategy.generatedOutputs.map((file) => `- \`${file}\``)
  ].join("\n");
}

function buildBranchStrategyFiles(strategy, outputDir) {
  return [
    {
      path: join(outputDir, ".aigate", "generated-branch-strategy.md"),
      content: `${renderBranchStrategyMarkdown(strategy)}\n`
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
      content: renderReleaseProcess(strategy)
    },
    {
      path: join(outputDir, "docs", "hotfix-process.md"),
      content: renderHotfixProcess(strategy)
    },
    {
      path: join(outputDir, ".github", "pull_request_template.aigate.md"),
      content: renderPullRequestTemplateDraft()
    },
    {
      path: join(outputDir, ".github", "CODEOWNERS.aigate"),
      content: "* @LeeHueeng\n"
    }
  ];
}

function renderReleaseProcess(strategy) {
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

function renderHotfixProcess(strategy) {
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

function renderPullRequestTemplateDraft() {
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
    korean: "ko",
    kr: "ko",
    "ko-kr": "ko",
    "한국어": "ko"
  };
  const language = aliases[normalized] ?? normalized;
  return SUPPORTED_LANGUAGES.includes(language) ? language : null;
}

function unsupportedLanguage(value) {
  process.exitCode = 1;
  return [
    `Unsupported language: ${value ?? ""}`.trim(),
    `Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`
  ].join("\n");
}

function translateRecommendation(recommendation, language) {
  if (language !== "ko") {
    return recommendation;
  }

  return RECOMMENDATIONS_KO.get(recommendation) ?? recommendation;
}

function translateBlocker(blocker, language) {
  if (language !== "ko") {
    return blocker;
  }

  if (blocker === "AIGate must run inside a Git repository.") {
    return "AIGate는 Git 저장소 안에서 실행해야 합니다.";
  }

  if (blocker === "Possible secret-bearing file names are present in local changes.") {
    return "로컬 변경사항에 secret이 포함될 수 있는 파일명이 있습니다.";
  }

  const secretCountMatch = blocker.match(/^(\d+) possible secret finding\(s\) detected in changed files\.$/);
  if (secretCountMatch) {
    return `변경 파일에서 secret 의심 항목 ${secretCountMatch[1]}개가 감지됐습니다.`;
  }

  return blocker.replace(
    /^Project foundation score is (\d+)\/100; minimum is 80\.$/,
    "프로젝트 기반 점수는 $1/100이며 최소 기준은 80입니다."
  );
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

function translateIntegrationAction(action) {
  return {
    created: "생성",
    updated: "갱신",
    skipped: "건너뜀"
  }[action] ?? action;
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

function print(value) {
  console.log(value);
}

function printError(value) {
  console.error(value);
}

main(process.argv.slice(2));

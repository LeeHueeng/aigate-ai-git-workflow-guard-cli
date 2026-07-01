#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VERSION = "0.0.0";

const helpText = `AIGate ${VERSION}

AI Git Workflow Guard CLI

Usage:
  aigate <command> [options]

Commands:
  check                    Summarize local Git readiness.
  git-ready                Run the before-push readiness gate.
  push                     Run AIGate checks, then run git push.
  report                   Print a workflow report.
  evaluate-project         Score repository workflow foundations.
  score                    Print only the project score.
  branch-strategy          Recommend a branch strategy.
  notify <setup|test>      Preview notification workflows.
  help                     Show this help message.

Options:
  --format <text|json|markdown|html>
  --type <local|pr|weekly>
  --generate               Write generated branch strategy guidance.
  --github                 Include GitHub protection guidance.
  --event <name>           Notification event name.
  --dry-run                Preview an AIGate command without changing remotes.
  --no-verify              Skip the AIGate readiness gate for push.
  --version                Print CLI version.
`;

const commands = {
  check: commandCheck,
  "git-ready": commandGitReady,
  push: commandPush,
  report: commandReport,
  "evaluate-project": commandEvaluateProject,
  score: commandScore,
  "branch-strategy": commandBranchStrategy,
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

function commandCheck(args) {
  const options = parseOptions(args);
  const status = buildGitStatus();
  const result = {
    command: "check",
    status: status.riskLevel === "high" ? "BLOCK" : status.changedFiles.length ? "WARN" : "PASS",
    branch: status.branch,
    changedFiles: status.changedFiles.length,
    tracked: status.insideGitRepository,
    recommendation: status.recommendation
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return [
    `AIGate check: ${result.status}`,
    `Branch: ${result.branch}`,
    `Changed files: ${result.changedFiles}`,
    `Recommendation: ${result.recommendation}`
  ].join("\n");
}

function commandGitReady(args) {
  return formatGitReadyResult(buildGitReadyResult(), parseOptions(args));
}

function commandPush(args) {
  const options = parseOptions(args);
  const pushArgs = args.filter((arg) => arg !== "--dry-run" && arg !== "--no-verify");
  const lines = [];

  if (!options.noVerify) {
    const result = buildGitReadyResult();
    lines.push(formatGitReadyResult(result, { format: "text" }));

    if (result.blockers.length) {
      process.exitCode = 1;
      return lines.join("\n");
    }
  } else {
    lines.push("AIGate push: readiness gate skipped with --no-verify");
  }

  const gitArgs = ["push", ...pushArgs];
  if (options.dryRun) {
    lines.push(`Would run: git ${gitArgs.join(" ")}`);
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

function buildGitReadyResult() {
  const status = buildGitStatus();
  const evaluation = buildEvaluation();
  const blockers = [];

  if (!status.insideGitRepository) {
    blockers.push("AIGate must run inside a Git repository.");
  }

  if (status.riskLevel === "high") {
    blockers.push("Possible secret-bearing file names are present in local changes.");
  }

  if (evaluation.score < 80) {
    blockers.push(`Project foundation score is ${evaluation.score}/100; minimum is 80.`);
  }

  return {
    command: "git-ready",
    status: blockers.length ? "BLOCK" : "READY",
    branch: status.branch,
    changedFiles: status.changedFiles.length,
    projectScore: evaluation.score,
    blockers,
    recommendation: blockers.length
      ? "Resolve blockers before committing, pushing, or opening a pull request."
      : "Run npm test, commit focused changes, push the branch, and open a pull request."
  };
}

function formatGitReadyResult(result, options) {
  if (result.blockers.length) {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return [
    `AIGate git-ready: ${result.status}`,
    `Branch: ${result.branch}`,
    `Changed files: ${result.changedFiles}`,
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
  const status = buildGitStatus();
  const evaluation = buildEvaluation();
  const report = {
    command: "report",
    type,
    branch: status.branch,
    status: status.changedFiles.length ? "WARN" : "PASS",
    changedFiles: status.changedFiles.length,
    projectScore: evaluation.score,
    recommendation: status.recommendation
  };

  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  if (format === "html") {
    return renderHtmlReport(report);
  }

  return renderMarkdownReport(report);
}

function commandEvaluateProject(args) {
  const options = parseOptions(args);
  const evaluation = buildEvaluation();

  if (options.format === "json") {
    return JSON.stringify(evaluation, null, 2);
  }

  const rows = evaluation.checks.map((check) => {
    const mark = check.pass ? "PASS" : "TODO";
    return `- ${mark}: ${check.name}`;
  });

  return [
    `AIGate project score: ${evaluation.score}/100`,
    "",
    ...rows,
    "",
    `Recommendation: ${evaluation.recommendation}`
  ].join("\n");
}

function commandScore() {
  return String(buildEvaluation().score);
}

function commandBranchStrategy(args) {
  const options = parseOptions(args);
  const strategy = buildBranchStrategy();

  if (options.generate) {
    mkdirSync(".aigate", { recursive: true });
    const outputPath = join(".aigate", "generated-branch-strategy.md");
    writeFileSync(outputPath, renderBranchStrategyMarkdown(strategy), "utf8");
    return `Generated ${outputPath}`;
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

  return lines.join("\n");
}

function commandNotify(args) {
  const [subcommand, ...rest] = args;
  const options = parseOptions(rest);
  const event = options.event ?? "BLOCK";

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
      "Target: terminal",
      "Status: ready"
    ].join("\n");
  }

  process.exitCode = 1;
  return "Usage: aigate notify <setup|test> [--event BLOCK]";
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

function buildEvaluation() {
  const checks = [
    { name: "README exists", pass: existsSync("README.md") },
    { name: "License exists", pass: existsSync("LICENSE") },
    { name: "AIGate configuration exists", pass: existsSync(".aigate.yml") },
    { name: "Branch strategy is documented", pass: existsSync(join("docs", "branch-strategy.md")) },
    { name: "Git upload workflow is documented", pass: existsSync(join("docs", "git-upload-workflow.md")) },
    { name: "Pull request template exists", pass: existsSync(join(".github", "pull_request_template.md")) },
    { name: "CI workflow exists", pass: existsSync(join(".github", "workflows", "ci.yml")) },
    { name: "Package metadata exists", pass: existsSync("package.json") },
    { name: "Tests exist", pass: existsSync("test") }
  ];
  const passed = checks.filter((check) => check.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const recommendation = score === 100
    ? "Repository foundations are ready for the next MVP slice."
    : "Complete the missing repository foundations before public release.";

  return { score, checks, recommendation };
}

function buildBranchStrategy() {
  return {
    name: "GitHub Flow with release channels",
    reason: "AIGate needs fast public contribution flow plus npm channel control for latest, next, beta, and canary releases.",
    branches: [
      { name: "main", use: "protected stable source of truth" },
      { name: "codex/*", use: "AI-assisted implementation branches" },
      { name: "feature/*", use: "user-facing feature branches" },
      { name: "fix/*", use: "bug fix branches" },
      { name: "docs/*", use: "documentation-only branches" },
      { name: "chore/*", use: "maintenance and tooling branches" },
      { name: "release/*", use: "release stabilization" },
      { name: "hotfix/*", use: "urgent stable fixes" }
    ],
    githubProtection: [
      "Require pull request before merging into main.",
      "Require at least one approval.",
      "Require the CI test job before merging.",
      "Require conversation resolution.",
      "Block force pushes and branch deletion."
    ]
  };
}

function renderMarkdownReport(report) {
  return [
    `# AIGate ${report.type} report`,
    "",
    `- Status: ${report.status}`,
    `- Branch: ${report.branch}`,
    `- Changed files: ${report.changedFiles}`,
    `- Project score: ${report.projectScore}/100`,
    `- Recommendation: ${report.recommendation}`
  ].join("\n");
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
    `<li>Branch: ${escapeHtml(report.branch)}</li>`,
    `<li>Changed files: ${report.changedFiles}</li>`,
    `<li>Project score: ${report.projectScore}/100</li>`,
    `<li>Recommendation: ${escapeHtml(report.recommendation)}</li>`,
    "</ul>",
    "</body>",
    "</html>"
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
    ...strategy.githubProtection.map((rule) => `- ${rule}`)
  ].join("\n");
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

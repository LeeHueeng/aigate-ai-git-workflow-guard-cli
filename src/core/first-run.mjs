import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

export const AIGATE_HOOK_MARKER = "AIGate pre-push hook";

export function buildDoctorReport(context) {
  const packageJson = context.readJsonFile("package.json");
  const gitRoot = context.git(["rev-parse", "--show-toplevel"]);
  const gitReady = context.buildGitReadyResult();
  const evaluation = context.buildEvaluation();
  const ciCheck = evaluation.checks.find((check) => check.name === "CI workflow exists");
  const profile = evaluation.profile ?? {};
  const checks = [
    doctorCheck({
      id: "node",
      label: "Node.js runtime",
      pass: nodeMajor() >= 20,
      severity: "block",
      value: process.version,
      next: "Install Node.js 20 or newer."
    }),
    doctorCheck({
      id: "git-repository",
      label: "Git repository",
      pass: Boolean(gitRoot),
      severity: "block",
      value: gitRoot || "not detected",
      next: "Run AIGate inside a Git repository."
    }),
    doctorCheck({
      id: "package-json",
      label: "package.json",
      pass: existsSync("package.json"),
      severity: "warn",
      value: existsSync("package.json") ? "found" : "missing",
      next: "Add package.json or run AIGate from the project root."
    }),
    doctorCheck({
      id: "test-script",
      label: "test script",
      pass: hasTestScript(packageJson),
      severity: "warn",
      value: detectedTestScript(packageJson) ?? "missing",
      next: "Add a real package.json test script."
    }),
    doctorCheck({
      id: "aigate-config",
      label: "AIGate config",
      pass: existsSync(".aigate.yml"),
      severity: "warn",
      value: existsSync(".aigate.yml") ? "found" : "missing",
      next: "Run aigate init."
    }),
    doctorCheck({
      id: "ci-workflow",
      label: "CI workflow",
      pass: Boolean(ciCheck?.pass),
      severity: "warn",
      value: ciWorkflowValue(profile),
      next: "Add a CI workflow for the configured hosting provider or run checks before every push."
    }),
    doctorCheck({
      id: "pre-push-hook",
      label: "pre-push hook",
      pass: hasAigatePrePushHook(context),
      severity: "warn",
      value: hasAigatePrePushHook(context) ? "installed" : "missing",
      next: "Run aigate install-hook --pre-push."
    }),
    doctorCheck({
      id: "git-ready",
      label: "git-ready gate",
      pass: gitReady.status !== "BLOCK",
      severity: "block",
      value: gitReady.status,
      next: "Run aigate git-ready and resolve blockers."
    }),
    doctorCheck({
      id: "project-score",
      label: "project foundation score",
      pass: evaluation.score >= 80,
      severity: "warn",
      value: `${evaluation.score}/100`,
      next: "Run aigate evaluate-project and complete missing foundations."
    })
  ];

  const failedBlockers = checks.filter((check) => !check.pass && check.severity === "block");
  const failedWarnings = checks.filter((check) => !check.pass && check.severity === "warn");
  const status = failedBlockers.length ? "BLOCK" : failedWarnings.length ? "WARN" : "READY";

  return {
    command: "doctor",
    status,
    branch: gitRoot ? context.git(["branch", "--show-current"]) || "detached" : "not-a-git-repo",
    projectScore: evaluation.score,
    checks,
    nextSteps: checks.filter((check) => !check.pass).map((check) => check.next)
  };
}

function hasTestScript(packageJson) {
  return Boolean(detectedTestScript(packageJson));
}

function detectedTestScript(packageJson) {
  const scripts = packageJson.scripts ?? {};
  if (scripts.test) {
    return "test";
  }

  return Object.keys(scripts).find((name) => (
    name.endsWith(":test") || name.includes("test")
  ));
}

function ciWorkflowValue(profile) {
  const provider = profile.ciProvider ?? profile.hosting ?? "unknown";
  if (provider === "gitlab") {
    return existsSync(".gitlab-ci.yml") ? "gitlab found" : "gitlab missing";
  }

  if (provider === "github") {
    return existsSync(join(".github", "workflows", "ci.yml")) ? "github found" : "github missing";
  }

  return existsSync(".gitlab-ci.yml") || existsSync(join(".github", "workflows", "ci.yml")) ? "found" : "missing";
}

export function buildDemoScenario() {
  return {
    command: "demo",
    title: "AIGate first-run demo",
    steps: [
      {
        title: "Run a local readiness check",
        command: "npx -y aigate-cli check",
        output: [
          "AIGate check: PASS",
          "Changed files: 0",
          "Secret findings: 0"
        ]
      },
      {
        title: "Review pull request readiness",
        command: "npx -y aigate-cli pr-check",
        output: [
          "# AIGate PR report",
          "- Status: WARN",
          "- Recommendation: Open a focused branch and pull request after tests pass."
        ]
      },
      {
        title: "Install the guarded pre-push hook",
        command: "aigate install-hook --pre-push",
        output: [
          "AIGate hook: installed",
          "Hook: pre-push",
          "Next: git push now runs aigate git-ready first."
        ]
      }
    ],
    next: "Run npx -y aigate-cli check in your repository."
  };
}

export function installPrePushHook(options, context) {
  if (!options.prePush) {
    return {
      command: "install-hook",
      status: "ERROR",
      hook: "pre-push",
      action: "none",
      path: null,
      next: "Run aigate install-hook --pre-push."
    };
  }

  const gitRoot = context.git(["rev-parse", "--show-toplevel"]);
  const hookPath = resolveGitHookPath(context, gitRoot);
  if (!gitRoot || !hookPath) {
    return {
      command: "install-hook",
      status: "BLOCK",
      hook: "pre-push",
      action: "none",
      path: null,
      next: "Run AIGate inside a Git repository."
    };
  }

  const exists = existsSync(hookPath);
  const current = exists ? readFileSync(hookPath, "utf8") : "";
  const ownsHook = current.includes(AIGATE_HOOK_MARKER);

  if (exists && !ownsHook && !options.force) {
    return {
      command: "install-hook",
      status: "SKIPPED",
      hook: "pre-push",
      action: "skipped",
      path: hookPath,
      next: "Existing pre-push hook found. Re-run with --force to replace it."
    };
  }

  const action = exists ? "updated" : "created";
  const content = renderPrePushHook();

  if (options.dryRun) {
    return {
      command: "install-hook",
      status: "DRY_RUN",
      hook: "pre-push",
      action,
      path: hookPath,
      next: "Remove --dry-run to write the hook."
    };
  }

  mkdirSync(dirname(hookPath), { recursive: true });
  writeFileSync(hookPath, content, "utf8");
  chmodSync(hookPath, 0o755);

  return {
    command: "install-hook",
    status: "INSTALLED",
    hook: "pre-push",
    action,
    path: hookPath,
    next: "git push now runs aigate git-ready first."
  };
}

function nodeMajor() {
  return Number.parseInt(process.versions.node.split(".")[0], 10) || 0;
}

function doctorCheck({ id, label, pass, severity, value, next }) {
  return {
    id,
    label,
    pass,
    severity,
    value,
    next
  };
}

function hasAigatePrePushHook(context) {
  const gitRoot = context.git(["rev-parse", "--show-toplevel"]);
  const hookPath = resolveGitHookPath(context, gitRoot);
  if (!hookPath || !existsSync(hookPath)) {
    return false;
  }

  return readFileSync(hookPath, "utf8").includes(AIGATE_HOOK_MARKER);
}

function resolveGitHookPath(context, gitRoot) {
  if (!gitRoot) {
    return null;
  }

  const hookPath = context.git(["rev-parse", "--git-path", "hooks/pre-push"]);
  if (!hookPath) {
    return join(gitRoot, ".git", "hooks", "pre-push");
  }

  return isAbsolute(hookPath) ? hookPath : join(gitRoot, hookPath);
}

function renderPrePushHook() {
  return [
    "#!/bin/sh",
    `# ${AIGATE_HOOK_MARKER}`,
    "# Generated by: aigate install-hook --pre-push",
    "",
    "if command -v aigate >/dev/null 2>&1; then",
    "  exec aigate git-ready",
    "fi",
    "",
    "exec npx -y aigate-cli git-ready"
  ].join("\n") + "\n";
}

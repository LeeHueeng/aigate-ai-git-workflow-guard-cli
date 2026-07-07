import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

export const AIGATE_HOOK_MARKER = "AIGate pre-push hook";

export function buildDoctorReport(context) {
  const packageJson = context.readJsonFile("package.json");
  const gitRoot = context.git(["rev-parse", "--show-toplevel"]);
  const gitReady = context.buildGitReadyResult();
  const evaluation = context.buildEvaluation();
  const ciCheck = evaluation.checks.find((check) => check.name === "CI workflow exists");
  const ciGateCheck = evaluation.checks.find((check) => check.name === "AIGate CI gate exists");
  const serverEnforcementCheck = evaluation.checks.find((check) => check.name === "AIGate server enforcement exists");
  const prePushHookInstalled = hasAigatePrePushHook(context);
  const repositoryHookFile = repositoryPrePushHookFile();
  const hookActivation = hookActivationAutomation(packageJson);
  const profile = evaluation.profile ?? {};
  const enforcement = evaluation.enforcement ?? {};
  const serverEnforced = Boolean(serverEnforcementCheck?.pass);
  const generatedVersion = generatedFilesVersion(context);
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
      id: "generated-version",
      label: "AIGate generated files version",
      pass: generatedVersion.pass,
      severity: "warn",
      value: generatedVersion.value,
      next: "Regenerate stale AIGate files with aigate init --force and aigate integrate all --force."
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
      label: "local pre-push hook",
      pass: prePushHookInstalled,
      severity: "warn",
      value: prePushHookInstalled ? "active in this clone" : "not active in this clone",
      next: "Run aigate install-hook --pre-push."
    }),
    doctorCheck({
      id: "repository-pre-push-hook-file",
      label: "repository pre-push hook file",
      pass: repositoryHookFile.found || serverEnforced,
      severity: "warn",
      value: repositoryHookFile.found
        ? `found ${repositoryHookFile.path}`
        : serverEnforced
          ? "not required; server enforcement verified"
          : "missing",
      next: "Commit an AIGate pre-push hook file or rely on required server-side CI."
    }),
    doctorCheck({
      id: "hook-activation-automation",
      label: "hook activation automation",
      pass: hookActivation.found || serverEnforced,
      severity: "warn",
      value: hookActivation.found
        ? hookActivation.value
        : serverEnforced
          ? "not required; server enforcement verified"
          : hookActivation.value,
      next: "Automate hook activation in prepare/postinstall or rely on required server-side CI."
    }),
    doctorCheck({
      id: "aigate-enforcement",
      label: "AIGate enforcement",
      pass: serverEnforced,
      severity: "warn",
      value: enforcementValue({ prePushHookInstalled, repositoryHookFile, hookActivation, ciGateCheck, serverEnforcementCheck, enforcement }),
      next: "Make aigate git-ready a verified required CI check."
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

  const rootScript = Object.keys(scripts).find((name) => (
    name.endsWith(":test") || name.includes("test")
  ));
  if (rootScript) {
    return rootScript;
  }

  const workspaceScript = workspacePackages()
    .flatMap((workspacePackage) => Object.keys(workspacePackage.scripts ?? {}))
    .find((name) => name === "test" || name.endsWith(":test") || name.includes("test"));
  return workspaceScript ? `workspace:${workspaceScript}` : null;
}

function workspacePackages() {
  const patterns = [];
  const packageJson = readJsonFile("package.json");
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

  return [...new Set(patterns)]
    .flatMap(expandWorkspacePattern)
    .filter((packagePath) => existsSync(packagePath))
    .map((packagePath) => readJsonFile(packagePath))
    .filter((workspacePackage) => Object.keys(workspacePackage).length);
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

function expandWorkspacePattern(pattern) {
  const clean = String(pattern ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/$/, "");
  const starIndex = clean.indexOf("*");
  if (!clean || clean.startsWith("!") || clean.includes("**")) {
    return [];
  }

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

function generatedFilesVersion(context) {
  const currentVersion = context.version ?? "0.0.0";
  const versions = [
    generatedByVersion(context.readAigateConfig?.(".aigate.yml")?.generatedBy),
    generatedByVersion(context.readJsonFile(join(".aigate", "integrations.json"))?.generatedBy)
  ].filter(Boolean);

  if (!versions.length) {
    return { pass: true, value: "not recorded" };
  }

  const staleVersions = versions.filter((version) => version !== currentVersion);
  return {
    pass: staleVersions.length === 0,
    value: staleVersions.length ? `stale ${[...new Set(staleVersions)].join(", ")}; current ${currentVersion}` : `current ${currentVersion}`
  };
}

function generatedByVersion(value) {
  const match = String(value ?? "").match(/\baigate\s+([0-9][^\s]*)/i);
  return match?.[1] ?? null;
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

function enforcementValue({ prePushHookInstalled, repositoryHookFile, hookActivation, ciGateCheck, serverEnforcementCheck, enforcement }) {
  if (serverEnforcementCheck?.pass && prePushHookInstalled) {
    return "server required CI gate, local hook active in this clone";
  }

  if (serverEnforcementCheck?.pass) {
    return "server required CI gate";
  }

  if (prePushHookInstalled) {
    return hookActivation?.found
      ? "partial: local hook active in this clone; bypassable with --no-verify"
      : "partial: local hook active in this clone; team-wide activation not verified";
  }

  if (repositoryHookFile?.found) {
    return "advisory: repository hook file found but not active in this clone";
  }

  if (ciGateCheck?.pass) {
    return `advisory: CI gate not proven required (${enforcement?.serverReason ?? "server setting unverified"})`;
  }

  return "missing";
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

function repositoryPrePushHookFile() {
  const candidates = [
    join(".githooks", "pre-push"),
    join(".husky", "pre-push"),
    join("hooks", "pre-push")
  ];
  const filePath = candidates.find((candidate) => (
    existsSync(candidate) && fileHasAigateGate(candidate)
  ));

  return filePath
    ? { found: true, path: filePath }
    : { found: false, path: "" };
}

function fileHasAigateGate(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    return content.includes(AIGATE_HOOK_MARKER) ||
      /\baigate\s+git-ready\b/i.test(content) ||
      /\baigate-cli\s+git-ready\b/i.test(content) ||
      /\bnode\s+src\/cli\.mjs\s+git-ready\b/i.test(content);
  } catch {
    return false;
  }
}

function hookActivationAutomation(packageJson) {
  const scripts = packageJson.scripts ?? {};
  const automaticScripts = ["prepare", "postinstall", "install", "preinstall"];
  const scriptName = automaticScripts.find((name) => hookActivationCommand(scripts[name]));

  if (scriptName) {
    return { found: true, value: `${scriptName} script` };
  }

  return { found: false, value: "manual or missing" };
}

function hookActivationCommand(command) {
  const text = String(command ?? "");
  return /git\s+config\s+(?:--local\s+)?core\.hooksPath\b/i.test(text) ||
    /\bhusky\s+install\b/i.test(text) ||
    /\blefthook\s+install\b/i.test(text) ||
    /\bpre-commit\s+install\b/i.test(text);
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

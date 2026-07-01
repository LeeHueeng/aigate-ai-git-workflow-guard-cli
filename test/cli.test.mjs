import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const cliPath = fileURLToPath(new URL("../src/cli.mjs", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function createSettingsPath() {
  return join(mkdtempSync(join(tmpdir(), "aigate-settings-")), "settings.json");
}

function createOutputDir() {
  return mkdtempSync(join(tmpdir(), "aigate-integrations-"));
}

function run(args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      AIGATE_SETTINGS_PATH: options.settingsPath ?? createSettingsPath(),
      AIGATE_SLACK_WEBHOOK_URL: options.slackWebhook ?? ""
    }
  });
}

test("shows help", () => {
  const result = run(["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AI Git Workflow Guard CLI/);
  assert.match(result.stdout, /init/);
  assert.match(result.stdout, /pr-check/);
  assert.match(result.stdout, /release-check/);
  assert.match(result.stdout, /audit-report/);
  assert.match(result.stdout, /branch-strategy/);
  assert.match(result.stdout, /setup/);
  assert.match(result.stdout, /settings/);
  assert.match(result.stdout, /integrate/);
  assert.match(result.stdout, /--language/);
  assert.match(result.stdout, /push/);
});

test("prints package version", () => {
  const result = run(["--version"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^0\.1\.0/m);
});

test("initializes starter project files", () => {
  const outputDir = createOutputDir();
  const result = run(["init", "--output-dir", outputDir, "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "init");
  assert.ok(existsSync(join(outputDir, ".aigate.yml")));
  assert.ok(existsSync(join(outputDir, ".aigate", "reports", ".gitkeep")));
});

test("prints check output as json", () => {
  const result = run(["check", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "check");
  assert.equal(typeof output.changedFiles, "number");
  assert.ok(["PASS", "WARN", "BLOCK"].includes(output.status));
});

test("runs git-ready output as json", () => {
  const result = run(["git-ready", "--format=json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "git-ready");
  assert.equal(output.status, "READY");
  assert.equal(typeof output.projectScore, "number");
  assert.deepEqual(output.blockers, []);
});

test("previews guarded push in dry-run mode", () => {
  const result = run(["push", "--dry-run", "origin", "main"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate git-ready: READY/);
  assert.match(result.stdout, /Would run: git push origin main/);
});

test("previews pull request creation in dry-run mode", () => {
  const result = run(["pr", "--dry-run", "--title", "feat: dry run"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate git-ready: READY/);
  assert.match(result.stdout, /Would run: gh pr create/);
  assert.match(result.stdout, /feat: dry run/);
});

test("generates pull request readiness report", () => {
  const result = run(["pr-check", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.type, "pr");
  assert.equal(typeof output.riskScore, "number");
  assert.equal(typeof output.prReadinessScore, "number");
});

test("can skip push readiness gate in dry-run mode", () => {
  const result = run(["push", "--dry-run", "--no-verify"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /readiness gate skipped/);
  assert.match(result.stdout, /Would run: git push/);
});

test("configures Korean language setting", () => {
  const settingsPath = createSettingsPath();
  const setup = run(["setup", "--language", "ko"], { settingsPath });

  assert.equal(setup.status, 0);
  assert.match(setup.stdout, /AIGate 설정 완료/);

  const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  assert.equal(settings.language, "ko");

  const check = run(["check"], { settingsPath });
  assert.equal(check.status, 0);
  assert.match(check.stdout, /AIGate 검사:/);
  assert.match(check.stdout, /브랜치:/);
});

test("shows settings as json", () => {
  const settingsPath = createSettingsPath();
  run(["setup", "--language", "en"], { settingsPath });
  const result = run(["settings", "--format", "json"], { settingsPath });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "settings");
  assert.equal(output.settings.language, "en");
});

test("rejects unsupported language", () => {
  const result = run(["setup", "--language", "jp"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Unsupported language: jp/);
});

test("generates Codex and Gemini integration files", () => {
  const outputDir = createOutputDir();
  const result = run(["integrate", "all", "--output-dir", outputDir, "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.providers, ["codex", "gemini"]);
  assert.ok(existsSync(join(outputDir, "AGENTS.md")));
  assert.ok(existsSync(join(outputDir, "GEMINI.md")));
  assert.ok(existsSync(join(outputDir, ".aigate", "integrations.json")));

  const manifest = JSON.parse(readFileSync(join(outputDir, ".aigate", "integrations.json"), "utf8"));
  assert.deepEqual(manifest.providers, ["codex", "gemini"]);
});

test("skips integration files unless force is used", () => {
  const outputDir = createOutputDir();
  run(["integrate", "codex", "--output-dir", outputDir]);
  const skipped = run(["integrate", "codex", "--output-dir", outputDir]);

  assert.equal(skipped.status, 0);
  assert.match(skipped.stdout, /skipped/);

  const forced = run(["integrate", "codex", "--output-dir", outputDir, "--force"]);
  assert.equal(forced.status, 0);
  assert.match(forced.stdout, /updated/);
});

test("rejects unsupported integration providers", () => {
  const result = run(["integrate", "unknown-ai"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Unsupported integration provider: unknown-ai/);
});

test("sends terminal notifications", () => {
  const result = run(["notify", "send", "--event", "WARN", "--channel", "terminal"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate notification: WARN/);
  assert.match(result.stdout, /Status: READY/);
});

test("requires webhook env for webhook notifications", () => {
  const result = run(["notify", "send", "--event", "BLOCK", "--channel", "slack"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Missing webhook environment variable: AIGATE_SLACK_WEBHOOK_URL/);
});

test("renders markdown report by default", () => {
  const result = run(["report"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# AIGate local report/m);
  assert.match(result.stdout, /Project score:/);
});

test("writes report output to a file", () => {
  const outputDir = createOutputDir();
  const outputPath = join(outputDir, "report.md");
  const result = run(["report", "--output", outputPath]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Wrote/);
  assert.match(readFileSync(outputPath, "utf8"), /# AIGate local report/);
});

test("renders sarif report", () => {
  const result = run(["report", "--format", "sarif"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.version, "2.1.0");
  assert.equal(output.runs[0].tool.driver.name, "AIGate");
});

test("renders html report safely", () => {
  const result = run(["report", "--format", "html", "--type", "pr"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /<!doctype html>/);
  assert.match(result.stdout, /AIGate pr report/);
});

test("renders weekly and risk report sections", () => {
  const weekly = run(["report", "--type", "weekly"]);
  assert.equal(weekly.status, 0);
  assert.match(weekly.stdout, /Weekly Team Signals/);

  const risk = run(["report", "--type", "risk"]);
  assert.equal(risk.status, 0);
  assert.match(risk.stdout, /Risk Signals/);
});

test("blocks possible secrets in changed files", () => {
  const secretPath = join(repoRoot, "tmp-aigate-secret-fixture.txt");
  const secretValue = ["abcdefghijklmnop", "qrstuvwxyz123456"].join("");
  writeFileSync(secretPath, `api_key = "${secretValue}"\n`, "utf8");

  try {
    const result = run(["check", "--format", "json"]);
    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.status, "BLOCK");
    assert.equal(output.secretFindings.length, 1);

    const ready = run(["git-ready", "--format", "json"]);
    assert.equal(ready.status, 1);
    const readyOutput = JSON.parse(ready.stdout);
    assert.equal(readyOutput.status, "BLOCK");
  } finally {
    unlinkSync(secretPath);
  }
});

test("scores repository foundations", () => {
  const result = run(["evaluate-project", "--format=json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(typeof output.score, "number");
  assert.ok(output.score > 0);
  assert.equal(typeof output.grade, "string");
  assert.ok(Array.isArray(output.categories));
});

test("renders deep project evaluation report", () => {
  const result = run(["evaluate-project", "--deep", "--report"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /# AIGate Project Evaluation/);
  assert.match(result.stdout, /Deep Signals/);
});

test("checks release readiness", () => {
  const result = run(["release-check", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "release-check");
  assert.equal(output.packageName, "@aigate/cli");
  assert.equal(output.version, "0.1.0");
  assert.equal(output.expectedTag, "v0.1.0");
  assert.ok(["READY", "ACTION_REQUIRED"].includes(output.status));
});

test("renders audit report", () => {
  const result = run(["audit-report", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "audit-report");
  assert.equal(typeof output.projectScore, "number");
  assert.ok(Array.isArray(output.findings));
  assert.ok(Array.isArray(output.recommendations));
});

test("recommends branch strategy", () => {
  const result = run(["branch-strategy", "--github"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /GitHub Flow with release channels/);
  assert.match(result.stdout, /Require pull request/);
});

test("generates branch strategy policy drafts", () => {
  const outputDir = createOutputDir();
  const result = run([
    "branch-strategy",
    "--apply",
    "--team-size",
    "8",
    "--release",
    "weekly",
    "--output-dir",
    outputDir,
    "--format",
    "json"
  ]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "branch-strategy");
  assert.equal(output.strategy.name, "Hybrid Flow");
  assert.ok(existsSync(join(outputDir, ".aigate", "generated-branch-strategy.md")));
  assert.ok(existsSync(join(outputDir, ".aigate", "branch-strategy-policy.json")));
  assert.ok(existsSync(join(outputDir, "docs", "release-process.md")));
  assert.ok(existsSync(join(outputDir, "docs", "hotfix-process.md")));
  assert.ok(existsSync(join(outputDir, ".github", "pull_request_template.aigate.md")));
  assert.ok(existsSync(join(outputDir, ".github", "CODEOWNERS.aigate")));
});

test("rejects unknown commands", () => {
  const result = run(["unknown-command"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command: unknown-command/);
});

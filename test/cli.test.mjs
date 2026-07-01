import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
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
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.env ?? {}),
      AIGATE_SETTINGS_PATH: options.settingsPath ?? createSettingsPath(),
      AIGATE_SLACK_WEBHOOK_URL: options.slackWebhook ?? ""
    }
  });
}

function createGenericReleaseProject() {
  const projectDir = mkdtempSync(join(tmpdir(), "aigate-release-project-"));
  mkdirSync(join(projectDir, ".github", "workflows"), { recursive: true });
  writeFileSync(join(projectDir, "package.json"), `${JSON.stringify({
    name: "admin-root-monorepo",
    version: "1.0.0",
    main: "dist/index.js",
    repository: {
      type: "git",
      url: "git+https://github.com/ExampleOrg/admin-root-monorepo.git"
    },
    publishConfig: {
      access: "public"
    }
  }, null, 2)}\n`);
  writeFileSync(join(projectDir, "package-lock.json"), `${JSON.stringify({
    name: "admin-root-monorepo",
    version: "1.0.0",
    lockfileVersion: 3,
    packages: {
      "": {
        name: "admin-root-monorepo",
        version: "1.0.0"
      }
    }
  }, null, 2)}\n`);
  writeFileSync(join(projectDir, "README.md"), "# Admin Root\n\n```sh\nnpm install admin-root-monorepo\n```\n");
  writeFileSync(join(projectDir, ".github", "workflows", "release.yml"), [
    "name: Release",
    "on: workflow_dispatch",
    "jobs:",
    "  release:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/setup-node@v4",
    "        with:",
    "          package-manager-cache: false",
    "      - run: npm publish --provenance"
  ].join("\n"));

  spawnSync("git", ["init"], { cwd: projectDir, encoding: "utf8" });
  spawnSync("git", ["remote", "add", "origin", "https://github.com/ExampleOrg/admin-root-monorepo.git"], {
    cwd: projectDir,
    encoding: "utf8"
  });

  return projectDir;
}

function createMinimalGitProject() {
  const projectDir = mkdtempSync(join(tmpdir(), "aigate-minimal-project-"));
  writeFileSync(join(projectDir, "package.json"), `${JSON.stringify({
    name: "minimal-project",
    version: "1.0.0"
  }, null, 2)}\n`);
  spawnSync("git", ["init"], { cwd: projectDir, encoding: "utf8" });
  return projectDir;
}

function createFakeCurlBin() {
  const binDir = mkdtempSync(join(tmpdir(), "aigate-curl-"));
  const curlPath = join(binDir, "curl");
  const payloadPath = join(binDir, "payload.json");
  writeFileSync(curlPath, [
    "#!/bin/sh",
    "payload=''",
    "while [ \"$#\" -gt 0 ]; do",
    "  if [ \"$1\" = \"--data\" ]; then",
    "    shift",
    "    payload=\"$1\"",
    "  fi",
    "  shift",
    "done",
    "printf '%s\\n' \"$payload\" > \"$AIGATE_CURL_CAPTURE\"",
    "exit 0"
  ].join("\n"));
  chmodSync(curlPath, 0o755);
  return { binDir, payloadPath };
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
  assert.match(result.stdout, /doctor/);
  assert.match(result.stdout, /demo/);
  assert.match(result.stdout, /install-hook/);
  assert.match(result.stdout, /github <comment\|check>/);
  assert.match(result.stdout, /setup/);
  assert.match(result.stdout, /settings/);
  assert.match(result.stdout, /integrate/);
  assert.match(result.stdout, /--language/);
  assert.match(result.stdout, /--pre-push/);
  assert.match(result.stdout, /push/);
});

test("renders localized help", () => {
  const korean = run(["--help", "--language", "ko"]);
  assert.equal(korean.status, 0);
  assert.match(korean.stdout, /AI Git 워크플로 보호 CLI/);
  assert.match(korean.stdout, /명령어:/);
  assert.match(korean.stdout, /푸시 전 준비 게이트를 실행합니다/);
  assert.doesNotMatch(korean.stdout, /Commands:/);

  const japanese = run(["help", "--language", "ja"]);
  assert.equal(japanese.status, 0);
  assert.match(japanese.stdout, /AI Git ワークフロー保護 CLI/);
  assert.match(japanese.stdout, /コマンド:/);
  assert.match(japanese.stdout, /プッシュ前の準備ゲート/);

  const chinese = run(["help", "--language", "zh"]);
  assert.equal(chinese.status, 0);
  assert.match(chinese.stdout, /AI Git 工作流守护 CLI/);
  assert.match(chinese.stdout, /命令:/);
  assert.match(chinese.stdout, /推送前的就绪关卡/);
});

test("prints package version", () => {
  const result = run(["--version"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^0\.1\.2/m);
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

test("renders localized pull request readiness report", () => {
  const settingsPath = createSettingsPath();
  run(["setup", "--language", "ko"], { settingsPath });
  const result = run(["pr-check"], { settingsPath });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# AIGate PR 리포트/m);
  assert.match(result.stdout, /## 변경 경로/);
  assert.match(result.stdout, /## 권장 조치/);
  assert.doesNotMatch(result.stdout, /## Changed Paths/);
});

test("previews a localized GitHub pull request comment", () => {
  const result = run(["github", "comment", "--pr", "123", "--dry-run", "--language", "ko"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /GitHub PR 댓글 준비 완료/);
  assert.match(result.stdout, /Pull request: #123/);
  assert.match(result.stdout, /gh pr comment 123/);
  assert.doesNotMatch(result.stdout, /Usage:/);
});

test("renders a GitHub Checks payload as json", () => {
  const result = run(["github", "check", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "github check");
  assert.equal(output.checkRun.name, "AIGate");
  assert.equal(output.checkRun.status, "completed");
  assert.ok(["success", "neutral", "failure"].includes(output.checkRun.conclusion));
  assert.match(output.checkRun.output.summary, /^# AIGate PR report/m);
});

test("accepts GitHub check options before the subcommand", () => {
  const result = run([
    "github",
    "--name",
    "AIGate Preview",
    "--details-url",
    "https://example.test/aigate",
    "check",
    "--format",
    "json"
  ]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.checkRun.name, "AIGate Preview");
  assert.equal(output.checkRun.details_url, "https://example.test/aigate");
});

test("writes localized GitHub Checks summary output", () => {
  const outputDir = createOutputDir();
  const outputPath = join(outputDir, "github-check.md");
  const result = run(["github", "check", "--output", outputPath, "--language", "ja"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /書き込みました/);
  assert.match(readFileSync(outputPath, "utf8"), /^# AIGate PR レポート/m);
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

test("configures Japanese and Chinese language settings", () => {
  const japaneseSettingsPath = createSettingsPath();
  const japaneseSetup = run(["setup", "--language", "jp"], { settingsPath: japaneseSettingsPath });

  assert.equal(japaneseSetup.status, 0);
  assert.match(japaneseSetup.stdout, /AIGate 設定完了/);

  const japaneseSettings = JSON.parse(readFileSync(japaneseSettingsPath, "utf8"));
  assert.equal(japaneseSettings.language, "ja");

  const japaneseStrategy = run(["branch-strategy", "--github"], { settingsPath: japaneseSettingsPath });
  assert.equal(japaneseStrategy.status, 0);
  assert.match(japaneseStrategy.stdout, /推奨戦略:/);
  assert.match(japaneseStrategy.stdout, /GitHub 保護ルール:/);
  assert.doesNotMatch(japaneseStrategy.stdout, /Recommended strategy:/);

  const chineseSettingsPath = createSettingsPath();
  const chineseSetup = run(["setup", "--language", "zh"], { settingsPath: chineseSettingsPath });

  assert.equal(chineseSetup.status, 0);
  assert.match(chineseSetup.stdout, /AIGate 设置完成/);

  const chineseRelease = run(["release-check"], { settingsPath: chineseSettingsPath });
  assert.equal(chineseRelease.status, 0);
  assert.match(chineseRelease.stdout, /发布标签:/);
  assert.match(chineseRelease.stdout, /下一步:/);
  assert.doesNotMatch(chineseRelease.stdout, /Release tag:/);
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
  const result = run(["setup", "--language", "fr"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Unsupported language: fr/);
  assert.match(result.stdout, /en, ko, ja, zh/);
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

test("generates localized integration instructions", () => {
  const outputDir = createOutputDir();
  const result = run(["integrate", "codex", "--language", "ko", "--output-dir", outputDir]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate AI 연동 파일 생성/);
  assert.match(result.stdout, /다음 단계:/);

  const agents = readFileSync(join(outputDir, "AGENTS.md"), "utf8");
  assert.match(agents, /# AIGate Codex 지침/);
  assert.match(agents, /AI Git 워크플로 보호 CLI/);
  assert.match(agents, /제안, 푸시, 병합 전에/);
  assert.match(agents, /필수 검사:/);
  assert.doesNotMatch(agents, /Before Editing/);
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

test("diagnoses first-run repository setup", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["doctor", "--format", "json"], { cwd: projectDir });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "doctor");
  assert.equal(output.status, "WARN");
  assert.ok(output.checks.some((check) => check.id === "node" && check.pass));
  assert.ok(output.checks.some((check) => check.id === "pre-push-hook" && !check.pass));
  assert.ok(output.nextSteps.includes("Run aigate install-hook --pre-push."));
});

test("renders a localized first-run demo", () => {
  const result = run(["demo", "--language", "ko"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate 데모/);
  assert.match(result.stdout, /npx -y aigate-cli check/);
  assert.match(result.stdout, /guarded pre-push hook 설치/);
});

test("installs a guarded pre-push hook", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["install-hook", "--pre-push", "--language", "ko"], { cwd: projectDir });
  const hookPath = join(projectDir, ".git", "hooks", "pre-push");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /설치 완료/);
  assert.ok(existsSync(hookPath));
  assert.match(readFileSync(hookPath, "utf8"), /AIGate pre-push hook/);
  assert.match(readFileSync(hookPath, "utf8"), /aigate git-ready/);

  const doctor = run(["doctor", "--format", "json"], { cwd: projectDir });
  const output = JSON.parse(doctor.stdout);
  assert.ok(output.checks.some((check) => check.id === "pre-push-hook" && check.pass));
});

test("protects existing pre-push hooks unless forced", () => {
  const projectDir = createMinimalGitProject();
  const hookPath = join(projectDir, ".git", "hooks", "pre-push");
  writeFileSync(hookPath, "#!/bin/sh\nexit 0\n", "utf8");
  chmodSync(hookPath, 0o755);

  const skipped = run(["install-hook", "--pre-push"], { cwd: projectDir });
  assert.equal(skipped.status, 1);
  assert.match(skipped.stdout, /Existing pre-push hook found/);
  assert.doesNotMatch(readFileSync(hookPath, "utf8"), /AIGate pre-push hook/);

  const forced = run(["install-hook", "--pre-push", "--force"], { cwd: projectDir });
  assert.equal(forced.status, 0);
  assert.match(readFileSync(hookPath, "utf8"), /AIGate pre-push hook/);
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

test("sends Slack webhook notification when git-ready blocks", () => {
  const projectDir = createMinimalGitProject();
  const { binDir, payloadPath } = createFakeCurlBin();
  const secretValue = ["abcdefghijklmnop", "qrstuvwxyz123456"].join("");
  writeFileSync(join(projectDir, "tmp-aigate-secret-fixture.txt"), `api_key = "${secretValue}"\n`, "utf8");

  const result = run(["git-ready", "--notify-channel", "slack", "--language", "ko"], {
    cwd: projectDir,
    env: {
      PATH: `${binDir}:${process.env.PATH}`,
      AIGATE_CURL_CAPTURE: payloadPath
    },
    slackWebhook: "https://hooks.slack.test/services/aigate"
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /AIGate 준비 검사: 차단/);
  assert.match(result.stdout, /slack 채널로 BLOCK 알림을 보냈습니다/);

  const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
  assert.match(payload.text, /AIGate BLOCK: 차단/);
  assert.ok(Array.isArray(payload.blocks));
  assert.equal(payload.aigate.event, "BLOCK");
  assert.equal(payload.aigate.channel, "slack");
  assert.equal(payload.aigate.secretFindings, 1);
  assert.ok(payload.aigate.blockers.some((blocker) => /민감 정보/.test(blocker)));
});

test("renders Discord and Teams webhook payloads through notify test", () => {
  const discord = createFakeCurlBin();
  const discordResult = run(["notify", "test", "--event", "WARN", "--channel", "discord"], {
    env: {
      PATH: `${discord.binDir}:${process.env.PATH}`,
      AIGATE_CURL_CAPTURE: discord.payloadPath,
      AIGATE_DISCORD_WEBHOOK_URL: "https://discord.test/webhook"
    }
  });
  assert.equal(discordResult.status, 0);
  const discordPayload = JSON.parse(readFileSync(discord.payloadPath, "utf8"));
  assert.match(discordPayload.content, /AIGate WARN:/);
  assert.ok(Array.isArray(discordPayload.embeds));

  const teams = createFakeCurlBin();
  const teamsResult = run(["notify", "test", "--event", "WARN", "--channel", "teams"], {
    env: {
      PATH: `${teams.binDir}:${process.env.PATH}`,
      AIGATE_CURL_CAPTURE: teams.payloadPath,
      AIGATE_TEAMS_WEBHOOK_URL: "https://teams.test/webhook"
    }
  });
  assert.equal(teamsResult.status, 0);
  const teamsPayload = JSON.parse(readFileSync(teams.payloadPath, "utf8"));
  assert.equal(teamsPayload["@type"], "MessageCard");
  assert.match(teamsPayload.summary, /AIGate WARN:/);
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
  assert.match(result.stdout, /AIGate PR report/);
});

test("renders weekly and risk report sections", () => {
  const weekly = run(["report", "--type", "weekly"]);
  assert.equal(weekly.status, 0);
  assert.match(weekly.stdout, /Weekly Team Signals/);

  const risk = run(["report", "--type", "risk"]);
  assert.equal(risk.status, 0);
  assert.match(risk.stdout, /Risk Signals/);
});

test("renders localized report, audit, and notification output", () => {
  const weekly = run(["report", "--type", "weekly", "--language", "ja"]);
  assert.equal(weekly.status, 0);
  assert.match(weekly.stdout, /# AIGate 週次 レポート/);
  assert.match(weekly.stdout, /機密情報検出/);
  assert.match(weekly.stdout, /週次チームシグナル/);
  assert.doesNotMatch(weekly.stdout, /Weekly Team Signals/);

  const audit = run(["audit-report", "--language", "zh"]);
  assert.equal(audit.status, 0);
  assert.match(audit.stdout, /# AIGate 审计报告/);
  assert.match(audit.stdout, /## 发现项/);
  assert.match(audit.stdout, /## 建议/);
  assert.doesNotMatch(audit.stdout, /## Findings/);

  const notify = run(["notify", "setup", "--language", "zh"]);
  assert.equal(notify.status, 0);
  assert.match(notify.stdout, /通知设置预览/);
  assert.match(notify.stdout, /终端/);
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

test("warns but does not block only for a low project foundation score", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["git-ready", "--format", "json"], { cwd: projectDir });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "READY");
  assert.deepEqual(output.blockers, []);
  assert.ok(output.warnings.some((warning) => /Project foundation score/.test(warning)));
});

test("blocks Playwright auth state files as sensitive findings", () => {
  const projectDir = createMinimalGitProject();
  const authDir = join(projectDir, "apps", "admin", "playwright", ".auth");
  mkdirSync(authDir, { recursive: true });
  writeFileSync(join(authDir, "admin.json"), JSON.stringify({
    cookies: [
      {
        name: "session",
        value: "example-session-cookie-value",
        domain: "example.test"
      }
    ]
  }, null, 2));

  const check = run(["check", "--format", "json"], { cwd: projectDir });
  assert.equal(check.status, 0);
  const checkOutput = JSON.parse(check.stdout);
  assert.equal(checkOutput.status, "BLOCK");
  assert.ok(checkOutput.secretFindings.some((finding) => finding.ruleId === "sensitive-auth-state"));

  const ready = run(["git-ready", "--format", "json"], { cwd: projectDir });
  assert.equal(ready.status, 1);
  const readyOutput = JSON.parse(ready.stdout);
  assert.equal(readyOutput.status, "BLOCK");
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

test("renders localized project evaluation report", () => {
  const result = run(["evaluate-project", "--deep", "--report", "--language", "ko"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /# AIGate 프로젝트 평가/);
  assert.match(result.stdout, /## 상세 신호/);
  assert.match(result.stdout, /AI 어시스턴트 지침 존재/);
  assert.doesNotMatch(result.stdout, /Deep Signals/);
});

test("checks release readiness", () => {
  const result = run(["release-check", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "release-check");
  assert.equal(output.packageName, "aigate-cli");
  assert.equal(output.version, "0.1.2");
  assert.equal(output.expectedTag, "v0.1.2");
  assert.ok(["READY", "ACTION_REQUIRED", "RELEASED"].includes(output.status));
  assert.deepEqual(output.registry, { checked: false });
});

test("checks npm publication state when requested", () => {
  const binDir = mkdtempSync(join(tmpdir(), "aigate-npm-"));
  const npmPath = join(binDir, "npm");
  writeFileSync(npmPath, "#!/bin/sh\nprintf '\"0.1.2\"\\n'\n");
  chmodSync(npmPath, 0o755);

  const result = run(["release-check", "--npm", "--format", "json"], {
    env: {
      PATH: `${binDir}:${process.env.PATH}`
    }
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.registry.checked, true);
  assert.equal(output.registry.published, true);
  assert.equal(output.registry.publishedVersion, "0.1.2");
});

test("uses generic npm package and repository release checks", () => {
  const projectDir = createGenericReleaseProject();
  const result = run(["release-check", "--format", "json"], { cwd: projectDir });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.packageName, "admin-root-monorepo");
  assert.equal(output.repository, "ExampleOrg/admin-root-monorepo");
  assert.equal(output.expectedTag, "v1.0.0");
  assert.equal(output.checks.find((check) => check.name === "package has a valid npm package name")?.pass, true);
  assert.equal(output.checks.find((check) => check.name === "package declares npm entrypoint or bin")?.pass, true);
  assert.equal(output.checks.find((check) => check.name === "README documents npm install command")?.pass, true);
  assert.ok(output.nextSteps.some((step) => step.includes("--repo ExampleOrg/admin-root-monorepo")));
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

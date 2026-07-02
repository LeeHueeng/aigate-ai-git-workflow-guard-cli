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
  assert.match(result.stdout, /trends <record\|show>/);
  assert.match(result.stdout, /doctor/);
  assert.match(result.stdout, /demo/);
  assert.match(result.stdout, /install-hook/);
  assert.match(result.stdout, /start/);
  assert.match(result.stdout, /test/);
  assert.match(result.stdout, /aitest/);
  assert.match(result.stdout, /ai report/);
  assert.match(result.stdout, /ai-report/);
  assert.match(result.stdout, /--ask-steps/);
  assert.match(result.stdout, /--steps <ids>/);
  assert.match(result.stdout, /github <comment\|check\|setup>/);
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
  assert.match(result.stdout, /^0\.1\.6/m);
});

test("ships reusable GitHub Action metadata", () => {
  const rootAction = readFileSync(join(repoRoot, "action.yml"), "utf8");
  const bundledAction = readFileSync(join(repoRoot, ".github", "actions", "aigate", "action.yml"), "utf8");

  assert.equal(bundledAction, rootAction);
  assert.match(rootAction, /^name: AIGate AI Git Workflow Guard CLI/m);
  assert.match(rootAction, /secret scans, and release gates/);
  assert.match(rootAction, /default: aigate-cli@latest/);
  assert.match(rootAction, /uses: actions\/setup-node@v6/);
  assert.match(rootAction, /package-manager-cache: false/);
  assert.match(rootAction, /github-check\)/);
  assert.match(rootAction, /branch-strategy-compare\)/);
  assert.match(rootAction, /test\|aitest\)/);
  assert.match(rootAction, /npx -y "\$PACKAGE"/);
  assert.doesNotMatch(rootAction, /node src\/cli\.mjs/);
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

test("sets up GitHub pull request template and CODEOWNERS", () => {
  const outputDir = createOutputDir();
  const result = run([
    "github",
    "setup",
    "--output-dir",
    outputDir,
    "--owner",
    "@example/team",
    "--format",
    "json"
  ]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "github setup");
  assert.equal(output.owner, "@example/team");
  assert.deepEqual(output.files.map((file) => file.action), ["created", "created"]);
  assert.match(readFileSync(join(outputDir, ".github", "pull_request_template.md"), "utf8"), /## Summary/);
  assert.equal(readFileSync(join(outputDir, ".github", "CODEOWNERS"), "utf8"), "* @example/team\n");
});

test("previews localized GitHub setup without writing files", () => {
  const outputDir = createOutputDir();
  const result = run([
    "github",
    "--owner",
    "hueeng",
    "setup",
    "--dry-run",
    "--output-dir",
    outputDir,
    "--language",
    "ko"
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate GitHub 설정/);
  assert.match(result.stdout, /소유자: @hueeng/);
  assert.match(result.stdout, /미리보기: 예/);
  assert.equal(existsSync(join(outputDir, ".github", "pull_request_template.md")), false);
  assert.equal(existsSync(join(outputDir, ".github", "CODEOWNERS")), false);
});

test("protects GitHub setup files unless forced", () => {
  const outputDir = createOutputDir();
  const githubDir = join(outputDir, ".github");
  mkdirSync(githubDir, { recursive: true });
  const templatePath = join(githubDir, "pull_request_template.md");
  writeFileSync(templatePath, "custom template\n", "utf8");

  const skipped = run(["github", "setup", "--pr-template", "--output-dir", outputDir, "--format", "json"]);
  assert.equal(skipped.status, 0);
  assert.equal(JSON.parse(skipped.stdout).files[0].action, "skipped");
  assert.equal(readFileSync(templatePath, "utf8"), "custom template\n");

  const forced = run(["github", "setup", "--pr-template", "--output-dir", outputDir, "--force", "--format", "json"]);
  assert.equal(forced.status, 0);
  assert.equal(JSON.parse(forced.stdout).files[0].action, "updated");
  assert.match(readFileSync(templatePath, "utf8"), /## Summary/);
});

test("records and shows project health trends", () => {
  const outputDir = createOutputDir();
  const historyPath = join(outputDir, "history.json");
  const first = run(["trends", "record", "--history", historyPath, "--format", "json"]);
  const second = run(["trends", "record", "--history", historyPath, "--format", "json"]);

  assert.equal(first.status, 0);
  assert.equal(second.status, 0);

  const output = JSON.parse(second.stdout);
  assert.equal(output.command, "trends record");
  assert.equal(output.historyPath, historyPath);
  assert.equal(output.summary.entries, 2);
  assert.equal(typeof output.snapshot.projectScore, "number");

  const history = JSON.parse(readFileSync(historyPath, "utf8"));
  assert.equal(history.entries.length, 2);

  const show = run(["trends", "show", "--history", historyPath, "--language", "ko"]);
  assert.equal(show.status, 0);
  assert.match(show.stdout, /^# AIGate 상태 추세/m);
  assert.match(show.stdout, /기록 수: 2/);
  assert.match(show.stdout, /프로젝트 점수 변화:/);
});

test("renders localized empty trend history", () => {
  const outputDir = createOutputDir();
  const result = run(["trends", "show", "--history", join(outputDir, "missing.json"), "--language", "zh"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /还没有趋势历史/);
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

test("generates Codex, Gemini, and Claude integration files", () => {
  const outputDir = createOutputDir();
  const result = run(["integrate", "all", "--output-dir", outputDir, "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.providers, ["codex", "gemini", "claude"]);
  assert.ok(existsSync(join(outputDir, "AGENTS.md")));
  assert.ok(existsSync(join(outputDir, "GEMINI.md")));
  assert.ok(existsSync(join(outputDir, "CLAUDE.md")));
  assert.ok(existsSync(join(outputDir, ".aigate", "integrations.json")));
  assert.ok(existsSync(join(outputDir, ".aigate", "integrations", "claude.md")));

  const manifest = JSON.parse(readFileSync(join(outputDir, ".aigate", "integrations.json"), "utf8"));
  assert.deepEqual(manifest.providers, ["codex", "gemini", "claude"]);
});

test("generates Claude Code integration instructions", () => {
  const outputDir = createOutputDir();
  const result = run(["integrate", "claude", "--language", "ko", "--output-dir", outputDir]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /대상: claude/);

  const claude = readFileSync(join(outputDir, "CLAUDE.md"), "utf8");
  assert.match(claude, /# AIGate Claude Code 지침/);
  assert.match(claude, /Claude Code로 이 저장소를 작업할 때/);
  assert.match(claude, /aigate push -u origin <branch>/);

  const integration = readFileSync(join(outputDir, ".aigate", "integrations", "claude.md"), "utf8");
  assert.match(integration, /# Claude Code 연동/);
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

test("previews a guided start route", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["start", "--route", "ai", "--provider", "claude", "--dry-run", "--language", "ko"], {
    cwd: projectDir
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /AIGate start: 미리보기/);
  assert.match(result.stdout, /AI 에이전트 설정/);
  assert.match(result.stdout, /aigate integrate claude/);
});

test("previews the default stepwise start route", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["start", "--route", "default", "--dry-run", "--language", "ko"], {
    cwd: projectDir
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /기본 설정/);
  assert.match(result.stdout, /aigate start --route oss/);
  assert.match(result.stdout, /aigate integrate all/);
  assert.match(result.stdout, /aigate ai report/);
});

test("runs selected default start steps and skips the rest", () => {
  const outputDir = createOutputDir();
  const result = run([
    "start",
    "--route",
    "default",
    "--steps",
    "init,repo-files",
    "--output-dir",
    outputDir,
    "--owner",
    "example/team",
    "--format",
    "json"
  ]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.route, "default");
  assert.deepEqual(output.selectedSteps, ["init", "repo-files"]);
  assert.ok(output.steps.some((step) => step.id === "init" && step.status === "PASS"));
  assert.ok(output.steps.some((step) => step.id === "repo-files" && step.status === "PASS"));
  assert.ok(output.steps.some((step) => step.id === "integrate" && step.status === "SKIPPED"));
  assert.ok(output.steps.some((step) => step.id === "ai-report" && step.status === "SKIPPED"));
  assert.ok(existsSync(join(outputDir, "README.md")));
  assert.equal(readFileSync(join(outputDir, ".github", "CODEOWNERS"), "utf8"), "* @example/team\n");
});

test("blocks unknown default start steps", () => {
  const result = run(["start", "--route", "default", "--steps", "unknown", "--language", "ko"]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /알 수 없는 start 단계/);
  assert.match(result.stdout, /지원 단계/);
  assert.match(result.stdout, /repo-files/);
});

test("creates open source starter files from the guided start route", () => {
  const outputDir = createOutputDir();
  const result = run([
    "start",
    "--route",
    "oss",
    "--output-dir",
    outputDir,
    "--owner",
    "example/team",
    "--format",
    "json"
  ]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.route, "oss");
  assert.equal(output.owner, "@example/team");
  assert.ok(output.steps.some((step) => step.id === "repo-files" && step.status === "PASS"));
  assert.ok(existsSync(join(outputDir, "README.md")));
  assert.ok(existsSync(join(outputDir, "CONTRIBUTING.md")));
  assert.ok(existsSync(join(outputDir, ".github", "ISSUE_TEMPLATE", "bug_report.yml")));
  assert.ok(existsSync(join(outputDir, ".github", "ISSUE_TEMPLATE", "feature_request.yml")));
  assert.ok(existsSync(join(outputDir, ".github", "pull_request_template.md")));
  assert.equal(readFileSync(join(outputDir, ".github", "CODEOWNERS"), "utf8"), "* @example/team\n");
});

test("previews open source starter files without writing", () => {
  const outputDir = createOutputDir();
  const result = run(["start", "--route", "oss", "--output-dir", outputDir, "--dry-run", "--language", "ko"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /오픈소스 설정/);
  assert.match(result.stdout, /aigate start --route oss/);
  assert.equal(existsSync(join(outputDir, "README.md")), false);
  assert.equal(existsSync(join(outputDir, ".github", "ISSUE_TEMPLATE", "bug_report.yml")), false);
});

test("runs a project test command", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["test", "--command", "node -e \"process.exit(0)\"", "--format", "json"], {
    cwd: projectDir
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "test");
  assert.equal(output.status, "PASS");
  assert.equal(output.testRun.exitCode, 0);
});

test("reports failing project tests in Korean", () => {
  const projectDir = createMinimalGitProject();
  const result = run(["test", "--command", "node -e \"process.exit(2)\"", "--language", "ko"], {
    cwd: projectDir
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /AIGate test: 실패/);
  assert.match(result.stdout, /종료 코드: 2/);
  assert.match(result.stdout, /AI 수정 프롬프트/);
});

test("writes an AI remediation prompt for failing tests", () => {
  const projectDir = createMinimalGitProject();
  const promptPath = join(projectDir, ".aigate", "reports", "ai-test.md");
  const result = run([
    "aitest",
    "--command",
    "node -e \"process.exit(2)\"",
    "--provider",
    "codex",
    "--output",
    promptPath,
    "--format",
    "json"
  ], {
    cwd: projectDir
  });

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "aitest");
  assert.equal(output.status, "ACTION_REQUIRED");
  assert.equal(output.promptPath, promptPath);
  assert.ok(existsSync(promptPath));
  assert.match(readFileSync(promptPath, "utf8"), /AIGate AI Test Remediation/);
  assert.match(readFileSync(promptPath, "utf8"), /node -e "process.exit\(2\)"/);
});

test("renders an AI project report as json", () => {
  const result = run(["ai", "report", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "ai report");
  assert.equal(typeof output.projectScore, "number");
  assert.ok(Array.isArray(output.problems));
  assert.ok(Array.isArray(output.strengths));
  assert.ok(Array.isArray(output.direction));
  assert.ok(Array.isArray(output.suggestedCommands));
  assert.match(output.prompt, /AIGate AI Report/);
});

test("renders localized AI report and alias", () => {
  const korean = run(["ai", "report", "--language", "ko"]);
  assert.equal(korean.status, 0);
  assert.match(korean.stdout, /^# AIGate AI 리포트/m);
  assert.match(korean.stdout, /## 현재 문제점/);
  assert.match(korean.stdout, /## 잘된 점/);
  assert.match(korean.stdout, /## 방향성/);
  assert.doesNotMatch(korean.stdout, /## Current Problems/);

  const alias = run(["ai-report", "--format", "json"]);
  assert.equal(alias.status, 0);
  assert.equal(JSON.parse(alias.stdout).command, "ai report");
});

test("applies AI report through a custom agent command", () => {
  const projectDir = createMinimalGitProject();
  const promptPath = join(projectDir, ".aigate", "reports", "ai-report-prompt.md");
  const result = run([
    "ai",
    "report",
    "--apply",
    "--agent-command",
    "cat >/dev/null",
    "--prompt-output",
    promptPath,
    "--format",
    "json"
  ], {
    cwd: projectDir
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "AI_APPLIED");
  assert.equal(output.ai.applied, true);
  assert.equal(output.ai.promptPath, promptPath);
  assert.ok(existsSync(promptPath));
  assert.match(readFileSync(promptPath, "utf8"), /AIGate AI Report/);
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

test("renders email, Linear, and Jira notification dry-run payloads", () => {
  const email = run(["notify", "send", "--channel", "email", "--dry-run", "--format", "json"]);
  const linear = run(["notify", "send", "--channel", "linear", "--dry-run", "--format", "json"]);
  const jira = run(["notify", "send", "--channel", "jira", "--dry-run", "--format", "json"]);
  const localizedJira = run(["notify", "send", "--channel", "jira", "--dry-run", "--format", "json", "--language", "ko"]);

  assert.equal(email.status, 0);
  assert.equal(linear.status, 0);
  assert.equal(jira.status, 0);
  assert.equal(localizedJira.status, 0);

  const emailPayload = JSON.parse(email.stdout);
  const linearPayload = JSON.parse(linear.stdout);
  const jiraPayload = JSON.parse(jira.stdout);

  assert.equal(emailPayload.channel, "email");
  assert.ok(emailPayload.requiredEnv.includes("AIGATE_EMAIL_WEBHOOK_URL"));
  assert.equal(typeof emailPayload.payload.subject, "string");

  assert.equal(linearPayload.channel, "linear");
  assert.ok(linearPayload.requiredEnv.includes("AIGATE_LINEAR_API_KEY"));
  assert.ok(linearPayload.requiredEnv.includes("AIGATE_LINEAR_TEAM_ID"));
  assert.match(linearPayload.payload.query, /IssueCreate/);

  assert.equal(jiraPayload.channel, "jira");
  assert.ok(jiraPayload.requiredEnv.includes("AIGATE_JIRA_BASE_URL"));
  assert.ok(jiraPayload.requiredEnv.includes("AIGATE_JIRA_PROJECT_KEY"));
  assert.equal(jiraPayload.payload.fields.issuetype.name, "Task");

  const localizedJiraPayload = JSON.parse(localizedJira.stdout);
  const localizedJiraText = JSON.stringify(localizedJiraPayload.payload.fields.description);
  assert.match(localizedJiraPayload.payload.fields.summary, /AIGate BLOCK/);
  assert.match(localizedJiraText, /차단 사유/);
  assert.match(localizedJiraText, /주의 사항/);
  assert.match(localizedJiraText, /권장 사항/);
  assert.match(localizedJiraText, /생성 시각/);
  assert.doesNotMatch(localizedJiraText, /Blockers|Warnings|Recommendation|Generated|- none/);
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
  assert.equal(output.version, "0.1.6");
  assert.equal(output.expectedTag, "v0.1.6");
  assert.ok(["READY", "ACTION_REQUIRED", "RELEASED"].includes(output.status));
  assert.deepEqual(output.registry, { checked: false });
});

test("checks npm publication state when requested", () => {
  const binDir = mkdtempSync(join(tmpdir(), "aigate-npm-"));
  const npmPath = join(binDir, "npm");
  writeFileSync(npmPath, "#!/bin/sh\nprintf '\"0.1.6\"\\n'\n");
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
  assert.equal(output.registry.publishedVersion, "0.1.6");
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

test("renders compliance report and dashboard", () => {
  const result = run(["compliance-report", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "compliance-report");
  assert.ok(Array.isArray(output.controls));
  assert.ok(output.controls.some((control) => control.id === "operational-docs"));

  const localized = run(["compliance-report", "--format", "markdown", "--language", "ko"]);
  assert.equal(localized.status, 0);
  assert.match(localized.stdout, /릴리스 준비 상태 - (준비 완료|조치 필요|배포 완료)/);
  assert.match(localized.stdout, /릴리스와 핫픽스 프로세스 문서/);
  assert.match(localized.stdout, /감사 발견 항목 \d+개/);
  assert.doesNotMatch(localized.stdout, /finding\(s\)|READY|release and hotfix process docs|Resolve control/);

  const outputDir = createOutputDir();
  const dashboardPath = join(outputDir, "dashboard.html");
  const dashboard = run(["dashboard", "--output", dashboardPath, "--language", "ko"]);
  assert.equal(dashboard.status, 0);
  assert.ok(existsSync(dashboardPath));
  const dashboardHtml = readFileSync(dashboardPath, "utf8");
  assert.match(dashboardHtml, /AIGate 상태 대시보드/);
  assert.match(dashboardHtml, /감사 발견 항목 \d+개/);
});

test("recommends branch strategy", () => {
  const result = run(["branch-strategy", "--github"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /GitHub Flow with release channels/);
  assert.match(result.stdout, /Require pull request/);
});

test("compares branch strategy proposals", () => {
  const result = run(["branch-strategy", "--compare", "--team-size", "8", "--release", "weekly", "--format", "json"]);

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.command, "branch-strategy");
  assert.equal(output.comparison.command, "branch-strategy compare");
  assert.equal(output.comparison.recommended, "Hybrid Flow");
  assert.equal(output.comparison.proposals[0].name, "Hybrid Flow");
  assert.equal(output.comparison.proposals[0].recommended, true);
  assert.deepEqual(new Set(output.comparison.proposals.map((proposal) => proposal.name)), new Set([
    "GitHub Flow with release channels",
    "Trunk-Based Development",
    "Hybrid Flow",
    "Git Flow"
  ]));
  assert.ok(output.comparison.proposals[0].score > output.comparison.proposals.at(-1).score);
  assert.ok(output.comparison.proposals[0].migration.includes("Use feature/* and codex/* branches for focused work."));

  const localized = run(["branch-strategy", "--compare", "--team-size", "14", "--release", "monthly", "--language", "ko"]);
  assert.equal(localized.status, 0);
  assert.match(localized.stdout, /# 브랜치 전략 제안 비교/);
  assert.match(localized.stdout, /권장 전략: Git Flow/);
  assert.match(localized.stdout, /적합 점수:/);
  assert.match(localized.stdout, /전환 단계/);
  assert.doesNotMatch(localized.stdout, /Fit score/);

  const outputDir = createOutputDir();
  const outputPath = join(outputDir, "branch-strategy.json");
  const written = run(["branch-strategy", "--compare", "--format", "json", "--output", outputPath]);
  assert.equal(written.status, 0);
  assert.ok(existsSync(outputPath));
  assert.equal(JSON.parse(readFileSync(outputPath, "utf8")).command, "branch-strategy");
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
  assert.ok(output.strategy.generatedOutputs.includes(".aigate/policy-packs/branch-protection.json"));
  assert.ok(existsSync(join(outputDir, ".aigate", "generated-branch-strategy.md")));
  assert.ok(existsSync(join(outputDir, ".aigate", "branch-strategy-policy.json")));
  assert.ok(existsSync(join(outputDir, ".aigate", "policy-packs", "README.md")));
  assert.ok(existsSync(join(outputDir, ".aigate", "policy-packs", "branch-protection.json")));
  assert.ok(existsSync(join(outputDir, ".aigate", "policy-packs", "pr-quality.json")));
  assert.ok(existsSync(join(outputDir, ".aigate", "policy-packs", "release-channels.json")));
  assert.ok(existsSync(join(outputDir, ".aigate", "policy-packs", "ai-collaboration.json")));
  assert.ok(existsSync(join(outputDir, "docs", "release-process.md")));
  assert.ok(existsSync(join(outputDir, "docs", "hotfix-process.md")));
  assert.ok(existsSync(join(outputDir, ".github", "pull_request_template.aigate.md")));
  assert.ok(existsSync(join(outputDir, ".github", "CODEOWNERS.aigate")));

  const policy = JSON.parse(readFileSync(join(outputDir, ".aigate", "branch-strategy-policy.json"), "utf8"));
  assert.deepEqual(policy.policyPacks, [
    ".aigate/policy-packs/branch-protection.json",
    ".aigate/policy-packs/pr-quality.json",
    ".aigate/policy-packs/release-channels.json",
    ".aigate/policy-packs/ai-collaboration.json"
  ]);

  const branchProtection = JSON.parse(readFileSync(join(outputDir, ".aigate", "policy-packs", "branch-protection.json"), "utf8"));
  assert.equal(branchProtection.id, "branch-protection");
  assert.ok(branchProtection.requiredChecks.includes("aigate git-ready"));
  const reviewRule = branchProtection.rules.find((rule) => rule.id === "review-policy");
  assert.equal(reviewRule.minimumApprovals, 0);

  const aiCollaboration = JSON.parse(readFileSync(join(outputDir, ".aigate", "policy-packs", "ai-collaboration.json"), "utf8"));
  assert.ok(aiCollaboration.assistantBranches.includes("codex/*"));
});

test("rejects unknown commands", () => {
  const result = run(["unknown-command"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command: unknown-command/);
});

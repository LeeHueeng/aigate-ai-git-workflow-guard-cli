import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildGitHubCheckPayload, buildGitHubCommentPlan } from "../core/github-reporting.mjs";
import { applyGithubSetupPlan, buildGithubSetupPlan } from "../core/github-setup.mjs";
import {
  renderGithubCheckText,
  renderGithubCommentPreview,
  renderGithubCommentSent,
  renderGithubUsage
} from "../renderers/github-reporting.mjs";
import { renderGithubSetupResult } from "../renderers/github-setup.mjs";

export function commandGithub(args, context) {
  const options = context.parseOptions(args);
  const language = context.resolveLanguage(options);
  if (!language) {
    return context.unsupportedLanguage(options.language);
  }

  const action = context.firstPositionalArg(args);
  if (!action || action === "help") {
    return renderGithubUsage(language, context.t);
  }

  if (action === "comment") {
    return commandGithubComment(options, context, language);
  }

  if (action === "check") {
    return commandGithubCheck(options, context, language);
  }

  if (action === "setup") {
    return commandGithubSetup(options, context, language);
  }

  process.exitCode = 1;
  return [
    context.t(language, "github.unknownAction", { action }),
    renderGithubUsage(language, context.t)
  ].join("\n");
}

function commandGithubSetup(options, context, language) {
  const plan = buildGithubSetupPlan(options, context, language);
  const result = applyGithubSetupPlan(plan, {
    dryRun: options.dryRun,
    force: options.force
  });

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderGithubSetupResult(result, language);
}

function commandGithubComment(options, context, language) {
  const prNumber = resolvePrNumber(options);
  if (!prNumber) {
    process.exitCode = 1;
    return context.t(language, "github.missingPr");
  }

  const report = context.buildReport("pr");
  const body = options.body ?? context.renderReport(report, "markdown", language);
  const plan = buildGitHubCommentPlan(prNumber, body);

  if (options.output) {
    writeOutput(options.output, body);
    return context.t(language, "common.wrote", { path: options.output });
  }

  if (options.dryRun) {
    return renderGithubCommentPreview(plan, language, context.t, context.quoteArgs);
  }

  const ghArgs = ["pr", "comment", plan.prNumber, "--body", plan.body];
  const result = spawnSync("gh", ghArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const lines = [];

  if (result.stdout.trim()) {
    lines.push(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    lines.push(result.stderr.trim());
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return lines.join("\n");
  }

  lines.push(renderGithubCommentSent(plan, language, context.t));
  return lines.join("\n");
}

function commandGithubCheck(options, context, language) {
  const reportType = options.type ?? "pr";
  const report = context.buildReport(reportType);
  const summary = context.renderReport(report, "markdown", language);
  const payload = buildGitHubCheckPayload(report, summary, {
    detailsUrl: options.detailsUrl,
    name: options.name,
    title: options.title
  });
  const format = options.format ?? "text";

  if (options.output) {
    writeOutput(options.output, format === "json" ? JSON.stringify(payload, null, 2) : summary);
    return context.t(language, "common.wrote", { path: options.output });
  }

  if (format === "json") {
    return JSON.stringify(payload, null, 2);
  }

  if (format === "markdown") {
    return summary;
  }

  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath && !options.dryRun) {
    appendFileSync(stepSummaryPath, `${summary}\n`, "utf8");
    return [
      context.t(language, "github.stepSummaryWritten", { path: stepSummaryPath }),
      renderGithubCheckText(payload, language, context.t)
    ].join("\n");
  }

  return renderGithubCheckText(payload, language, context.t);
}

function resolvePrNumber(options) {
  if (options.pr) {
    return String(options.pr).replace(/^#/, "").trim();
  }

  const result = spawnSync("gh", ["pr", "view", "--json", "number", "--jq", ".number"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  });
  const number = result.stdout.trim();

  return result.status === 0 && number ? number : null;
}

function writeOutput(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${content}\n`, "utf8");
}

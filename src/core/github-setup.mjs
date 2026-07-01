import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function buildGithubSetupPlan(options, context, language) {
  const outputDir = options.outputDir ?? ".";
  const remoteUrl = context.git(["remote", "get-url", "origin"]) ?? "";
  const owner = normalizeOwner(options.owner ?? inferOwnerFromRemote(remoteUrl) ?? "maintainers");
  const includeTemplate = Boolean(options.prTemplate) || (!options.prTemplate && !options.codeowners);
  const includeCodeowners = Boolean(options.codeowners) || (!options.prTemplate && !options.codeowners);
  const files = [];

  if (includeTemplate) {
    files.push({
      id: "pull-request-template",
      path: join(outputDir, ".github", "pull_request_template.md"),
      content: context.renderPullRequestTemplateDraft(language)
    });
  }

  if (includeCodeowners) {
    files.push({
      id: "codeowners",
      path: join(outputDir, ".github", "CODEOWNERS"),
      content: `* ${owner}\n`
    });
  }

  return {
    command: "github setup",
    outputDir,
    owner,
    files
  };
}

export function applyGithubSetupPlan(plan, options = {}) {
  return {
    ...plan,
    dryRun: Boolean(options.dryRun),
    files: plan.files.map((file) => applyGithubSetupFile(file, options))
  };
}

export function inferOwnerFromRemote(remoteUrl) {
  const match = String(remoteUrl).match(/github\.com[:/]([^/]+)\//i);
  return match ? match[1] : null;
}

export function normalizeOwner(owner) {
  const text = String(owner ?? "").trim();
  if (!text) {
    return "@maintainers";
  }

  return text.startsWith("@") ? text : `@${text}`;
}

function applyGithubSetupFile(file, options) {
  const exists = existsSync(file.path);
  const action = exists ? (options.force ? "updated" : "skipped") : "created";

  if (!options.dryRun && action !== "skipped") {
    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, file.content, "utf8");
  }

  return {
    id: file.id,
    path: file.path,
    action
  };
}

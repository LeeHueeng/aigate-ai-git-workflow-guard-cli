import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const requiredGroups = [
  ["README", ["README.md", "README.ko.md", "README.ja.md", "README.zh.md"]],
  ["docs index", ["docs/README.md", "docs/README.ko.md", "docs/README.ja.md", "docs/README.zh.md"]],
  ["operations", ["docs/operations.en.md", "docs/operations.ko.md", "docs/operations.ja.md", "docs/operations.zh.md"]],
  ["ai integrations", ["docs/ai-integrations.md", "docs/ai-integrations.ko.md", "docs/ai-integrations.ja.md", "docs/ai-integrations.zh.md"]],
  ["branch strategy", ["docs/branch-strategy.md", "docs/branch-strategy.ko.md", "docs/branch-strategy.ja.md", "docs/branch-strategy.zh.md"]],
  ["commercialization", ["docs/commercialization.md", "docs/commercialization.ko.md", "docs/commercialization.ja.md", "docs/commercialization.zh.md"]],
  ["distribution", ["docs/distribution.md", "docs/distribution.ko.md", "docs/distribution.ja.md", "docs/distribution.zh.md"]],
  ["github action", ["docs/github-action.md", "docs/github-action.ko.md", "docs/github-action.ja.md", "docs/github-action.zh.md"]],
  ["git upload workflow", ["docs/git-upload-workflow.md", "docs/git-upload-workflow.ko.md", "docs/git-upload-workflow.ja.md", "docs/git-upload-workflow.zh.md"]],
  ["notifications", ["docs/notifications.md", "docs/notifications.ko.md", "docs/notifications.ja.md", "docs/notifications.zh.md"]],
  ["release process", ["docs/release-process.md", "docs/release-process.ko.md", "docs/release-process.ja.md", "docs/release-process.zh.md"]],
  ["hotfix process", ["docs/hotfix-process.md", "docs/hotfix-process.ko.md", "docs/hotfix-process.ja.md", "docs/hotfix-process.zh.md"]],
  ["open source readiness", ["docs/open-source-readiness.md", "docs/open-source-readiness.ko.md", "docs/open-source-readiness.ja.md", "docs/open-source-readiness.zh.md"]],
  ["product plan", ["docs/product-plan.md", "docs/product-plan.ko.md", "docs/product-plan.ja.md", "docs/product-plan.zh.md"]],
  ["roadmap", ["docs/roadmap.md", "docs/roadmap.ko.md", "docs/roadmap.ja.md", "docs/roadmap.zh.md"]],
  ["security scanning", ["docs/security-scanning.md", "docs/security-scanning.ko.md", "docs/security-scanning.ja.md", "docs/security-scanning.zh.md"]],
  ["basic node example", ["docs/examples/basic-node-project.md", "docs/examples/basic-node-project.ko.md", "docs/examples/basic-node-project.ja.md", "docs/examples/basic-node-project.zh.md"]],
  ["json output example", ["docs/examples/json-output.md", "docs/examples/json-output.ko.md", "docs/examples/json-output.ja.md", "docs/examples/json-output.zh.md"]],
  ["windows smoke test", ["docs/examples/windows-smoke-test.md", "docs/examples/windows-smoke-test.ko.md", "docs/examples/windows-smoke-test.ja.md", "docs/examples/windows-smoke-test.zh.md"]]
];

const missing = [];

for (const [name, files] of requiredGroups) {
  for (const file of files) {
    if (!existsSync(join(rootDir, file))) {
      missing.push(`${name}: ${file}`);
    }
  }
}

if (missing.length > 0) {
  console.error("Missing localized documentation files:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`Localized documentation coverage OK: ${requiredGroups.length} groups`);

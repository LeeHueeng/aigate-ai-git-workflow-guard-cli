const MAX_GITHUB_SUMMARY_CHARS = 60_000;

export function conclusionForStatus(status) {
  if (status === "PASS" || status === "READY" || status === "RELEASED") {
    return "success";
  }

  if (status === "WARN" || status === "ACTION_REQUIRED") {
    return "neutral";
  }

  return "failure";
}

export function buildGitHubCheckPayload(report, summary, options = {}) {
  const conclusion = conclusionForStatus(report.status);
  const title = options.title ?? "AIGate PR report";
  const safeSummary = truncateGitHubSummary(summary);
  const checkRun = {
    name: options.name ?? "AIGate",
    status: "completed",
    conclusion,
    output: {
      title,
      summary: safeSummary
    }
  };

  if (options.detailsUrl) {
    checkRun.details_url = options.detailsUrl;
  }

  return {
    command: "github check",
    status: report.status,
    conclusion,
    generatedAt: report.generatedAt,
    branch: report.branch,
    riskScore: report.riskScore,
    prReadinessScore: report.prReadinessScore,
    projectScore: report.projectScore,
    secretFindings: report.secretFindings.length,
    changedFiles: report.changedFiles,
    checkRun
  };
}

export function buildGitHubCommentPlan(prNumber, body) {
  return {
    command: "github comment",
    prNumber: String(prNumber),
    body
  };
}

function truncateGitHubSummary(summary) {
  const text = String(summary ?? "");
  if (text.length <= MAX_GITHUB_SUMMARY_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_GITHUB_SUMMARY_CHARS)}\n\n[truncated]`;
}

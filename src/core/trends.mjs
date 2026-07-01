import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MAX_TREND_HISTORY_ENTRIES = 200;

export function defaultTrendHistoryPath() {
  return join(".aigate", "reports", "history.json");
}

export function buildTrendSnapshot(report) {
  return {
    generatedAt: report.generatedAt,
    branch: report.branch,
    status: report.status,
    projectScore: report.projectScore,
    projectGrade: report.projectGrade,
    riskScore: report.riskScore,
    prReadinessScore: report.prReadinessScore,
    changedFiles: report.changedFiles,
    secretFindings: report.secretFindings.length
  };
}

export function readTrendHistory(filePath) {
  if (!existsSync(filePath)) {
    return emptyHistory();
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    if (Array.isArray(parsed)) {
      return {
        version: 1,
        entries: parsed.filter(Boolean)
      };
    }

    return {
      version: 1,
      entries: Array.isArray(parsed.entries) ? parsed.entries.filter(Boolean) : []
    };
  } catch {
    return emptyHistory();
  }
}

export function appendTrendSnapshot(history, snapshot, limit = MAX_TREND_HISTORY_ENTRIES) {
  const entries = [...(history.entries ?? []), snapshot].slice(-limit);
  return {
    version: 1,
    entries
  };
}

export function summarizeTrendHistory(history) {
  const entries = history.entries ?? [];
  const latest = entries.at(-1) ?? null;
  const previous = entries.at(-2) ?? null;
  const projectScores = entries.map((entry) => entry.projectScore).filter((score) => Number.isFinite(score));
  const riskScores = entries.map((entry) => entry.riskScore).filter((score) => Number.isFinite(score));

  return {
    entries: entries.length,
    latest,
    previous,
    deltas: latest && previous
      ? {
          projectScore: latest.projectScore - previous.projectScore,
          riskScore: latest.riskScore - previous.riskScore,
          prReadinessScore: latest.prReadinessScore - previous.prReadinessScore,
          changedFiles: latest.changedFiles - previous.changedFiles,
          secretFindings: latest.secretFindings - previous.secretFindings
        }
      : null,
    bestProjectScore: projectScores.length ? Math.max(...projectScores) : null,
    worstProjectScore: projectScores.length ? Math.min(...projectScores) : null,
    averageRiskScore: riskScores.length ? Math.round(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length) : null,
    statusCounts: entries.reduce((counts, entry) => {
      counts[entry.status] = (counts[entry.status] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function emptyHistory() {
  return {
    version: 1,
    entries: []
  };
}

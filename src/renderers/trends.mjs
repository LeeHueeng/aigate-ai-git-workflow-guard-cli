const TREND_LABELS = {
  en: {
    title: "AIGate Health Trends",
    recorded: "AIGate trend snapshot recorded",
    historyPath: "History file",
    entries: "Entries",
    latestStatus: "Latest status",
    branch: "Branch",
    projectScore: "Project score",
    riskScore: "Risk score",
    prReadinessScore: "PR readiness score",
    changedFiles: "Changed files",
    secretFindings: "Secret findings",
    projectScoreDelta: "Project score delta",
    riskScoreDelta: "Risk score delta",
    prReadinessDelta: "PR readiness delta",
    bestProjectScore: "Best project score",
    worstProjectScore: "Worst project score",
    averageRiskScore: "Average risk score",
    statusCounts: "Status counts",
    noHistory: "No trend history yet. Run `aigate trends record` first.",
    usage: "Usage: aigate trends <record|show> [--history .aigate/reports/history.json] [--format json]"
  },
  ko: {
    title: "AIGate 상태 추세",
    recorded: "AIGate 추세 스냅샷 기록 완료",
    historyPath: "기록 파일",
    entries: "기록 수",
    latestStatus: "최근 상태",
    branch: "브랜치",
    projectScore: "프로젝트 점수",
    riskScore: "위험 점수",
    prReadinessScore: "PR 준비 점수",
    changedFiles: "변경 파일",
    secretFindings: "민감 정보 탐지",
    projectScoreDelta: "프로젝트 점수 변화",
    riskScoreDelta: "위험 점수 변화",
    prReadinessDelta: "PR 준비 점수 변화",
    bestProjectScore: "최고 프로젝트 점수",
    worstProjectScore: "최저 프로젝트 점수",
    averageRiskScore: "평균 위험 점수",
    statusCounts: "상태별 기록 수",
    noHistory: "아직 추세 기록이 없습니다. 먼저 `aigate trends record`를 실행하세요.",
    usage: "사용법: aigate trends <record|show> [--history .aigate/reports/history.json] [--format json]"
  },
  ja: {
    title: "AIGate 状態トレンド",
    recorded: "AIGate トレンドスナップショットを記録しました",
    historyPath: "履歴ファイル",
    entries: "記録数",
    latestStatus: "最新状態",
    branch: "ブランチ",
    projectScore: "プロジェクトスコア",
    riskScore: "リスクスコア",
    prReadinessScore: "PR 準備スコア",
    changedFiles: "変更ファイル",
    secretFindings: "機密情報検出",
    projectScoreDelta: "プロジェクトスコア変化",
    riskScoreDelta: "リスクスコア変化",
    prReadinessDelta: "PR 準備スコア変化",
    bestProjectScore: "最高プロジェクトスコア",
    worstProjectScore: "最低プロジェクトスコア",
    averageRiskScore: "平均リスクスコア",
    statusCounts: "状態別記録数",
    noHistory: "トレンド履歴はまだありません。先に `aigate trends record` を実行してください。",
    usage: "使い方: aigate trends <record|show> [--history .aigate/reports/history.json] [--format json]"
  },
  zh: {
    title: "AIGate 状态趋势",
    recorded: "AIGate 趋势快照已记录",
    historyPath: "历史文件",
    entries: "记录数",
    latestStatus: "最新状态",
    branch: "分支",
    projectScore: "项目分数",
    riskScore: "风险分数",
    prReadinessScore: "PR 就绪分数",
    changedFiles: "变更文件",
    secretFindings: "敏感信息发现",
    projectScoreDelta: "项目分数变化",
    riskScoreDelta: "风险分数变化",
    prReadinessDelta: "PR 就绪分数变化",
    bestProjectScore: "最高项目分数",
    worstProjectScore: "最低项目分数",
    averageRiskScore: "平均风险分数",
    statusCounts: "各状态记录数",
    noHistory: "还没有趋势历史。请先运行 `aigate trends record`。",
    usage: "用法: aigate trends <record|show> [--history .aigate/reports/history.json] [--format json]"
  }
};

export function renderTrendUsage(language) {
  return labelsFor(language).usage;
}

export function renderTrendRecord(result, language, statusLabel) {
  const labels = labelsFor(language);
  return [
    labels.recorded,
    `${labels.historyPath}: ${result.historyPath}`,
    "",
    renderTrendSummary(result.summary, language, statusLabel)
  ].join("\n");
}

export function renderTrendSummary(summary, language, statusLabel) {
  const labels = labelsFor(language);
  if (!summary.latest) {
    return [
      `# ${labels.title}`,
      "",
      `- ${labels.entries}: 0`,
      `- ${labels.noHistory}`
    ].join("\n");
  }

  const lines = [
    `# ${labels.title}`,
    "",
    `- ${labels.entries}: ${summary.entries}`,
    `- ${labels.latestStatus}: ${statusLabel(summary.latest.status, language)}`,
    `- ${labels.branch}: ${summary.latest.branch}`,
    `- ${labels.projectScore}: ${summary.latest.projectScore}/100 (${summary.latest.projectGrade})`,
    `- ${labels.riskScore}: ${summary.latest.riskScore}/100`,
    `- ${labels.prReadinessScore}: ${summary.latest.prReadinessScore}/100`,
    `- ${labels.changedFiles}: ${summary.latest.changedFiles}`,
    `- ${labels.secretFindings}: ${summary.latest.secretFindings}`,
    `- ${labels.bestProjectScore}: ${formatNullableScore(summary.bestProjectScore)}`,
    `- ${labels.worstProjectScore}: ${formatNullableScore(summary.worstProjectScore)}`,
    `- ${labels.averageRiskScore}: ${formatNullableScore(summary.averageRiskScore)}`
  ];

  if (summary.deltas) {
    lines.push(
      `- ${labels.projectScoreDelta}: ${formatDelta(summary.deltas.projectScore)}`,
      `- ${labels.riskScoreDelta}: ${formatDelta(summary.deltas.riskScore)}`,
      `- ${labels.prReadinessDelta}: ${formatDelta(summary.deltas.prReadinessScore)}`
    );
  }

  lines.push(
    "",
    `## ${labels.statusCounts}`,
    "",
    ...Object.entries(summary.statusCounts).map(([status, count]) => `- ${statusLabel(status, language)}: ${count}`)
  );

  return lines.join("\n");
}

function labelsFor(language) {
  return TREND_LABELS[language] ?? TREND_LABELS.en;
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

function formatNullableScore(value) {
  return value === null ? "-" : `${value}/100`;
}

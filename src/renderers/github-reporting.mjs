export function renderGithubUsage(language, t) {
  return t(language, "github.usage");
}

export function renderGithubCommentPreview(plan, language, t, quoteArgs) {
  const ghArgs = ["pr", "comment", plan.prNumber, "--body", plan.body];
  return [
    t(language, "github.commentPrepared"),
    t(language, "github.prNumber", { pr: plan.prNumber }),
    t(language, "push.wouldRun", { command: `gh ${quoteArgs(ghArgs).join(" ")}` })
  ].join("\n");
}

export function renderGithubCommentSent(plan, language, t) {
  return [
    t(language, "github.commentSent", { pr: plan.prNumber })
  ].join("\n");
}

export function renderGithubCheckText(payload, language, t) {
  return [
    t(language, "github.checkPrepared"),
    t(language, "github.status", { status: payload.status }),
    t(language, "github.conclusion", { conclusion: conclusionLabel(payload.conclusion, language) }),
    t(language, "gitReady.branch", { branch: payload.branch }),
    t(language, "gitReady.projectScore", { score: payload.projectScore })
  ].join("\n");
}

function conclusionLabel(conclusion, language) {
  const labels = {
    ko: {
      failure: "실패",
      neutral: "중립",
      success: "성공"
    },
    ja: {
      failure: "失敗",
      neutral: "中立",
      success: "成功"
    },
    zh: {
      failure: "失败",
      neutral: "中立",
      success: "成功"
    }
  };

  return labels[language]?.[conclusion] ?? conclusion;
}

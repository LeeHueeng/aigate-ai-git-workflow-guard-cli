export function renderDoctorReport(report, language = "en") {
  const labels = firstRunLabels(language);
  return [
    `${labels.doctor}: ${statusText(report.status, language)}`,
    `${labels.branch}: ${report.branch}`,
    `${labels.projectScore}: ${report.projectScore}/100`,
    "",
    `${labels.checks}:`,
    ...report.checks.map((check) => (
      `- ${check.pass ? labels.pass : labels[check.severity]}: ${translateCheckLabel(check.label, language)} (${check.value})`
    )),
    "",
    `${labels.nextSteps}:`,
    ...(report.nextSteps.length ? report.nextSteps.map((step) => `- ${translateNextStep(step, language)}`) : [`- ${labels.none}`])
  ].join("\n");
}

export function renderDemoScenario(demo, language = "en") {
  const labels = firstRunLabels(language);
  return [
    labels.demoTitle,
    "",
    ...demo.steps.flatMap((step, index) => [
      `${index + 1}. ${translateDemoTitle(step.title, language)}`,
      `   $ ${step.command}`,
      ...step.output.map((line) => `   ${translateDemoOutput(line, language)}`),
      ""
    ]),
    `${labels.next}: ${translateNextStep(demo.next, language)}`
  ].join("\n").trimEnd();
}

export function renderHookResult(result, language = "en") {
  const labels = firstRunLabels(language);
  return [
    `${labels.hook}: ${statusText(result.status, language)}`,
    `${labels.hookName}: ${result.hook}`,
    result.path ? `${labels.path}: ${result.path}` : null,
    `${labels.action}: ${translateAction(result.action, language)}`,
    `${labels.next}: ${translateNextStep(result.next, language)}`
  ].filter(Boolean).join("\n");
}

function firstRunLabels(language) {
  return {
    en: {
      action: "Action",
      branch: "Branch",
      block: "BLOCK",
      checks: "Checks",
      demoTitle: "AIGate demo",
      doctor: "AIGate doctor",
      hook: "AIGate hook",
      hookName: "Hook",
      next: "Next",
      nextSteps: "Next steps",
      none: "None",
      pass: "PASS",
      path: "Path",
      projectScore: "Project score",
      warn: "WARN"
    },
    ko: {
      action: "동작",
      branch: "브랜치",
      block: "차단",
      checks: "점검 항목",
      demoTitle: "AIGate 데모",
      doctor: "AIGate doctor",
      hook: "AIGate hook",
      hookName: "Hook",
      next: "다음 단계",
      nextSteps: "다음 단계",
      none: "없음",
      pass: "통과",
      path: "경로",
      projectScore: "프로젝트 점수",
      warn: "주의"
    },
    ja: {
      action: "操作",
      branch: "ブランチ",
      block: "ブロック",
      checks: "チェック項目",
      demoTitle: "AIGate デモ",
      doctor: "AIGate doctor",
      hook: "AIGate hook",
      hookName: "Hook",
      next: "次の手順",
      nextSteps: "次の手順",
      none: "なし",
      pass: "通過",
      path: "パス",
      projectScore: "プロジェクトスコア",
      warn: "注意"
    },
    zh: {
      action: "动作",
      branch: "分支",
      block: "阻塞",
      checks: "检查项",
      demoTitle: "AIGate 演示",
      doctor: "AIGate doctor",
      hook: "AIGate hook",
      hookName: "Hook",
      next: "下一步",
      nextSteps: "下一步",
      none: "无",
      pass: "通过",
      path: "路径",
      projectScore: "项目分数",
      warn: "警告"
    }
  }[language] ?? firstRunLabels("en");
}

function statusText(status, language) {
  const map = {
    en: {
      BLOCK: "BLOCK",
      DRY_RUN: "DRY RUN",
      ERROR: "ERROR",
      INSTALLED: "INSTALLED",
      READY: "READY",
      SKIPPED: "SKIPPED",
      WARN: "WARN"
    },
    ko: {
      BLOCK: "차단",
      DRY_RUN: "미리보기",
      ERROR: "오류",
      INSTALLED: "설치 완료",
      READY: "준비 완료",
      SKIPPED: "건너뜀",
      WARN: "주의"
    },
    ja: {
      BLOCK: "ブロック",
      DRY_RUN: "ドライラン",
      ERROR: "エラー",
      INSTALLED: "インストール済み",
      READY: "準備完了",
      SKIPPED: "スキップ",
      WARN: "注意"
    },
    zh: {
      BLOCK: "阻塞",
      DRY_RUN: "预演",
      ERROR: "错误",
      INSTALLED: "已安装",
      READY: "就绪",
      SKIPPED: "已跳过",
      WARN: "警告"
    }
  };
  return map[language]?.[status] ?? map.en[status] ?? status;
}

function translateCheckLabel(label, language) {
  return {
    ko: {
      "AIGate config": "AIGate 설정",
      "CI workflow": "CI workflow",
      "Git repository": "Git 저장소",
      "Node.js runtime": "Node.js runtime",
      "git-ready gate": "git-ready 게이트",
      "npm test script": "npm test script",
      "package.json": "package.json",
      "pre-push hook": "pre-push hook",
      "project foundation score": "프로젝트 기반 점수"
    },
    ja: {
      "AIGate config": "AIGate 設定",
      "CI workflow": "CI workflow",
      "Git repository": "Git リポジトリ",
      "Node.js runtime": "Node.js runtime",
      "git-ready gate": "git-ready ゲート",
      "npm test script": "npm test script",
      "package.json": "package.json",
      "pre-push hook": "pre-push hook",
      "project foundation score": "プロジェクト基盤スコア"
    },
    zh: {
      "AIGate config": "AIGate 配置",
      "CI workflow": "CI workflow",
      "Git repository": "Git 仓库",
      "Node.js runtime": "Node.js runtime",
      "git-ready gate": "git-ready 关卡",
      "npm test script": "npm test script",
      "package.json": "package.json",
      "pre-push hook": "pre-push hook",
      "project foundation score": "项目基础分"
    }
  }[language]?.[label] ?? label;
}

function translateNextStep(step, language) {
  return {
    ko: {
      "Add a CI workflow or run checks before every push.": "CI workflow를 추가하거나 push 전 검사를 실행하세요.",
      "Add a package.json test script.": "package.json에 test script를 추가하세요.",
      "Add package.json or run AIGate from the project root.": "package.json을 추가하거나 프로젝트 root에서 AIGate를 실행하세요.",
      "Existing pre-push hook found. Re-run with --force to replace it.": "기존 pre-push hook이 있습니다. 교체하려면 --force로 다시 실행하세요.",
      "Install Node.js 20 or newer.": "Node.js 20 이상을 설치하세요.",
      "Remove --dry-run to write the hook.": "hook을 작성하려면 --dry-run을 제거하세요.",
      "Run AIGate inside a Git repository.": "AIGate를 Git 저장소 안에서 실행하세요.",
      "Run aigate evaluate-project and complete missing foundations.": "aigate evaluate-project를 실행하고 부족한 기반을 보완하세요.",
      "Run aigate git-ready and resolve blockers.": "aigate git-ready를 실행하고 차단 사유를 해결하세요.",
      "Run aigate init.": "aigate init을 실행하세요.",
      "Run aigate install-hook --pre-push.": "aigate install-hook --pre-push를 실행하세요.",
      "Run npx -y aigate-cli check in your repository.": "저장소에서 npx -y aigate-cli check를 실행하세요.",
      "git push now runs aigate git-ready first.": "이제 git push 전에 aigate git-ready가 먼저 실행됩니다."
    },
    ja: {
      "Add a CI workflow or run checks before every push.": "CI workflow を追加するか、push 前に checks を実行してください。",
      "Add a package.json test script.": "package.json に test script を追加してください。",
      "Add package.json or run AIGate from the project root.": "package.json を追加するか project root で AIGate を実行してください。",
      "Existing pre-push hook found. Re-run with --force to replace it.": "既存の pre-push hook があります。置き換えるには --force で再実行してください。",
      "Install Node.js 20 or newer.": "Node.js 20 以上をインストールしてください。",
      "Remove --dry-run to write the hook.": "hook を書き込むには --dry-run を外してください。",
      "Run AIGate inside a Git repository.": "AIGate は Git リポジトリ内で実行してください。",
      "Run aigate evaluate-project and complete missing foundations.": "aigate evaluate-project を実行し、不足している基盤を補ってください。",
      "Run aigate git-ready and resolve blockers.": "aigate git-ready を実行し、blocker を解消してください。",
      "Run aigate init.": "aigate init を実行してください。",
      "Run aigate install-hook --pre-push.": "aigate install-hook --pre-push を実行してください。",
      "Run npx -y aigate-cli check in your repository.": "リポジトリで npx -y aigate-cli check を実行してください。",
      "git push now runs aigate git-ready first.": "これから git push 前に aigate git-ready が先に実行されます。"
    },
    zh: {
      "Add a CI workflow or run checks before every push.": "添加 CI workflow，或在每次 push 前运行检查。",
      "Add a package.json test script.": "在 package.json 中添加 test script。",
      "Add package.json or run AIGate from the project root.": "添加 package.json，或在 project root 运行 AIGate。",
      "Existing pre-push hook found. Re-run with --force to replace it.": "发现已有 pre-push hook。若要替换，请用 --force 重新运行。",
      "Install Node.js 20 or newer.": "安装 Node.js 20 或更高版本。",
      "Remove --dry-run to write the hook.": "移除 --dry-run 以写入 hook。",
      "Run AIGate inside a Git repository.": "请在 Git 仓库内运行 AIGate。",
      "Run aigate evaluate-project and complete missing foundations.": "运行 aigate evaluate-project 并补齐缺失基础项。",
      "Run aigate git-ready and resolve blockers.": "运行 aigate git-ready 并解决 blockers。",
      "Run aigate init.": "运行 aigate init。",
      "Run aigate install-hook --pre-push.": "运行 aigate install-hook --pre-push。",
      "Run npx -y aigate-cli check in your repository.": "在你的仓库中运行 npx -y aigate-cli check。",
      "git push now runs aigate git-ready first.": "现在 git push 会先运行 aigate git-ready。"
    }
  }[language]?.[step] ?? step;
}

function translateDemoTitle(title, language) {
  return {
    ko: {
      "Install the guarded pre-push hook": "guarded pre-push hook 설치",
      "Review pull request readiness": "pull request 준비 상태 확인",
      "Run a local readiness check": "로컬 준비 상태 검사 실행"
    },
    ja: {
      "Install the guarded pre-push hook": "guarded pre-push hook をインストール",
      "Review pull request readiness": "pull request readiness を確認",
      "Run a local readiness check": "ローカル readiness check を実行"
    },
    zh: {
      "Install the guarded pre-push hook": "安装 guarded pre-push hook",
      "Review pull request readiness": "检查 pull request readiness",
      "Run a local readiness check": "运行本地 readiness check"
    }
  }[language]?.[title] ?? title;
}

function translateDemoOutput(line, language) {
  return {
    ko: {
      "AIGate check: PASS": "AIGate 검사: 통과",
      "AIGate hook: installed": "AIGate hook: 설치 완료",
      "Changed files: 0": "변경 파일: 0",
      "Hook: pre-push": "Hook: pre-push",
      "Next: git push now runs aigate git-ready first.": "다음 단계: 이제 git push 전에 aigate git-ready가 먼저 실행됩니다.",
      "Secret findings: 0": "민감 정보 탐지: 0"
    },
    ja: {
      "AIGate check: PASS": "AIGate チェック: 通過",
      "AIGate hook: installed": "AIGate hook: インストール済み",
      "Changed files: 0": "変更ファイル: 0",
      "Hook: pre-push": "Hook: pre-push",
      "Next: git push now runs aigate git-ready first.": "次の手順: これから git push 前に aigate git-ready が先に実行されます。",
      "Secret findings: 0": "機密情報検出: 0"
    },
    zh: {
      "AIGate check: PASS": "AIGate 检查: 通过",
      "AIGate hook: installed": "AIGate hook: 已安装",
      "Changed files: 0": "变更文件: 0",
      "Hook: pre-push": "Hook: pre-push",
      "Next: git push now runs aigate git-ready first.": "下一步: 现在 git push 会先运行 aigate git-ready。",
      "Secret findings: 0": "敏感信息发现: 0"
    }
  }[language]?.[line] ?? line;
}

function translateAction(action, language) {
  return {
    ko: { created: "생성", skipped: "건너뜀", updated: "갱신", none: "없음" },
    ja: { created: "作成", skipped: "スキップ", updated: "更新", none: "なし" },
    zh: { created: "已创建", skipped: "已跳过", updated: "已更新", none: "无" }
  }[language]?.[action] ?? action;
}

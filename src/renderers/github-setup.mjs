const SETUP_LABELS = {
  en: {
    title: "AIGate GitHub setup",
    owner: "Owner",
    dryRun: "Dry run",
    files: "Files",
    next: "Next: review the generated files, run npm run ci, then open a focused pull request.",
    created: "created",
    skipped: "skipped",
    updated: "updated",
    yes: "yes",
    no: "no"
  },
  ko: {
    title: "AIGate GitHub 설정",
    owner: "소유자",
    dryRun: "미리보기",
    files: "파일",
    next: "다음 단계: 생성된 파일을 검토하고 npm run ci를 실행한 뒤 범위가 명확한 PR을 여세요.",
    created: "생성",
    skipped: "건너뜀",
    updated: "갱신",
    yes: "예",
    no: "아니요"
  },
  ja: {
    title: "AIGate GitHub 設定",
    owner: "オーナー",
    dryRun: "ドライラン",
    files: "ファイル",
    next: "次の手順: 生成ファイルを確認し、npm run ci を実行して、範囲を絞った PR を作成してください。",
    created: "作成",
    skipped: "スキップ",
    updated: "更新",
    yes: "はい",
    no: "いいえ"
  },
  zh: {
    title: "AIGate GitHub 设置",
    owner: "所有者",
    dryRun: "预演",
    files: "文件",
    next: "下一步: 检查生成的文件，运行 npm run ci，然后创建范围清晰的 PR。",
    created: "已创建",
    skipped: "已跳过",
    updated: "已更新",
    yes: "是",
    no: "否"
  }
};

export function renderGithubSetupResult(result, language) {
  const labels = labelsFor(language);
  return [
    labels.title,
    `${labels.owner}: ${result.owner}`,
    `${labels.dryRun}: ${result.dryRun ? labels.yes : labels.no}`,
    "",
    `${labels.files}:`,
    ...result.files.map((file) => `- ${labels[file.action] ?? file.action}: ${file.path}`),
    "",
    labels.next
  ].join("\n");
}

function labelsFor(language) {
  return SETUP_LABELS[language] ?? SETUP_LABELS.en;
}

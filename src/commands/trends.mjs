import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  appendTrendSnapshot,
  buildTrendSnapshot,
  defaultTrendHistoryPath,
  readTrendHistory,
  summarizeTrendHistory
} from "../core/trends.mjs";
import { renderTrendRecord, renderTrendSummary, renderTrendUsage } from "../renderers/trends.mjs";

export function commandTrends(args, context) {
  const options = context.parseOptions(args);
  const language = context.resolveLanguage(options);
  if (!language) {
    return context.unsupportedLanguage(options.language);
  }

  const action = context.firstPositionalArg(args) ?? "show";
  if (action === "help") {
    return renderTrendUsage(language);
  }

  if (action === "record") {
    return commandRecordTrend(options, context, language);
  }

  if (action === "show") {
    return commandShowTrends(options, context, language);
  }

  process.exitCode = 1;
  return [
    context.t(language, "trends.unknownAction", { action }),
    renderTrendUsage(language)
  ].join("\n");
}

function commandRecordTrend(options, context, language) {
  const historyPath = options.history ?? defaultTrendHistoryPath();
  const report = context.buildReport(options.type ?? "local");
  const snapshot = buildTrendSnapshot(report);
  const history = appendTrendSnapshot(readTrendHistory(historyPath), snapshot);
  writeHistory(historyPath, history);

  const result = {
    command: "trends record",
    historyPath,
    snapshot,
    summary: summarizeTrendHistory(history)
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderTrendRecord(result, language, context.statusLabel);
}

function commandShowTrends(options, context, language) {
  const historyPath = options.history ?? defaultTrendHistoryPath();
  const history = readTrendHistory(historyPath);
  const result = {
    command: "trends show",
    historyPath,
    summary: summarizeTrendHistory(history)
  };

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderTrendSummary(result.summary, language, context.statusLabel);
}

function writeHistory(historyPath, history) {
  mkdirSync(dirname(historyPath), { recursive: true });
  writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

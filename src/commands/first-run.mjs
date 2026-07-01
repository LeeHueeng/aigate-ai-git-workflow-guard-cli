import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildDemoScenario, buildDoctorReport, installPrePushHook } from "../core/first-run.mjs";
import { renderDemoScenario, renderDoctorReport, renderHookResult } from "../renderers/first-run.mjs";

export function commandDoctor(args, context) {
  const options = context.parseOptions(args);
  const language = context.resolveLanguage(options);
  if (!language) {
    return context.unsupportedLanguage(options.language);
  }

  const report = buildDoctorReport(context);
  if (report.status === "BLOCK") {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(report, null, 2);
  }

  return renderDoctorReport(report, language);
}

export function commandDemo(args, context) {
  const options = context.parseOptions(args);
  const language = context.resolveLanguage(options);
  if (!language) {
    return context.unsupportedLanguage(options.language);
  }

  const demo = buildDemoScenario();
  const output = options.format === "json"
    ? JSON.stringify(demo, null, 2)
    : renderDemoScenario(demo, language);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, `${output}\n`, "utf8");
    return context.t(language, "common.wrote", { path: options.output });
  }

  return output;
}

export function commandInstallHook(args, context) {
  const options = context.parseOptions(args);
  const language = context.resolveLanguage(options);
  if (!language) {
    return context.unsupportedLanguage(options.language);
  }

  const result = installPrePushHook(options, context);
  if (result.status === "BLOCK" || result.status === "ERROR" || result.status === "SKIPPED") {
    process.exitCode = 1;
  }

  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  return renderHookResult(result, language);
}

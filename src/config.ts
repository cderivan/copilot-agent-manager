import * as vscode from "vscode";
import type { BuildConfig, ScanConfig } from "./types";

const SECTION = "copilotAgentManager";

export function readScanConfig(): ScanConfig {
  const config = vscode.workspace.getConfiguration(SECTION);
  return {
    scope: config.get<ScanConfig["scope"]>("scope", "workspace"),
    maxSessions: config.get("maxSessions", 6),
    includeChatStore: config.get("includeChatStore", true),
  };
}

export function readBuildConfig(copilotHome: string): BuildConfig {
  const config = vscode.workspace.getConfiguration(SECTION);
  return {
    scope: config.get<BuildConfig["scope"]>("scope", "workspace"),
    accent: config.get<BuildConfig["accent"]>("accent", "clay"),
    layout: config.get<BuildConfig["layout"]>("defaultLayout", "tree"),
    activeThresholdSeconds: config.get("activeThresholdSeconds", 45),
    maxLogLines: config.get("maxLogLines", 200),
    copilotHome,
  };
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  await vscode.workspace
    .getConfiguration(SECTION)
    .update(key, value, vscode.ConfigurationTarget.Global);
}

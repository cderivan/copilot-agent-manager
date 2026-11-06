import * as vscode from "vscode";
import type { AppState } from "../types";

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return String(tokens);
}

export function updateStatusBar(item: vscode.StatusBarItem, state: AppState | undefined): void {
  if (!state || state.empty) {
    item.text = "$(sparkle) Copilot: idle";
    item.tooltip = "Copilot Agent Manager — no active sessions (click to open)";
    return;
  }
  const running = state.agents.filter((agent) => agent.status === "running").length;
  const tokens = state.agents.reduce((total, agent) => total + agent.tokens, 0);
  if (running > 0) {
    item.text = `$(sync~spin) Copilot: ${running} running \u00B7 ${formatTokens(tokens)} tok`;
    item.tooltip = `${running} agent(s) running \u00B7 ${formatTokens(
      tokens
    )} tokens \u2014 click to open Copilot Agent Manager`;
  } else {
    item.text = `$(sparkle) Copilot: idle \u00B7 ${formatTokens(tokens)} tok`;
    item.tooltip = "No agents running — click to open Copilot Agent Manager";
  }
}

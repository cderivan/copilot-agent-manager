import type { AccentName, AgentStatus } from "../types";

export const STATUS: Record<AgentStatus, { color: string; label: string }> = {
  running: { color: "#4daafc", label: "running" },
  done: { color: "#89d185", label: "done" },
  waiting: { color: "#cca700", label: "waiting" },
  paused: { color: "#b48ead", label: "paused" },
  error: { color: "#f48771", label: "error" },
  stopped: { color: "#7a7a7a", label: "stopped" },
};

const TOOL_COLORS: Record<string, string> = {
  view: "#4daafc",
  read: "#4daafc",
  edit: "#c586c0",
  create: "#dcdcaa",
  write: "#dcdcaa",
  apply_patch: "#c586c0",
  bash: "#ce9178",
  exec: "#ce9178",
  read_bash: "#ce9178",
  stop_bash: "#ce9178",
  grep: "#4ec9b0",
  glob: "#4ec9b0",
  rg: "#4ec9b0",
  task: "#d97757",
  agent: "#d97757",
  skill: "#d7ba7d",
  todowrite: "#d7ba7d",
  web_fetch: "#569cd6",
  sql: "#569cd6",
  ask_user: "#8a8a8a",
  report_intent: "#8a8a8a",
  say: "#8a8a8a",
  done: "#89d185",
  error: "#f48771",
  "·": "#6a6a6a",
};

export function accentColor(accent: AccentName): string {
  return accent === "blue" ? "#4daafc" : "#d97757";
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return String(tokens);
}

export function formatElapsed(elapsedMs: number): string {
  if (!elapsedMs || elapsedMs < 1000) {
    return "0s";
  }
  const seconds = Math.floor(elapsedMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}

export function toolColor(tag: string): string {
  return TOOL_COLORS[tag] || "#8a8a8a";
}

export function timeAgo(mtimeMs: number): string {
  if (!mtimeMs) {
    return "";
  }
  const seconds = Math.floor((Date.now() - mtimeMs) / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

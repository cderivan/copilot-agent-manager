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
  Read: "#4daafc",
  Edit: "#c586c0",
  MultiEdit: "#c586c0",
  Write: "#dcdcaa",
  NotebookEdit: "#dcdcaa",
  Bash: "#ce9178",
  Grep: "#4ec9b0",
  Glob: "#4ec9b0",
  Task: "#d97757",
  Skill: "#d7ba7d",
  TodoWrite: "#d7ba7d",
  WebFetch: "#569cd6",
  WebSearch: "#569cd6",
  Test: "#89d185",
  Info: "#8a8a8a",
  Done: "#89d185",
  Error: "#f48771",
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

import type { AccentName, AgentStatus } from "../types";

export const STATUS: Record<AgentStatus, { color: string; label: string }> = {
  running: { color: "var(--cam-running)", label: "running" },
  done: { color: "var(--cam-done)", label: "done" },
  waiting: { color: "var(--cam-waiting)", label: "waiting" },
  paused: { color: "var(--cam-paused)", label: "paused" },
  error: { color: "var(--cam-error)", label: "error" },
  stopped: { color: "var(--cam-stopped)", label: "stopped" },
};

const TOOL_COLORS: Record<string, string> = {
  view: "var(--cam-tool-blue)",
  read: "var(--cam-tool-blue)",
  edit: "var(--cam-tool-purple)",
  create: "var(--cam-tool-yellow)",
  write: "var(--cam-tool-yellow)",
  apply_patch: "var(--cam-tool-purple)",
  bash: "var(--cam-tool-orange)",
  exec: "var(--cam-tool-orange)",
  read_bash: "var(--cam-tool-orange)",
  stop_bash: "var(--cam-tool-orange)",
  grep: "var(--cam-tool-teal)",
  glob: "var(--cam-tool-teal)",
  rg: "var(--cam-tool-teal)",
  task: "var(--cam-tool-clay)",
  agent: "var(--cam-tool-clay)",
  skill: "var(--cam-tool-gold)",
  todowrite: "var(--cam-tool-gold)",
  web_fetch: "var(--cam-tool-steel)",
  sql: "var(--cam-tool-steel)",
  ask_user: "var(--cam-tool-gray)",
  report_intent: "var(--cam-tool-gray)",
  say: "var(--cam-tool-gray)",
  done: "var(--cam-done)",
  error: "var(--cam-error)",
  "·": "var(--cam-text-dim)",
};

export function accentColor(accent: AccentName): string {
  return accent === "blue" ? "var(--cam-accent-blue)" : "var(--cam-accent-clay)";
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
  return TOOL_COLORS[tag] || "var(--cam-tool-gray)";
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

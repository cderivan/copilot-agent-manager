import type {
  Agent,
  AgentStatus,
  BuildConfig,
  CopilotEvent,
  FileChange,
  LogLine,
} from "../types";

export interface AgentSeed {
  id: string;
  sessionId: string;
  name: string;
  agentType: string;
  task: string;
  depth: number;
  parentId: string | null;
  transcriptPath: string;
  eventAgentId: string;
  cwd: string;
  events: CopilotEvent[];
  mtimeMs: number;
  cfg: BuildConfig;
  nowMs: number;
}

export function dataOf(event: CopilotEvent): Record<string, any> {
  return event.data && typeof event.data === "object" ? event.data : {};
}

/** Subagent id that produced the event; "" for the main agent. */
export function eventAgentId(event: CopilotEvent): string {
  return typeof event.agentId === "string" ? event.agentId : "";
}

export function textOfEvent(event: CopilotEvent): string {
  const content = dataOf(event).content;
  return typeof content === "string" ? content.trim() : "";
}

export function parseTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatClock(timestamp: string | undefined): string {
  const parsed = parseTimestamp(timestamp);
  if (!parsed) {
    return "";
  }
  const date = new Date(parsed);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function countLines(value: unknown): number {
  if (typeof value !== "string" || value.length === 0) {
    return 0;
  }
  return value.split("\n").length;
}

/** Short model label: `customendpoint/freellmapi/auto` → `freellmapi/auto`. */
export function modelLabel(model: string | undefined): string {
  if (!model) {
    return "";
  }
  const trimmed = model.replace(/^customendpoint\//, "").replace(/^copilot\//, "");
  return trimmed.length > 28 ? `${trimmed.slice(0, 27)}…` : trimmed;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  callId: string;
}

export function toolCalls(events: CopilotEvent[]): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const event of events) {
    if (event.type !== "tool.execution_start") {
      continue;
    }
    const data = dataOf(event);
    const args = data.arguments;
    calls.push({
      name: String(data.toolName || "tool"),
      args: args && typeof args === "object" ? (args as Record<string, any>) : {},
      callId: String(data.toolCallId || ""),
    });
  }
  return calls;
}

const ARG_PRIORITY = [
  "path",
  "file_path",
  "notebook_path",
  "command",
  "pattern",
  "query",
  "url",
  "skill",
  "intent",
  "description",
  "prompt",
  "agent_type",
  "summary",
];

/** Short, human-readable argument for a tool call. */
export function describeToolCall(args: Record<string, any>): string {
  let raw = "";
  for (const key of ARG_PRIORITY) {
    const value = args[key];
    if (typeof value === "string" && value.trim()) {
      raw = value;
      break;
    }
  }
  if (!raw && Array.isArray(args.todos)) {
    raw = `${args.todos.length} todos`;
  }
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length > 120) {
    return `${text.slice(0, 117)}…`;
  }
  return text;
}

export function resultText(event: CopilotEvent): string {
  const result = dataOf(event).result;
  if (!result || typeof result !== "object") {
    return "";
  }
  const content = (result as Record<string, unknown>).content;
  return typeof content === "string" ? content : "";
}

export function totalTokens(events: CopilotEvent[]): number {
  let total = 0;
  for (const event of events) {
    if (event.type !== "session.usage_record") {
      continue;
    }
    const usage = dataOf(event).usage;
    if (!usage) {
      continue;
    }
    total += (usage.inputTokens || 0) + (usage.outputTokens || 0);
    total += usage.cacheWriteTokens || 0;
  }
  return total;
}

/** Aggregate per-file added/removed line counts from edit-style tool calls. */
export function collectFileChanges(events: CopilotEvent[]): FileChange[] {
  const files = new Map<string, FileChange>();
  const add = (filePath: unknown, added: number, removed: number) => {
    if (typeof filePath !== "string" || !filePath) {
      return;
    }
    const entry = files.get(filePath) || { path: filePath, add: 0, del: 0 };
    entry.add += added;
    entry.del += removed;
    files.set(filePath, entry);
  };

  for (const call of toolCalls(events)) {
    if (call.name === "edit") {
      add(call.args.path, countLines(call.args.new_str), countLines(call.args.old_str));
    } else if (call.name === "create" || call.name === "write") {
      add(call.args.path, countLines(call.args.file_text), 0);
    }
  }
  return [...files.values()];
}

/** Completion percentage from the latest todo tool call, or null when absent. */
export function todoProgress(events: CopilotEvent[]): number | null {
  let todos: Array<Record<string, any>> | null = null;
  for (const call of toolCalls(events)) {
    if (Array.isArray(call.args.todos)) {
      todos = call.args.todos as Array<Record<string, any>>;
    }
  }
  if (!todos || todos.length === 0) {
    return null;
  }
  const completed = todos.filter((todo) =>
    ["completed", "done"].includes(String(todo.status || ""))
  ).length;
  return Math.round((completed / todos.length) * 100);
}

export function buildLogTail(events: CopilotEvent[], maxLogLines: number): LogLine[] {
  const lines: LogLine[] = [];
  for (const event of events) {
    const time = formatClock(event.timestamp);
    const data = dataOf(event);
    if (event.type === "tool.execution_start") {
      const args =
        data.arguments && typeof data.arguments === "object"
          ? (data.arguments as Record<string, any>)
          : {};
      lines.push({
        time,
        tag: String(data.toolName || "tool"),
        text: describeToolCall(args),
        kind: "tool",
      });
    } else if (event.type === "tool.execution_complete") {
      if (data.success === false) {
        const error = data.error && typeof data.error === "object" ? data.error : {};
        const message = String(error.message || "error").replace(/\s+/g, " ").slice(0, 100);
        lines.push({ time, tag: "error", text: message, kind: "error" });
      } else {
        const text = resultText(event).replace(/\s+/g, " ").slice(0, 100);
        if (text) {
          lines.push({ time, tag: "·", text, kind: "result" });
        }
      }
    } else if (event.type === "assistant.message") {
      const text = textOfEvent(event).replace(/\s+/g, " ").trim();
      if (text) {
        lines.push({ time, tag: "say", text: text.slice(0, 140), kind: "text" });
      }
    } else if (event.type === "subagent.started") {
      lines.push({
        time,
        tag: "agent",
        text: String(data.agentDisplayName || data.agentName || "subagent").slice(0, 100),
        kind: "tool",
      });
    } else if (event.type === "session.error") {
      lines.push({
        time,
        tag: "error",
        text: String(data.message || "session error").replace(/\s+/g, " ").slice(0, 100),
        kind: "error",
      });
    } else if (event.type === "session.task_complete") {
      lines.push({
        time,
        tag: "done",
        text: String(data.summary || "task complete").replace(/\s+/g, " ").slice(0, 100),
        kind: "text",
      });
    }
  }
  return lines.slice(-maxLogLines);
}

/** The tool call currently in flight, if any. */
export function currentTool(events: CopilotEvent[]): { tag: string; arg: string } {
  const finished = new Set<string>();
  for (const event of events) {
    if (event.type === "tool.execution_complete") {
      finished.add(String(dataOf(event).toolCallId || ""));
    }
  }
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    if (event.type !== "tool.execution_start") {
      continue;
    }
    const data = dataOf(event);
    if (finished.has(String(data.toolCallId || ""))) {
      continue;
    }
    const args =
      data.arguments && typeof data.arguments === "object"
        ? (data.arguments as Record<string, any>)
        : {};
    return { tag: String(data.toolName || ""), arg: describeToolCall(args) };
  }
  return { tag: "", arg: "" };
}

export function deriveStatus(
  events: CopilotEvent[],
  lastActivityMs: number,
  thresholdMs: number,
  nowMs: number
): AgentStatus {
  if (events.length === 0) {
    return "waiting";
  }
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    const type = event.type;
    if (type === "session.error") {
      return "error";
    }
    if (type === "session.shutdown" || type === "abort") {
      return "done";
    }
    if (type === "session.task_complete") {
      return dataOf(event).success === false ? "error" : "done";
    }
    if (type === "subagent.completed") {
      return "done";
    }
    if (type === "tool.execution_complete" && dataOf(event).error) {
      return "error";
    }
    if (
      type === "assistant.message" ||
      type === "assistant.turn_start" ||
      type === "tool.execution_start" ||
      type === "user.message"
    ) {
      break;
    }
  }
  if (nowMs - lastActivityMs < thresholdMs) {
    return "running";
  }
  return "done";
}

/** First real user prompt in the session (raw text, before context injection). */
export function findSessionTask(events: CopilotEvent[], fallback: string): string {
  for (const event of events) {
    if (event.type !== "user.message") {
      continue;
    }
    const text = textOfEvent(event).replace(/\s+/g, " ");
    if (text) {
      return text.slice(0, 160);
    }
  }
  return fallback;
}

export function latestModel(events: CopilotEvent[], fallback: string): string {
  for (let index = events.length - 1; index >= 0; index--) {
    const data = dataOf(events[index]);
    if (typeof data.model === "string" && data.model) {
      return modelLabel(data.model);
    }
    if (typeof data.newModel === "string" && data.newModel) {
      return modelLabel(data.newModel);
    }
    const usage = data.usage;
    if (usage && typeof usage.model === "string" && usage.model) {
      return modelLabel(usage.model);
    }
    if (typeof data.selectedModel === "string" && data.selectedModel) {
      return modelLabel(data.selectedModel);
    }
  }
  return modelLabel(fallback);
}

export function buildAgent(seed: AgentSeed): Agent {
  const { events, cfg, nowMs, mtimeMs } = seed;
  const thresholdMs = cfg.activeThresholdSeconds * 1000;
  const startedAt = events.length ? events[0].timestamp ?? null : null;
  const updatedAt = events.length ? events[events.length - 1].timestamp ?? null : null;
  const lastActivityMs = parseTimestamp(updatedAt) || mtimeMs;
  const status = deriveStatus(events, lastActivityMs, thresholdMs, nowMs);
  const current = status === "running" ? currentTool(events) : { tag: "", arg: "" };
  const startedMs = parseTimestamp(startedAt);
  const endMs = status === "running" ? nowMs : lastActivityMs || nowMs;

  return {
    id: seed.id,
    sessionId: seed.sessionId,
    eventAgentId: seed.eventAgentId,
    source: "events",
    resumable: true,
    name: seed.name,
    agentType: seed.agentType,
    task: seed.task,
    status,
    model: latestModel(events, ""),
    depth: seed.depth,
    parentId: seed.parentId,
    currentToolTag: current.tag,
    currentToolArg: current.arg,
    progress: todoProgress(events),
    toolCount: events.filter((event) => event.type === "tool.execution_start").length,
    tokens: totalTokens(events),
    elapsedMs: startedMs ? Math.max(0, endMs - startedMs) : 0,
    startedAt,
    updatedAt,
    logTail: buildLogTail(events, cfg.maxLogLines),
    files: collectFileChanges(events),
    transcriptPath: seed.transcriptPath,
    cwd: seed.cwd,
  };
}

import type {
  Agent,
  AgentStatus,
  BuildConfig,
  ContentBlock,
  FileChange,
  LogLine,
  TranscriptRecord,
} from "../types";
import { readText } from "./fsText";

export interface AgentSeed {
  id: string;
  sessionId: string;
  name: string;
  agentType: string;
  task: string;
  depth: number;
  parentId: string | null;
  transcriptPath: string;
  records: TranscriptRecord[];
  mtimeMs: number;
  cfg: BuildConfig;
  nowMs: number;
}

export function contentBlocks(record: TranscriptRecord): ContentBlock[] {
  const content = record.message?.content;
  if (Array.isArray(content)) {
    return content as ContentBlock[];
  }
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }
  return [];
}

export function toolUseBlocks(record: TranscriptRecord): ContentBlock[] {
  return contentBlocks(record).filter((block) => block.type === "tool_use");
}

export function toolResultBlocks(record: TranscriptRecord): ContentBlock[] {
  return contentBlocks(record).filter((block) => block.type === "tool_result");
}

export function textOf(record: TranscriptRecord): string {
  return contentBlocks(record)
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export function totalTokens(records: TranscriptRecord[]): number {
  let total = 0;
  for (const record of records) {
    const usage = record.message?.usage;
    if (usage) {
      total += (usage.input_tokens || 0) + (usage.output_tokens || 0);
      total += usage.cache_creation_input_tokens || 0;
    }
  }
  return total;
}

/** Short, human-readable argument for a tool call. */
export function describeToolCall(block: ContentBlock): string {
  const input = block.input || {};
  const raw =
    input.file_path ||
    input.path ||
    input.command ||
    input.pattern ||
    input.query ||
    input.url ||
    input.description ||
    input.prompt ||
    input.notebook_path ||
    "";
  const text = String(raw).replace(/\s+/g, " ").trim();
  if (text.length > 120) {
    return `${text.slice(0, 117)}…`;
  }
  return text;
}

export function toolResultText(block: ContentBlock): string {
  const content = block.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        return (item as ContentBlock)?.text || "";
      })
      .join(" ")
      .trim();
  }
  return "";
}

export function parseTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
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

export function modelLabel(model: string | undefined): string {
  if (model) {
    return model.replace(/^claude-/, "").replace(/-\d{6,8}$/, "").replace(/\[1m\]$/, "");
  }
  return "";
}

export function readAgentMeta(metaPath: string): { agentType: string; description: string } {
  try {
    const raw = JSON.parse(readText(metaPath, 64 * 1024)) as Record<string, unknown>;
    return {
      agentType: String(raw.agentType || raw.subagent_type || "subagent"),
      description: String(raw.description || ""),
    };
  } catch {
    return { agentType: "subagent", description: "" };
  }
}

/** Aggregate per-file added/removed line counts from edit-style tool calls. */
export function collectFileChanges(records: TranscriptRecord[]): FileChange[] {
  const files = new Map<string, FileChange>();
  const add = (path: string | undefined, added: number, removed: number) => {
    if (!path) {
      return;
    }
    const entry = files.get(path) || { path, add: 0, del: 0 };
    entry.add += added;
    entry.del += removed;
    files.set(path, entry);
  };
  for (const record of records) {
    for (const block of toolUseBlocks(record)) {
      const input = block.input || {};
      if (block.name === "Edit") {
        add(input.file_path, countLines(input.new_string), countLines(input.old_string));
      } else if (block.name === "MultiEdit" && Array.isArray(input.edits)) {
        for (const edit of input.edits as Array<Record<string, unknown>>) {
          add(input.file_path, countLines(edit.new_string), countLines(edit.old_string));
        }
      } else if (block.name === "Write") {
        add(input.file_path, countLines(input.content), 0);
      } else if (block.name === "NotebookEdit") {
        add(input.notebook_path || input.file_path, countLines(input.new_source || input.new_string), 0);
      }
    }
  }
  return [...files.values()];
}

/** Completion percentage from the latest TodoWrite call, or null when absent. */
export function todoProgress(records: TranscriptRecord[]): number | null {
  let todos: Array<Record<string, unknown>> | null = null;
  for (const record of records) {
    for (const block of toolUseBlocks(record)) {
      const input = block.input || {};
      if (block.name === "TodoWrite" && Array.isArray(input.todos)) {
        todos = input.todos as Array<Record<string, unknown>>;
      }
    }
  }
  if (!todos || todos.length === 0) {
    return null;
  }
  const completed = todos.filter((todo) => (todo.status || todo.state) === "completed").length;
  return Math.round((completed / todos.length) * 100);
}

export function buildLogTail(records: TranscriptRecord[], maxLogLines: number): LogLine[] {
  const lines: LogLine[] = [];
  for (const record of records) {
    const time = formatClock(record.timestamp);
    for (const block of contentBlocks(record)) {
      if (block.type === "tool_use") {
        lines.push({
          time,
          tag: block.name || "Tool",
          text: describeToolCall(block),
          kind: "tool",
        });
      } else if (block.type === "tool_result") {
        const text = toolResultText(block).replace(/\s+/g, " ").slice(0, 100);
        if (block.is_error) {
          lines.push({ time, tag: "Error", text: text || "error", kind: "error" });
        } else if (text) {
          lines.push({ time, tag: "·", text, kind: "result" });
        }
      } else if (block.type === "text" && typeof block.text === "string") {
        const text = block.text.replace(/\s+/g, " ").trim();
        if (text) {
          lines.push({ time, tag: "say", text: text.slice(0, 140), kind: "text" });
        }
      }
    }
  }
  return lines.slice(-maxLogLines);
}

export function lastToolUse(records: TranscriptRecord[]): { tag: string; arg: string } {
  for (let index = records.length - 1; index >= 0; index--) {
    const blocks = toolUseBlocks(records[index]);
    if (blocks.length) {
      const block = blocks[blocks.length - 1];
      return { tag: block.name || "", arg: describeToolCall(block) };
    }
  }
  return { tag: "", arg: "" };
}

export function deriveStatus(
  records: TranscriptRecord[],
  mtimeMs: number,
  thresholdMs: number,
  nowMs: number
): AgentStatus {
  if (records.length === 0) {
    return "waiting";
  }
  const active = nowMs - mtimeMs < thresholdMs;
  let hasError = false;
  for (const record of records) {
    for (const block of toolResultBlocks(record)) {
      hasError = !!block.is_error;
    }
  }
  if (active && hasError) {
    return "error";
  }
  if (active) {
    return "running";
  }
  return "done";
}

/** First real user prompt in a session transcript. */
export function findSessionTask(records: TranscriptRecord[]): string {
  for (const record of records) {
    if (record.type === "user" && record.message?.role === "user") {
      const isToolResult = toolResultBlocks(record).length > 0;
      const text = textOf(record);
      if (text && !isToolResult) {
        return text.replace(/\s+/g, " ").slice(0, 160);
      }
    }
  }
  return "";
}

export function latestModel(records: TranscriptRecord[]): string {
  for (let index = records.length - 1; index >= 0; index--) {
    const model = records[index].message?.model;
    if (model) {
      return modelLabel(model);
    }
  }
  return "";
}

export function buildAgent(seed: AgentSeed): Agent {
  const { records, cfg, nowMs, mtimeMs } = seed;
  const thresholdMs = cfg.activeThresholdSeconds * 1000;
  const status = deriveStatus(records, mtimeMs, thresholdMs, nowMs);
  const current = status === "running" ? lastToolUse(records) : { tag: "", arg: "" };
  const toolCount = records.reduce((count, record) => count + toolUseBlocks(record).length, 0);
  const startedAt = records.length ? records[0].timestamp ?? null : null;
  const updatedAt = records.length ? records[records.length - 1].timestamp ?? null : null;
  const startedMs = parseTimestamp(startedAt);
  const endMs = status === "running" ? nowMs : parseTimestamp(updatedAt) || nowMs;
  const cwd = records.find((record) => record.cwd)?.cwd || "";

  return {
    id: seed.id,
    sessionId: seed.sessionId,
    name: seed.name,
    agentType: seed.agentType,
    task: seed.task,
    status,
    model: latestModel(records),
    depth: seed.depth,
    parentId: seed.parentId,
    currentToolTag: current.tag,
    currentToolArg: current.arg,
    progress: todoProgress(records),
    toolCount,
    tokens: totalTokens(records),
    elapsedMs: startedMs ? Math.max(0, endMs - startedMs) : 0,
    startedAt,
    updatedAt,
    logTail: buildLogTail(records, cfg.maxLogLines),
    files: collectFileChanges(records),
    transcriptPath: seed.transcriptPath,
    cwd,
  };
}

import * as fs from "fs";
import type { SqliteRow, SqliteValue } from "./sqlite";
import { readTables } from "./sqlite";
import { readVscodeChatFile } from "./vscodeChats";

export interface ChatTurn {
  turnIndex: number;
  userMessage: string;
  assistantResponse: string;
  timestamp: string;
}

export interface ChatFileRef {
  path: string;
  /** Tool that touched the file, e.g. `read_file` or `edit`. */
  toolName: string;
  turnIndex: number;
}

export interface ChatToolCall {
  name: string;
  arg: string;
  turnIndex: number;
}

export interface ChatSessionRecord {
  id: string;
  /** File backing this session: the Copilot DB or one native `.jsonl` file. */
  path?: string;
  cwd: string;
  repository: string;
  gitBranch: string;
  summary: string;
  agentName: string;
  /** Model of the most recent request, when the source records it. */
  model?: string;
  /** Tool invocations in call order, when the source records them. */
  tools?: ChatToolCall[];
  createdAt: string;
  updatedAt: string;
  turns: ChatTurn[];
  files: ChatFileRef[];
}

interface Cache {
  key: string;
  sessions: ChatSessionRecord[];
}

let cache: Cache | null = null;

function statKey(filePath: string): string {
  try {
    const stat = fs.statSync(filePath);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return "0";
  }
}

function text(value: SqliteValue | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function toNumber(value: SqliteValue | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Read VS Code Copilot Chat's own session store: one row per session in
 * `sessions`, one row per exchange in `turns`.
 *
 * Cached across polls; the cache key includes the `-wal` file because recent
 * turns often live only there.
 */
export function readChatStore(dbPath: string): ChatSessionRecord[] {
  const key = `${statKey(dbPath)}|${statKey(`${dbPath}-wal`)}`;
  if (cache && cache.key === key) {
    return cache.sessions;
  }
  if (!fs.existsSync(dbPath)) {
    return [];
  }

  let tables: Map<string, SqliteRow[]>;
  try {
    tables = readTables(dbPath, ["sessions", "turns", "session_files"]);
  } catch {
    return [];
  }

  const sessions = new Map<string, ChatSessionRecord>();
  for (const row of tables.get("sessions") ?? []) {
    const id = text(row.id);
    if (!id) {
      continue;
    }
    sessions.set(id, {
      id,
      path: dbPath,
      cwd: text(row.cwd),
      repository: text(row.repository),
      gitBranch: text(row.branch),
      summary: text(row.summary),
      agentName: text(row.agent_name),
      createdAt: text(row.created_at),
      updatedAt: text(row.updated_at),
      turns: [],
      files: [],
    });
  }

  for (const row of tables.get("session_files") ?? []) {
    const session = sessions.get(text(row.session_id));
    const filePath = text(row.file_path);
    if (!session || !filePath) {
      continue;
    }
    session.files.push({
      path: filePath,
      toolName: text(row.tool_name),
      turnIndex: toNumber(row.turn_index),
    });
  }

  for (const row of tables.get("turns") ?? []) {
    const session = sessions.get(text(row.session_id));
    if (!session) {
      continue;
    }
    session.turns.push({
      turnIndex: toNumber(row.turn_index),
      userMessage: text(row.user_message),
      assistantResponse: text(row.assistant_response),
      timestamp: text(row.timestamp),
    });
  }

  // Copilot records a turn for some sessions without any text (aborted or
  // tool-only runs); those would just be empty rows in the agent list.
  const list = [...sessions.values()].filter((session) =>
    session.turns.some(
      (turn) => turn.userMessage.trim() !== "" || turn.assistantResponse.trim() !== ""
    )
  );
  for (const session of list) {
    session.turns.sort(
      (a, b) => a.turnIndex - b.turnIndex || a.timestamp.localeCompare(b.timestamp)
    );
    session.files.sort((a, b) => a.turnIndex - b.turnIndex || a.path.localeCompare(b.path));
  }

  cache = { key, sessions: list };
  return list;
}

/** A chat session from either backing store, keyed by its transcript path. */
function findChatSession(filePath: string, sessionId: string): ChatSessionRecord | undefined {
  if (filePath.endsWith(".jsonl")) {
    const record = readVscodeChatFile(filePath);
    return record && (!sessionId || record.id === sessionId) ? record : undefined;
  }
  return readChatStore(filePath).find((candidate) => candidate.id === sessionId);
}

/** Conversation feed for one chat session. */
export function chatStoreMessages(
  dbPath: string,
  sessionId: string
): Array<{ role: "user" | "assistant"; avatar: string; text: string; mono: boolean }> {
  const session = findChatSession(dbPath, sessionId);
  if (!session) {
    return [];
  }
  const messages: Array<{
    role: "user" | "assistant";
    avatar: string;
    text: string;
    mono: boolean;
  }> = [];
  for (const turn of session.turns) {
    if (turn.userMessage) {
      messages.push({ role: "user", avatar: "U", text: turn.userMessage, mono: false });
    }
    if (turn.assistantResponse) {
      messages.push({ role: "assistant", avatar: "✦", text: turn.assistantResponse, mono: false });
    }
  }
  return messages.slice(-80);
}

/** Markdown rendering for one chat session, opened via a virtual document. */
export function chatStoreMarkdown(dbPath: string, sessionId: string, title: string): string {
  const session = findChatSession(dbPath, sessionId);
  if (!session) {
    return `# ${title}\n\n_No conversation text found in the chat store._`;
  }
  const lines = [`# ${title}`, "", "_Formatted view of the agent's conversation._", ""];
  for (const turn of session.turns) {
    if (turn.userMessage) {
      lines.push(`### \u{1F9D1} You \u00B7 ${turn.timestamp}`, "", turn.userMessage, "");
    }
    if (turn.assistantResponse) {
      lines.push(`### \u2733 Copilot \u00B7 ${turn.timestamp}`, "", turn.assistantResponse, "");
    }
  }
  return lines.join("\n");
}

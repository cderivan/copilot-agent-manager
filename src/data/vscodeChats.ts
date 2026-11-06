import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { ChatFileRef, ChatSessionRecord, ChatToolCall, ChatTurn } from "./chatStore";

/**
 * VS Code persists editor chat sessions itself, one incremental JSONL file per
 * session under `<user-data-dir>/User/workspaceStorage/<hash>/chatSessions/`
 * (or `globalStorage/emptyWindowChatSessions` for windows without a folder).
 *
 * Each file starts with a `snapshot` line (`kind: 0`) and then records `set`
 * (`kind: 1`) and `append` (`kind: 2`) operations against paths inside that
 * snapshot. Replaying them yields the latest full session, including requests,
 * response parts and tool invocations. No native dependency is involved.
 */

export interface VscodeChatFile {
  path: string;
  /** Workspace folder the session belongs to, from `workspace.json`. */
  cwd: string;
  mtimeMs: number;
}

interface Cached {
  key: string;
  record: ChatSessionRecord | null;
}

const cache = new Map<string, Cached>();
const MAX_CACHE = 3000;

function fileStatKey(filePath: string): string {
  try {
    const stat = fs.statSync(filePath);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return "";
  }
}

function mtimeOf(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function readdirSafe(dir: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function jsonlFiles(dir: string): string[] {
  return readdirSafe(dir)
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
    .map((entry) => path.join(dir, entry.name));
}

function workspaceFolder(workspaceJson: string): string {
  try {
    const data = JSON.parse(fs.readFileSync(workspaceJson, "utf8"));
    const value = data?.folder || data?.workspace;
    if (typeof value !== "string" || !value) {
      return "";
    }
    return value.startsWith("file:") ? fileURLToPath(value) : value;
  } catch {
    return "";
  }
}

/** Every native chat-session file for the running VS Code install. */
export function discoverVscodeChatFiles(userDir: string): VscodeChatFile[] {
  if (!userDir) {
    return [];
  }
  const files: VscodeChatFile[] = [];
  const storage = path.join(userDir, "workspaceStorage");
  for (const entry of readdirSafe(storage)) {
    if (!entry.isDirectory()) {
      continue;
    }
    const root = path.join(storage, entry.name);
    const cwd = workspaceFolder(path.join(root, "workspace.json"));
    for (const filePath of jsonlFiles(path.join(root, "chatSessions"))) {
      files.push({ path: filePath, cwd, mtimeMs: mtimeOf(filePath) });
    }
  }
  for (const filePath of jsonlFiles(
    path.join(userDir, "globalStorage", "emptyWindowChatSessions")
  )) {
    files.push({ path: filePath, cwd: "", mtimeMs: mtimeOf(filePath) });
  }
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

function applyOperation(root: Record<string, any>, operation: any): void {
  const kind = operation?.kind;
  const keyPath = operation?.k;
  if ((kind !== 1 && kind !== 2) || !Array.isArray(keyPath) || keyPath.length === 0) {
    return;
  }

  let target: any = root;
  for (let index = 0; index < keyPath.length - 1; index++) {
    target = target?.[keyPath[index]];
    if (target === null || target === undefined) {
      return;
    }
  }

  const last = keyPath[keyPath.length - 1];
  if (kind === 1) {
    target[last] = operation.v;
    return;
  }
  const added = Array.isArray(operation.v) ? operation.v : [operation.v];
  if (Array.isArray(target[last])) {
    target[last].push(...added);
  } else {
    target[last] = added;
  }
}

function replaySession(raw: string): Record<string, any> | null {
  let snapshot: Record<string, any> | null = null;
  for (const line of raw.split(/\r?\n/)) {
    if (!line) {
      continue;
    }
    let parsed: any;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (!snapshot) {
      if (parsed?.kind === 0 && parsed.v && typeof parsed.v === "object") {
        snapshot = parsed.v;
      }
      continue;
    }
    applyOperation(snapshot, parsed);
  }
  return snapshot;
}

function isoTime(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? "" : new Date(parsed).toISOString();
  }
  return "";
}

function asText(value: any): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && typeof value.value === "string") {
    return value.value;
  }
  return "";
}

function messageText(message: any): string {
  if (!message || typeof message !== "object") {
    return "";
  }
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
  }
  return "";
}

/** Assistant markdown from a response part list; reasoning/tool parts are skipped. */
function responseText(response: any): string {
  if (typeof response === "string") {
    return response;
  }
  if (!Array.isArray(response)) {
    return "";
  }
  const pieces: string[] = [];
  for (const part of response) {
    if (!part || typeof part !== "object") {
      continue;
    }
    if (part.kind === "thinking") {
      continue;
    }
    if (part.kind === undefined || part.kind === null || part.kind === "markdownContent" || part.kind === "text") {
      const text = asText(part.value);
      if (text) {
        pieces.push(text);
      }
    }
  }
  return pieces.join("").trim();
}

function fileUriToPath(value: any): string {
  if (!value || typeof value !== "object") {
    return "";
  }
  if (typeof value.fsPath === "string" && value.fsPath) {
    return value.fsPath;
  }
  if (value.scheme === "file" && typeof value.path === "string") {
    const authority = typeof value.authority === "string" ? value.authority : "";
    try {
      return fileURLToPath(`file://${authority ? `//${authority}` : ""}${value.path}`);
    } catch {
      return value.path;
    }
  }
  return "";
}

function cleanToolMessage(value: any): string {
  return asText(value)
    .replace(/\[([^\]]*)\]\(file:\/\/[^)]*\)/g, "$1")
    .replace(/file:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Turn a Copilot tool id (`copilot_readFile`) into a short display tag. */
function displayToolName(raw: string): string {
  const normalized = raw
    .replace(/^copilot[_.]/i, "")
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_+/, "");
  const aliases: Record<string, string> = {
    read_file: "read",
    list_directory: "view",
    replace_string: "edit",
    create_file: "create",
    run_in_terminal: "bash",
    find_files: "glob",
    file_search: "grep",
    get_errors: "error",
  };
  return aliases[normalized] || normalized.slice(0, 24) || "tool";
}

function toolArgument(part: any): string {
  for (const message of [part.invocationMessage, part.pastTenseMessage]) {
    const uris = message && typeof message === "object" ? message.uris : undefined;
    if (uris && typeof uris === "object") {
      for (const key of Object.keys(uris)) {
        if (key.startsWith("file://")) {
          try {
            return fileURLToPath(key);
          } catch {
            return key;
          }
        }
      }
    }
  }
  return cleanToolMessage(part.invocationMessage || part.pastTenseMessage).slice(0, 120);
}

function collectFileUris(
  value: any,
  visit: (filePath: string) => void,
  depth = 0,
  seen = new Set<object>()
): void {
  if (!value || typeof value !== "object" || depth > 6) {
    return;
  }
  if (seen.has(value)) {
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      collectFileUris(item, visit, depth + 1, seen);
    }
    return;
  }
  const direct = fileUriToPath(value);
  if (direct) {
    visit(direct);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (key.startsWith("file://")) {
      try {
        visit(fileURLToPath(key));
      } catch {
        // Not a usable file URL; skip it.
      }
    }
    if (typeof item === "string" && item.startsWith("file://")) {
      try {
        visit(fileURLToPath(item));
      } catch {
        // Not a usable file URL; skip it.
      }
    } else if (item && typeof item === "object") {
      collectFileUris(item, visit, depth + 1, seen);
    }
  }
}

function toRecord(
  filePath: string,
  cwd: string,
  fallbackMtimeMs: number,
  snapshot: Record<string, any>
): ChatSessionRecord | null {
  const requests = Array.isArray(snapshot.requests)
    ? snapshot.requests.filter((request: unknown) => !!request && typeof request === "object")
    : [];
  const turns: ChatTurn[] = [];
  const files = new Map<string, ChatFileRef>();
  const tools: ChatToolCall[] = [];

  let firstUser = "";
  let agentName = "";
  let model = "";
  let lastMillis = 0;
  let firstMillis = 0;

  const noteTime = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      lastMillis = Math.max(lastMillis, value);
      if (!firstMillis || value < firstMillis) {
        firstMillis = value;
      }
    }
  };

  requests.forEach((request: any, index: number) => {
    const userMessage = messageText(request.message);
    const assistantResponse = responseText(request.response);
    const timestamp = isoTime(request.responseTimestamp || request.timestamp);
    noteTime(request.timestamp);
    noteTime(request.responseTimestamp);

    if (!firstUser && userMessage.trim()) {
      firstUser = userMessage;
    }
    const agent = request.agent && typeof request.agent === "object" ? request.agent : {};
    if (!agentName) {
      agentName = String(agent.fullName || agent.name || "");
    }
    if (typeof request.modelId === "string" && request.modelId.trim()) {
      model = request.modelId;
    }

    const toolsBefore = tools.length;
    if (userMessage.trim() || assistantResponse.trim() || tools.length > toolsBefore) {
      turns.push({
        turnIndex: index,
        userMessage,
        assistantResponse,
        timestamp,
      });
    }

    const addFile = (filePathValue: string, toolName: string) => {
      if (!filePathValue || files.has(filePathValue)) {
        return;
      }
      files.set(filePathValue, { path: filePathValue, toolName, turnIndex: index });
    };
    collectFileUris(request.contentReferences, (value) => addFile(value, ""));
    collectFileUris(request.variableData, (value) => addFile(value, ""));
    if (Array.isArray(request.response)) {
      for (const part of request.response) {
        if (!part || typeof part !== "object") {
          continue;
        }
        if (part.kind === "toolInvocationSerialized") {
          const toolName = String(part.toolId || part.toolName || "tool");
          tools.push({
            name: displayToolName(toolName),
            arg: toolArgument(part),
            turnIndex: index,
          });
          collectFileUris(part, (value) => addFile(value, toolName));
        } else if (part.kind === "textEditGroup" || part.uri) {
          collectFileUris(part, (value) => addFile(value, "edit"));
        }
      }
    }
  });

  if (turns.length === 0 && files.size === 0 && tools.length === 0) {
    return null;
  }

  const id =
    typeof snapshot.sessionId === "string" && snapshot.sessionId
      ? snapshot.sessionId
      : path.basename(filePath, ".jsonl");
  const createdAt =
    isoTime(snapshot.creationDate) || (firstMillis ? isoTime(firstMillis) : "") || isoTime(fallbackMtimeMs);
  const updatedAt = (lastMillis ? isoTime(lastMillis) : "") || isoTime(fallbackMtimeMs) || createdAt;
  const summary = (
    typeof snapshot.customTitle === "string" && snapshot.customTitle.trim()
      ? snapshot.customTitle
      : firstUser
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return {
    id,
    path: filePath,
    cwd,
    repository: "",
    gitBranch: "",
    summary: summary || "(session)",
    agentName:
      agentName || (typeof snapshot.responderUsername === "string" ? snapshot.responderUsername : ""),
    model: model || undefined,
    tools,
    createdAt,
    updatedAt,
    turns,
    files: [...files.values()].sort((a, b) => a.turnIndex - b.turnIndex),
  };
}

/** Replay one session file. Cached by stat key, so polls only reparse changes. */
export function readVscodeChatFile(
  filePath: string,
  cwd = "",
  fallbackMtimeMs = 0
): ChatSessionRecord | null {
  const key = fileStatKey(filePath);
  if (!key) {
    return null;
  }
  const cacheKey = `${filePath}|${key}|${cwd}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached.record;
  }

  let record: ChatSessionRecord | null = null;
  try {
    const snapshot = replaySession(fs.readFileSync(filePath, "utf8"));
    record = snapshot
      ? toRecord(filePath, cwd, fallbackMtimeMs || mtimeOf(filePath), snapshot)
      : null;
  } catch {
    record = null;
  }

  cache.set(cacheKey, { key: cacheKey, record });
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  return record;
}

/** All native VS Code chat sessions, newest first and deduped by session id. */
export function readVscodeChats(userDir: string): ChatSessionRecord[] {
  const byId = new Map<string, ChatSessionRecord>();
  for (const file of discoverVscodeChatFiles(userDir)) {
    const record = readVscodeChatFile(file.path, file.cwd, file.mtimeMs);
    if (!record) {
      continue;
    }
    const existing = byId.get(record.id);
    if (!existing || record.updatedAt > existing.updatedAt) {
      byId.set(record.id, record);
    }
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function textWeight(record: ChatSessionRecord): number {
  return record.turns.reduce(
    (total, turn) => total + turn.userMessage.length + turn.assistantResponse.length,
    0
  );
}

function mergeRecord(
  stored: ChatSessionRecord,
  native: ChatSessionRecord
): ChatSessionRecord {
  const preferNative = textWeight(native) > textWeight(stored);
  const files = new Map<string, ChatFileRef>();
  for (const file of [...stored.files, ...native.files]) {
    if (!files.has(file.path)) {
      files.set(file.path, file);
    }
  }
  const updatedAt =
    (stored.updatedAt || "") >= (native.updatedAt || "")
      ? stored.updatedAt || native.updatedAt
      : native.updatedAt;
  return {
    ...stored,
    cwd: stored.cwd || native.cwd,
    repository: stored.repository || native.repository,
    gitBranch: stored.gitBranch || native.gitBranch,
    summary: stored.summary || native.summary,
    agentName: stored.agentName || native.agentName,
    createdAt: stored.createdAt || native.createdAt,
    updatedAt,
    turns: preferNative ? native.turns : stored.turns,
    files: [...files.values()],
    path: preferNative ? native.path : stored.path,
  };
}

/**
 * Combine Copilot's session store (metadata, summaries, turn text) with VS
 * Code's native session files (full requests, response text, tool calls) into
 * one record per session id.
 */
export function mergeChatRecords(
  stored: ChatSessionRecord[],
  native: ChatSessionRecord[]
): ChatSessionRecord[] {
  const byId = new Map(stored.map((record) => [record.id, record]));
  for (const record of native) {
    const existing = byId.get(record.id);
    byId.set(record.id, existing ? mergeRecord(existing, record) : record);
  }
  return [...byId.values()];
}

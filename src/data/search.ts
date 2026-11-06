import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import type { ChatSessionRecord } from "./chatStore";
import type { CopilotEvent, SearchResult } from "../types";
import { readSessionMeta } from "./discovery";
import { inWorkspace, isDirectory, sessionsDir } from "./paths";

/** Prefer the ripgrep binary VS Code ships; fall back to one on PATH. */
function resolveRipgrepPath(): string {
  const binary = process.platform === "win32" ? "rg.exe" : "rg";
  const candidates = [
    path.join(vscode.env.appRoot, "node_modules", "@vscode", "ripgrep", "bin", binary),
    path.join(vscode.env.appRoot, "node_modules.asar.unpacked", "@vscode", "ripgrep", "bin", binary),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Keep looking.
    }
  }
  return binary;
}

function parseLine(rawLine: string): CopilotEvent | null {
  try {
    const parsed = JSON.parse(rawLine);
    return parsed && typeof parsed === "object" ? (parsed as CopilotEvent) : null;
  } catch {
    return null;
  }
}

/** Text carried by one event line: prompts, replies, tool arguments. */
function eventText(event: CopilotEvent): string {
  const data = event.data && typeof event.data === "object" ? event.data : {};
  if (typeof data.content === "string") {
    return data.content;
  }
  if (Array.isArray(data.toolRequests)) {
    return (data.toolRequests as Array<Record<string, any>>)
      .map((request) => {
        const args = request.arguments || {};
        return `${request.name || ""} ${args.command || args.path || args.pattern || args.query || ""}`;
      })
      .join(" ");
  }
  const args = data.arguments;
  if (args && typeof args === "object") {
    for (const key of ["command", "path", "pattern", "query", "url", "description", "prompt"]) {
      const value = (args as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }
  return "";
}

/** Snippet around the first query hit, falling back to the raw matched line. */
function buildSnippet(rawLine: string, query: string): string {
  const event = parseLine(rawLine);
  const text = event ? eventText(event).replace(/\s+/g, " ").trim() : "";
  const needle = query.toLowerCase();
  const source =
    text && text.toLowerCase().indexOf(needle) >= 0 ? text : rawLine.replace(/\s+/g, " ").trim();
  const hit = source.toLowerCase().indexOf(needle);
  if (hit < 0) {
    return source.slice(0, 180);
  }
  const start = Math.max(0, hit - 70);
  const end = Math.min(source.length, hit + query.length + 90);
  return (start > 0 ? "…" : "") + source.slice(start, end) + (end < source.length ? "…" : "");
}

function buildHit(
  transcriptPath: string,
  matchCount: number,
  firstLine: string,
  query: string
): SearchResult {
  let mtimeMs = 0;
  try {
    mtimeMs = fs.statSync(transcriptPath).mtimeMs;
  } catch {
    // Leave 0 when the file vanished.
  }
  const event = parseLine(firstLine);
  const agentId = typeof event?.agentId === "string" ? event.agentId : "";
  const dir = path.dirname(transcriptPath);
  const meta = readSessionMeta(dir);
  const sessionId = path.basename(dir);
  const projectName = meta.cwd
    ? path.basename(meta.cwd)
    : meta.name || sessionId.slice(0, 8);

  return {
    sessionId,
    transcriptPath,
    agentName: agentId ? `subagent ${agentId.slice(0, 6)}` : projectName,
    isSubagent: !!agentId,
    source: "events",
    resumable: true,
    agentMatches: 1,
    projectName,
    cwd: meta.cwd,
    snippet: buildSnippet(firstLine, query),
    matchCount,
    mtimeMs,
  };
}

interface RawMatch {
  count: number;
  firstLine: string;
}

function chatSnippet(text: string, hit: number, length: number): string {
  const start = Math.max(0, hit - 70);
  const end = Math.min(text.length, hit + length + 90);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

/** In-memory search over VS Code chat sessions (they are rows, not files). */
function chatResults(
  needle: string,
  sessions: ChatSessionRecord[],
  dbPath: string,
  allProjects: boolean
): SearchResult[] {
  if (!dbPath || sessions.length === 0) {
    return [];
  }
  const query = needle.toLowerCase();
  const results: SearchResult[] = [];

  for (const session of sessions) {
    if (!allProjects && !inWorkspace(session.cwd)) {
      continue;
    }
    let matchCount = 0;
    let snippet = "";
    const texts: string[] = [];
    if (session.summary) {
      texts.push(session.summary);
    }
    for (const turn of session.turns) {
      if (turn.userMessage) {
        texts.push(turn.userMessage);
      }
      if (turn.assistantResponse) {
        texts.push(turn.assistantResponse);
      }
    }
    for (const text of texts) {
      const clean = text.replace(/\s+/g, " ").trim();
      const lower = clean.toLowerCase();
      let hit = lower.indexOf(query);
      while (hit >= 0) {
        matchCount++;
        if (!snippet) {
          snippet = chatSnippet(clean, hit, query.length);
        }
        hit = lower.indexOf(query, hit + query.length);
      }
    }
    if (!matchCount) {
      continue;
    }
    const projectName = session.cwd
      ? path.basename(session.cwd)
      : session.agentName || session.id.slice(0, 8);
    results.push({
      sessionId: session.id,
      transcriptPath: dbPath,
      agentName: session.agentName || projectName,
      isSubagent: false,
      source: "chat-store",
      resumable: false,
      agentMatches: 1,
      projectName,
      cwd: session.cwd,
      snippet,
      matchCount,
      mtimeMs: Date.parse(session.updatedAt) || 0,
    });
  }
  return results;
}

/** Full-text search over every Copilot session's events, grouped per session. */
export async function searchTranscripts(
  query: string,
  allProjects: boolean,
  chatSessions: ChatSessionRecord[] = [],
  chatDbPath = ""
): Promise<SearchResult[]> {
  const needle = (query || "").trim();
  if (needle.length < 2) {
    return [];
  }
  const root = sessionsDir();
  if (!isDirectory(root)) {
    return [];
  }

  const rgPath = resolveRipgrepPath();
  const args = ["--json", "-i", "-F", "-m", "3", "--glob", "events.jsonl", "-e", needle, root];
  const matches = new Map<string, RawMatch>();

  await new Promise<void>((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(rgPath, args);
    } catch {
      resolve();
      return;
    }

    let buffer = "";
    let seen = 0;
    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        try {
          child.kill();
        } catch {
          // Already gone.
        }
        resolve();
      }
    };
    const timeout = setTimeout(finish, 8000);

    child.stdout?.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line) {
          continue;
        }
        let event: any;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (event.type === "match") {
          const filePath: string | undefined = event.data?.path?.text;
          if (!filePath) {
            continue;
          }
          const existing = matches.get(filePath);
          if (existing) {
            existing.count++;
          } else {
            matches.set(filePath, { count: 1, firstLine: event.data?.lines?.text || "" });
          }
          if (++seen > 800) {
            clearTimeout(timeout);
            finish();
            return;
          }
        }
      }
    });
    child.on("error", () => {
      clearTimeout(timeout);
      finish();
    });
    child.on("close", () => {
      clearTimeout(timeout);
      finish();
    });
  });

  const grouped = new Map<string, { primary: SearchResult; primaryMatches: number }>();
  for (const [filePath, match] of matches) {
    const primary = buildHit(filePath, match.count, match.firstLine, needle);
    const group = grouped.get(primary.sessionId);
    if (!group) {
      grouped.set(primary.sessionId, { primary, primaryMatches: primary.matchCount });
      continue;
    }
    group.primary.matchCount += primary.matchCount;
    group.primary.agentMatches += 1;
    group.primary.mtimeMs = Math.max(group.primary.mtimeMs, primary.mtimeMs);
    if (
      primary.matchCount > group.primaryMatches ||
      (primary.matchCount === group.primaryMatches &&
        !primary.isSubagent &&
        group.primary.isSubagent)
    ) {
      group.primaryMatches = primary.matchCount;
      group.primary.transcriptPath = primary.transcriptPath;
      group.primary.agentName = primary.agentName;
      group.primary.isSubagent = primary.isSubagent;
      group.primary.snippet = primary.snippet;
      if (primary.cwd) {
        group.primary.cwd = primary.cwd;
        group.primary.projectName = primary.projectName;
      }
    }
  }

  let results = [...grouped.values()].map((group) => group.primary);
  const seenSessions = new Set(results.map((result) => result.sessionId));
  for (const extra of chatResults(needle, chatSessions, chatDbPath, allProjects)) {
    if (!seenSessions.has(extra.sessionId)) {
      results.push(extra);
      seenSessions.add(extra.sessionId);
    }
  }
  if (!allProjects) {
    const scoped = results.filter((result) => inWorkspace(result.cwd));
    if (scoped.length) {
      results = scoped;
    }
  }
  results.sort((a, b) => b.matchCount - a.matchCount || b.mtimeMs - a.mtimeMs);
  return results.slice(0, 30);
}

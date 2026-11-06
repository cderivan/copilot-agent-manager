import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import type { SearchResult } from "../types";
import { isDirectory, projectsDir, workspaceProjectKeys } from "./paths";

const UUID_PATTERN = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

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

function searchRoots(allProjects: boolean): string[] {
  const root = projectsDir();
  if (!isDirectory(root)) {
    return [];
  }
  if (allProjects) {
    return [root];
  }
  const folders = workspaceProjectKeys()
    .map((key) => path.join(root, key))
    .filter(isDirectory);
  if (folders.length) {
    return folders;
  }
  return [root];
}

function readHead(filePath: string, maxBytes = 8192): string {
  try {
    const fd = fs.openSync(filePath, "r");
    const length = Math.min(maxBytes, fs.fstatSync(fd).size);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, 0);
    fs.closeSync(fd);
    return buffer.toString("utf8");
  } catch {
    return "";
  }
}

function firstCwd(transcriptPath: string): string {
  const line = readHead(transcriptPath)
    .split("\n")
    .find((candidate) => candidate.trim());
  if (!line) {
    return "";
  }
  try {
    return String(JSON.parse(line).cwd || "");
  } catch {
    return "";
  }
}

function subagentDisplayName(transcriptPath: string): string {
  try {
    const meta = JSON.parse(
      fs.readFileSync(transcriptPath.replace(/\.jsonl$/, ".meta.json"), "utf8")
    );
    return String(meta.description || meta.agentType || "subagent").slice(0, 52);
  } catch {
    return "subagent";
  }
}

function blockText(block: any): string {
  if (typeof block === "string") {
    return block;
  }
  if (!block || typeof block !== "object") {
    return "";
  }
  if (block.type === "text") {
    return block.text || "";
  }
  if (block.type === "thinking") {
    return block.thinking || block.text || "";
  }
  if (block.type === "tool_use") {
    const input = block.input || {};
    return `${block.name || ""} ${
      input.command || input.file_path || input.description || input.pattern || input.query || ""
    }`;
  }
  if (block.type === "tool_result") {
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
          return item?.text || "";
        })
        .join(" ");
    }
    return "";
  }
  return block.text || "";
}

/** Snippet around the first query hit, falling back to the raw matched line. */
function buildSnippet(rawLine: string, query: string): string {
  let text = "";
  try {
    const content = JSON.parse(rawLine)?.message?.content;
    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content.map(blockText).join(" ");
    }
  } catch {
    // Fall back to the raw line below.
  }
  text = text.replace(/\s+/g, " ").trim();
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
  const isSubagent = /\/subagents\/agent-[^/]+\.jsonl$/.test(transcriptPath);
  const sessionId =
    (transcriptPath.match(UUID_PATTERN) || [])[1] ||
    path.basename(transcriptPath).replace(/\.jsonl$/, "");
  const cwd = firstCwd(transcriptPath);
  const projectName = cwd ? path.basename(cwd) : path.basename(path.dirname(transcriptPath));
  const agentName = isSubagent ? subagentDisplayName(transcriptPath) : projectName || sessionId.slice(0, 8);

  return {
    sessionId,
    transcriptPath,
    agentName,
    isSubagent,
    agentMatches: 1,
    projectName,
    cwd,
    snippet: buildSnippet(firstLine, query),
    matchCount,
    mtimeMs,
  };
}

interface RawMatch {
  count: number;
  firstLine: string;
}

/** Full-text search over every transcript with ripgrep, grouped per session. */
export async function searchTranscripts(
  query: string,
  allProjects: boolean
): Promise<SearchResult[]> {
  const needle = (query || "").trim();
  if (needle.length < 2) {
    return [];
  }
  const roots = searchRoots(allProjects);
  if (roots.length === 0) {
    return [];
  }

  const rgPath = resolveRipgrepPath();
  const args = ["--json", "-i", "-F", "-m", "3", "--glob", "*.jsonl", "-e", needle, ...roots];
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

  const results = [...grouped.values()].map((group) => group.primary);
  results.sort((a, b) => b.matchCount - a.matchCount || b.mtimeMs - a.mtimeMs);
  return results.slice(0, 30);
}

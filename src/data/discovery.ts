import * as fs from "fs";
import * as path from "path";
import type { ScopeName } from "../types";
import { readText } from "./fsText";
import { inWorkspace, isDirectory, isFile, sessionsDir } from "./paths";

export interface SessionMeta {
  cwd: string;
  gitBranch: string;
  name: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionEntry {
  sessionId: string;
  dir: string;
  eventsPath: string;
  mtimeMs: number;
  meta: SessionMeta;
}

export function listDirectory(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

export function mtimeOf(target: string): number {
  try {
    return fs.statSync(target).mtimeMs;
  } catch {
    return 0;
  }
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Copilot CLI writes `workspace.yaml` (session name, cwd, branch) next to the events. */
export function readSessionMeta(dir: string): SessionMeta {
  const meta: SessionMeta = {
    cwd: "",
    gitBranch: "",
    name: "",
    clientName: "",
    createdAt: "",
    updatedAt: "",
  };

  for (const line of readText(path.join(dir, "workspace.yaml"), 64 * 1024).split("\n")) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (!match) {
      continue;
    }
    const value = unquote(match[2]);
    switch (match[1]) {
      case "cwd":
        meta.cwd = value;
        break;
      case "branch":
        meta.gitBranch = value;
        break;
      case "name":
        meta.name = value;
        break;
      case "client_name":
        meta.clientName = value;
        break;
      case "created_at":
        meta.createdAt = value;
        break;
      case "updated_at":
        meta.updatedAt = value;
        break;
    }
  }

  if (!meta.cwd) {
    try {
      const data = JSON.parse(readText(path.join(dir, "vscode.metadata.json"), 64 * 1024));
      meta.cwd = String(data?.workspaceFolder?.folderPath || "");
    } catch {
      // No metadata file; the session keeps an empty cwd.
    }
  }

  return meta;
}

export function discoverSessions(scope: ScopeName, maxSessions: number): SessionEntry[] {
  const root = sessionsDir();
  if (!isDirectory(root)) {
    return [];
  }

  const entries: SessionEntry[] = [];
  for (const name of listDirectory(root)) {
    const dir = path.join(root, name);
    const eventsPath = path.join(dir, "events.jsonl");
    if (!isDirectory(dir) || !isFile(eventsPath)) {
      continue;
    }
    entries.push({
      sessionId: name,
      dir,
      eventsPath,
      mtimeMs: mtimeOf(eventsPath),
      meta: readSessionMeta(dir),
    });
  }

  entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const scoped =
    scope === "workspace" ? entries.filter((entry) => inWorkspace(entry.meta.cwd)) : entries;
  return scoped.slice(0, maxSessions);
}

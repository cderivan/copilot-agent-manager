import * as fs from "fs";
import * as path from "path";
import type { ScopeName } from "../types";
import { isDirectory, projectsDir, workspaceProjectKeys } from "./paths";

export interface SubagentEntry {
  fileId: string;
  jsonlPath: string;
  metaPath: string;
  mtimeMs: number;
}

export interface SessionEntry {
  sessionId: string;
  projectDir: string;
  mainPath: string;
  subagentsDir: string;
  mtimeMs: number;
  subagents: SubagentEntry[];
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

export function listProjectSessions(projectDir: string, maxSubagents: number): SessionEntry[] {
  const sessions: SessionEntry[] = [];
  for (const name of listDirectory(projectDir)) {
    if (!name.endsWith(".jsonl")) {
      continue;
    }
    const sessionId = name.slice(0, -6);
    const mainPath = path.join(projectDir, name);
    const subagentsDir = path.join(projectDir, sessionId, "subagents");
    const subagents: SubagentEntry[] = [];
    if (isDirectory(subagentsDir)) {
      for (const subName of listDirectory(subagentsDir)) {
        if (!subName.endsWith(".jsonl")) {
          continue;
        }
        const fileId = subName.slice(0, -6);
        const jsonlPath = path.join(subagentsDir, subName);
        subagents.push({
          fileId,
          jsonlPath,
          metaPath: path.join(subagentsDir, `${fileId}.meta.json`),
          mtimeMs: mtimeOf(jsonlPath),
        });
      }
    }
    subagents.sort((a, b) => b.mtimeMs - a.mtimeMs);

    sessions.push({
      sessionId,
      projectDir,
      mainPath,
      subagentsDir,
      mtimeMs: mtimeOf(mainPath),
      subagents: subagents.slice(0, maxSubagents),
    });
  }
  return sessions;
}

export function discoverSessions(
  scope: ScopeName,
  maxSessions: number,
  maxSubagents: number
): SessionEntry[] {
  const root = projectsDir();
  if (!isDirectory(root)) {
    return [];
  }

  let projectDirs: string[];
  if (scope === "workspace") {
    const keys = new Set(workspaceProjectKeys());
    projectDirs = listDirectory(root)
      .filter((name) => keys.has(name))
      .map((name) => path.join(root, name));
    if (projectDirs.length === 0) {
      projectDirs = listDirectory(root).map((name) => path.join(root, name));
    }
  } else {
    projectDirs = listDirectory(root).map((name) => path.join(root, name));
  }
  projectDirs = projectDirs.filter(isDirectory);

  const sessions: SessionEntry[] = [];
  for (const projectDir of projectDirs) {
    sessions.push(...listProjectSessions(projectDir, maxSubagents));
  }
  sessions.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return sessions.slice(0, maxSessions);
}

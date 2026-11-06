import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

export function expandTilde(value: string): string {
  if (value === "~") {
    return os.homedir();
  }
  if (value.startsWith("~/")) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
}

/** `copilotAgentManager.copilotHome` → `COPILOT_HOME` → `~/.copilot`. */
export function resolveCopilotHome(): string {
  const configured = vscode.workspace
    .getConfiguration("copilotAgentManager")
    .get<string>("copilotHome", "")
    .trim();
  if (configured) {
    return expandTilde(configured);
  }
  const envHome = process.env.COPILOT_HOME;
  if (envHome && envHome.trim()) {
    return expandTilde(envHome.trim());
  }
  return path.join(os.homedir(), ".copilot");
}

/** Copilot CLI keeps one directory per session under `<home>/session-state`. */
export function sessionsDir(): string {
  return path.join(resolveCopilotHome(), "session-state");
}

export function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

export function isFile(target: string): boolean {
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

/**
 * VS Code's own Copilot Chat session store (one SQLite file per install).
 *
 * `userDir` is the `…/User` directory of the running VS Code, derived from the
 * extension's storage path, so custom `--user-data-dir` and portable installs
 * resolve correctly. Standard per-platform locations are the fallback.
 */
export function chatStorePath(userDir?: string): string {
  const database = path.join("globalStorage", "github.copilot-chat", "session-store.db");
  const candidates: string[] = [];
  if (userDir) {
    candidates.push(path.join(userDir, database));
  }
  const home = os.homedir();
  for (const product of ["Code", "Code - Insiders"]) {
    const suffix = path.join(product, "User", database);
    if (process.platform === "darwin") {
      candidates.push(path.join(home, "Library", "Application Support", suffix));
    } else if (process.platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      candidates.push(path.join(appData, suffix));
    } else {
      candidates.push(path.join(home, ".config", suffix));
    }
  }
  return candidates.find(isFile) || candidates[0];
}

export function workspaceFolders(): string[] {
  return (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath);
}

export function normalizePath(value: string): string {
  const stripped = value.replace(/\\/g, "/").replace(/\/+$/, "");
  return process.platform === "win32" ? stripped.toLowerCase() : stripped;
}

/** True when a session's cwd is one of the open workspace folders (or inside one). */
export function inWorkspace(cwd: string): boolean {
  if (!cwd) {
    return false;
  }
  const target = normalizePath(cwd);
  return workspaceFolders().some((folder) => {
    const root = normalizePath(folder);
    return target === root || target.startsWith(`${root}/`);
  });
}

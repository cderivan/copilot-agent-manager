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

/** `claudeAgentManager.claudeHome` → `CLAUDE_CONFIG_DIR` → `~/.claude`. */
export function resolveClaudeHome(): string {
  const configured = vscode.workspace
    .getConfiguration("claudeAgentManager")
    .get<string>("claudeHome", "")
    .trim();
  if (configured) {
    return expandTilde(configured);
  }
  const envHome = process.env.CLAUDE_CONFIG_DIR;
  if (envHome && envHome.trim()) {
    return expandTilde(envHome.trim());
  }
  return path.join(os.homedir(), ".claude");
}

export function projectsDir(): string {
  return path.join(resolveClaudeHome(), "projects");
}

/** Claude Code stores a project as the cwd with every non-alphanumeric char replaced. */
export function encodeProjectDirName(fsPath: string): string {
  return fsPath.replace(/[^a-zA-Z0-9]/g, "-");
}

export function workspaceProjectKeys(): string[] {
  return (vscode.workspace.workspaceFolders ?? []).map((folder) =>
    encodeProjectDirName(folder.uri.fsPath)
  );
}

export function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { chatStoreMarkdown } from "../data/chatStore";
import { conversationMarkdown } from "../data/conversation";
import { dataOf } from "../data/events";
import { parseJsonl, readText } from "../data/fsText";
import { openConversation } from "./conversationProvider";
import { openDiff } from "./diffProvider";

export interface ActionPayload {
  transcriptPath?: string;
  name?: string;
  agentId?: string;
  source?: "events" | "chat-store";
  path?: string;
  cwd?: string;
  file?: string;
  sessionId?: string;
}

/** Copilot CLI binary from the usual install locations, else the one on PATH. */
function resolveCopilotBinary(): string {
  const candidates = [
    path.join(os.homedir(), ".copilot", "bin", "copilot"),
    "/opt/homebrew/bin/copilot",
    "/usr/local/bin/copilot",
  ];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Keep looking.
    }
  }
  return "copilot";
}

function resolveFilePath(filePath: string | undefined, cwd: string | undefined) {
  if (filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    if (cwd) {
      return path.join(cwd, filePath);
    }
    return filePath;
  }
  return undefined;
}

/** Last recorded edit to a file in a session's events, as before/after text. */
function recordedEdit(
  transcriptPath: string | undefined,
  file: string | undefined
): { oldText: string; newText: string } | null {
  if (!transcriptPath || !file) {
    return null;
  }
  let edit: { oldText: string; newText: string } | null = null;
  for (const event of parseJsonl(readText(transcriptPath))) {
    if (event.type !== "tool.execution_start") {
      continue;
    }
    const data = dataOf(event);
    const args = data.arguments;
    if (!args || typeof args !== "object") {
      continue;
    }
    if (args.path !== file) {
      continue;
    }
    if (data.toolName === "edit") {
      edit = {
        oldText: String(args.old_str ?? ""),
        newText: String(args.new_str ?? ""),
      };
    } else if (data.toolName === "create" || data.toolName === "write") {
      edit = { oldText: "", newText: String(args.file_text ?? "") };
    }
  }
  return edit;
}

export async function handleAction(action: string, payload: ActionPayload): Promise<void> {
  switch (action) {
    case "readConversation": {
      if (payload.transcriptPath && fs.existsSync(payload.transcriptPath)) {
        const title = payload.name || "Conversation";
        const markdown =
          payload.source === "chat-store"
            ? chatStoreMarkdown(payload.transcriptPath, payload.sessionId || "", title)
            : conversationMarkdown(payload.transcriptPath, title, payload.agentId || "");
        await openConversation(payload.name || "conversation", markdown);
      } else {
        vscode.window.showWarningMessage("Session events not found for this agent.");
      }
      return;
    }
    case "revealFile": {
      const target = resolveFilePath(payload.path, payload.cwd);
      if (target && fs.existsSync(target)) {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(target));
        await vscode.window.showTextDocument(doc, { preview: true });
      } else {
        vscode.window.showWarningMessage(`File not found: ${payload.path}`);
      }
      return;
    }
    case "openDiff": {
      const file = payload.file || "";
      const edit = recordedEdit(payload.transcriptPath, payload.file);
      if (edit) {
        await openDiff(file, edit.oldText, edit.newText);
      } else {
        const target = resolveFilePath(payload.file, payload.cwd);
        if (target && fs.existsSync(target)) {
          const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(target));
          await vscode.window.showTextDocument(doc, { preview: true });
        } else {
          vscode.window.showInformationMessage("No recorded edit to diff for this file.");
        }
      }
      return;
    }
    case "copySession": {
      await vscode.env.clipboard.writeText(payload.sessionId || "");
      vscode.window.showInformationMessage(`Copied session id: ${payload.sessionId}`);
      return;
    }
    case "continueSession": {
      const sessionId = payload.sessionId || "";
      const cwd = payload.cwd && fs.existsSync(payload.cwd) ? payload.cwd : undefined;
      const terminal = vscode.window.createTerminal({
        name: `Copilot \u00B7 resume ${sessionId.slice(0, 8)}`,
        cwd,
      });
      terminal.show();
      const binary = resolveCopilotBinary();
      const quoted = binary.includes(" ") ? `"${binary}"` : binary;
      terminal.sendText(`${quoted} --resume=${sessionId}`);
      return;
    }
  }
}

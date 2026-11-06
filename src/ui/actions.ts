import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { conversationMarkdown } from "../data/conversation";
import { parseJsonl, readText } from "../data/fsText";
import { toolUseBlocks } from "../data/transcripts";
import type { ContinueTarget } from "../types";
import { openConversation } from "./conversationProvider";
import { openDiff } from "./diffProvider";

export interface ActionPayload {
  transcriptPath?: string;
  name?: string;
  path?: string;
  cwd?: string;
  file?: string;
  sessionId?: string;
  target?: ContinueTarget;
}

/** Newest Claude Code CLI binary shipped inside the official extension, if installed. */
function resolveClaudeBinary(): string {
  try {
    const extensionsDir = path.join(os.homedir(), ".vscode", "extensions");
    const binaryName = process.platform === "win32" ? "claude.exe" : "claude";
    const candidates: Array<{ version: [number, number, number]; bin: string }> = [];
    for (const entry of fs.readdirSync(extensionsDir)) {
      const match = entry.match(/^anthropic\.claude-code-(\d+)\.(\d+)\.(\d+)/);
      if (!match) {
        continue;
      }
      const bin = path.join(extensionsDir, entry, "resources", "native-binary", binaryName);
      if (fs.existsSync(bin)) {
        candidates.push({ version: [+match[1], +match[2], +match[3]], bin });
      }
    }
    candidates.sort(
      (a, b) =>
        a.version[0] - b.version[0] ||
        a.version[1] - b.version[1] ||
        a.version[2] - b.version[2]
    );
    if (candidates.length) {
      return candidates[candidates.length - 1].bin;
    }
  } catch {
    // Fall through to PATH lookup.
  }
  return "claude";
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

/** Last recorded edit to a file in a transcript, as before/after text. */
function recordedEdit(
  transcriptPath: string | undefined,
  file: string | undefined
): { oldText: string; newText: string } | null {
  if (!transcriptPath || !file) {
    return null;
  }
  const records = parseJsonl(readText(transcriptPath));
  let edit: { oldText: string; newText: string } | null = null;
  for (const record of records) {
    for (const block of toolUseBlocks(record)) {
      const input = block.input || {};
      if (block.name === "Edit" && input.file_path === file) {
        edit = {
          oldText: String(input.old_string ?? ""),
          newText: String(input.new_string ?? ""),
        };
      } else if (block.name === "MultiEdit" && input.file_path === file && Array.isArray(input.edits)) {
        const oldText = (input.edits as Array<Record<string, unknown>>)
          .map((item) => String(item.old_string ?? ""))
          .join("\n");
        const newText = (input.edits as Array<Record<string, unknown>>)
          .map((item) => String(item.new_string ?? ""))
          .join("\n");
        edit = { oldText, newText };
      } else if (block.name === "Write" && input.file_path === file) {
        edit = { oldText: "", newText: String(input.content ?? "") };
      }
    }
  }
  return edit;
}

export async function handleAction(action: string, payload: ActionPayload): Promise<void> {
  switch (action) {
    case "readConversation": {
      if (payload.transcriptPath && fs.existsSync(payload.transcriptPath)) {
        const markdown = conversationMarkdown(payload.transcriptPath, payload.name || "Conversation");
        await openConversation(payload.name || "conversation", markdown);
      } else {
        vscode.window.showWarningMessage("Transcript not found for this agent.");
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
      const configured = vscode.workspace
        .getConfiguration("claudeAgentManager")
        .get<ContinueTarget>("continueIn", "extension");
      if ((payload.target || configured) === "extension") {
        const commands = await vscode.commands.getCommands(true);
        if (commands.includes("claude-vscode.editor.open")) {
          try {
            await vscode.commands.executeCommand(
              "claude-vscode.editor.open",
              sessionId,
              undefined,
              vscode.ViewColumn.Active
            );
            return;
          } catch {
            vscode.window.showWarningMessage(
              "Couldn't open the Claude Code extension view — falling back to terminal."
            );
          }
        } else {
          vscode.window.showWarningMessage(
            "Claude Code extension not found — opening in terminal instead."
          );
        }
      }
      const terminal = vscode.window.createTerminal({
        name: `Claude \u00B7 resume ${sessionId.slice(0, 8)}`,
        cwd,
      });
      terminal.show();
      const binary = resolveClaudeBinary();
      terminal.sendText(
        `${binary.includes(" ") ? `"${binary}"` : binary} --resume ${sessionId}`
      );
      return;
    }
  }
}

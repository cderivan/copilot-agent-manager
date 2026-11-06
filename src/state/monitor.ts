import * as vscode from "vscode";
import { readBuildConfig, readScanConfig } from "../config";
import { readChatStore, type ChatSessionRecord } from "../data/chatStore";
import { discoverSessions } from "../data/discovery";
import { buildState } from "../data/model";
import { chatStorePath, inWorkspace, resolveCopilotHome, sessionsDir } from "../data/paths";
import { mergeChatRecords, readVscodeChats } from "../data/vscodeChats";
import type { Agent, AgentStatus, AppState, ToastInfo } from "../types";
import { TranscriptWatcher } from "./watcher";

/** Holds the live agent model and pushes it to every attached webview. */
export class AgentMonitor implements vscode.Disposable {
  private watcher?: TranscriptWatcher;
  private lastState?: AppState;
  private selectedId: string | null = null;
  private readonly lastStatus = new Map<string, AgentStatus>();
  private chatRecords: ChatSessionRecord[] = [];
  private chatPath = "";
  private firstBuildDone = false;

  constructor(private readonly userDir?: string) {}
  private readonly stateCbs: Array<(state: AppState) => void> = [];
  private readonly toastCbs: Array<(toast: ToastInfo) => void> = [];

  start(): void {
    this.startWatcher();
    this.rebuild();
  }

  dispose(): void {
    this.watcher?.dispose();
  }

  onState(callback: (state: AppState) => void): () => void {
    this.stateCbs.push(callback);
    if (this.lastState) {
      callback(this.lastState);
    }
    return () => {
      const index = this.stateCbs.indexOf(callback);
      if (index >= 0) {
        this.stateCbs.splice(index, 1);
      }
    };
  }

  onToast(callback: (toast: ToastInfo) => void): () => void {
    this.toastCbs.push(callback);
    return () => {
      const index = this.toastCbs.indexOf(callback);
      if (index >= 0) {
        this.toastCbs.splice(index, 1);
      }
    };
  }

  get state(): AppState | undefined {
    return this.lastState;
  }

  getAgent(id: string): Agent | undefined {
    return this.lastState?.agents.find((agent) => agent.id === id);
  }

  /** VS Code chat-store sessions, for full-text search. */
  get chatSessions(): ChatSessionRecord[] {
    return this.chatRecords;
  }

  get chatDbPath(): string {
    return this.chatPath;
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
    if (this.lastState) {
      this.lastState = { ...this.lastState, selectedId: id };
      this.emitState();
    }
  }

  refresh(): void {
    this.startWatcher();
    this.rebuild();
  }

  private startWatcher(): void {
    this.watcher?.dispose();
    const pollSeconds = vscode.workspace
      .getConfiguration("copilotAgentManager")
      .get("pollSeconds", 4);
    this.watcher = new TranscriptWatcher(sessionsDir(), () => this.rebuild(), pollSeconds);
    this.watcher.start();
  }

  private rebuild(): void {
    const copilotHome = resolveCopilotHome();
    const scan = readScanConfig();
    const cfg = readBuildConfig(copilotHome);
    const entries = discoverSessions(scan.scope, scan.maxSessions);
    this.chatPath = chatStorePath(this.userDir);
    if (scan.includeChatStore) {
      const stored = readChatStore(this.chatPath);
      const native = readVscodeChats(this.userDir || "");
      this.chatRecords = mergeChatRecords(stored, native);
    } else {
      this.chatRecords = [];
    }
    // Search always sees every chat session; the live list stays scoped and
    // capped like CLI sessions so an old chat history cannot flood it.
    const scopedChat =
      scan.scope === "workspace"
        ? this.chatRecords.filter((record) => inWorkspace(record.cwd))
        : this.chatRecords;
    const recentChat = [...scopedChat]
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, Math.max(scan.maxSessions, 6));
    const state = buildState(
      entries,
      { dbPath: this.chatPath, records: recentChat },
      this.selectedId,
      cfg,
      Date.now()
    );
    this.selectedId = state.selectedId;
    this.lastState = state;
    this.detectFinishes(state);
    this.emitState();
  }

  private emitState(): void {
    if (this.lastState) {
      for (const callback of this.stateCbs) {
        callback(this.lastState);
      }
    }
  }

  private detectFinishes(state: AppState): void {
    const notify = vscode.workspace
      .getConfiguration("copilotAgentManager")
      .get("notifyOnFinish", true);
    for (const agent of state.agents) {
      const previous = this.lastStatus.get(agent.id);
      if (
        this.firstBuildDone &&
        previous === "running" &&
        (agent.status === "done" || agent.status === "error")
      ) {
        const finished = agent.status === "done";
        const toast: ToastInfo = {
          color: finished ? "#89d185" : "#f48771",
          icon: finished ? "✓" : "✕",
          title: `${agent.name} ${finished ? "finished" : "errored"}`,
          body: agent.task.slice(0, 80),
        };
        for (const callback of this.toastCbs) {
          callback(toast);
        }
        if (notify) {
          const message = `Copilot agent \u201C${agent.name}\u201D ${
            finished ? "finished" : "hit an error"
          }.`;
          if (finished) {
            vscode.window.showInformationMessage(message);
          } else {
            vscode.window.showWarningMessage(message);
          }
        }
      }
      this.lastStatus.set(agent.id, agent.status);
    }
    this.firstBuildDone = true;
  }
}

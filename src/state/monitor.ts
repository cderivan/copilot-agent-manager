import * as vscode from "vscode";
import { readBuildConfig, readScanConfig } from "../config";
import { discoverSessions } from "../data/discovery";
import { buildState } from "../data/model";
import { projectsDir, resolveClaudeHome } from "../data/paths";
import type { Agent, AgentStatus, AppState, ToastInfo } from "../types";
import { TranscriptWatcher } from "./watcher";

/** Holds the live agent model and pushes it to every attached webview. */
export class AgentMonitor implements vscode.Disposable {
  private watcher?: TranscriptWatcher;
  private lastState?: AppState;
  private selectedId: string | null = null;
  private readonly lastStatus = new Map<string, AgentStatus>();
  private firstBuildDone = false;
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
      .getConfiguration("claudeAgentManager")
      .get("pollSeconds", 4);
    this.watcher = new TranscriptWatcher(projectsDir(), () => this.rebuild(), pollSeconds);
    this.watcher.start();
  }

  private rebuild(): void {
    const claudeHome = resolveClaudeHome();
    const scan = readScanConfig();
    const cfg = readBuildConfig(claudeHome);
    const entries = discoverSessions(scan.scope, scan.maxSessions, scan.maxSubagents);
    const state = buildState(entries, this.selectedId, cfg, Date.now());
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
      .getConfiguration("claudeAgentManager")
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
          const message = `Claude agent \u201C${agent.name}\u201D ${
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

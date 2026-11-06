import * as vscode from "vscode";
import type { AgentMonitor } from "../state/monitor";
import { wireWebview } from "./panel";

export class AgentManagerViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = "copilotAgentManager.view";

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly monitor: AgentMonitor
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    wireWebview(this.context, this.monitor, view.webview, view.onDidDispose);
  }
}

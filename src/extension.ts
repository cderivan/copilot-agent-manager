import * as vscode from "vscode";
import { AgentMonitor } from "./state/monitor";
import { registerConversationProvider } from "./ui/conversationProvider";
import { registerDiffProvider } from "./ui/diffProvider";
import { wireWebview } from "./ui/panel";
import { AgentManagerViewProvider } from "./ui/provider";
import { updateStatusBar } from "./ui/statusBar";

export function activate(context: vscode.ExtensionContext): void {
  registerDiffProvider(context);
  registerConversationProvider(context);

  const monitor = new AgentMonitor();
  context.subscriptions.push(monitor);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.command = "workbench.view.extension.claudeAgentManager";
  context.subscriptions.push(status);
  monitor.onState((state) => updateStatusBar(status, state));
  updateStatusBar(status, undefined);
  status.show();

  const provider = new AgentManagerViewProvider(context, monitor);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(AgentManagerViewProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  let panel: vscode.WebviewPanel | undefined;
  context.subscriptions.push(
    vscode.commands.registerCommand("claudeAgentManager.openInEditor", () => {
      if (panel) {
        panel.reveal(vscode.ViewColumn.Active);
        return;
      }
      panel = vscode.window.createWebviewPanel(
        "claudeAgentManager.panel",
        "Claude Agent Manager",
        vscode.ViewColumn.Active,
        { enableScripts: true, retainContextWhenHidden: true }
      );
      panel.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "claudecode-color.svg");
      wireWebview(context, monitor, panel.webview, panel.onDidDispose);
      panel.onDidDispose(() => {
        panel = undefined;
      });
    }),
    vscode.commands.registerCommand("claudeAgentManager.refresh", () => monitor.refresh()),
    vscode.commands.registerCommand("claudeAgentManager.toggleScope", async () => {
      const config = vscode.workspace.getConfiguration("claudeAgentManager");
      const next = config.get("scope", "workspace") === "workspace" ? "all" : "workspace";
      await config.update("scope", next, vscode.ConfigurationTarget.Global);
      vscode.window.setStatusBarMessage(`Claude Agents scope: ${next}`, 2000);
    }),
    vscode.commands.registerCommand("claudeAgentManager.cycleLayout", async () => {
      const config = vscode.workspace.getConfiguration("claudeAgentManager");
      const layouts = ["tree", "cards", "split"];
      const current = config.get("defaultLayout", "tree");
      const next = layouts[(layouts.indexOf(current) + 1) % layouts.length];
      await config.update("defaultLayout", next, vscode.ConfigurationTarget.Global);
      vscode.window.setStatusBarMessage(`Claude Agents layout: ${next}`, 2000);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("claudeAgentManager")) {
        monitor.refresh();
      }
    })
  );

  monitor.start();
}

export function deactivate(): void {
  // Everything is torn down through context.subscriptions.
}

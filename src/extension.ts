import * as path from "path";
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

  // `<user-data-dir>/User/globalStorage/<extension>` → `<user-data-dir>/User`,
  // so a custom --user-data-dir or portable install locates its own chat store.
  const userDir = path.dirname(path.dirname(context.globalStorageUri.fsPath));
  const monitor = new AgentMonitor(userDir);
  context.subscriptions.push(monitor);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.command = "workbench.view.extension.copilotAgentManager";
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
    vscode.commands.registerCommand("copilotAgentManager.openInEditor", () => {
      if (panel) {
        panel.reveal(vscode.ViewColumn.Active);
        return;
      }
      panel = vscode.window.createWebviewPanel(
        "copilotAgentManager.panel",
        "Copilot Agent Manager",
        vscode.ViewColumn.Active,
        { enableScripts: true, retainContextWhenHidden: true }
      );
      panel.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "agent.svg");
      wireWebview(context, monitor, panel.webview, panel.onDidDispose);
      panel.onDidDispose(() => {
        panel = undefined;
      });
    }),
    vscode.commands.registerCommand("copilotAgentManager.refresh", () => monitor.refresh()),
    vscode.commands.registerCommand("copilotAgentManager.toggleScope", async () => {
      const config = vscode.workspace.getConfiguration("copilotAgentManager");
      const next = config.get("scope", "workspace") === "workspace" ? "all" : "workspace";
      await config.update("scope", next, vscode.ConfigurationTarget.Global);
      vscode.window.setStatusBarMessage(`Copilot Agents scope: ${next}`, 2000);
    }),
    vscode.commands.registerCommand("copilotAgentManager.cycleLayout", async () => {
      const config = vscode.workspace.getConfiguration("copilotAgentManager");
      const layouts = ["tree", "cards", "split"];
      const current = config.get("defaultLayout", "tree");
      const next = layouts[(layouts.indexOf(current) + 1) % layouts.length];
      await config.update("defaultLayout", next, vscode.ConfigurationTarget.Global);
      vscode.window.setStatusBarMessage(`Copilot Agents layout: ${next}`, 2000);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("copilotAgentManager")) {
        monitor.refresh();
      }
    })
  );

  monitor.start();
}

export function deactivate(): void {
  // Everything is torn down through context.subscriptions.
}

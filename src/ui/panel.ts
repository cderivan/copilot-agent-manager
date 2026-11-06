import * as vscode from "vscode";
import { updateSetting } from "../config";
import { conversationMessages } from "../data/conversation";
import { searchTranscripts } from "../data/search";
import type { AgentMonitor } from "../state/monitor";
import type { AccentName, ContinueTarget, LayoutName, ScopeName } from "../types";
import { handleAction } from "./actions";
import { buildWebviewHtml } from "./html";

export type Poster = (message: unknown) => void;

type IncomingMessage =
  | { type: "ready" }
  | { type: "select"; id: string }
  | { type: "setLayout"; layout: LayoutName }
  | { type: "setAccent"; accent: AccentName }
  | { type: "setScope"; scope: ScopeName }
  | { type: "setContinueIn"; target: ContinueTarget }
  | { type: "refresh" }
  | { type: "loadConversation"; id: string }
  | { type: "search"; query: string; allProjects: boolean }
  | { type: "action"; action: string; payload: any };

/** Attach one webview (sidebar view or editor panel) to the shared monitor. */
export function wireWebview(
  context: vscode.ExtensionContext,
  monitor: AgentMonitor,
  webview: vscode.Webview,
  onDidDispose: (listener: () => void) => vscode.Disposable
): void {
  webview.options = {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(context.extensionUri, "out"),
      vscode.Uri.joinPath(context.extensionUri, "media"),
    ],
  };
  webview.html = buildWebviewHtml(context.extensionUri, webview);

  let disposed = false;
  const post: Poster = (message) => {
    if (!disposed) {
      try {
        webview.postMessage(message);
      } catch {
        // The view went away between the check and the post.
      }
    }
  };

  const messageSub = webview.onDidReceiveMessage((message) => {
    void handleMessage(monitor, post, message as IncomingMessage);
  });
  const stateSub = monitor.onState((state) => post({ type: "state", state }));
  const toastSub = monitor.onToast((toast) => post({ type: "toast", toast }));

  onDidDispose(() => {
    disposed = true;
    stateSub();
    toastSub();
    messageSub.dispose();
  });
}

async function handleMessage(
  monitor: AgentMonitor,
  post: Poster,
  message: IncomingMessage
): Promise<void> {
  switch (message.type) {
    case "ready":
      if (monitor.state) {
        post({ type: "state", state: monitor.state });
      } else {
        monitor.refresh();
      }
      return;
    case "select":
      monitor.setSelected(message.id);
      return;
    case "setLayout":
      await updateSetting("defaultLayout", message.layout);
      return;
    case "setAccent":
      await updateSetting("accent", message.accent);
      return;
    case "setScope":
      await updateSetting("scope", message.scope);
      return;
    case "setContinueIn":
      await updateSetting("continueIn", message.target);
      return;
    case "refresh":
      monitor.refresh();
      return;
    case "loadConversation": {
      const agent = monitor.getAgent(message.id);
      if (agent) {
        post({
          type: "conversation",
          agentId: message.id,
          messages: conversationMessages(agent.transcriptPath),
        });
      }
      return;
    }
    case "search": {
      const results = await searchTranscripts(message.query, message.allProjects);
      post({ type: "searchResults", query: message.query, results });
      return;
    }
    case "action":
      await handleAction(message.action, message.payload);
      return;
  }
}

import * as vscode from "vscode";

const BEFORE_SCHEME = "copilot-agent-before";
const AFTER_SCHEME = "copilot-agent-after";

class TextContentStore implements vscode.TextDocumentContentProvider {
  private readonly store = new Map<string, string>();
  private readonly emitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.emitter.event;

  set(uri: vscode.Uri, content: string): void {
    this.store.set(uri.toString(), content);
    this.emitter.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.store.get(uri.toString()) ?? "";
  }
}

const beforeStore = new TextContentStore();
const afterStore = new TextContentStore();
let changeCounter = 0;

export function registerDiffProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(BEFORE_SCHEME, beforeStore),
    vscode.workspace.registerTextDocumentContentProvider(AFTER_SCHEME, afterStore)
  );
}

/** Show a recorded edit as a native side-by-side diff. */
export async function openDiff(filePath: string, oldText: string, newText: string): Promise<void> {
  const name = filePath.split(/[\\/]/).pop() || "change";
  const id = changeCounter++;
  const beforeUri = vscode.Uri.parse(`${BEFORE_SCHEME}:/${id}/${name}`);
  const afterUri = vscode.Uri.parse(`${AFTER_SCHEME}:/${id}/${name}`);
  beforeStore.set(beforeUri, oldText);
  afterStore.set(afterUri, newText);
  await vscode.commands.executeCommand(
    "vscode.diff",
    beforeUri,
    afterUri,
    `${name} \u2014 agent change`
  );
}

import * as vscode from "vscode";

const SCHEME = "claude-convo";

class MarkdownStore implements vscode.TextDocumentContentProvider {
  private readonly store = new Map<string, string>();
  private readonly emitter = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this.emitter.event;

  set(uri: vscode.Uri, content: string): void {
    this.store.set(uri.toString(), content);
    this.emitter.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.store.get(uri.toString()) ?? "# (empty)";
  }
}

const store = new MarkdownStore();
let docCounter = 0;

export function registerConversationProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(SCHEME, store));
}

/** Open a formatted conversation in the Markdown preview (plain editor as fallback). */
export async function openConversation(title: string, markdown: string): Promise<void> {
  const slug = title.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40) || "conversation";
  const uri = vscode.Uri.parse(`${SCHEME}:/${docCounter++}/${slug}.md`);
  store.set(uri, markdown);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.languages.setTextDocumentLanguage(doc, "markdown");
  try {
    await vscode.commands.executeCommand("markdown.showPreview", uri);
  } catch {
    await vscode.window.showTextDocument(doc, { preview: true });
  }
}

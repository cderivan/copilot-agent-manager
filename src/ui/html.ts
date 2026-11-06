import * as vscode from "vscode";

/**
 * Semantic palette shared by the CSS and the webview components.
 *
 * Every token resolves to a VS Code theme variable first, so the webview
 * follows the editor theme (and therefore the system light/dark setting).
 * The literal fallbacks are only used outside VS Code. Semantic colors that
 * have no theme variable (agent status, tool tags, accent) get explicit light
 * variants on `body.vscode-light`.
 */
const STYLE = `
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--cam-bg);
  color: var(--cam-text);
  font-family: var(--vscode-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  color-scheme: dark;
  --cam-bg: var(--vscode-editor-background, #1e1e1e);
  --cam-bg-inset: var(--vscode-input-background, #1c1c1c);
  --cam-bg-elevated: var(--vscode-editorWidget-background, #252526);
  --cam-bg-raised: var(--vscode-editorWidget-background, #2b2b2c);
  --cam-bg-hover: var(--vscode-list-hoverBackground, #2f2f30);
  --cam-bg-active: var(--vscode-list-activeSelectionBackground, #37373d);
  --cam-border: var(--vscode-panel-border, var(--vscode-widget-border, #3a3a3b));
  --cam-border-soft: var(--vscode-panel-border, #2d2d2d);
  --cam-text: var(--vscode-foreground, #cccccc);
  --cam-text-body: var(--vscode-foreground, #d4d4d4);
  --cam-text-strong: #ffffff;
  --cam-text-muted: var(--vscode-descriptionForeground, #9a9a9a);
  --cam-text-dim: var(--vscode-disabledForeground, #7a7a7a);
  --cam-text-faint: var(--vscode-disabledForeground, #5a5a5a);
  --cam-icon: var(--vscode-icon-foreground, #8a8a8a);
  --cam-icon-hover: var(--vscode-foreground, #dddddd);
  --cam-button-bg: var(--vscode-button-background, #0e639c);
  --cam-button-fg: var(--vscode-button-foreground, #ffffff);
  --cam-button-hover: var(--vscode-button-hoverBackground, #1177bb);
  --cam-mark-bg: var(--vscode-editor-findMatchHighlightBackground, #5a4a1a);
  --cam-mark-fg: var(--vscode-editor-foreground, #ffe9a8);
  --cam-shadow: var(--vscode-widget-shadow, rgba(0, 0, 0, .5));
  --cam-accent-clay: #d97757;
  --cam-accent-blue: #4daafc;
  --cam-running: #4daafc;
  --cam-done: #89d185;
  --cam-waiting: #cca700;
  --cam-paused: #b48ead;
  --cam-error: #f48771;
  --cam-stopped: #7a7a7a;
  --cam-tool-blue: #4daafc;
  --cam-tool-purple: #c586c0;
  --cam-tool-yellow: #dcdcaa;
  --cam-tool-orange: #ce9178;
  --cam-tool-teal: #4ec9b0;
  --cam-tool-clay: #d97757;
  --cam-tool-gold: #d7ba7d;
  --cam-tool-steel: #569cd6;
  --cam-tool-gray: #8a8a8a;
}
body.vscode-light, body.vscode-high-contrast-light {
  color-scheme: light;
  --cam-text-strong: #1f2328;
  --cam-accent-clay: #b5482a;
  --cam-accent-blue: #005fb8;
  --cam-running: #0969da;
  --cam-done: #1a7f37;
  --cam-waiting: #9a6700;
  --cam-paused: #8250df;
  --cam-error: #cf222e;
  --cam-stopped: #6e7781;
  --cam-tool-blue: #0969da;
  --cam-tool-purple: #8250df;
  --cam-tool-yellow: #7a5c00;
  --cam-tool-orange: #b5482a;
  --cam-tool-teal: #0f766e;
  --cam-tool-clay: #b5482a;
  --cam-tool-gold: #7a5c00;
  --cam-tool-steel: #0550ae;
  --cam-tool-gray: #57606a;
}
.mono { font-family: "SF Mono", "Cascadia Code", Menlo, Monaco, Consolas, monospace; }
button { font-family: inherit; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes toastin { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes logslide { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background, #424242); border-radius: 6px; border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground, #4f4f4f); background-clip: content-box; }
::-webkit-scrollbar-track { background: transparent; }
.app { display: flex; flex-direction: column; height: 100vh; }
.spinner { width: 11px; height: 11px; border-radius: 50%; border: 1.6px solid var(--c); border-top-color: transparent; animation: spin .8s linear infinite; display: inline-block; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.row:hover { background: var(--cam-bg-hover) !important; }
.iconbtn { background: transparent; border: none; color: var(--cam-icon); cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 13px; }
.iconbtn:hover { background: var(--cam-bg-hover); color: var(--cam-icon-hover); }
.iconbtn.active { color: var(--cam-text-strong); background: color-mix(in srgb, var(--cam-text-strong) 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cam-text-strong) 22%, transparent); }
.actionbtn { flex: 1; border: 1px solid var(--cam-border); background: var(--cam-bg-elevated); color: var(--cam-text); font-size: 11px; font-weight: 600; padding: 5px; border-radius: 5px; cursor: pointer; }
.actionbtn:hover { background: var(--cam-bg-hover); }
.actionbtn.danger { color: var(--cam-error); }
.chip { border: 1px solid var(--cam-border); background: var(--cam-bg-elevated); color: var(--cam-text-muted); font-size: 10.5px; font-weight: 600; letter-spacing: .03em; padding: 3px 8px; border-radius: 11px; cursor: pointer; }
.fade-in { animation: logslide .25s ease; }
input.filter { flex: 1; background: transparent; border: none; outline: none; color: var(--cam-text-body); font-size: 12.5px; font-family: inherit; }
mark { background: var(--cam-mark-bg); color: var(--cam-mark-fg); border-radius: 2px; padding: 0 1px; }
`;

function createNonce(): string {
  let nonce = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let index = 0; index < 32; index++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

export function buildWebviewHtml(extensionUri: vscode.Uri, webview: vscode.Webview): string {
  const nonce = createNonce();
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "webview.js")
  );
  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} https: data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `font-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join("; ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>${STYLE}</style>
</head>
<body>
<div id="root"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

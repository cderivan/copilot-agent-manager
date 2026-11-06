import * as vscode from "vscode";

const STYLE = `
* { box-sizing: border-box; }
body { margin: 0; background: #1e1e1e; color: #cccccc;
  font-family: var(--vscode-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
  -webkit-font-smoothing: antialiased; font-size: 13px; }
.mono { font-family: "SF Mono", "Cascadia Code", Menlo, Monaco, Consolas, monospace; }
button { font-family: inherit; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes toastin { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes logslide { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #424242; border-radius: 6px; border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: #4f4f4f; background-clip: content-box; }
::-webkit-scrollbar-track { background: transparent; }
.app { display: flex; flex-direction: column; height: 100vh; }
.spinner { width: 11px; height: 11px; border-radius: 50%; border: 1.6px solid var(--c); border-top-color: transparent; animation: spin .8s linear infinite; display: inline-block; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.row:hover { background: #2f2f30 !important; }
.iconbtn { background: transparent; border: none; color: #8a8a8a; cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 13px; }
.iconbtn:hover { background: #2f2f30; color: #ddd; }
.iconbtn.active { color: #fff; background: #37373d; }
.actionbtn { flex: 1; border: 1px solid #3a3a3b; background: #2d2d2e; color: #cfcfcf; font-size: 11px; font-weight: 600; padding: 5px; border-radius: 5px; cursor: pointer; }
.actionbtn:hover { background: #3a3a3b; }
.actionbtn.danger { color: #f48771; }
.chip { border: 1px solid #3a3a3b; background: #2a2a2b; color: #9a9a9a; font-size: 10.5px; font-weight: 600; letter-spacing: .03em; padding: 3px 8px; border-radius: 11px; cursor: pointer; }
.fade-in { animation: logslide .25s ease; }
input.filter { flex: 1; background: transparent; border: none; outline: none; color: #dcdcdc; font-size: 12.5px; font-family: inherit; }
mark { background: #5a4a1a; color: #ffe9a8; border-radius: 2px; padding: 0 1px; }
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

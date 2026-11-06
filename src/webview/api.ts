import type { AccentName, LayoutName, ScopeName } from "../types";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

export function post(message: unknown): void {
  vscode.postMessage(message);
}

export function selectAgent(id: string): void {
  post({ type: "select", id });
}

export function setLayout(layout: LayoutName): void {
  post({ type: "setLayout", layout });
}

export function setAccent(accent: AccentName): void {
  post({ type: "setAccent", accent });
}

export function setScope(scope: ScopeName): void {
  post({ type: "setScope", scope });
}

export function refresh(): void {
  post({ type: "refresh" });
}

export function loadConversation(id: string): void {
  post({ type: "loadConversation", id });
}

export function runAction(action: string, payload: Record<string, unknown>): void {
  post({ type: "action", action, payload });
}

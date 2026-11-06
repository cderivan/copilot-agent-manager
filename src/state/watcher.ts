import * as fs from "fs";
import * as vscode from "vscode";

/** Watches the Copilot session-state tree recursively, with a polling fallback. */
export class TranscriptWatcher implements vscode.Disposable {
  private fsWatcher?: fs.FSWatcher;
  private pollTimer?: NodeJS.Timeout;
  private debounceTimer?: NodeJS.Timeout;
  private disposed = false;

  constructor(
    private readonly rootDir: string,
    private readonly onChange: () => void,
    private readonly pollSeconds: number
  ) {}

  start(): void {
    try {
      if (fs.existsSync(this.rootDir)) {
        this.fsWatcher = fs.watch(this.rootDir, { recursive: true }, () => this.schedule());
      }
    } catch {
      // Recursive watching is not available everywhere; polling covers it.
    }
    const intervalMs = Math.max(1, this.pollSeconds) * 1000;
    this.pollTimer = setInterval(() => this.onChange(), intervalMs);
  }

  private schedule(): void {
    if (this.disposed) {
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.onChange(), 300);
  }

  dispose(): void {
    this.disposed = true;
    if (this.fsWatcher) {
      this.fsWatcher.close();
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

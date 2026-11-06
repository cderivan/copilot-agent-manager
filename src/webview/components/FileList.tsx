import type { Agent } from "../../types";
import { runAction } from "../api";

/** Files touched by a single agent. */
export function FileList({ a }: { a: Agent }) {
  const references = a.source === "chat-store";
  if (a.files.length === 0) {
    return (
      <div
        style={{
          color: "var(--cam-text-faint)",
          fontSize: 12,
          textAlign: "center",
          padding: "24px 10px",
        }}
      >
        {references ? "No files referenced yet." : "No files changed yet."}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {a.files.map((file, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            background: "var(--cam-bg-elevated)",
            border: "1px solid var(--cam-border-soft)",
            borderRadius: 5,
          }}
        >
          <span style={{ color: "var(--cam-tool-teal)", fontSize: 12 }}>◧</span>
          <span
            class="mono"
            title={file.toolName ? `${file.path} · ${file.toolName}` : file.path}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              color: "var(--cam-text-body)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.path}
          </span>
          {references ? null : (
            <>
              <span class="mono" style={{ fontSize: 10.5, color: "var(--cam-done)" }}>
                +{file.add}
              </span>
              <span class="mono" style={{ fontSize: 10.5, color: "var(--cam-error)" }}>
                −{file.del}
              </span>
              <button
                class="iconbtn"
                title="Open diff"
                onClick={() =>
                  runAction("openDiff", {
                    transcriptPath: a.transcriptPath,
                    file: file.path,
                    cwd: a.cwd,
                  })
                }
              >
                ⇄
              </button>
            </>
          )}
          <button
            class="iconbtn"
            title="Open file"
            onClick={() => runAction("revealFile", { path: file.path, cwd: a.cwd })}
          >
            ↗
          </button>
        </div>
      ))}
    </div>
  );
}

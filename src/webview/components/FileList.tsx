import type { Agent } from "../../types";
import { runAction } from "../api";

/** Files touched by a single agent. */
export function FileList({ a }: { a: Agent }) {
  if (a.files.length === 0) {
    return (
      <div
        style={{
          color: "#5a5a5a",
          fontSize: 12,
          textAlign: "center",
          padding: "24px 10px",
        }}
      >
        No files changed yet.
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
            background: "#252526",
            border: "1px solid #2d2d2d",
            borderRadius: 5,
          }}
        >
          <span style={{ color: "#4ec9b0", fontSize: 12 }}>◧</span>
          <span
            class="mono"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              color: "#d4d4d4",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.path}
          </span>
          <span class="mono" style={{ fontSize: 10.5, color: "#89d185" }}>
            +{file.add}
          </span>
          <span class="mono" style={{ fontSize: 10.5, color: "#f48771" }}>
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

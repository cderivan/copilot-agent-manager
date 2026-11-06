import type { Agent, AppState } from "../../types";
import { runAction } from "../api";

/** Combined, PR-style list of every file the whole session touched. */
export function SessionChanges({
  state,
  selected,
  open,
  onToggle,
}: {
  state: AppState;
  selected?: Agent;
  open: boolean;
  onToggle: () => void;
}) {
  const session =
    state.sessions.find((candidate) => candidate.id === selected?.sessionId) || state.sessions[0];
  if (!session || session.files.length === 0) {
    return null;
  }
  const added = session.files.reduce((total, file) => total + file.add, 0);
  const removed = session.files.reduce((total, file) => total + file.del, 0);

  return (
    <div style={{ flex: "none", margin: "0 12px 8px" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#252526",
          border: "1px solid #3a3a3b",
          borderRadius: 6,
          padding: "7px 10px",
          cursor: "pointer",
          color: "#cfcfcf",
        }}
      >
        <span style={{ color: "#4ec9b0" }}>◧</span>
        <span style={{ flex: 1, textAlign: "left", fontSize: 12 }}>
          {session.files.length} files changed this session
        </span>
        <span class="mono" style={{ fontSize: 11, color: "#89d185" }}>
          +{added}
        </span>
        <span class="mono" style={{ fontSize: 11, color: "#f48771" }}>
          −{removed}
        </span>
        <span style={{ color: "#7a7a7a" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {session.files.map((file, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                background: "#1e1e1e",
                border: "1px solid #2d2d2d",
                borderRadius: 5,
              }}
            >
              <span style={{ color: "#4ec9b0", fontSize: 12 }}>◧</span>
              <span
                class="mono"
                title={file.path}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 11.5,
                  color: "#d4d4d4",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  direction: "rtl",
                  textAlign: "left",
                }}
              >
                {file.path}
              </span>
              {file.agentCount > 1 && (
                <span
                  style={{ flex: "none", fontSize: 9.5, color: "#7a7a7a" }}
                  title={`${file.agentCount} agents touched this file`}
                >
                  {file.agentCount}×
                </span>
              )}
              <span class="mono" style={{ flex: "none", fontSize: 10.5, color: "#89d185" }}>
                +{file.add}
              </span>
              <span class="mono" style={{ flex: "none", fontSize: 10.5, color: "#f48771" }}>
                −{file.del}
              </span>
              <button
                class="iconbtn"
                title="Open diff"
                onClick={() =>
                  runAction("openDiff", {
                    transcriptPath: file.transcriptPath,
                    file: file.path,
                    cwd: file.cwd,
                  })
                }
              >
                ⇄
              </button>
              <button
                class="iconbtn"
                title="Open file"
                onClick={() => runAction("revealFile", { path: file.path, cwd: file.cwd })}
              >
                ↗
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

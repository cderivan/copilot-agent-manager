import type { Agent, AppState } from "../../types";
import { formatTokens } from "../theme";

export function SessionBanner({ state, selected }: { state: AppState; selected?: Agent }) {
  const session =
    state.sessions.find((candidate) => candidate.id === selected?.sessionId) || state.sessions[0];
  if (!session) {
    return null;
  }
  const active = session.running > 0;
  return (
    <div
      style={{
        flex: "none",
        margin: "0 12px 8px",
        padding: "9px 11px",
        background: "#2d2d2e",
        border: "1px solid #3a3a3b",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        class="dot"
        style={{
          width: 9,
          height: 9,
          background: active ? "#4daafc" : "#7a7a7a",
          boxShadow: active ? "0 0 0 3px rgba(77,170,252,.16)" : "none",
          animation: active ? "pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            color: "#e4e4e4",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {session.title}
        </div>
        <div style={{ fontSize: 11, color: "#8a8a8a", marginTop: 1 }}>
          {session.running} running · {session.done} done · {formatTokens(session.tokens)} tokens
        </div>
      </div>
    </div>
  );
}

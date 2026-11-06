import type { Agent, AppState } from "../../types";
import { formatTokens } from "../theme";
import { SourceBadge } from "./primitives";

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
        background: "var(--cam-bg-raised)",
        border: "1px solid var(--cam-border)",
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
          background: active ? "var(--cam-running)" : "var(--cam-text-dim)",
          boxShadow: active
            ? "0 0 0 3px color-mix(in srgb, var(--cam-running) 16%, transparent)"
            : "none",
          animation: active ? "pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--cam-text-strong)",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {session.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--cam-text-dim)", marginTop: 1 }}>
          {session.running} running · {session.done} done · {formatTokens(session.tokens)} tokens
        </div>
      </div>
      <SourceBadge source={session.source} />
    </div>
  );
}

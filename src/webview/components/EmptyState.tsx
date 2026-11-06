import type { AppState } from "../../types";
import { setScope } from "../api";

export function EmptyState({ state }: { state: AppState }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "var(--cam-text-faint)",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 30, color: "var(--cam-running)", opacity: 0.5 }}>✦</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, maxWidth: 260 }}>
        {state.emptyReason || "No matching agents."}
      </div>
      <button
        class="actionbtn"
        style={{ flex: "none", padding: "5px 12px" }}
        onClick={() => setScope(state.scope === "workspace" ? "all" : "workspace")}
      >
        {state.scope === "workspace" ? "Show all projects" : "Show this workspace"}
      </button>
    </div>
  );
}

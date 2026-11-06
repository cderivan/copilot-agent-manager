import type { AppState, LayoutName } from "../../types";
import { refresh, setAccent, setLayout, setScope } from "../api";
import { accentColor } from "../theme";

const LAYOUTS: Array<{ id: LayoutName; icon: string; label: string }> = [
  { id: "tree", icon: "❏", label: "Tree" },
  { id: "cards", icon: "▤", label: "Cards" },
  { id: "split", icon: "◫", label: "Split" },
];

export function Header({
  state,
  searchMode,
  onToggleSearch,
  onExitSearch,
}: {
  state: AppState;
  searchMode: boolean;
  onToggleSearch: () => void;
  onExitSearch: () => void;
}) {
  return (
    <div
      style={{
        flex: "none",
        padding: "10px 12px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".09em", color: "#bbbbbb" }}>
        {"CLAUDE\u00A0AGENT\u00A0MANAGER"}
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <button
          class={`iconbtn${searchMode ? " active" : ""}`}
          title="Search all conversations"
          onClick={onToggleSearch}
        >
          ⌕
        </button>
        <span style={{ width: 8 }} />
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            class={`iconbtn${!searchMode && state.layout === layout.id ? " active" : ""}`}
            title={`${layout.label} layout`}
            onClick={() => {
              onExitSearch();
              setLayout(layout.id);
            }}
          >
            {layout.icon}
          </button>
        ))}
        <span style={{ width: 8 }} />
        <button
          class="iconbtn"
          title={`Accent: ${state.accent}`}
          onClick={() => setAccent(state.accent === "clay" ? "blue" : "clay")}
        >
          <span
            class="dot"
            style={{ width: 10, height: 10, background: accentColor(state.accent) }}
          />
        </button>
        <button
          class="iconbtn"
          title={`Scope: ${state.scope} (click to toggle)`}
          onClick={() => setScope(state.scope === "workspace" ? "all" : "workspace")}
        >
          {state.scope === "workspace" ? "◳" : "◰"}
        </button>
        <button class="iconbtn" title="Refresh" onClick={() => refresh()}>
          ↻
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "preact/hooks";
import type { Agent, AppState, ConversationMessage } from "../../types";
import { loadConversation, selectAgent } from "../api";
import { STATUS } from "../theme";
import { Conversation } from "./Conversation";
import { ContinueBar } from "./ContinueBar";
import { EmptyState } from "./EmptyState";
import { FileList } from "./FileList";
import { LogTail, SourceBadge, StatusDot } from "./primitives";

type Tab = "activity" | "files" | "conv";

const TABS: Tab[] = ["activity", "files", "conv"];

/** Split layout: master agent list with Activity / Files / Conversation tabs. */
export function SplitView({
  state,
  visible,
  accent,
  conv,
}: {
  state: AppState;
  visible: Agent[];
  accent: string;
  conv: Record<string, ConversationMessage[]>;
}) {
  const [tab, setTab] = useState<Tab>("activity");
  const selected = state.agents.find((agent) => agent.id === state.selectedId);

  useEffect(() => {
    if (tab === "conv" && selected && !conv[selected.id]) {
      loadConversation(selected.id);
    }
  }, [tab, selected?.id]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ flex: "none", height: 240, overflowY: "auto", padding: "0 6px 8px" }}>
        {visible.map((agent) => {
          const status = STATUS[agent.status];
          const active = agent.id === state.selectedId;
          return (
            <div
              key={agent.id}
              class="row"
              onClick={() => selectAgent(agent.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: `5px 8px 5px ${8 + agent.depth * 16}px`,
                borderRadius: 5,
                cursor: "pointer",
                background: active
                  ? `color-mix(in srgb, ${accent} 14%, transparent)`
                  : "transparent",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StatusDot status={agent.status} color={status.color} size={10} />
              </span>
              <div
                class="mono"
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  color: active ? "var(--cam-text-strong)" : "var(--cam-text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {agent.name}
              </div>
              <SourceBadge source={agent.source} />
              <span
                style={{
                  flex: "none",
                  width: 34,
                  height: 3,
                  background: "var(--cam-bg-inset)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${agent.progress ?? Math.min(95, agent.toolCount * 6)}%`,
                    background: status.color,
                  }}
                />
              </span>
            </div>
          );
        })}
        {visible.length === 0 && <EmptyState state={state} />}
      </div>
      <div
        style={{
          flex: "none",
          height: 6,
          background: "var(--cam-bg)",
          borderTop: "1px solid var(--cam-border-soft)",
          borderBottom: "1px solid var(--cam-border)",
        }}
      />
      {selected && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: "var(--cam-bg)",
          }}
        >
          <div style={{ flex: "none", padding: "10px 14px 6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                class="dot"
                style={{ width: 8, height: 8, background: STATUS[selected.status].color }}
              />
              <span
                class="mono"
                style={{
                  fontSize: 13,
                  color: "var(--cam-text-strong)",
                  fontWeight: 600,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selected.name}
              </span>
              {selected.model && (
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--cam-text-dim)",
                    background: "var(--cam-bg-elevated)",
                    border: "1px solid var(--cam-border)",
                    padding: "1px 6px",
                    borderRadius: 8,
                  }}
                >
                  {selected.model}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--cam-text-muted)", marginTop: 4, lineHeight: 1.4 }}>
              {selected.task}
            </div>
          </div>
          <div
            style={{
              flex: "none",
              display: "flex",
              gap: 2,
              padding: "4px 12px 0",
              borderBottom: "1px solid var(--cam-border-soft)",
            }}
          >
            {TABS.map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${tab === id ? accent : "transparent"}`,
                  color: tab === id ? "var(--cam-text-strong)" : "var(--cam-text-dim)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                {id === "activity" ? "Activity" : id === "files" ? "Files" : "Conversation"}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 14px" }}>
            {tab === "activity" && <LogTail lines={selected.logTail} max={40} />}
            {tab === "files" && <FileList a={selected} />}
            {tab === "conv" && <Conversation messages={conv[selected.id]} />}
          </div>
          <div
            style={{
              flex: "none",
              borderTop: "1px solid var(--cam-border-soft)",
              padding: "8px 12px",
            }}
          >
            <ContinueBar t={selected} />
          </div>
        </div>
      )}
    </div>
  );
}

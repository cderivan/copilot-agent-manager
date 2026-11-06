import type { Agent, AppState } from "../../types";
import { STATUS, toolColor } from "../theme";
import { ContinueBar } from "./ContinueBar";
import { EmptyState } from "./EmptyState";
import { LogTail, Progress, SourceBadge, StatusDot, ToolTag } from "./primitives";

/** Tree layout: hierarchical rows with inline detail for the selected agent. */
export function AgentTree({
  state,
  visible,
  accent,
  activeId,
  onAgentClick,
}: {
  state: AppState;
  visible: Agent[];
  accent: string;
  activeId: string | null;
  onAgentClick: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px 16px" }}>
      {visible.map((agent) => {
        const status = STATUS[agent.status];
        const active = agent.id === activeId;
        const indent = 8 + agent.depth * 16;
        return (
          <div key={agent.id}>
            <div
              class="row"
              title={active ? "Click to collapse" : "Click to expand"}
              onClick={() => onAgentClick(agent.id)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: `6px 8px 6px ${indent}px`,
                borderRadius: 5,
                cursor: "pointer",
                background: active
                  ? `color-mix(in srgb, ${accent} 14%, transparent)`
                  : "transparent",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 3,
                  bottom: 3,
                  width: 2,
                  borderRadius: 2,
                  background: active ? accent : "transparent",
                }}
              />
              <span
                style={{
                  flex: "none",
                  width: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StatusDot status={agent.status} color={status.color} />
              </span>
              <span
                class="mono"
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12.5,
                  color: active
                    ? "var(--cam-text-strong)"
                    : agent.status === "error"
                      ? "var(--cam-error)"
                      : "var(--cam-text)",
                  fontWeight: agent.depth === 0 ? 700 : 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {agent.name}
              </span>
              <SourceBadge source={agent.source} />
              {agent.model && (
                <span
                  style={{
                    flex: "none",
                    fontSize: 9.5,
                    color: "var(--cam-text-dim)",
                    background: "var(--cam-bg)",
                    border: "1px solid var(--cam-border)",
                    padding: "1px 5px",
                    borderRadius: 8,
                  }}
                >
                  {agent.model}
                </span>
              )}
            </div>
            {!active && agent.status === "running" && agent.currentToolArg && (
              <div
                class="mono"
                style={{
                  padding: `1px 8px 5px ${indent + 21}px`,
                  fontSize: 11,
                  color: "var(--cam-text-dim)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <ToolTag
                  tag={agent.currentToolTag}
                  arg={agent.currentToolArg}
                  color={toolColor(agent.currentToolTag)}
                />
              </div>
            )}
            {active && (
              <AgentDetail a={agent} indent={6 + agent.depth * 16} />
            )}
          </div>
        );
      })}
      {visible.length === 0 && <EmptyState state={state} />}
    </div>
  );
}

function AgentDetail({ a, indent }: { a: Agent; indent: number }) {
  return (
    <div
      style={{
        margin: `3px 6px 10px ${indent}px`,
        background: "var(--cam-bg)",
        border: "1px solid var(--cam-border)",
        borderRadius: 7,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "9px 11px 8px", borderBottom: "1px solid var(--cam-border-soft)" }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--cam-text-dim)",
            letterSpacing: ".05em",
            fontWeight: 700,
            marginBottom: 3,
          }}
        >
          TASK
        </div>
        <div style={{ fontSize: 12, color: "var(--cam-text-body)", lineHeight: 1.4 }}>{a.task}</div>
      </div>
      <div style={{ padding: "9px 11px" }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--cam-text-dim)",
            letterSpacing: ".05em",
            fontWeight: 700,
            marginBottom: 5,
          }}
        >
          NOW
        </div>
        <div
          class="mono"
          style={{ fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 }}
        >
          {a.status === "running" && (
            <span
              class="dot"
              style={{
                width: 7,
                height: 7,
                background: STATUS[a.status].color,
                animation: "pulse 1s infinite",
              }}
            />
          )}
          <ToolTag
            tag={a.currentToolTag}
            arg={a.currentToolArg || a.task}
            color={toolColor(a.currentToolTag)}
          />
        </div>
      </div>
      <div style={{ padding: "0 11px 9px" }}>
        <Progress a={a} color={STATUS[a.status].color} />
      </div>
      <div
        style={{
          borderTop: "1px solid var(--cam-border-soft)",
          padding: "8px 11px",
          maxHeight: 140,
          overflowY: "auto",
        }}
      >
        <LogTail lines={a.logTail} max={6} />
      </div>
      <div style={{ borderTop: "1px solid var(--cam-border-soft)", padding: "8px 10px" }}>
        <ContinueBar t={a} />
      </div>
    </div>
  );
}

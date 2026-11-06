import type { Agent, AppState } from "../../types";
import { STATUS, toolColor } from "../theme";
import { ContinueBar } from "./ContinueBar";
import { EmptyState } from "./EmptyState";
import { LogTail, Progress, StatusDot, ToolTag } from "./primitives";

/** Cards layout: one live card per agent. */
export function AgentCards({
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
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      {visible.map((agent) => {
        const status = STATUS[agent.status];
        const active = agent.id === activeId;
        return (
          <div
            key={agent.id}
            title={active ? "Click to collapse" : "Click to expand"}
            onClick={() => onAgentClick(agent.id)}
            style={{
              background: "#2b2b2c",
              border: `1px solid ${active ? accent : "#3a3a3b"}`,
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              marginLeft: agent.depth * 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px" }}>
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
                  color: "#e0e0e0",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {agent.name}
              </span>
              <span
                style={{
                  flex: "none",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  color: status.color,
                  background: `${status.color}22`,
                  padding: "2px 6px",
                  borderRadius: 8,
                  textTransform: "uppercase",
                }}
              >
                {status.label}
              </span>
            </div>
            <div
              style={{
                padding: "0 11px 8px",
                fontSize: 11.5,
                color: "#9a9a9a",
                lineHeight: 1.4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {agent.task}
            </div>
            {agent.status === "running" && (
              <div
                class="mono"
                style={{
                  margin: "0 11px 9px",
                  padding: "7px 9px",
                  background: "#1c1c1c",
                  borderRadius: 5,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflow: "hidden",
                }}
              >
                <span
                  class="dot"
                  style={{
                    flex: "none",
                    width: 6,
                    height: 6,
                    background: status.color,
                    animation: "pulse 1s infinite",
                  }}
                />
                <ToolTag
                  tag={agent.currentToolTag}
                  arg={agent.currentToolArg}
                  color={toolColor(agent.currentToolTag)}
                />
              </div>
            )}
            <div style={{ padding: "0 11px 9px" }}>
              <Progress a={agent} color={status.color} />
            </div>
            {active && (
              <div>
                <div
                  style={{
                    borderTop: "1px solid #3a3a3b",
                    padding: "8px 11px",
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                >
                  <LogTail lines={agent.logTail} max={5} />
                </div>
                <div style={{ borderTop: "1px solid #3a3a3b", padding: "7px 10px" }}>
                  <ContinueBar t={agent} />
                </div>
              </div>
            )}
          </div>
        );
      })}
      {visible.length === 0 && <EmptyState state={state} />}
    </div>
  );
}

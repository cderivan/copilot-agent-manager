import type { JSX } from "preact";
import type { Agent, AgentStatus, LogLine } from "../../types";
import { STATUS, formatElapsed, formatTokens, toolColor } from "../theme";

type CSS = JSX.CSSProperties;

export function StatusDot({
  status,
  color,
  size = 11,
}: {
  status: AgentStatus;
  color: string;
  size?: number;
}) {
  if (status === "running") {
    return (
      <span class="spinner" style={{ width: size, height: size, "--c": color } as CSS} />
    );
  }
  return <span class="dot" style={{ width: size - 2, height: size - 2, background: color }} />;
}

export function ToolTag({ tag, arg, color }: { tag: string; arg: string; color: string }) {
  return (
    <span
      class="mono"
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color }}>{tag ? `[${tag}]` : "[idle]"}</span>{" "}
      <span style={{ color: "#bdbdbd" }}>{arg}</span>
    </span>
  );
}

export function Progress({ a, color }: { a: Agent; color: string }) {
  if (a.progress != null) {
    return (
      <div>
        <div
          style={{ height: 5, background: "#2d2d2d", borderRadius: 3, overflow: "hidden" }}
        >
          <div
            style={{
              height: "100%",
              width: `${a.progress}%`,
              background: color,
              transition: "width .5s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 10,
            color: "#7a7a7a",
          }}
        >
          <span>
            {STATUS[a.status].label} · {a.progress}%
          </span>
          <span class="mono">{formatTokens(a.tokens)} tok</span>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#7a7a7a" }}
    >
      <span>
        {STATUS[a.status].label} · {a.toolCount} tools · {formatElapsed(a.elapsedMs)}
      </span>
      <span class="mono">{formatTokens(a.tokens)} tok</span>
    </div>
  );
}

export function LogTail({ lines, max = 6 }: { lines: LogLine[]; max?: number }) {
  const visible = lines.slice(-max);
  return (
    <div>
      {visible.map((line, index) => (
        <div
          key={index}
          class="mono fade-in"
          style={{ fontSize: 11, lineHeight: 1.65, color: "#9a9a9a" }}
        >
          <span style={{ color: "#5a5a5a" }}>{line.time}</span>
          <span style={{ color: line.kind === "error" ? "#f48771" : toolColor(line.tag) }}>
            {" "}
            {line.tag}
          </span>
          <span style={{ color: "#bdbdbd" }}> {line.text}</span>
        </div>
      ))}
      {visible.length === 0 && (
        <div style={{ color: "#5a5a5a", fontSize: 11 }}>No activity yet.</div>
      )}
    </div>
  );
}

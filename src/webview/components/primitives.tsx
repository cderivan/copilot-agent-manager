import type { CSSProperties as CSS } from "preact";
import type { Agent, AgentSource, AgentStatus, LogLine } from "../../types";
import { STATUS, formatElapsed, formatTokens, toolColor } from "../theme";

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

/** Small pill that tells Copilot CLI sessions from VS Code editor chats. */
export function SourceBadge({ source }: { source: AgentSource }) {
  const cli = source === "events";
  const color = cli ? "var(--cam-tool-teal)" : "var(--cam-running)";
  return (
    <span
      title={cli ? "Copilot CLI session" : "VS Code chat session"}
      style={{
        flex: "none",
        fontSize: 7,
        fontWeight: 700,
        lineHeight: 1.55,
        letterSpacing: ".03em",
        textTransform: "uppercase",
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        padding: "0 3px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {cli ? "CLI" : "VS Code"}
    </span>
  );
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
      <span style={{ color: "var(--cam-text-body)" }}>{arg}</span>
    </span>
  );
}

export function Progress({ a, color }: { a: Agent; color: string }) {
  if (a.progress != null) {
    return (
      <div>
        <div
          style={{ height: 5, background: "var(--cam-bg-inset)", borderRadius: 3, overflow: "hidden" }}
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
            color: "var(--cam-text-dim)",
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
      style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--cam-text-dim)" }}
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
          style={{ fontSize: 11, lineHeight: 1.65, color: "var(--cam-text-muted)" }}
        >
          <span style={{ color: "var(--cam-text-faint)" }}>{line.time}</span>
          <span style={{ color: line.kind === "error" ? "var(--cam-error)" : toolColor(line.tag) }}>
            {" "}
            {line.tag}
          </span>
          <span style={{ color: "var(--cam-text-body)" }}> {line.text}</span>
        </div>
      ))}
      {visible.length === 0 && (
        <div style={{ color: "var(--cam-text-faint)", fontSize: 11 }}>No activity yet.</div>
      )}
    </div>
  );
}

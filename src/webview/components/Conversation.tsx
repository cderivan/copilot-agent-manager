import type { ConversationMessage } from "../../types";

export function Conversation({ messages }: { messages?: ConversationMessage[] }) {
  if (messages) {
    if (messages.length === 0) {
      return (
        <div style={{ color: "var(--cam-text-faint)", fontSize: 12, padding: "20px 4px" }}>
          No conversation text.
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {messages.map((message, index) => (
          <div key={index} style={{ display: "flex", gap: 8 }}>
            <span
              style={{
                flex: "none",
                width: 20,
                height: 20,
                borderRadius: 5,
                background:
                  message.role === "user"
                    ? "var(--cam-bg-active)"
                    : "color-mix(in srgb, var(--cam-running) 20%, transparent)",
                color: message.role === "user" ? "var(--cam-text)" : "var(--cam-running)",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {message.avatar}
            </span>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                background: message.role === "user" ? "var(--cam-bg-elevated)" : "var(--cam-bg)",
                border: "1px solid var(--cam-border-soft)",
                borderRadius: 7,
                padding: "7px 10px",
                fontSize: 11.5,
                lineHeight: 1.5,
                color: "var(--cam-text)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ color: "var(--cam-text-faint)", fontSize: 12, padding: "20px 4px" }}>
      Loading conversation…
    </div>
  );
}

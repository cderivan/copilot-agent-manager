import type { ToastInfo } from "../../types";

export function Toast({ toast }: { toast: ToastInfo }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 46,
        background: "var(--cam-bg-raised)",
        border: "1px solid var(--cam-border)",
        borderLeft: `3px solid ${toast.color}`,
        borderRadius: 7,
        padding: "11px 14px",
        maxWidth: 280,
        boxShadow: "0 8px 28px var(--cam-shadow)",
        animation: "toastin .3s ease",
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--cam-text-strong)",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span style={{ color: toast.color }}>{toast.icon}</span>
        {toast.title}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--cam-text-muted)", marginTop: 3 }}>{toast.body}</div>
    </div>
  );
}

import type { ToastInfo } from "../../types";

export function Toast({ toast }: { toast: ToastInfo }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 46,
        background: "#2d2d2e",
        border: "1px solid #3a3a3b",
        borderLeft: `3px solid ${toast.color}`,
        borderRadius: 7,
        padding: "11px 14px",
        maxWidth: 280,
        boxShadow: "0 8px 28px rgba(0,0,0,.5)",
        animation: "toastin .3s ease",
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#e6e6e6",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span style={{ color: toast.color }}>{toast.icon}</span>
        {toast.title}
      </div>
      <div style={{ fontSize: 11.5, color: "#9a9a9a", marginTop: 3 }}>{toast.body}</div>
    </div>
  );
}

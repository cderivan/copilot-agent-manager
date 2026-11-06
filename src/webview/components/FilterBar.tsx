export type StatusFilter = "all" | "running" | "waiting" | "error" | "done";

const FILTERS: Array<[StatusFilter, string]> = [
  ["all", "All"],
  ["running", "Running"],
  ["waiting", "Waiting"],
  ["error", "Error"],
  ["done", "Done"],
];

export function FilterBar({
  filter,
  onFilter,
  statusFilter,
  onStatus,
  accent,
}: {
  filter: string;
  onFilter: (value: string) => void;
  statusFilter: StatusFilter;
  onStatus: (value: StatusFilter) => void;
  accent: string;
}) {
  return (
    <div style={{ flex: "none" }}>
      <div
        style={{
          margin: "0 12px 8px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "var(--cam-bg-inset)",
          border: "1px solid var(--cam-border)",
          borderRadius: 5,
          padding: "5px 9px",
        }}
      >
        <span style={{ color: "var(--cam-text-dim)", fontSize: 13 }}>⌕</span>
        <input
          class="filter"
          value={filter}
          placeholder="Filter agents…"
          onInput={(event) => onFilter((event.target as HTMLInputElement).value)}
        />
      </div>
      <div style={{ margin: "0 12px 6px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            class="chip"
            style={
              statusFilter === id
                ? {
                  color: "var(--cam-text-strong)",
                  borderColor: accent,
                  background: `color-mix(in srgb, ${accent} 16%, transparent)`,
                }
                : {}
            }
            onClick={() => onStatus(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

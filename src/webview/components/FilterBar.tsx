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
          background: "#1c1c1c",
          border: "1px solid #3a3a3b",
          borderRadius: 5,
          padding: "5px 9px",
        }}
      >
        <span style={{ color: "#7a7a7a", fontSize: 13 }}>⌕</span>
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
                ? { color: "#f0f0f0", borderColor: accent, background: `${accent}29` }
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

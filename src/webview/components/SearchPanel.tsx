import type { JSX } from "preact";
import type { ContinueTarget, SearchResult } from "../../types";
import { runAction } from "../api";
import { timeAgo } from "../theme";
import { ContinueBar } from "./ContinueBar";

function highlight(snippet: string, query: string): Array<string | JSX.Element> {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [snippet];
  }
  const haystack = snippet.toLowerCase();
  const parts: Array<string | JSX.Element> = [];
  let index = 0;
  let key = 0;
  for (;;) {
    const hit = haystack.indexOf(needle, index);
    if (hit < 0) {
      parts.push(snippet.slice(index));
      break;
    }
    if (hit > index) {
      parts.push(snippet.slice(index, hit));
    }
    parts.push(<mark key={key++}>{snippet.slice(hit, hit + needle.length)}</mark>);
    index = hit + needle.length;
  }
  return parts;
}

/** Full-text conversation search across all projects. */
export function SearchPanel({
  query,
  setQuery,
  results,
  searching,
  allProjects,
  setAllProjects,
  runNow,
  continueIn,
}: {
  query: string;
  setQuery: (value: string) => void;
  results: SearchResult[];
  searching: boolean;
  allProjects: boolean;
  setAllProjects: (value: boolean) => void;
  runNow: () => void;
  continueIn: ContinueTarget;
}) {
  const trimmed = query.trim();
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          flex: "none",
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
          autofocus
          value={query}
          placeholder="Search all conversations…"
          onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              runNow();
            }
          }}
        />
        {searching && (
          <span
            class="spinner"
            style={{ width: 11, height: 11, "--c": "#4daafc" } as JSX.CSSProperties}
          />
        )}
      </div>
      <div
        style={{
          flex: "none",
          margin: "0 12px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "#8a8a8a",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={allProjects}
            onChange={(event) => setAllProjects((event.target as HTMLInputElement).checked)}
          />
          {" All projects"}
        </label>
        <span style={{ flex: 1 }} />
        {trimmed.length >= 2 && (
          <span>
            {results.length} conversation{results.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 8px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {trimmed.length < 2 && (
          <div
            style={{
              color: "#6a6a6a",
              fontSize: 12,
              padding: "20px 12px",
              lineHeight: 1.6,
            }}
          >
            {
              "Search the full text of every Claude Code conversation. Find a past session by what was said in it, then "
            }
            <b style={{ color: "#9a9a9a" }}>Continue</b> or <b style={{ color: "#9a9a9a" }}>Read</b>{" "}
            it.
          </div>
        )}
        {trimmed.length >= 2 && results.length === 0 && !searching && (
          <div
            style={{
              color: "#5a5a5a",
              fontSize: 12,
              textAlign: "center",
              padding: "30px 10px",
            }}
          >
            No conversations match “{trimmed}”.
          </div>
        )}
        {results.map((result, index) => (
          <div
            key={result.sessionId + index}
            style={{
              border: "1px solid #2d2d2d",
              background: "#1e1e1e",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              class="row"
              title="Open this conversation (Read)"
              onClick={() =>
                runAction("readConversation", {
                  transcriptPath: result.transcriptPath,
                  name: result.agentName,
                })
              }
              style={{ padding: "8px 10px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  class="dot"
                  style={{
                    width: 7,
                    height: 7,
                    flex: "none",
                    background: result.isSubagent ? "#b48ead" : "#4daafc",
                  }}
                />
                <span
                  class="mono"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    color: "#e0e0e0",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {result.projectName || result.agentName}
                </span>
                <span style={{ flex: "none", fontSize: 10, color: "#7a7a7a" }}>
                  {result.matchCount} hit{result.matchCount === 1 ? "" : "s"}
                </span>
                <span style={{ flex: "none", fontSize: 10, color: "#7a7a7a" }}>
                  {timeAgo(result.mtimeMs)}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: "#7a7a7a", marginTop: 2 }}>
                matched in {result.agentName}
                {result.isSubagent ? " (subagent)" : ""}
                {result.agentMatches > 1 ? ` +${result.agentMatches - 1} more` : ""}
              </div>
              <div
                class="mono"
                style={{
                  fontSize: 11,
                  color: "#bdbdbd",
                  marginTop: 4,
                  lineHeight: 1.5,
                  maxHeight: 54,
                  overflow: "hidden",
                }}
              >
                {highlight(result.snippet, trimmed)}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #2d2d2d", padding: "7px 10px" }}>
              <ContinueBar
                t={{
                  sessionId: result.sessionId,
                  cwd: result.cwd,
                  transcriptPath: result.transcriptPath,
                  name: result.agentName,
                }}
                continueIn={continueIn}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

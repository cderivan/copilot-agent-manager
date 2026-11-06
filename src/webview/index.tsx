import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { AppState, ConversationMessage, SearchResult, ToastInfo } from "../types";
import { post, selectAgent } from "./api";
import { AgentCards } from "./components/AgentCards";
import { AgentTree } from "./components/AgentTree";
import { FilterBar, type StatusFilter } from "./components/FilterBar";
import { Header } from "./components/Header";
import { SearchPanel } from "./components/SearchPanel";
import { SessionBanner } from "./components/SessionBanner";
import { SessionChanges } from "./components/SessionChanges";
import { SplitView } from "./components/SplitView";
import { Toast } from "./components/Toast";
import { accentColor } from "./theme";

type IncomingMessage =
  | { type: "state"; state: AppState }
  | { type: "toast"; toast: ToastInfo }
  | { type: "conversation"; agentId: string; messages: ConversationMessage[] }
  | { type: "searchResults"; results: SearchResult[] };

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("running");
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [conv, setConv] = useState<Record<string, ConversationMessage[]>>({});
  const [changesOpen, setChangesOpen] = useState(false);
  const [detailCollapsed, setDetailCollapsed] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [allProjects, setAllProjects] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data as IncomingMessage;
      if (message.type === "state") {
        setState(message.state);
      } else if (message.type === "toast") {
        setToast(message.toast);
        if (toastTimer.current) {
          clearTimeout(toastTimer.current);
        }
        toastTimer.current = setTimeout(() => setToast(null), 4500);
      } else if (message.type === "conversation") {
        setConv((previous) => ({ ...previous, [message.agentId]: message.messages }));
      } else if (message.type === "searchResults") {
        setResults(message.results);
        setSearching(false);
      }
    };
    window.addEventListener("message", onMessage);
    post({ type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!searchMode) {
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      post({ type: "search", query: trimmed, allProjects });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, allProjects, searchMode]);

  const runNow = () => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      setSearching(true);
      post({ type: "search", query: trimmed, allProjects });
    }
  };

  if (!state) {
    return (
      <div style={{ padding: 20, color: "#8a8a8a", fontSize: 12.5 }}>
        Loading Copilot agents…
      </div>
    );
  }

  const accent = accentColor(state.accent);
  const needle = filter.trim().toLowerCase();
  const visible = state.agents.filter((agent) => {
    if (statusFilter !== "all" && agent.status !== statusFilter) {
      return false;
    }
    if (needle) {
      return (
        agent.name.toLowerCase().includes(needle) || agent.task.toLowerCase().includes(needle)
      );
    }
    return true;
  });
  const selected = state.agents.find((agent) => agent.id === state.selectedId);
  const activeId = detailCollapsed ? null : state.selectedId;
  const onAgentClick = (id: string) => {
    if (id === state.selectedId) {
      setDetailCollapsed((collapsed) => !collapsed);
    } else {
      setDetailCollapsed(false);
      selectAgent(id);
    }
  };

  return (
    <div class="app" style={{ position: "relative" }}>
      <Header
        state={state}
        searchMode={searchMode}
        onToggleSearch={() => setSearchMode((open) => !open)}
        onExitSearch={() => setSearchMode(false)}
      />
      {searchMode ? (
        <SearchPanel
          query={query}
          setQuery={setQuery}
          results={results}
          searching={searching}
          allProjects={allProjects}
          setAllProjects={setAllProjects}
          runNow={runNow}
        />
      ) : (
        <>
          <SessionBanner state={state} selected={selected} />
          <SessionChanges
            state={state}
            selected={selected}
            open={changesOpen}
            onToggle={() => setChangesOpen((open) => !open)}
          />
          <FilterBar
            filter={filter}
            onFilter={setFilter}
            statusFilter={statusFilter}
            onStatus={setStatusFilter}
            accent={accent}
          />
          {state.layout === "tree" && (
            <AgentTree
              state={state}
              visible={visible}
              accent={accent}
              activeId={activeId}
              onAgentClick={onAgentClick}
            />
          )}
          {state.layout === "cards" && (
            <AgentCards
              state={state}
              visible={visible}
              accent={accent}
              activeId={activeId}
              onAgentClick={onAgentClick}
            />
          )}
          {state.layout === "split" && (
            <SplitView state={state} visible={visible} accent={accent} conv={conv} />
          )}
        </>
      )}
      {toast && <Toast toast={toast} />}
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  render(<App />, root);
}

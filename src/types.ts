export type AgentStatus = "running" | "done" | "waiting" | "paused" | "error" | "stopped";

export type AccentName = "clay" | "blue";

export type LayoutName = "tree" | "cards" | "split";

export type ScopeName = "workspace" | "all";

/** Where a session was read from: Copilot CLI events or VS Code's chat store. */
export type AgentSource = "events" | "chat-store";

/** One line of a Copilot CLI session's `events.jsonl`. */
export interface CopilotEvent {
  type?: string;
  id?: string;
  timestamp?: string;
  parentId?: string | null;
  /** Set on events produced by a subagent; empty for the main agent. */
  agentId?: string | null;
  data?: Record<string, any>;
  [key: string]: unknown;
}

export type LogLineKind = "tool" | "result" | "text" | "error";

export interface LogLine {
  time: string;
  tag: string;
  text: string;
  kind: LogLineKind;
}

export interface FileChange {
  path: string;
  add: number;
  del: number;
  /** Tool that touched the file, when the source records one. */
  toolName?: string;
}

export interface Agent {
  id: string;
  sessionId: string;
  /** Copilot subagent id, or "" for the main/orchestrator agent. */
  eventAgentId: string;
  source: AgentSource;
  /** True when the session can be reopened with `copilot --resume`. */
  resumable: boolean;
  name: string;
  agentType: string;
  task: string;
  status: AgentStatus;
  model: string;
  depth: number;
  parentId: string | null;
  currentToolTag: string;
  currentToolArg: string;
  progress: number | null;
  toolCount: number;
  tokens: number;
  elapsedMs: number;
  startedAt: string | null;
  updatedAt: string | null;
  logTail: LogLine[];
  files: FileChange[];
  transcriptPath: string;
  cwd: string;
}

export interface SessionFileChange extends FileChange {
  agentCount: number;
  transcriptPath: string;
  cwd: string;
}

export interface SessionSummary {
  id: string;
  source: AgentSource;
  title: string;
  cwd: string;
  gitBranch: string;
  running: number;
  done: number;
  total: number;
  tokens: number;
  mainTranscriptPath: string;
  files: SessionFileChange[];
}

export interface ToastInfo {
  color: string;
  icon: string;
  title: string;
  body: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  avatar: string;
  text: string;
  mono: boolean;
}

export interface SearchResult {
  sessionId: string;
  transcriptPath: string;
  agentName: string;
  isSubagent: boolean;
  source: AgentSource;
  resumable: boolean;
  agentMatches: number;
  projectName: string;
  cwd: string;
  snippet: string;
  matchCount: number;
  mtimeMs: number;
}

/** Settings the render model needs. */
export interface BuildConfig {
  scope: ScopeName;
  accent: AccentName;
  layout: LayoutName;
  activeThresholdSeconds: number;
  maxLogLines: number;
  copilotHome: string;
}

/** Settings the project scanner needs. */
export interface ScanConfig {
  scope: ScopeName;
  maxSessions: number;
  includeChatStore: boolean;
}

export interface AppState {
  scope: ScopeName;
  accent: AccentName;
  layout: LayoutName;
  sessions: SessionSummary[];
  agents: Agent[];
  selectedId: string | null;
  generatedAt: string;
  copilotHome: string;
  empty: boolean;
  emptyReason?: string;
}

export type AgentStatus = "running" | "done" | "waiting" | "paused" | "error" | "stopped";

export type AccentName = "clay" | "blue";

export type LayoutName = "tree" | "cards" | "split";

export type ScopeName = "workspace" | "all";

export type ContinueTarget = "extension" | "terminal";

export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ContentBlock {
  type?: string;
  text?: string;
  thinking?: string;
  name?: string;
  input?: Record<string, any>;
  content?: unknown;
  is_error?: boolean;
  [key: string]: unknown;
}

export interface TranscriptMessage {
  role?: string;
  model?: string;
  content?: string | ContentBlock[];
  usage?: Usage;
}

export interface TranscriptRecord {
  type?: string;
  timestamp?: string;
  cwd?: string;
  message?: TranscriptMessage;
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
}

export interface Agent {
  id: string;
  sessionId: string;
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
  continueIn: ContinueTarget;
  claudeHome: string;
}

/** Settings the project scanner needs. */
export interface ScanConfig {
  scope: ScopeName;
  maxSessions: number;
  maxSubagents: number;
}

export interface AppState {
  scope: ScopeName;
  accent: AccentName;
  layout: LayoutName;
  continueIn: ContinueTarget;
  sessions: SessionSummary[];
  agents: Agent[];
  selectedId: string | null;
  generatedAt: string;
  claudeHome: string;
  empty: boolean;
  emptyReason?: string;
}

import * as path from "path";
import type {
  Agent,
  AgentStatus,
  AppState,
  BuildConfig,
  CopilotEvent,
  LogLine,
  SessionFileChange,
  SessionSummary,
} from "../types";
import type { ChatSessionRecord, ChatToolCall } from "./chatStore";
import type { SessionEntry } from "./discovery";
import {
  buildAgent,
  dataOf,
  eventAgentId,
  findSessionTask,
  formatClock,
  modelLabel,
  parseTimestamp,
} from "./events";
import { parseJsonl, readTail } from "./fsText";

/** Copilot sessions are a single append-only events file; read a generous tail. */
const EVENTS_TAIL_BYTES = 2 * 1024 * 1024;

export interface SubagentSpec {
  agentId: string;
  name: string;
  agentType: string;
  task: string;
  parentAgentId: string;
  depth: number;
}

/** Running subagents, discovered from `subagent.started` and nested by their `task` tool call. */
export function subagentSpecs(events: CopilotEvent[]): Map<string, SubagentSpec> {
  const owners = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "tool.execution_start") {
      continue;
    }
    const callId = String(dataOf(event).toolCallId || "");
    if (callId) {
      owners.set(callId, eventAgentId(event));
    }
  }

  const specs = new Map<string, SubagentSpec>();
  for (const event of events) {
    if (event.type !== "subagent.started") {
      continue;
    }
    const data = dataOf(event);
    const agentId = eventAgentId(event) || String(data.agentId || "");
    if (!agentId || specs.has(agentId)) {
      continue;
    }
    const toolCallId = String(data.toolCallId || "");
    const parentAgentId = toolCallId ? owners.get(toolCallId) || "" : "";
    const parent = parentAgentId ? specs.get(parentAgentId) : undefined;
    specs.set(agentId, {
      agentId,
      name: String(data.agentDisplayName || data.agentName || "subagent").slice(0, 52),
      agentType: String(data.agentType || data.agentName || "subagent"),
      task: String(data.agentDescription || data.agentDisplayName || data.agentName || "subagent"),
      parentAgentId,
      depth: parent ? parent.depth + 1 : 1,
    });
  }
  return specs;
}

/** Main/orchestrator agent plus every subagent spawned in the session. */
export function buildSessionAgents(
  entry: SessionEntry,
  cfg: BuildConfig,
  nowMs: number
): Agent[] {
  const events = parseJsonl(readTail(entry.eventsPath, EVENTS_TAIL_BYTES));
  const meta = entry.meta;
  const specs = subagentSpecs(events);
  const mainEvents = events.filter((event) => {
    const agentId = eventAgentId(event);
    return !agentId || !specs.has(agentId);
  });

  const start = events.find((event) => event.type === "session.start");
  const cwd = (start ? String(dataOf(start).context?.cwd || "") : "") || meta.cwd || "";
  const mainId = `${entry.sessionId}:main`;
  const selected = [...events].reverse().find((event) => event.type === "subagent.selected");
  const selectedAgent = selected ? String(dataOf(selected).agentName || "") : "";
  const name = cwd ? path.basename(cwd) : entry.sessionId.slice(0, 8);

  const main = buildAgent({
    id: mainId,
    sessionId: entry.sessionId,
    name,
    agentType: selectedAgent || "copilot",
    task: findSessionTask(events, meta.name || "(session)"),
    depth: 0,
    parentId: null,
    transcriptPath: entry.eventsPath,
    eventAgentId: "",
    cwd,
    events: mainEvents,
    mtimeMs: entry.mtimeMs,
    cfg,
    nowMs,
  });

  const subagents = [...specs.values()].map((spec) =>
    buildAgent({
      id: `${entry.sessionId}:${spec.agentId}`,
      sessionId: entry.sessionId,
      name: spec.name,
      agentType: spec.agentType,
      task: spec.task,
      depth: spec.depth,
      parentId:
        spec.parentAgentId && specs.has(spec.parentAgentId)
          ? `${entry.sessionId}:${spec.parentAgentId}`
          : mainId,
      transcriptPath: entry.eventsPath,
      eventAgentId: spec.agentId,
      cwd,
      events: events.filter((event) => eventAgentId(event) === spec.agentId),
      mtimeMs: entry.mtimeMs,
      cfg,
      nowMs,
    })
  );

  return [main, ...subagents];
}

/**
 * Chat-store sessions have no tool-call stream: one agent per session, with the
 * recorded turns as its activity log and no subagents.
 */
export function buildChatAgents(
  dbPath: string,
  records: ChatSessionRecord[],
  cfg: BuildConfig,
  nowMs: number
): Agent[] {
  const thresholdMs = cfg.activeThresholdSeconds * 1000;

  return records.map((record) => {
    const createdMs = parseTimestamp(record.createdAt);
    const updatedMs = parseTimestamp(record.updatedAt) || createdMs;
    const status: AgentStatus =
      updatedMs && nowMs - updatedMs < thresholdMs ? "running" : "done";
    const firstTurn = record.turns[0];
    const task = (record.summary || firstTurn?.userMessage || "(session)")
      .replace(/\s+/g, " ")
      .slice(0, 160);

    const tools = record.tools ?? [];
    const lastTool = tools.length ? tools[tools.length - 1] : undefined;
    const toolsByTurn = new Map<number, ChatToolCall[]>();
    for (const tool of tools) {
      const list = toolsByTurn.get(tool.turnIndex);
      if (list) {
        list.push(tool);
      } else {
        toolsByTurn.set(tool.turnIndex, [tool]);
      }
    }

    const logLines: LogLine[] = [];
    for (const turn of record.turns) {
      const time = formatClock(turn.timestamp);
      if (turn.userMessage) {
        logLines.push({
          time,
          tag: "you",
          text: turn.userMessage.replace(/\s+/g, " ").slice(0, 120),
          kind: "text",
        });
      }
      for (const tool of toolsByTurn.get(turn.turnIndex) ?? []) {
        logLines.push({
          time,
          tag: tool.name,
          text: (tool.arg || tool.name).slice(0, 120),
          kind: "tool",
        });
      }
      toolsByTurn.delete(turn.turnIndex);
      if (turn.assistantResponse) {
        logLines.push({
          time,
          tag: "say",
          text: turn.assistantResponse.replace(/\s+/g, " ").slice(0, 140),
          kind: "text",
        });
      }
    }
    for (const remaining of toolsByTurn.values()) {
      const time = formatClock(record.updatedAt);
      for (const tool of remaining) {
        logLines.push({
          time,
          tag: tool.name,
          text: (tool.arg || tool.name).slice(0, 120),
          kind: "tool",
        });
      }
    }
    const logTail = logLines.slice(-cfg.maxLogLines);

    return {
      id: `${record.id}:main`,
      sessionId: record.id,
      eventAgentId: "",
      source: "chat-store",
      resumable: false,
      name: record.agentName || (record.cwd ? path.basename(record.cwd) : record.id.slice(0, 8)),
      agentType: record.agentName || "chat",
      task,
      status,
      model: modelLabel(record.model),
      depth: 0,
      parentId: null,
      currentToolTag: status === "running" && lastTool ? lastTool.name : "",
      currentToolArg: status === "running" && lastTool ? lastTool.arg : "",
      lastToolTag: lastTool?.name || "",
      lastToolArg: lastTool?.arg || "",
      progress: null,
      toolCount: tools.length,
      tokens: 0,
      elapsedMs: createdMs && updatedMs ? Math.max(0, updatedMs - createdMs) : 0,
      startedAt: record.createdAt || null,
      updatedAt: record.updatedAt || null,
      logTail,
      files: record.files.map((file) => ({
        path: file.path,
        add: 0,
        del: 0,
        toolName: file.toolName,
      })),
      transcriptPath: record.path || dbPath,
      cwd: record.cwd,
    };
  });
}

/** Session-wide view of every file touched by the orchestrator and its subagents. */
export function mergeSessionFiles(agents: Agent[]): SessionFileChange[] {
  const merged = new Map<string, SessionFileChange>();
  for (const agent of agents) {
    for (const file of agent.files) {
      const existing = merged.get(file.path);
      if (existing) {
        existing.add += file.add;
        existing.del += file.del;
        existing.agentCount += 1;
        existing.transcriptPath = agent.transcriptPath;
        existing.cwd = agent.cwd || existing.cwd;
        existing.toolName = file.toolName || existing.toolName;
      } else {
        merged.set(file.path, {
          path: file.path,
          add: file.add,
          del: file.del,
          agentCount: 1,
          transcriptPath: agent.transcriptPath,
          cwd: agent.cwd,
          toolName: file.toolName,
        });
      }
    }
  }
  return [...merged.values()].sort((a, b) => b.add + b.del - (a.add + a.del));
}

export interface ChatStoreSource {
  dbPath: string;
  records: ChatSessionRecord[];
}

export function buildState(
  entries: SessionEntry[],
  chat: ChatStoreSource,
  selectedId: string | null,
  cfg: BuildConfig,
  nowMs: number
): AppState {
  const groups: Array<{ summary: SessionSummary; agents: Agent[]; sortMs: number }> = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const sessionAgents = buildSessionAgents(entry, cfg, nowMs);
    seen.add(entry.sessionId);
    const main = sessionAgents[0];
    const lastActivity = sessionAgents.reduce(
      (latest, agent) => Math.max(latest, parseTimestamp(agent.updatedAt)),
      0
    );
    groups.push({
      agents: sessionAgents,
      sortMs: Math.max(entry.mtimeMs, lastActivity),
      summary: {
        id: entry.sessionId,
        source: "events",
        title: main?.task || entry.meta.name || entry.sessionId.slice(0, 8),
        cwd: main?.cwd || entry.meta.cwd,
        gitBranch: entry.meta.gitBranch,
        running: sessionAgents.filter((agent) => agent.status === "running").length,
        done: sessionAgents.filter((agent) => agent.status === "done").length,
        total: sessionAgents.length,
        tokens: sessionAgents.reduce((total, agent) => total + agent.tokens, 0),
        mainTranscriptPath: entry.eventsPath,
        files: mergeSessionFiles(sessionAgents),
      },
    });
  }

  const chatOnly = chat.records.filter((record) => !seen.has(record.id));
  const chatAgents = buildChatAgents(chat.dbPath, chatOnly, cfg, nowMs);
  const chatById = new Map(chatOnly.map((record) => [record.id, record]));
  for (const agent of chatAgents) {
    const record = chatById.get(agent.sessionId);
    groups.push({
      agents: [agent],
      sortMs: parseTimestamp(agent.updatedAt || record?.updatedAt),
      summary: {
        id: agent.sessionId,
        source: "chat-store",
        title: agent.task,
        cwd: agent.cwd,
        gitBranch: record?.gitBranch || "",
        running: agent.status === "running" ? 1 : 0,
        done: agent.status === "done" ? 1 : 0,
        total: 1,
        tokens: agent.tokens,
        mainTranscriptPath: agent.transcriptPath,
        files: mergeSessionFiles([agent]),
      },
    });
  }

  // Most recent activity first, across CLI and VS Code chat sessions alike.
  groups.sort((a, b) => b.sortMs - a.sortMs);
  const agents: Agent[] = groups.flatMap((group) => group.agents);
  const sessions: SessionSummary[] = groups.map((group) => group.summary);

  let selected =
    selectedId && agents.find((agent) => agent.id === selectedId) ? selectedId : null;
  if (!selected) {
    selected = (agents.find((agent) => agent.status === "running") || agents[0])?.id || null;
  }

  return {
    scope: cfg.scope,
    accent: cfg.accent,
    layout: cfg.layout,
    sessions,
    agents,
    selectedId: selected,
    generatedAt: new Date(nowMs).toISOString(),
    copilotHome: cfg.copilotHome,
    empty: agents.length === 0,
    emptyReason:
      agents.length === 0
        ? `No Copilot sessions found under ${cfg.copilotHome}/session-state` +
          (cfg.scope === "workspace"
            ? " or in VS Code's chat store for this workspace. Try switching scope to All projects."
            : " or in VS Code's chat store.")
        : undefined,
  };
}

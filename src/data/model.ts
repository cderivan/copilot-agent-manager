import * as path from "path";
import type {
  Agent,
  AppState,
  BuildConfig,
  SessionFileChange,
  SessionSummary,
} from "../types";
import type { SessionEntry } from "./discovery";
import { parseJsonl, readTail } from "./fsText";
import {
  buildAgent,
  findSessionTask,
  parseTimestamp,
  readAgentMeta,
} from "./transcripts";

/** Main/orchestrator agent plus every subagent transcript, in start order. */
export function buildSessionAgents(
  entry: SessionEntry,
  cfg: BuildConfig,
  nowMs: number
): Agent[] {
  const records = parseJsonl(readTail(entry.mainPath));
  const cwd = records.find((record) => record.cwd)?.cwd || "";
  const name = cwd ? path.basename(cwd) : entry.sessionId.slice(0, 8);
  const mainId = `${entry.sessionId}:main`;

  const main = buildAgent({
    id: mainId,
    sessionId: entry.sessionId,
    name,
    agentType: "orchestrator",
    task: findSessionTask(records) || "(session)",
    depth: 0,
    parentId: null,
    transcriptPath: entry.mainPath,
    records,
    mtimeMs: entry.mtimeMs,
    cfg,
    nowMs,
  });

  const subagents = entry.subagents.map((subagent) => {
    const meta = readAgentMeta(subagent.metaPath);
    const subRecords = parseJsonl(readTail(subagent.jsonlPath));
    const subName = (meta.description || meta.agentType).slice(0, 52);
    return buildAgent({
      id: `${entry.sessionId}:${subagent.fileId}`,
      sessionId: entry.sessionId,
      name: subName,
      agentType: meta.agentType,
      task: meta.description || meta.agentType,
      depth: 1,
      parentId: mainId,
      transcriptPath: subagent.jsonlPath,
      records: subRecords,
      mtimeMs: subagent.mtimeMs,
      cfg,
      nowMs,
    });
  });
  subagents.sort((a, b) => parseTimestamp(a.startedAt) - parseTimestamp(b.startedAt));

  return [main, ...subagents];
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
      } else {
        merged.set(file.path, {
          path: file.path,
          add: file.add,
          del: file.del,
          agentCount: 1,
          transcriptPath: agent.transcriptPath,
          cwd: agent.cwd,
        });
      }
    }
  }
  return [...merged.values()].sort((a, b) => b.add + b.del - (a.add + a.del));
}

export function buildState(
  entries: SessionEntry[],
  selectedId: string | null,
  cfg: BuildConfig,
  nowMs: number
): AppState {
  const agents: Agent[] = [];
  const sessions: SessionSummary[] = [];

  for (const entry of entries) {
    const sessionAgents = buildSessionAgents(entry, cfg, nowMs);
    agents.push(...sessionAgents);
    const main = sessionAgents[0];
    sessions.push({
      id: entry.sessionId,
      title: main?.task || entry.sessionId.slice(0, 8),
      cwd: main?.cwd || "",
      gitBranch: "",
      running: sessionAgents.filter((agent) => agent.status === "running").length,
      done: sessionAgents.filter((agent) => agent.status === "done").length,
      total: sessionAgents.length,
      tokens: sessionAgents.reduce((total, agent) => total + agent.tokens, 0),
      mainTranscriptPath: entry.mainPath,
      files: mergeSessionFiles(sessionAgents),
    });
  }

  let selected =
    selectedId && agents.find((agent) => agent.id === selectedId) ? selectedId : null;
  if (!selected) {
    selected = (agents.find((agent) => agent.status === "running") || agents[0])?.id || null;
  }

  return {
    scope: cfg.scope,
    accent: cfg.accent,
    layout: cfg.layout,
    continueIn: cfg.continueIn,
    sessions,
    agents,
    selectedId: selected,
    generatedAt: new Date(nowMs).toISOString(),
    claudeHome: cfg.claudeHome,
    empty: agents.length === 0,
    emptyReason:
      agents.length === 0
        ? `No Claude Code sessions found under ${cfg.claudeHome}/projects` +
          (cfg.scope === "workspace"
            ? " for this workspace. Try switching scope to All projects."
            : ".")
        : undefined,
  };
}

import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import test from "node:test";
import type { ChatSessionRecord } from "../src/data/chatStore";
import { buildChatAgents, buildSessionAgents, buildState } from "../src/data/model";
import type { BuildConfig } from "../src/types";

const CFG: BuildConfig = {
  scope: "all",
  accent: "clay",
  layout: "tree",
  activeThresholdSeconds: 45,
  maxLogLines: 200,
  copilotHome: "",
};

function sessionDir(events: unknown[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "copilot-agent-manager-"));
  fs.writeFileSync(
    path.join(dir, "events.jsonl"),
    events.map((event) => JSON.stringify(event)).join("\n")
  );
  fs.writeFileSync(
    path.join(dir, "workspace.yaml"),
    "id: s1\ncwd: /work/demo\nbranch: main\nname: Demo session\n"
  );
  return dir;
}

function entryFor(dir: string) {
  return {
    sessionId: "s1",
    dir,
    eventsPath: path.join(dir, "events.jsonl"),
    mtimeMs: Date.now(),
    meta: {
      cwd: "/work/demo",
      gitBranch: "main",
      name: "Demo session",
      clientName: "vscode",
      createdAt: "",
      updatedAt: "",
    },
  };
}

test("buildSessionAgents splits main and subagent event streams", () => {
  const dir = sessionDir([
    { type: "session.start", data: { context: { cwd: "/work/demo" } }, timestamp: "2026-11-06T11:00:00.000Z" },
    { type: "user.message", data: { content: "fix the build" }, timestamp: "2026-11-06T11:00:01.000Z" },
    {
      type: "tool.execution_start",
      data: { toolName: "bash", toolCallId: "t1", arguments: { command: "npm test" } },
      timestamp: "2026-11-06T11:00:02.000Z",
    },
    {
      type: "tool.execution_start",
      data: { toolName: "task", toolCallId: "t2", arguments: { description: "run tests" } },
      timestamp: "2026-11-06T11:00:03.000Z",
    },
    {
      type: "subagent.started",
      data: { agentDisplayName: "Runner", toolCallId: "t2", agentType: "general-purpose" },
      agentId: "a1",
      timestamp: "2026-11-06T11:00:04.000Z",
    },
    {
      type: "tool.execution_start",
      data: { toolName: "view", toolCallId: "t3", arguments: { path: "/work/demo/a.ts" } },
      agentId: "a1",
      timestamp: "2026-11-06T11:00:05.000Z",
    },
    { type: "subagent.completed", data: { totalToolCalls: 1 }, agentId: "a1", timestamp: "2026-11-06T11:00:06.000Z" },
  ]);

  const agents = buildSessionAgents(entryFor(dir), CFG, Date.parse("2026-11-06T11:00:10.000Z"));
  assert.equal(agents.length, 2);

  const [main, sub] = agents;
  assert.equal(main.id, "s1:main");
  assert.equal(main.depth, 0);
  assert.equal(main.parentId, null);
  assert.equal(main.name, "demo");
  assert.equal(main.cwd, "/work/demo");
  assert.equal(main.task, "fix the build");
  assert.equal(main.toolCount, 2);
  assert.equal(main.status, "running");

  assert.equal(sub.id, "s1:a1");
  assert.equal(sub.depth, 1);
  assert.equal(sub.parentId, "s1:main");
  assert.equal(sub.name, "Runner");
  assert.equal(sub.task, "Runner");
  assert.equal(sub.toolCount, 1);
  assert.equal(sub.status, "done");
  assert.equal(sub.transcriptPath, path.join(dir, "events.jsonl"));
});

const CHAT_RECORD: ChatSessionRecord = {
  id: "c1",
  cwd: "/work/chat",
  repository: "",
  gitBranch: "main",
  summary: "Fix the chat",
  agentName: "GitHub Copilot Chat",
  createdAt: "2026-11-06T10:00:00.000Z",
  updatedAt: "2026-11-06T10:05:00.000Z",
  turns: [
    {
      turnIndex: 0,
      userMessage: "hi",
      assistantResponse: "yo",
      timestamp: "2026-11-06T10:00:01.000Z",
    },
  ],
  files: [
    { path: "/work/chat/a.ts", toolName: "read_file", turnIndex: 0 },
    { path: "/work/chat/b.ts", toolName: "edit", turnIndex: 1 },
  ],
};

test("buildChatAgents exposes referenced files without line counts", () => {
  const now = Date.parse("2026-11-06T10:06:00.000Z");
  const agents = buildChatAgents("/tmp/session-store.db", [CHAT_RECORD], CFG, now);
  assert.equal(agents.length, 1);

  const [agent] = agents;
  assert.equal(agent.source, "chat-store");
  assert.equal(agent.resumable, false);
  assert.equal(agent.status, "done");
  assert.equal(agent.transcriptPath, "/tmp/session-store.db");
  assert.deepEqual(
    agent.files.map((file) => [file.path, file.add, file.del, file.toolName]),
    [
      ["/work/chat/a.ts", 0, 0, "read_file"],
      ["/work/chat/b.ts", 0, 0, "edit"],
    ]
  );
});

test("buildState carries chat-store files onto the session summary", () => {
  const now = Date.parse("2026-11-06T10:06:00.000Z");
  const state = buildState(
    [],
    { dbPath: "/tmp/session-store.db", records: [CHAT_RECORD] },
    null,
    CFG,
    now
  );
  assert.equal(state.sessions.length, 1);
  const session = state.sessions[0];
  assert.equal(session.source, "chat-store");
  assert.equal(session.files.length, 2);
  assert.equal(session.files[0].toolName, "read_file");
  assert.equal(session.files[0].agentCount, 1);
  assert.equal(state.agents[0].files.length, 2);
});

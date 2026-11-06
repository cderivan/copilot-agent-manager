import assert from "node:assert/strict";
import test from "node:test";
import {
  collectFileChanges,
  currentTool,
  deriveStatus,
  describeToolCall,
  findSessionTask,
  modelLabel,
  todoProgress,
  totalTokens,
} from "../src/data/events";
import { subagentSpecs } from "../src/data/model";
import type { CopilotEvent } from "../src/types";

const NOW = Date.parse("2026-11-06T12:00:00.000Z");
const ACTIVE_MS = 45_000;

function ev(
  type: string,
  data: Record<string, unknown> = {},
  extra: Partial<CopilotEvent> = {}
): CopilotEvent {
  return { type, data, timestamp: "2026-11-06T11:59:50.000Z", ...extra };
}

test("deriveStatus: fresh activity is running", () => {
  const events = [ev("tool.execution_start", { toolName: "view" })];
  assert.equal(deriveStatus(events, NOW - 1_000, ACTIVE_MS, NOW), "running");
});

test("deriveStatus: stale activity is done", () => {
  const events = [ev("assistant.message", { content: "done" })];
  assert.equal(deriveStatus(events, NOW - 10 * 60_000, ACTIVE_MS, NOW), "done");
});

test("deriveStatus: a trailing session error wins over recency", () => {
  const events = [ev("assistant.message", { content: "..." }), ev("session.error", { message: "quota" })];
  assert.equal(deriveStatus(events, NOW, ACTIVE_MS, NOW), "error");
});

test("deriveStatus: shutdown ends the run", () => {
  assert.equal(deriveStatus([ev("session.shutdown")], NOW, ACTIVE_MS, NOW), "done");
});

test("deriveStatus: failed task_complete is an error", () => {
  const events = [ev("session.task_complete", { success: false })];
  assert.equal(deriveStatus(events, NOW, ACTIVE_MS, NOW), "error");
});

test("deriveStatus: a completed subagent is done", () => {
  const events = [ev("subagent.started"), ev("subagent.completed", { totalToolCalls: 3 })];
  assert.equal(deriveStatus(events, NOW, ACTIVE_MS, NOW), "done");
});

test("describeToolCall prefers paths, then commands, and truncates", () => {
  assert.equal(describeToolCall({ path: "/a/b.ts" }), "/a/b.ts");
  assert.equal(describeToolCall({ command: "npm test" }), "npm test");
  assert.equal(describeToolCall({ pattern: "foo" }), "foo");
  assert.equal(describeToolCall({ todos: [1, 2] }), "2 todos");
  assert.equal(describeToolCall({}), "");
  const long = describeToolCall({ command: "x".repeat(300) });
  assert.equal(long.length, 118);
});

test("collectFileChanges counts lines for edit and create", () => {
  const events = [
    ev("tool.execution_start", {
      toolName: "edit",
      arguments: { path: "/a.ts", old_str: "a\nb", new_str: "a\nb\nc" },
    }),
    ev("tool.execution_start", {
      toolName: "create",
      arguments: { path: "/b.ts", file_text: "x\ny" },
    }),
    ev("tool.execution_start", { toolName: "view", arguments: { path: "/c.ts" } }),
  ];
  assert.deepEqual(collectFileChanges(events), [
    { path: "/a.ts", add: 3, del: 2 },
    { path: "/b.ts", add: 2, del: 0 },
  ]);
});

test("currentTool skips already-completed calls", () => {
  const events = [
    ev("tool.execution_start", { toolName: "view", toolCallId: "t1", arguments: { path: "/a" } }),
    ev("tool.execution_complete", { toolCallId: "t1", success: true }),
    ev("tool.execution_start", {
      toolName: "bash",
      toolCallId: "t2",
      arguments: { command: "npm test" },
    }),
  ];
  assert.deepEqual(currentTool(events), { tag: "bash", arg: "npm test" });
});

test("subagentSpecs nests grandchildren through the owning task call", () => {
  const events = [
    ev("tool.execution_start", { toolCallId: "t1", toolName: "task", arguments: {} }),
    ev("subagent.started", { agentDisplayName: "child", toolCallId: "t1" }, { agentId: "a1" }),
    ev(
      "tool.execution_start",
      { toolCallId: "t2", toolName: "task", arguments: {} },
      { agentId: "a1" }
    ),
    ev("subagent.started", { agentDisplayName: "grandchild", toolCallId: "t2" }, { agentId: "a2" }),
  ];
  const specs = subagentSpecs(events);
  assert.equal(specs.size, 2);
  assert.equal(specs.get("a1")?.depth, 1);
  assert.equal(specs.get("a1")?.name, "child");
  assert.equal(specs.get("a2")?.depth, 2);
  assert.equal(specs.get("a2")?.parentAgentId, "a1");
});

test("totalTokens sums input, output and cache writes", () => {
  const events = [
    ev("session.usage_record", { usage: { inputTokens: 100, outputTokens: 20, cacheWriteTokens: 5 } }),
    ev("session.usage_record", { usage: { inputTokens: 10, outputTokens: 1 } }),
    ev("usage in the wrong place", { usage: { inputTokens: 999 } }),
  ];
  assert.equal(totalTokens(events), 136);
});

test("todoProgress reports completed todos only", () => {
  const events = [
    ev("tool.execution_start", {
      toolName: "todowrite",
      arguments: {
        todos: [
          { status: "done" },
          { status: "completed" },
          { status: "in_progress" },
          { status: "pending" },
        ],
      },
    }),
  ];
  assert.equal(todoProgress(events), 50);
  assert.equal(todoProgress([]), null);
});

test("findSessionTask uses the first non-empty user prompt", () => {
  const events = [
    ev("user.message", { content: "" }),
    ev("user.message", { content: "  fix the build  " }),
  ];
  assert.equal(findSessionTask(events, "fallback"), "fix the build");
  assert.equal(findSessionTask([], "fallback"), "fallback");
});

test("modelLabel strips the custom endpoint prefix", () => {
  assert.equal(modelLabel("customendpoint/freellmapi/auto"), "freellmapi/auto");
  assert.equal(modelLabel("gpt-6-luna"), "gpt-6-luna");
  assert.equal(modelLabel(undefined), "");
});

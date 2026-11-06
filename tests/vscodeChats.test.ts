import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import type { ChatSessionRecord } from "../src/data/chatStore";
import {
  mergeChatRecords,
  readVscodeChatFile,
  readVscodeChats,
} from "../src/data/vscodeChats";

function writeSession(lines: unknown[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cam-vscode-chat-"));
  const file = path.join(dir, "chat-1.jsonl");
  fs.writeFileSync(file, lines.map((line) => JSON.stringify(line)).join("\n"));
  return file;
}

const SNAPSHOT = {
  kind: 0,
  v: {
    sessionId: "chat-1",
    creationDate: 1_770_000_000_000,
    responderUsername: "GitHub Copilot",
    requests: [],
  },
};

const REQUEST = {
  requestId: "r1",
  timestamp: 1_770_000_001_000,
  responseTimestamp: 1_770_000_003_000,
  agent: { fullName: "GitHub Copilot", name: "agent" },
  modelId: "copilot/gpt-5-mini",
  message: { text: "Fix the build" },
  contentReferences: [{ reference: "file:///work/demo/a.ts" }],
  response: [
    { kind: "thinking", value: "private reasoning" },
    { value: "Done" },
  ],
};

test("readVscodeChatFile replays set and append operations", () => {
  const file = writeSession([
    SNAPSHOT,
    { kind: 2, k: ["requests"], v: [REQUEST] },
    { kind: 2, k: ["requests", 0, "response"], v: [{ value: " and tested." }] },
    { kind: 1, k: ["customTitle"], v: "Named chat" },
    {
      kind: 2,
      k: ["requests", 0, "response"],
      v: [
        {
          kind: "toolInvocationSerialized",
          toolId: "copilot_readFile",
          invocationMessage: {
            uris: { "file:///work/demo/b.ts": { scheme: "file", path: "/work/demo/b.ts" } },
          },
        },
      ],
    },
  ]);

  const record = readVscodeChatFile(file, "/work/demo");
  assert.ok(record);
  assert.equal(record.id, "chat-1");
  assert.equal(record.path, file);
  assert.equal(record.cwd, "/work/demo");
  assert.equal(record.summary, "Named chat");
  assert.equal(record.agentName, "GitHub Copilot");
  assert.equal(record.model, "copilot/gpt-5-mini");
  assert.deepEqual(record.tools, [{ name: "read", arg: "/work/demo/b.ts", turnIndex: 0 }]);
  assert.equal(record.createdAt, new Date(1_770_000_000_000).toISOString());
  assert.equal(record.updatedAt, new Date(1_770_000_003_000).toISOString());
  assert.equal(record.turns.length, 1);
  assert.equal(record.turns[0].userMessage, "Fix the build");
  assert.equal(record.turns[0].assistantResponse, "Done and tested.");
  assert.deepEqual(
    record.files.map((fileRef) => fileRef.path).sort(),
    ["/work/demo/a.ts", "/work/demo/b.ts"]
  );
  assert.equal(
    record.files.find((fileRef) => fileRef.path === "/work/demo/b.ts")?.toolName,
    "copilot_readFile"
  );
});

test("readVscodeChatFile caches an unchanged file", () => {
  const file = writeSession([SNAPSHOT, { kind: 2, k: ["requests"], v: [REQUEST] }]);
  const first = readVscodeChatFile(file);
  assert.equal(readVscodeChatFile(file), first);
});

test("readVscodeChats finds sessions under workspace storage and maps the cwd", () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "cam-user-"));
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cam-workspace-"));
  const storage = path.join(userDir, "workspaceStorage", "hash1");
  fs.mkdirSync(path.join(storage, "chatSessions"), { recursive: true });
  fs.writeFileSync(
    path.join(storage, "workspace.json"),
    JSON.stringify({ folder: pathToFileURL(workspace).toString() })
  );
  fs.writeFileSync(
    path.join(storage, "chatSessions", "chat-1.jsonl"),
    [SNAPSHOT, { kind: 2, k: ["requests"], v: [REQUEST] }].map((line) => JSON.stringify(line)).join("\n")
  );

  const records = readVscodeChats(userDir);
  assert.equal(records.length, 1);
  assert.equal(records[0].cwd, workspace);
});

test("mergeChatRecords keeps store metadata and richer native turns", () => {
  const file = writeSession([SNAPSHOT, { kind: 2, k: ["requests"], v: [REQUEST] }]);
  const native = readVscodeChatFile(file, "/work/native");
  assert.ok(native);

  const stored: ChatSessionRecord = {
    id: "chat-1",
    path: "/tmp/session-store.db",
    cwd: "/work/stored",
    repository: "demo",
    gitBranch: "main",
    summary: "Stored summary",
    agentName: "GitHub Copilot Chat",
    createdAt: "2026-11-06T10:00:00.000Z",
    updatedAt: "2026-11-06T10:00:00.000Z",
    turns: [{ turnIndex: 0, userMessage: "hi", assistantResponse: "yo", timestamp: "" }],
    files: [{ path: "/work/stored/c.ts", toolName: "read_file", turnIndex: 0 }],
  };

  const [merged] = mergeChatRecords([stored], [native]);
  assert.equal(merged.cwd, "/work/stored");
  assert.equal(merged.gitBranch, "main");
  assert.equal(merged.summary, "Stored summary");
  assert.equal(merged.agentName, "GitHub Copilot Chat");
  assert.equal(merged.path, file);
  assert.equal(merged.turns[0].assistantResponse, "Done");
  assert.equal(merged.updatedAt, "2026-11-06T10:00:00.000Z");
  assert.equal(merged.files.length, 2);
});

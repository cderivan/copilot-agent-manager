import assert from "node:assert/strict";
import * as path from "path";
import test from "node:test";
import { chatStoreMessages, readChatStore } from "../src/data/chatStore";

const FIXTURE = path.join(__dirname, "fixtures", "chat-store.db");

test("readChatStore maps sessions to their turns", () => {
  const sessions = readChatStore(FIXTURE);
  assert.equal(sessions.length, 2);

  const first = sessions.find((session) => session.id === "s1");
  assert.ok(first);
  assert.equal(first.cwd, "/work/proj");
  assert.equal(first.gitBranch, "devel");
  assert.equal(first.summary, "Fix the tests");
  assert.equal(first.agentName, "GitHub Copilot Chat");
  assert.equal(first.turns.length, 2);
  assert.deepEqual(first.turns.map((turn) => turn.turnIndex), [0, 1]);
  assert.equal(first.turns[0].userMessage, "hello");
});

test("readChatStore hides sessions whose turns carry no text", () => {
  const sessions = readChatStore(FIXTURE);
  assert.equal(sessions.find((session) => session.id === "s3"), undefined);
  assert.deepEqual(sessions.map((session) => session.id), ["s1", "s2"]);
});

test("readChatStore maps referenced files in turn order", () => {
  const sessions = readChatStore(FIXTURE);
  const first = sessions.find((session) => session.id === "s1");
  const second = sessions.find((session) => session.id === "s2");
  assert.ok(first && second);

  assert.deepEqual(
    first.files.map((file) => [file.path, file.toolName, file.turnIndex]),
    [
      ["/work/proj/a.ts", "read_file", 0],
      ["/work/proj/src/b.ts", "edit", 1],
    ]
  );
  assert.deepEqual(
    second.files.map((file) => [file.path, file.toolName]),
    [["/work/other/c.rs", "read_file"]]
  );
});

test("readChatStore returns the cached copy for an unchanged file", () => {
  const first = readChatStore(FIXTURE);
  const second = readChatStore(FIXTURE);
  assert.equal(first, second);
});

test("chatStoreMessages renders user and assistant turns", () => {
  const messages = chatStoreMessages(FIXTURE, "s1");
  assert.deepEqual(
    messages.slice(0, 2).map((message) => [message.role, message.avatar]),
    [
      ["user", "U"],
      ["assistant", "✦"],
    ]
  );
  assert.equal(chatStoreMessages(FIXTURE, "missing").length, 0);
});

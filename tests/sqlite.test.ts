import assert from "node:assert/strict";
import * as path from "path";
import test from "node:test";
import { readTables } from "../src/data/sqlite";

const FIXTURE = path.join(__dirname, "fixtures", "chat-store.db");

test("readTables reads table rows with column names", () => {
  const tables = readTables(FIXTURE, ["sessions", "turns"]);
  const sessions = tables.get("sessions") ?? [];
  assert.equal(sessions.length, 3);
  assert.equal(sessions[0].id, "s1");
  assert.equal(sessions[0].cwd, "/work/proj");
  assert.equal(sessions[0].branch, "devel");
  assert.equal(sessions[1].id, "s2");
  assert.equal(sessions[1].summary, "Refactor parser");
  assert.equal(sessions[2].id, "s3");
});

test("readTables returns nulls and integers", () => {
  const tables = readTables(FIXTURE, ["turns"]);
  const turns = tables.get("turns") ?? [];
  assert.equal(turns.length, 4);
  assert.equal(turns[0].session_id, "s1");
  assert.equal(turns[0].turn_index, 0);
  assert.equal(turns[0].assistant_response, "hi there");
  const emptyTurn = turns.find((turn) => turn.session_id === "s3");
  assert.ok(emptyTurn);
  assert.equal(emptyTurn.user_message, "");
  assert.equal(emptyTurn.assistant_response, "   ");
});

test("readTables follows overflow pages for large payloads", () => {
  const tables = readTables(FIXTURE, ["turns"]);
  const turns = tables.get("turns") ?? [];
  const longTurn = turns.find((turn) => turn.turn_index === 1);
  assert.ok(longTurn, "expected the long turn");
  const text = String(longTurn.assistant_response);
  assert.ok(text.length > 4096, `expected an overflow payload, got ${text.length} chars`);
  assert.ok(text.endsWith("done"));
});

test("readTables rejects a non-SQLite file", () => {
  assert.throws(() => readTables(path.join(__dirname, "..", "..", "package.json"), ["sessions"]));
});

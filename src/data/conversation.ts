import type { ConversationMessage, TranscriptRecord } from "../types";
import { parseJsonl, readText } from "./fsText";
import {
  contentBlocks,
  describeToolCall,
  formatClock,
  textOf,
  toolResultBlocks,
  toolUseBlocks,
} from "./transcripts";

function truncate(value: string, max: number): string {
  if (value.length > max) {
    return `${value.slice(0, max)}…`;
  }
  return value;
}

/** A user turn that only carries tool results is not conversation text. */
function isToolResultOnly(record: TranscriptRecord): boolean {
  const blocks = contentBlocks(record);
  return (
    toolResultBlocks(record).length > 0 &&
    blocks.length > 0 &&
    blocks.every((block) => block.type === "tool_result")
  );
}

/** Compact feed of the recent conversation, for the webview's Conversation tab. */
export function conversationMessages(transcriptPath: string): ConversationMessage[] {
  const records = parseJsonl(readText(transcriptPath)).slice(-500);
  const messages: ConversationMessage[] = [];

  for (const record of records) {
    const role = record.message?.role;
    if (role !== "user" && role !== "assistant") {
      continue;
    }
    if (role === "user") {
      if (isToolResultOnly(record)) {
        continue;
      }
      const text = textOf(record);
      if (text) {
        messages.push({ role, avatar: "U", text: truncate(text, 1200), mono: false });
      }
      continue;
    }
    const text = textOf(record);
    if (text) {
      messages.push({ role, avatar: "✳", text: truncate(text, 1200), mono: false });
    }
    for (const block of toolUseBlocks(record)) {
      messages.push({
        role: "assistant",
        avatar: "→",
        text: `[${block.name}] ${describeToolCall(block)}`.trim(),
        mono: true,
      });
    }
  }
  return messages.slice(-80);
}

/** Readable Markdown rendering of a transcript, opened via a virtual document. */
export function conversationMarkdown(transcriptPath: string, title: string): string {
  const records = parseJsonl(readText(transcriptPath)).slice(-500);
  const lines: string[] = [
    `# ${title}`,
    "",
    "_Formatted view of the agent's conversation._",
    "",
  ];

  for (const record of records) {
    const role = record.message?.role;
    if (role !== "user" && role !== "assistant") {
      continue;
    }
    const time = formatClock(record.timestamp);
    if (role === "user") {
      if (isToolResultOnly(record)) {
        continue;
      }
      const text = textOf(record);
      if (text) {
        lines.push(`### \u{1F9D1} You \u00B7 ${time}`, "", text, "");
      }
      continue;
    }
    const text = textOf(record);
    const tools = toolUseBlocks(record);
    if (text) {
      lines.push(`### \u2733 Claude \u00B7 ${time}`, "", text, "");
    }
    for (const block of tools) {
      lines.push(`- \`${block.name}\` ${describeToolCall(block)}`.trimEnd());
    }
    if (tools.length) {
      lines.push("");
    }
  }

  if (lines.length <= 4) {
    lines.push("_No conversation text found in the recent transcript tail._");
  }
  return lines.join("\n");
}

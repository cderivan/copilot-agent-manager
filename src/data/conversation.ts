import type { ConversationMessage, CopilotEvent } from "../types";
import { dataOf, describeToolCall, eventAgentId, formatClock, textOfEvent } from "./events";
import { parseJsonl, readText } from "./fsText";
import { subagentSpecs } from "./model";

function truncate(value: string, max: number): string {
  if (value.length > max) {
    return `${value.slice(0, max)}…`;
  }
  return value;
}

/** Events belonging to one agent: a subagent's own, or the main agent's. */
function scopedEvents(transcriptPath: string, agentId: string): CopilotEvent[] {
  const events = parseJsonl(readText(transcriptPath));
  const specs = subagentSpecs(events);
  return events.filter((event) => {
    const id = eventAgentId(event);
    return agentId ? id === agentId : !id || !specs.has(id);
  });
}

function toolRequestsOf(event: CopilotEvent): Array<Record<string, any>> {
  const requests = dataOf(event).toolRequests;
  return Array.isArray(requests) ? (requests as Array<Record<string, any>>) : [];
}

/** Compact feed of the recent conversation, for the webview's Conversation tab. */
export function conversationMessages(
  transcriptPath: string,
  agentId = ""
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  for (const event of scopedEvents(transcriptPath, agentId).slice(-500)) {
    if (event.type === "user.message") {
      const text = textOfEvent(event);
      if (text) {
        messages.push({ role: "user", avatar: "U", text: truncate(text, 1200), mono: false });
      }
      continue;
    }
    if (event.type !== "assistant.message") {
      continue;
    }
    const text = textOfEvent(event);
    if (text) {
      messages.push({ role: "assistant", avatar: "✦", text: truncate(text, 1200), mono: false });
    }
    for (const request of toolRequestsOf(event)) {
      const args =
        request.arguments && typeof request.arguments === "object" ? request.arguments : {};
      messages.push({
        role: "assistant",
        avatar: "→",
        text: `[${String(request.name || "tool")}] ${describeToolCall(args)}`.trim(),
        mono: true,
      });
    }
  }
  return messages.slice(-80);
}

/** Readable Markdown rendering of a conversation, opened via a virtual document. */
export function conversationMarkdown(
  transcriptPath: string,
  title: string,
  agentId = ""
): string {
  const lines: string[] = [
    `# ${title}`,
    "",
    "_Formatted view of the agent's conversation._",
    "",
  ];

  for (const event of scopedEvents(transcriptPath, agentId).slice(-500)) {
    const time = formatClock(event.timestamp);
    if (event.type === "user.message") {
      const text = textOfEvent(event);
      if (text) {
        lines.push(`### \u{1F9D1} You \u00B7 ${time}`, "", text, "");
      }
      continue;
    }
    if (event.type !== "assistant.message") {
      continue;
    }
    const text = textOfEvent(event);
    if (text) {
      lines.push(`### \u2733 Copilot \u00B7 ${time}`, "", text, "");
    }
    const requests = toolRequestsOf(event);
    for (const request of requests) {
      const args =
        request.arguments && typeof request.arguments === "object" ? request.arguments : {};
      lines.push(`- \`${String(request.name || "tool")}\` ${describeToolCall(args)}`.trimEnd());
    }
    if (requests.length) {
      lines.push("");
    }
  }

  if (lines.length <= 4) {
    lines.push("_No conversation text found in the recent session events._");
  }
  return lines.join("\n");
}

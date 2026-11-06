import { runAction } from "../api";

export interface ContinueTargetAgent {
  sessionId: string;
  cwd?: string;
  transcriptPath: string;
  name: string;
  /** Copilot subagent id, when this row is a subagent. */
  agentId?: string;
  /** Chat-store sessions cannot be resumed with `copilot --resume`. */
  resumable?: boolean;
  source?: "events" | "chat-store";
}

const PRIMARY_STYLE = {
  borderColor: "var(--cam-button-hover)",
  background: "var(--cam-button-bg)",
  color: "var(--cam-button-fg)",
};

/** Continue / Read / Copy id actions for one agent. */
export function ContinueBar({ t }: { t: ContinueTargetAgent }) {
  return (
    <div style={{ display: "flex", gap: 7 }}>
      {t.resumable === false ? null : (
        <button
          class="actionbtn"
          title="Resume this session with `copilot --resume`"
          style={{ ...PRIMARY_STYLE, flex: 1 }}
          onClick={() =>
            runAction("continueSession", {
              sessionId: t.sessionId,
              cwd: t.cwd,
            })
          }
        >
          Continue
        </button>
      )}
      <button
        class="actionbtn"
        title="Open a readable, formatted view of this agent's conversation"
        onClick={() =>
          runAction("readConversation", {
            transcriptPath: t.transcriptPath,
            name: t.name,
            agentId: t.agentId,
            sessionId: t.sessionId,
            source: t.source,
          })
        }
      >
        Read
      </button>
      <button
        class="actionbtn"
        onClick={() => runAction("copySession", { sessionId: t.sessionId })}
      >
        Copy id
      </button>
    </div>
  );
}

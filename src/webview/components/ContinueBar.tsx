import { Fragment } from "preact";
import { useState } from "preact/hooks";
import type { ContinueTarget } from "../../types";
import { runAction, setContinueIn } from "../api";

export interface ContinueTargetAgent {
  sessionId: string;
  cwd?: string;
  transcriptPath: string;
  name: string;
}

const TARGETS: Array<{ id: ContinueTarget; label: string; hint: string }> = [
  {
    id: "extension",
    label: "Claude Code (editor)",
    hint: "Resume in the Claude Code extension, in the editor",
  },
  {
    id: "terminal",
    label: "Terminal (CLI)",
    hint: "Resume via claude --resume in a terminal",
  },
];

const PRIMARY_STYLE = {
  borderColor: "#1177bb",
  background: "#0e639c",
  color: "#fff",
};

/** Continue / Read / Copy id actions, with a "continue opens in…" dropdown. */
export function ContinueBar({
  t,
  continueIn,
}: {
  t: ContinueTargetAgent;
  continueIn: ContinueTarget;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = TARGETS.find((target) => target.id === continueIn) || TARGETS[0];

  const go = (target: ContinueTarget) => {
    setMenuOpen(false);
    runAction("continueSession", {
      sessionId: t.sessionId,
      cwd: t.cwd,
      target,
    });
  };

  const pick = (target: ContinueTarget) => {
    setContinueIn(target);
    go(target);
  };

  return (
    <div style={{ display: "flex", gap: 7, position: "relative" }}>
      <div style={{ display: "flex", flex: 1 }}>
        <button
          class="actionbtn"
          title={`Continue this session \u2014 ${active.label}`}
          style={{
            ...PRIMARY_STYLE,
            flex: 1,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
          onClick={() => go(continueIn)}
        >
          Continue
        </button>
        <button
          class="actionbtn"
          title="Choose where Continue opens"
          style={{
            ...PRIMARY_STYLE,
            flex: "none",
            padding: "5px 7px",
            borderLeft: "1px solid rgba(255,255,255,.28)",
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ▾
        </button>
      </div>
      <button
        class="actionbtn"
        title="Open a readable, formatted view of this agent's conversation"
        onClick={() => runAction("readConversation", { transcriptPath: t.transcriptPath, name: t.name })}
      >
        Read
      </button>
      <button
        class="actionbtn"
        onClick={() => runAction("copySession", { sessionId: t.sessionId })}
      >
        Copy id
      </button>
      {menuOpen && (
        <Fragment>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 60 }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: 5,
              background: "#252526",
              border: "1px solid #3a3a3b",
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,.5)",
              zIndex: 61,
              minWidth: 200,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                fontSize: 9.5,
                color: "#7a7a7a",
                letterSpacing: ".06em",
                fontWeight: 700,
                borderBottom: "1px solid #2d2d2d",
              }}
            >
              CONTINUE OPENS IN…
            </div>
            {TARGETS.map((option) => (
              <div
                key={option.id}
                title={option.hint}
                onClick={() => pick(option.id)}
                class="row"
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  color: "#dcdcdc",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ width: 12, flex: "none", color: "#89d185" }}>
                  {continueIn === option.id ? "✓" : ""}
                </span>
                {option.label}
              </div>
            ))}
          </div>
        </Fragment>
      )}
    </div>
  );
}

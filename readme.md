<div align="center">

<img src="https://github.com/cderivan/claude-agent-manager/raw/HEAD/media/icon.png" width="118" alt="Claude Agent Manager" />

# Claude Agent Manager

### See exactly what your Claude Code agents — and every subagent — are doing, **live**, without leaving VS Code.

[![Version](https://img.shields.io/visual-studio-marketplace/v/Damilola.claude-agent-manager?style=flat-square&label=VS%20Code%20Marketplace&color=d97757)](https://marketplace.visualstudio.com/items?itemName=Damilola.claude-agent-manager)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/Damilola.claude-agent-manager?style=flat-square&color=d97757)](https://marketplace.visualstudio.com/items?itemName=Damilola.claude-agent-manager)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/Damilola.claude-agent-manager?style=flat-square&color=d97757)](https://marketplace.visualstudio.com/items?itemName=Damilola.claude-agent-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/dammyboss/claude-agent-manager/blob/HEAD/LICENSE)

**100% local · read-only · zero config**

</div>

---

> When Claude Code spins up an orchestrator and a swarm of subagents, the terminal scrolls too fast to follow. **Claude Agent Manager** turns that firehose into a calm, live dashboard — the full agent tree, what each one is doing *right now*, what it changed, what it cost, and every conversation you've ever had — searchable in a keystroke.

<div align="center">

<img src="https://github.com/dammyboss/claude-agent-manager/raw/HEAD/media/demo.gif" width="820" alt="Claude Agent Manager — live demo: agent tree, search, continue, full-screen" />

</div>

---

## Why you'll want it

- 👀 **Never lose track of a subagent again.** A live tree shows the orchestrator → every subagent, with status, current tool, and progress.
- 🧭 **Understand a run at a glance** instead of scrolling thousands of terminal lines.
- 🔎 **Find any past conversation by what was said in it** — across every project — and jump right back in.
- 💎 **Beautiful, native, and safe.** Pure VS Code styling, read-only, all on your machine. It never touches your running sessions.

---

## ✨ Features

### 🌳 Live agent & subagent tree
Your whole run, structured. The main/orchestrator agent with its subagents nested underneath — names and tasks pulled straight from Claude Code. Spinners for running, badges for `done` / `error` / `waiting`, token counts, and TodoWrite-based progress when it's real (never a fake bar).

<!-- <img src="https://github.com/dammyboss/claude-agent-manager/raw/HEAD/media/screenshot-tree.png" width="820" alt="Agent tree" /> -->

### ⚡ "Right now" — the current tool call
For every running agent, see the exact tool in flight (`Edit src/auth/session.ts`, `Bash npm test`, `Grep …`) plus a **live streaming activity log** that updates as it works.

<!-- <img src="https://github.com/dammyboss/claude-agent-manager/raw/HEAD/media/screenshot-activity.png" width="820" alt="Live activity" /> -->

### 🔍 Search every conversation (full-text)
Hit the **search** icon and type a keyword. Claude Agent Manager scans the full text of **every transcript on your machine** with ripgrep — sub-second — and returns the matching conversations (subagent hits folded in), each with a highlighted snippet. Then **Continue** or **Read** it in one click.

<!-- <img src="https://github.com/dammyboss/claude-agent-manager/raw/HEAD/media/screenshot-search.png" width="820" alt="Conversation search" /> -->

### ▶️ Continue any session — your way
Pick up right where a session left off. The **Continue** button resumes it in **Claude Code's editor view** *or* a **terminal** (`claude --resume`) — your choice, from a dropdown that remembers your default.

### 📂 Session-wide changes
One combined, PR-style view of **every file the whole run touched** — across the orchestrator and all subagents — with `+/−` counts and one-click diffs of exactly what changed.

<!-- <img src="https://github.com/dammyboss/claude-agent-manager/raw/HEAD/media/screenshot-changes.png" width="820" alt="Session changes" /> -->

### 📖 Readable conversations (not raw JSON)
Open any agent's conversation as a **clean, formatted Markdown view** — prompts, replies, and tool calls — instead of squinting at raw `.jsonl`.

### 🖥️ Sidebar *or* full-screen editor
Live in the activity bar, or pop the whole dashboard out into a **full-screen editor tab** — both stay in sync.

### 🎛️ Three layouts, one click
Switch between **Tree** (hierarchy + inline detail), **Cards** (one live card per agent), and **Split** (master list + Activity / Files / Conversation tabs).

### 🔔 Status bar + finish notifications
A glanceable status-bar chip (`✦ 2 running · 1.2M tok`) even when the panel is closed, plus a toast when an agent **finishes** or **errors**.

---

## 🚀 Getting started

1. **Install** Claude Agent Manager from the Marketplace (or `code --install-extension claude-agent-manager-x.y.z.vsix`).
2. Click the **Claude Agent Manager** icon in the activity bar.
3. Run Claude Code as usual — ideally a task that spawns subagents — and watch it light up. ✨

> 🔎 **Seeing nothing?** First open is scoped to your current workspace. Click the **scope toggle** in the header (or run **“Claude Agents: Toggle Scope”**) to show **all projects**.

No setup, no API keys, no sign-in. It reads the transcripts Claude Code already writes under `~/.claude/projects`.

---

## ⚙️ Settings

All under `claudeAgentManager.*`:

| Setting | Default | Description |
| --- | --- | --- |
| `scope` | `workspace` | Monitor the current folder only, or **all** projects. |
| `defaultLayout` | `tree` | `tree` · `cards` · `split`. |
| `continueIn` | `extension` | Where **Continue** opens: Claude Code **editor** or a **terminal**. |
| `accent` | `clay` | Accent color (`clay` or `blue`). |
| `notifyOnFinish` | `true` | Toast when an agent finishes or errors. |
| `activeThresholdSeconds` | `45` | A transcript touched within this window counts as *running*. |
| `maxSessions` | `6` | Most recent sessions to monitor. |
| `maxSubagents` | `16` | Most recent subagents shown per session. |
| `maxLogLines` | `200` | Log lines kept per agent. |
| `pollSeconds` | `4` | File-watch fallback poll interval. |
| `claudeHome` | `""` | Override the Claude home dir (else `CLAUDE_CONFIG_DIR` → `~/.claude`). |

---

## 🛡️ Private & safe by design

- **Read-only.** It observes the transcripts Claude Code already writes — it never sends input to, pauses, or interferes with your agents.
- **100% local.** No network calls, no telemetry, no accounts. Your conversations never leave your machine.
- **Fast on huge runs.** Multi-megabyte transcripts are tail-read incrementally, never loaded whole in the hot path.

<details>
<summary><b>How it works</b></summary>

```
~/.claude/projects/<project>/
  <sessionId>.jsonl            ← main session (the orchestrator agent)
  <sessionId>/subagents/
    agent-<id>.jsonl           ← one transcript per subagent
    agent-<id>.meta.json       ← { agentType, description }
```

The extension scans these, watches them for changes, folds the records into a live agent model, and renders it. Status and progress are *derived* from the transcripts (Claude Code has no status field), so they're heuristic and tunable via settings.
</details>

---

## 🗺️ Roadmap

- 💵 Cost in **$** (token usage × model pricing, per agent / session / day)
- 📊 Usage analytics (per-tool breakdown, context-window %, cache-hit rate)
- 🕓 Session history & trends

Ideas or bugs? [Open an issue](https://github.com/dammyboss/claude-agent-manager/issues).

---

## ❓ FAQ

**Does it work without any setup?** Yes — if you use Claude Code, it just works.

**Can it control or stop my agents?** No, by design. Claude Code exposes no external control API, so this is a safe, read-only monitor. **Continue** launches a fresh resume via the CLI/extension; it never injects into a live run.

**Does it send my data anywhere?** Never. Everything stays on your machine.

**“Continue → Claude Code (editor)” isn't resuming?** It uses the official Claude Code extension; if that isn't installed, Continue falls back to a terminal automatically.

---

## 📄 License

[MIT](https://github.com/dammyboss/claude-agent-manager/blob/HEAD/LICENSE) © Damilola Onadeinde

<div align="center">

**If Claude Agent Manager makes your agent runs clearer, please ⭐ the repo and leave a Marketplace review!**

</div>

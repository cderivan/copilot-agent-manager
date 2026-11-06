"use strict";
const hasOwnProperty = Object.prototype.hasOwnProperty;
const Yt = (e, t)=>{
    for(var n in t){
        Object.defineProperty(e, n, {
            get: t[n],
            enumerable: true
        });
    }
};
const ut = (e, t, n, s)=>{
    if (t && typeof t === "object" || typeof t === "function") {
        for (let o of Object.getOwnPropertyNames(t)){
            if (!hasOwnProperty.call(e, o) && o !== n) {
                Object.defineProperty(e, o, {
                    get: ()=>t[o],
                    enumerable: !(s = Object.getOwnPropertyDescriptor(t, o)) || s.enumerable
                });
            }
        }
    }
    return e;
};
const f = (e, t, n)=>{
    n = e != null ? Object.create(Object.getPrototypeOf(e)) : {};
    return ut(t || !e || !e.__esModule ? Object.defineProperty(n, "default", {
        value: e,
        enumerable: true
    }) : n, e);
};
const Xt = (e)=>ut(Object.defineProperty({}, "__esModule", {
        value: true
    }), e);
const De = {};
Yt(De, {
    activate: ()=>Re,
    deactivate: ()=>Pe
});
module.exports = Xt(De);
var g = f(require("vscode"));
var I = f(require("path"));
var C = f(require("fs"));
var Lt = f(require("os"));
var p = f(require("vscode"));
const mt = f(require("fs"));
const ht = f(require("path"));
var b = f(require("fs"));
function B(e, t = 262144) {
    let n;
    try {
        n = b.openSync(e, "r");
        let s = b.fstatSync(n).size;
        let o = Math.max(0, s - t);
        let r = s - o;
        if (r <= 0) {
            return "";
        }
        let i = Buffer.alloc(r);
        b.readSync(n, i, 0, r, o);
        let a = i.toString("utf8");
        if (o > 0) {
            let d = a.indexOf(`
`);
            if (d >= 0) {
                a = a.slice(d + 1);
            }
        }
        return a;
    } catch  {
        return "";
    } finally{
        if (n !== undefined) {
            b.closeSync(n);
        }
    }
}
function W(e, t = 8 * 1024 * 1024) {
    try {
        if (b.statSync(e).size <= t) {
            return b.readFileSync(e, "utf8");
        }
        return B(e, t);
    } catch  {
        return "";
    }
}
function T(e) {
    let t = [];
    for (let n of e.split(`
`)){
        let s = n.trim();
        if (s) {
            try {
                t.push(JSON.parse(s));
            } catch  {}
        }
    }
    return t;
}
function A(e) {
    let t = e.message?.content;
    if (Array.isArray(t)) {
        return t;
    }
    if (typeof t === "string") {
        return [
            {
                type: "text",
                text: t
            }
        ];
    }
    return [];
}
function x(e) {
    return A(e).filter((t)=>t.type === "tool_use");
}
function H(e) {
    return A(e).filter((t)=>t.type === "tool_result");
}
function R(e) {
    return A(e).filter((t)=>t.type === "text" && typeof t.text === "string").map((t)=>t.text).join(`
`).trim();
}
function lt(records) {
    let t = 0;
    for (let n of records){
        let s = n.message?.usage;
        if (s) {
            t += (s.input_tokens || 0) + (s.output_tokens || 0);
            t += s.cache_creation_input_tokens || 0;
        }
    }
    return t;
}
function E(e) {
    let t = e.input || {};
    let n = t.file_path || t.path || t.command || t.pattern || t.query || t.url || t.description || t.prompt || t.notebook_path || "";
    let s = String(n).replace(/\s+/g, " ").trim();
    if (s.length > 120) {
        return `${s.slice(0, 117)}…`;
    }
    return s;
}
function pt({ content }) {
    if (typeof content === "string") {
        return content;
    }
    if (Array.isArray(content)) {
        return content.map((n)=>{
            if (typeof n === "string") {
                return n;
            }
            return n?.text || "";
        }).join(" ").trim();
    }
    return "";
}
function L(e) {
    if (!e) {
        return 0;
    }
    let t = Date.parse(e);
    if (Number.isNaN(t)) {
        return 0;
    }
    return t;
}
function vt(timestamp) {
    let t = L(timestamp);
    if (!t) {
        return "";
    }
    let n = new Date(t);
    let s = (o)=>String(o).padStart(2, "0");
    return `${s(n.getHours())}:${s(n.getMinutes())}:${s(n.getSeconds())}`;
}
function P(e) {
    if (typeof e !== "string" || e.length === 0) {
        return 0;
    }
    return e.split(`
`).length;
}
function Zt(e) {
    if (e) {
        return e.replace(/^claude-/, "").replace(/-\d{6,8}$/, "").replace(/\[1m\]$/, "");
    }
    return "";
}
function Kt(metaPath) {
    try {
        let t = JSON.parse(mt.readFileSync(metaPath, "utf8"));
        return {
            agentType: String(t.agentType || t.subagent_type || "subagent"),
            description: String(t.description || "")
        };
    } catch  {
        return {
            agentType: "subagent",
            description: ""
        };
    }
}
function Qt(records) {
    let t = new Map;
    let n = (path, o, r)=>{
        if (!path) {
            return;
        }
        let i = t.get(path) || {
            path,
            add: 0,
            del: 0
        };
        i.add += o;
        i.del += r;
        t.set(path, i);
    };
    for (let s of records){
        for (let o of x(s)){
            let r = o.input || {};
            if (o.name === "Edit") {
                n(r.file_path, P(r.new_string), P(r.old_string));
            } else if (o.name === "MultiEdit" && Array.isArray(r.edits)) {
                for (let i of r.edits){
                    n(r.file_path, P(i.new_string), P(i.old_string));
                }
            } else {
                if (o.name === "Write") {
                    n(r.file_path, P(r.content), 0);
                } else if (o.name === "NotebookEdit") {
                    n(r.notebook_path || r.file_path, P(r.new_source || r.new_string), 0);
                }
            }
        }
    }
    return [
        ...t.values()
    ];
}
function te(records) {
    let t = null;
    for (let s of records){
        for (let o of x(s)){
            if (o.name === "TodoWrite" && Array.isArray(o.input?.todos)) {
                t = o.input.todos;
            }
        }
    }
    if (!t || t.length === 0) {
        return null;
    }
    let length = t.filter((s)=>(s.status || s.state) === "completed").length;
    return Math.round(length / t.length * 100);
}
function ee(records, maxLogLines) {
    let n = [];
    for (let s of records){
        let time = vt(s.timestamp);
        for (let r of A(s)){
            if (r.type === "tool_use") {
                n.push({
                    time,
                    tag: r.name || "Tool",
                    text: E(r),
                    kind: "tool"
                });
            } else if (r.type === "tool_result") {
                let i = pt(r).replace(/\s+/g, " ").slice(0, 100);
                if (r.is_error) {
                    n.push({
                        time,
                        tag: "Error",
                        text: i || "error",
                        kind: "error"
                    });
                } else if (i) {
                    n.push({
                        time,
                        tag: "·",
                        text: i,
                        kind: "result"
                    });
                }
            } else if (r.type === "text" && typeof r.text === "string") {
                let i = r.text.replace(/\s+/g, " ").trim();
                if (i) {
                    n.push({
                        time,
                        tag: "say",
                        text: i.slice(0, 140),
                        kind: "text"
                    });
                }
            }
        }
    }
    return n.slice(-maxLogLines);
}
function ne(records) {
    for(let t = records.length - 1; t >= 0; t--){
        let n = x(records[t]);
        if (n.length) {
            let s = n[n.length - 1];
            return {
                tag: s.name || "",
                arg: E(s)
            };
        }
    }
    return {
        tag: "",
        arg: ""
    };
}
function se(records, mtimeMs, n, nowMs) {
    if (records.length === 0) {
        return "waiting";
    }
    let o = nowMs - mtimeMs < n;
    let r = false;
    for (let i of records){
        for (let a of H(i)){
            r = !!a.is_error;
        }
    }
    if (o && r) {
        return "error";
    }
    if (o) {
        return "running";
    }
    return "done";
}
function oe(e) {
    for (let t of e){
        if (t.type === "user" && t.message?.role === "user") {
            let n = H(t).length > 0;
            let s = R(t);
            if (s && !n) {
                return s.replace(/\s+/g, " ").slice(0, 160);
            }
        }
    }
    return "";
}
function re(records) {
    for(let t = records.length - 1; t >= 0; t--){
        let n = records[t].message?.model;
        if (n) {
            return Zt(n);
        }
    }
    return "";
}
function gt(e) {
    let { records, cfg, nowMs, mtimeMs } = e;
    let r = cfg.activeThresholdSeconds * 1000;
    let status = se(records, mtimeMs, r, nowMs);
    let a = status === "running" ? ne(records) : {
        tag: "",
        arg: ""
    };
    let toolCount = records.reduce((acc, record)=>acc + x(record).length, 0);
    let startedAt = records.length && records[0].timestamp || null;
    let updatedAt = records.length && records[records.length - 1].timestamp || null;
    let l = L(startedAt || undefined);
    let m = status === "running" ? nowMs : L(updatedAt || undefined) || nowMs;
    let $ = records.find((S)=>S.cwd)?.cwd || "";
    return {
        id: e.id,
        sessionId: e.sessionId,
        name: e.name,
        agentType: e.agentType,
        task: e.task,
        status,
        model: re(records),
        depth: e.depth,
        parentId: e.parentId,
        currentToolTag: a.tag,
        currentToolArg: a.arg,
        progress: te(records),
        toolCount,
        tokens: lt(records),
        elapsedMs: l ? Math.max(0, m - l) : 0,
        startedAt,
        updatedAt,
        logTail: ee(records, cfg.maxLogLines),
        files: Qt(records),
        transcriptPath: e.transcriptPath,
        cwd: $
    };
}
function ie(e, cfg, nowMs) {
    let records = T(B(e.mainPath));
    let o = records.find((c)=>c.cwd)?.cwd || "";
    let r = o ? ht.basename(o) : e.sessionId.slice(0, 8);
    let i = `${e.sessionId}:main`;
    let a = gt({
        id: i,
        sessionId: e.sessionId,
        name: r,
        agentType: "orchestrator",
        task: oe(records) || "(session)",
        depth: 0,
        parentId: null,
        transcriptPath: e.mainPath,
        records,
        mtimeMs: e.mtimeMs,
        cfg,
        nowMs
    });
    let d = e.subagents.map((c)=>{
        let u = Kt(c.metaPath);
        let records = T(B(c.jsonlPath));
        let m = (u.description || u.agentType).slice(0, 52);
        return gt({
            id: `${e.sessionId}:${c.fileId}`,
            sessionId: e.sessionId,
            name: m,
            agentType: u.agentType,
            task: u.description || u.agentType,
            depth: 1,
            parentId: i,
            transcriptPath: c.jsonlPath,
            records,
            mtimeMs: c.mtimeMs,
            cfg,
            nowMs
        });
    });
    d.sort((c, u)=>L(c.startedAt || undefined) - L(u.startedAt || undefined));
    return [
        a,
        ...d
    ];
}
function ae(e) {
    let t = new Map;
    for (let n of e){
        for (let s of n.files){
            let o = t.get(s.path);
            if (o) {
                o.add += s.add;
                o.del += s.del;
                o.agentCount += 1;
                o.transcriptPath = n.transcriptPath;
                o.cwd = n.cwd || o.cwd;
            } else {
                t.set(s.path, {
                    path: s.path,
                    add: s.add,
                    del: s.del,
                    agentCount: 1,
                    transcriptPath: n.transcriptPath,
                    cwd: n.cwd
                });
            }
        }
    }
    return [
        ...t.values()
    ].sort((n, s)=>s.add + s.del - (n.add + n.del));
}
function bt(e, selectedId, n, s) {
    let agents = [];
    let sessions = [];
    for (let a of e){
        let d = ie(a, n, s);
        agents.push(...d);
        let c = d[0];
        sessions.push({
            id: a.sessionId,
            title: c?.task || a.sessionId.slice(0, 8),
            cwd: c?.cwd || "",
            gitBranch: "",
            running: d.filter((u)=>u.status === "running").length,
            done: d.filter((u)=>u.status === "done").length,
            total: d.length,
            tokens: d.reduce((acc, item)=>acc + item.tokens, 0),
            mainTranscriptPath: a.mainPath,
            files: ae(d)
        });
    }
    let i = selectedId && agents.find((a)=>a.id === selectedId) ? selectedId : null;
    if (!i) {
        i = (agents.find((a)=>a.status === "running") || agents[0])?.id || null;
    }
    return {
        scope: n.scope,
        accent: n.accent,
        layout: n.layout,
        continueIn: n.continueIn,
        sessions,
        agents,
        selectedId: i,
        generatedAt: new Date(s).toISOString(),
        claudeHome: n.claudeHome,
        empty: agents.length === 0,
        emptyReason: agents.length === 0 ? `No Claude Code sessions found under ${n.claudeHome}/projects` + (n.scope === "workspace" ? " for this workspace. Try switching scope to All projects." : ".") : undefined
    };
}
function ft(e, t) {
    if (e.length > t) {
        return `${e.slice(0, t)}…`;
    }
    return e;
}
function wt(e) {
    let t = A(e);
    return H(e).length > 0 && t.length > 0 && t.every((n)=>n.type === "tool_result");
}
function yt(transcriptPath) {
    let t = T(W(transcriptPath)).slice(-500);
    let n = [];
    for (let s of t){
        let role = s.message?.role;
        if (role !== "user" && role !== "assistant") {
            continue;
        }
        if (role === "user") {
            if (wt(s)) {
                continue;
            }
            let i = R(s);
            if (i) {
                n.push({
                    role,
                    avatar: "U",
                    text: ft(i, 1200),
                    mono: false
                });
            }
            continue;
        }
        let r = R(s);
        if (r) {
            n.push({
                role,
                avatar: "✳",
                text: ft(r, 1200),
                mono: false
            });
        }
        for (let i of x(s)){
            n.push({
                role: "assistant",
                avatar: "→",
                text: `[${i.name}] ${E(i)}`.trim(),
                mono: true
            });
        }
    }
    return n.slice(-80);
}
function xt(transcriptPath, t) {
    let n = T(W(transcriptPath)).slice(-500);
    let s = [
        `# ${t}`,
        "",
        "_Formatted view of the agent's conversation._",
        ""
    ];
    for (let o of n){
        let r = o.message?.role;
        if (r !== "user" && r !== "assistant") {
            continue;
        }
        let i = vt(o.timestamp);
        if (r === "user") {
            if (wt(o)) {
                continue;
            }
            let c = R(o);
            if (c) {
                s.push(`### \u{1F9D1} You \xB7 ${i}`, "", c, "");
            }
            continue;
        }
        let a = R(o);
        let d = x(o);
        if (a) {
            s.push(`### \u2733 Claude \xB7 ${i}`, "", a, "");
        }
        for (let c of d){
            s.push(`- \`${c.name}\` ${E(c)}`.trimEnd());
        }
        if (d.length) {
            s.push("");
        }
    }
    if (s.length <= 4) {
        s.push("_No conversation text found in the recent transcript tail._");
    }
    return s.join(`
`);
}
var w = f(require("vscode"));
var St = "claude-agent-before";
var Ct = "claude-agent-after";
class z {
    constructor(){
        this.store = new Map;
        this.emitter = new w.EventEmitter;
        this.onDidChange = this.emitter.event;
    }
    set(t, n) {
        this.store.set(t.toString(), n);
        this.emitter.fire(t);
    }
    provideTextDocumentContent(t) {
        return this.store.get(t.toString()) ?? "";
    }
}
var kt = new z;
var Tt = new z;
var ce = 0;
function Mt(e) {
    e.subscriptions.push(w.workspace.registerTextDocumentContentProvider(St, kt), w.workspace.registerTextDocumentContentProvider(Ct, Tt));
}
async function At(file, oldText, newText) {
    let s = file.split(/[\\/]/).pop() || "change";
    let o = ce++;
    let r = w.Uri.parse(`${St}:/${o}/${s}`);
    let i = w.Uri.parse(`${Ct}:/${o}/${s}`);
    kt.set(r, oldText);
    Tt.set(i, newText);
    await w.commands.executeCommand("vscode.diff", r, i, `${s} \u2014 agent change`);
}
var v = f(require("vscode"));
var Rt = "claude-convo";
class st {
    constructor(){
        this.store = new Map;
        this.emitter = new v.EventEmitter;
        this.onDidChange = this.emitter.event;
    }
    set(t, n) {
        this.store.set(t.toString(), n);
        this.emitter.fire(t);
    }
    provideTextDocumentContent(t) {
        return this.store.get(t.toString()) ?? "# (empty)";
    }
}
var Pt = new st;
var de = 0;
function Dt(e) {
    e.subscriptions.push(v.workspace.registerTextDocumentContentProvider(Rt, Pt));
}
async function It(e, t) {
    let n = e.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40) || "conversation";
    let s = v.Uri.parse(`${Rt}:/${de++}/${n}.md`);
    Pt.set(s, t);
    let o = await v.workspace.openTextDocument(s);
    await v.languages.setTextDocumentLanguage(o, "markdown");
    try {
        await v.commands.executeCommand("markdown.showPreview", s);
    } catch  {
        await v.window.showTextDocument(o, {
            preview: true
        });
    }
}
var h = f(require("fs"));
var y = f(require("path"));
var _t = require("child_process");
var it = f(require("vscode"));
var q = f(require("os"));
var J = f(require("path"));
var $t = f(require("fs"));
var ot = f(require("vscode"));
function rt() {
    let e = ot.workspace.getConfiguration("claudeAgentManager").get("claudeHome", "").trim();
    if (e) {
        return jt(e);
    }
    let CLAUDE_CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR;
    if (CLAUDE_CONFIG_DIR && CLAUDE_CONFIG_DIR.trim()) {
        return jt(CLAUDE_CONFIG_DIR.trim());
    }
    return J.join(q.homedir(), ".claude");
}
function D() {
    return J.join(rt(), "projects");
}
function jt(e) {
    if (e === "~") {
        return q.homedir();
    }
    if (e.startsWith("~/")) {
        return J.join(q.homedir(), e.slice(2));
    }
    return e;
}
function ue(fsPath) {
    return fsPath.replace(/[^a-zA-Z0-9]/g, "-");
}
function V() {
    return (ot.workspace.workspaceFolders ?? []).map((t)=>ue(t.uri.fsPath));
}
function M(e) {
    try {
        return $t.statSync(e).isDirectory();
    } catch  {
        return false;
    }
}
var le = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
function pe() {
    let e = process.platform === "win32" ? "rg.exe" : "rg";
    let t = [
        y.join(it.env.appRoot, "node_modules", "@vscode", "ripgrep", "bin", e),
        y.join(it.env.appRoot, "node_modules.asar.unpacked", "@vscode", "ripgrep", "bin", e)
    ];
    for (let n of t){
        try {
            if (h.existsSync(n)) {
                return n;
            }
        } catch  {}
    }
    return e;
}
function ge(e) {
    let t = D();
    if (!M(t)) {
        return [];
    }
    if (e) {
        return [
            t
        ];
    }
    let n = V().map((s)=>y.join(t, s)).filter(M);
    if (n.length) {
        return n;
    }
    return [
        t
    ];
}
function fe(e, t = 8192) {
    try {
        let n = h.openSync(e, "r");
        let s = Math.min(t, h.fstatSync(n).size);
        let o = Buffer.alloc(s);
        h.readSync(n, o, 0, s, 0);
        h.closeSync(n);
        return o.toString("utf8");
    } catch  {
        return "";
    }
}
function me(transcriptPath) {
    let n = fe(transcriptPath).split(`
`).find((s)=>s.trim());
    if (!n) {
        return "";
    }
    try {
        return String(JSON.parse(n).cwd || "");
    } catch  {
        return "";
    }
}
function he(transcriptPath) {
    try {
        let t = JSON.parse(h.readFileSync(transcriptPath.replace(/\.jsonl$/, ".meta.json"), "utf8"));
        return String(t.description || t.agentType || "subagent").slice(0, 52);
    } catch  {
        return "subagent";
    }
}
function ve(e) {
    if (typeof e === "string") {
        return e;
    }
    if (!e || typeof e !== "object") {
        return "";
    }
    if (e.type === "text") {
        return e.text || "";
    }
    if (e.type === "thinking") {
        return e.thinking || e.text || "";
    }
    if (e.type === "tool_use") {
        let t = e.input || {};
        return `${e.name || ""} ${t.command || t.file_path || t.description || t.pattern || t.query || ""}`;
    }
    if (e.type === "tool_result") {
        let t = e.content;
        if (typeof t === "string") {
            return t;
        }
        if (Array.isArray(t)) {
            return t.map((n)=>{
                if (typeof n === "string") {
                    return n;
                }
                return n?.text || "";
            }).join(" ");
        }
        return "";
    }
    return e.text || "";
}
function be(e, t) {
    let n = "";
    try {
        let c = JSON.parse(e)?.message?.content;
        if (typeof c === "string") {
            n = c;
        } else if (Array.isArray(c)) {
            n = c.map(ve).join(" ");
        }
    } catch  {}
    n = n.replace(/\s+/g, " ").trim();
    let s = t.toLowerCase();
    let o = n && n.toLowerCase().indexOf(s) >= 0 ? n : e.replace(/\s+/g, " ").trim();
    let r = o.toLowerCase().indexOf(s);
    if (r < 0) {
        return o.slice(0, 180);
    }
    let i = Math.max(0, r - 70);
    let a = Math.min(o.length, r + t.length + 90);
    return (i > 0 ? "…" : "") + o.slice(i, a) + (a < o.length ? "…" : "");
}
function we(transcriptPath, matchCount, firstLine, s) {
    let mtimeMs = 0;
    try {
        mtimeMs = h.statSync(transcriptPath).mtimeMs;
    } catch  {}
    let isSubagent = /\/subagents\/agent-[^/]+\.jsonl$/.test(transcriptPath);
    let i = (transcriptPath.match(le) || [])[1] || y.basename(transcriptPath).replace(/\.jsonl$/, "");
    let a = me(transcriptPath);
    let projectName = a ? y.basename(a) : y.basename(y.dirname(transcriptPath));
    let agentName = isSubagent ? he(transcriptPath) : projectName || i.slice(0, 8);
    return {
        sessionId: i,
        transcriptPath,
        agentName,
        isSubagent,
        agentMatches: 1,
        projectName,
        cwd: a,
        snippet: be(firstLine, s),
        matchCount,
        mtimeMs
    };
}
async function Wt(query, allProjects) {
    let n = (query || "").trim();
    if (n.length < 2) {
        return [];
    }
    let s = ge(allProjects);
    if (s.length === 0) {
        return [];
    }
    let o = pe();
    let r = [
        "--json",
        "-i",
        "-F",
        "-m",
        "3",
        "--glob",
        "*.jsonl",
        "-e",
        n,
        ...s
    ];
    let i = new Map;
    await new Promise((resolve)=>{
        let u;
        try {
            u = _t.spawn(o, r);
        } catch  {
            resolve();
            return;
        }
        let l = "";
        let m = 0;
        let $ = false;
        let S = ()=>{
            if (!$) {
                $ = true;
                try {
                    u.kill();
                } catch  {}
                resolve();
            }
        };
        let _ = setTimeout(S, 8000);
        u.stdout?.on("data", (Ht)=>{
            l += Ht.toString();
            let et;
            while((et = l.indexOf(`
`)) >= 0){
                let ct = l.slice(0, et);
                l = l.slice(et + 1);
                if (!ct) {
                    continue;
                }
                let U;
                try {
                    U = JSON.parse(ct);
                } catch  {
                    continue;
                }
                if (U.type === "match") {
                    let nt = U.data?.path?.text;
                    if (!nt) {
                        continue;
                    }
                    let dt = i.get(nt);
                    if (dt) {
                        dt.count++;
                    } else {
                        i.set(nt, {
                            count: 1,
                            firstLine: U.data?.lines?.text || ""
                        });
                    }
                    if (++m > 800) {
                        clearTimeout(_);
                        S();
                        return;
                    }
                }
            }
        });
        u.on("error", ()=>{
            clearTimeout(_);
            S();
        });
        u.on("close", ()=>{
            clearTimeout(_);
            S();
        });
    });
    let a = new Map;
    for (let [c, u] of i){
        let primary = we(c, u.count, u.firstLine, n);
        let m = a.get(primary.sessionId);
        if (!m) {
            a.set(primary.sessionId, {
                primary,
                primaryMatches: primary.matchCount
            });
            continue;
        }
        m.primary.matchCount += primary.matchCount;
        m.primary.agentMatches += 1;
        m.primary.mtimeMs = Math.max(m.primary.mtimeMs, primary.mtimeMs);
        if (primary.matchCount > m.primaryMatches || primary.matchCount === m.primaryMatches && !primary.isSubagent && m.primary.isSubagent) {
            m.primaryMatches = primary.matchCount;
            m.primary.transcriptPath = primary.transcriptPath;
            m.primary.agentName = primary.agentName;
            m.primary.isSubagent = primary.isSubagent;
            m.primary.snippet = primary.snippet;
            if (primary.cwd) {
                m.primary.cwd = primary.cwd;
                m.primary.projectName = primary.projectName;
            }
        }
    }
    let d = [
        ...a.values()
    ].map((c)=>c.primary);
    d.sort((c, u)=>u.matchCount - c.matchCount || u.mtimeMs - c.mtimeMs);
    return d.slice(0, 30);
}
function Y(e, t, webview, onDidDispose) {
    webview.options = {
        enableScripts: true,
        localResourceRoots: [
            p.Uri.joinPath(e.extensionUri, "out"),
            p.Uri.joinPath(e.extensionUri, "media")
        ]
    };
    webview.html = ke(e, webview);
    let o = false;
    let r = (c)=>{
        if (!o) {
            try {
                webview.postMessage(c);
            } catch  {}
        }
    };
    let i = webview.onDidReceiveMessage((c)=>ye(t, r, c));
    let a = t.onState((state)=>r({
            type: "state",
            state
        }));
    let d = t.onToast((toast)=>r({
            type: "toast",
            toast
        }));
    onDidDispose(()=>{
        o = true;
        a();
        d();
        i.dispose();
    });
}
async function ye(e, t, n) {
    switch(n.type){
        case "ready":
            if (e.state) {
                t({
                    type: "state",
                    state: e.state
                });
            } else {
                e.refresh();
            }
            return;
        case "select":
            e.setSelected(n.id);
            return;
        case "setLayout":
            await G("defaultLayout", n.layout);
            return;
        case "setAccent":
            await G("accent", n.accent);
            return;
        case "setScope":
            await G("scope", n.scope);
            return;
        case "setContinueIn":
            await G("continueIn", n.target);
            return;
        case "refresh":
            e.refresh();
            return;
        case "loadConversation":
            {
                let s = e.getAgent(n.id);
                if (s) {
                    t({
                        type: "conversation",
                        agentId: n.id,
                        messages: yt(s.transcriptPath)
                    });
                }
                return;
            }
        case "search":
            {
                let results = await Wt(n.query, n.allProjects);
                t({
                    type: "searchResults",
                    query: n.query,
                    results
                });
                return;
            }
        case "action":
            await xe(t, n.action, n.payload);
            return;
    }
}
async function G(e, t) {
    await p.workspace.getConfiguration("claudeAgentManager").update(e, t, p.ConfigurationTarget.Global);
}
async function xe(e, action, payload) {
    switch(action){
        case "readConversation":
            {
                if (payload.transcriptPath && C.existsSync(payload.transcriptPath)) {
                    let s = xt(payload.transcriptPath, payload.name || "Conversation");
                    await It(payload.name || "conversation", s);
                } else {
                    p.window.showWarningMessage("Transcript not found for this agent.");
                }
                return;
            }
        case "revealFile":
            {
                let s = Et(payload.path, payload.cwd);
                if (s && C.existsSync(s)) {
                    let o = await p.workspace.openTextDocument(p.Uri.file(s));
                    await p.window.showTextDocument(o, {
                        preview: true
                    });
                } else {
                    p.window.showWarningMessage(`File not found: ${payload.path}`);
                }
                return;
            }
        case "openDiff":
            {
                let s = Ce(payload.transcriptPath, payload.file);
                if (s) {
                    await At(payload.file, s.oldText, s.newText);
                } else {
                    let o = Et(payload.file, payload.cwd);
                    if (o && C.existsSync(o)) {
                        let r = await p.workspace.openTextDocument(p.Uri.file(o));
                        await p.window.showTextDocument(r, {
                            preview: true
                        });
                    } else {
                        p.window.showInformationMessage("No recorded edit to diff for this file.");
                    }
                }
                return;
            }
        case "copySession":
            await p.env.clipboard.writeText(payload.sessionId || "");
            p.window.showInformationMessage(`Copied session id: ${payload.sessionId}`);
            return;
        case "continueSession":
            {
                let s = payload.sessionId || "";
                let o = payload.cwd && C.existsSync(payload.cwd) ? payload.cwd : undefined;
                if ((payload.target || p.workspace.getConfiguration("claudeAgentManager").get("continueIn", "extension")) === "extension") {
                    if ((await p.commands.getCommands(true)).includes("claude-vscode.editor.open")) {
                        try {
                            await p.commands.executeCommand("claude-vscode.editor.open", s, undefined, p.ViewColumn.Active);
                            return;
                        } catch  {
                            p.window.showWarningMessage("Couldn't open the Claude Code extension view — falling back to terminal.");
                        }
                    } else {
                        p.window.showWarningMessage("Claude Code extension not found — opening in terminal instead.");
                    }
                }
                let i = p.window.createTerminal({
                    name: `Claude \xB7 resume ${s.slice(0, 8)}`,
                    cwd: o
                });
                i.show();
                let a = Se();
                i.sendText(`${a.includes(" ") ? `"${a}"` : a} --resume ${s}`);
                return;
            }
    }
}
function Se() {
    try {
        let e = I.join(Lt.homedir(), ".vscode", "extensions");
        let t = process.platform === "win32" ? "claude.exe" : "claude";
        let n = [];
        for (let s of C.readdirSync(e)){
            let o = s.match(/^anthropic\.claude-code-(\d+)\.(\d+)\.(\d+)/);
            if (!o) {
                continue;
            }
            let bin = I.join(e, s, "resources", "native-binary", t);
            if (C.existsSync(bin)) {
                n.push({
                    v: [
                        +o[1],
                        +o[2],
                        +o[3]
                    ],
                    bin
                });
            }
        }
        n.sort((s, o)=>s.v[0] - o.v[0] || s.v[1] - o.v[1] || s.v[2] - o.v[2]);
        if (n.length) {
            return n[n.length - 1].bin;
        }
    } catch  {}
    return "claude";
}
function Et(e, cwd) {
    if (e) {
        if (I.isAbsolute(e)) {
            return e;
        }
        if (cwd) {
            return I.join(cwd, e);
        }
        return e;
    }
}
function Ce(transcriptPath, file) {
    if (!transcriptPath || !file) {
        return null;
    }
    let n = T(W(transcriptPath));
    let s = null;
    for (let o of n){
        for (let r of x(o)){
            let i = r.input || {};
            if (r.name === "Edit" && i.file_path === file) {
                s = {
                    oldText: String(i.old_string ?? ""),
                    newText: String(i.new_string ?? "")
                };
            } else if (r.name === "MultiEdit" && i.file_path === file && Array.isArray(i.edits)) {
                let oldText = i.edits.map((c)=>String(c.old_string ?? "")).join(`
`);
                let newText = i.edits.map((c)=>String(c.new_string ?? "")).join(`
`);
                s = {
                    oldText,
                    newText
                };
            } else {
                if (r.name === "Write" && i.file_path === file) {
                    s = {
                        oldText: "",
                        newText: String(i.content ?? "")
                    };
                }
            }
        }
    }
    return s;
}
function ke(e, t) {
    let n = Te();
    let s = t.asWebviewUri(p.Uri.joinPath(e.extensionUri, "out", "webview.js"));
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="${[
        "default-src 'none'",
        `img-src ${t.cspSource} https: data:`,
        `style-src ${t.cspSource} 'unsafe-inline'`,
        `font-src ${t.cspSource}`,
        `script-src 'nonce-${n}'`
    ].join("; ")}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>${Me}</style>
</head>
<body>
<div id="root"></div>
<script nonce="${n}" src="${s}"></script>
</body>
</html>`;
}
function Te() {
    let e = "";
    let t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let n = 0; n < 32; n++){
        e += t.charAt(Math.floor(Math.random() * t.length));
    }
    return e;
}
var Me = `
* { box-sizing: border-box; }
body { margin: 0; background: #1e1e1e; color: #cccccc;
  font-family: var(--vscode-font-family, -apple-system, "Segoe UI", system-ui, sans-serif);
  -webkit-font-smoothing: antialiased; font-size: 13px; }
.mono { font-family: "SF Mono", "Cascadia Code", Menlo, Monaco, Consolas, monospace; }
button { font-family: inherit; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes toastin { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes logslide { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: #424242; border-radius: 6px; border: 2px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-thumb:hover { background: #4f4f4f; background-clip: content-box; }
::-webkit-scrollbar-track { background: transparent; }
.app { display: flex; flex-direction: column; height: 100vh; }
.spinner { width: 11px; height: 11px; border-radius: 50%; border: 1.6px solid var(--c); border-top-color: transparent; animation: spin .8s linear infinite; display: inline-block; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.row:hover { background: #2f2f30 !important; }
.iconbtn { background: transparent; border: none; color: #8a8a8a; cursor: pointer; padding: 2px 4px; border-radius: 4px; font-size: 13px; }
.iconbtn:hover { background: #2f2f30; color: #ddd; }
.iconbtn.active { color: #fff; background: #37373d; }
.actionbtn { flex: 1; border: 1px solid #3a3a3b; background: #2d2d2e; color: #cfcfcf; font-size: 11px; font-weight: 600; padding: 5px; border-radius: 5px; cursor: pointer; }
.actionbtn:hover { background: #3a3a3b; }
.actionbtn.danger { color: #f48771; }
.chip { border: 1px solid #3a3a3b; background: #2a2a2b; color: #9a9a9a; font-size: 10.5px; font-weight: 600; letter-spacing: .03em; padding: 3px 8px; border-radius: 11px; cursor: pointer; }
.fade-in { animation: logslide .25s ease; }
input.filter { flex: 1; background: transparent; border: none; outline: none; color: #dcdcdc; font-size: 12.5px; font-family: inherit; }
mark { background: #5a4a1a; color: #ffe9a8; border-radius: 2px; padding: 0 1px; }
`;
var N = class {
    constructor(t, n){
        this.context = t;
        this.monitor = n;
    }
    static{
        this.viewId = "claudeAgentManager.view";
    }
    resolveWebviewView(t) {
        Y(this.context, this.monitor, t.webview, t.onDidDispose);
    }
};
const j = f(require("vscode"));
const X = f(require("fs"));
const k = f(require("path"));
function F(e) {
    try {
        return X.readdirSync(e);
    } catch  {
        return [];
    }
}
function Nt(e) {
    try {
        return X.statSync(e).mtimeMs;
    } catch  {
        return 0;
    }
}
function Ae(projectDir, t) {
    let n = [];
    for (let s of F(projectDir)){
        if (!s.endsWith(".jsonl")) {
            continue;
        }
        let o = s.slice(0, -6);
        let mainPath = k.join(projectDir, s);
        let subagentsDir = k.join(projectDir, o, "subagents");
        let a = [];
        if (M(subagentsDir)) {
            for (let d of F(subagentsDir)){
                if (!d.endsWith(".jsonl")) {
                    continue;
                }
                let fileId = d.slice(0, -6);
                let jsonlPath = k.join(subagentsDir, d);
                a.push({
                    fileId,
                    jsonlPath,
                    metaPath: k.join(subagentsDir, `${fileId}.meta.json`),
                    mtimeMs: Nt(jsonlPath)
                });
            }
        }
        a.sort((d, c)=>c.mtimeMs - d.mtimeMs);
        n.push({
            sessionId: o,
            projectDir,
            mainPath,
            subagentsDir,
            mtimeMs: Nt(mainPath),
            subagents: a.slice(0, t)
        });
    }
    return n;
}
function Ft(scope, maxSessions, maxSubagents) {
    let s = D();
    if (!M(s)) {
        return [];
    }
    let o;
    if (scope === "workspace") {
        let i = new Set(V());
        o = F(s).filter((a)=>i.has(a)).map((a)=>k.join(s, a));
        if (o.length === 0) {
            o = F(s).map((a)=>k.join(s, a));
        }
    } else {
        o = F(s).map((i)=>k.join(s, i));
    }
    o = o.filter(M);
    let r = [];
    for (let i of o){
        r.push(...Ae(i, maxSubagents));
    }
    r.sort((i, a)=>a.mtimeMs - i.mtimeMs);
    return r.slice(0, maxSessions);
}
const at = f(require("vscode"));
function Ut() {
    let e = at.workspace.getConfiguration("claudeAgentManager");
    return {
        scope: e.get("scope", "workspace"),
        maxSessions: e.get("maxSessions", 6),
        maxSubagents: e.get("maxSubagents", 16)
    };
}
function Ot(claudeHome) {
    let t = at.workspace.getConfiguration("claudeAgentManager");
    return {
        scope: t.get("scope", "workspace"),
        accent: t.get("accent", "clay"),
        layout: t.get("defaultLayout", "tree"),
        activeThresholdSeconds: t.get("activeThresholdSeconds", 45),
        maxLogLines: t.get("maxLogLines", 200),
        continueIn: t.get("continueIn", "extension"),
        claudeHome
    };
}
const K = f(require("fs"));
class Z {
    constructor(t, n, s){
        this.projectsDir = t;
        this.onChange = n;
        this.pollSeconds = s;
        this.disposed = false;
    }
    start() {
        try {
            if (K.existsSync(this.projectsDir)) {
                this.fsWatcher = K.watch(this.projectsDir, {
                    recursive: true
                }, ()=>this.schedule());
            }
        } catch  {}
        let t = Math.max(1, this.pollSeconds) * 1000;
        this.pollTimer = setInterval(()=>this.onChange(), t);
    }
    schedule() {
        if (!this.disposed) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(()=>this.onChange(), 300);
        }
    }
    dispose() {
        this.disposed = true;
        if (this.fsWatcher) {
            this.fsWatcher.close();
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}
var Q = class {
    constructor(){
        this.selectedId = null;
        this.lastStatus = new Map;
        this.firstBuildDone = false;
        this.stateCbs = [];
        this.toastCbs = [];
    }
    start() {
        this.startWatcher();
        this.rebuild();
    }
    dispose() {
        this.watcher?.dispose();
    }
    onState(t) {
        this.stateCbs.push(t);
        if (this.lastState) {
            t(this.lastState);
        }
        return ()=>{
            let n = this.stateCbs.indexOf(t);
            if (n >= 0) {
                this.stateCbs.splice(n, 1);
            }
        };
    }
    onToast(t) {
        this.toastCbs.push(t);
        return ()=>{
            let n = this.toastCbs.indexOf(t);
            if (n >= 0) {
                this.toastCbs.splice(n, 1);
            }
        };
    }
    get state() {
        return this.lastState;
    }
    getAgent(t) {
        return this.lastState?.agents.find((n)=>n.id === t);
    }
    setSelected(t) {
        this.selectedId = t;
        if (this.lastState) {
            this.lastState = {
                ...this.lastState,
                selectedId: t
            };
            this.emitState();
        }
    }
    refresh() {
        this.startWatcher();
        this.rebuild();
    }
    startWatcher() {
        this.watcher?.dispose();
        let t = j.workspace.getConfiguration("claudeAgentManager").get("pollSeconds", 4);
        this.watcher = new Z(D(), ()=>this.rebuild(), t);
        this.watcher.start();
    }
    rebuild() {
        let t = rt();
        let n = Ut();
        let s = Ot(t);
        let o = Ft(n.scope, n.maxSessions, n.maxSubagents);
        let r = bt(o, this.selectedId, s, Date.now());
        this.selectedId = r.selectedId;
        this.lastState = r;
        this.detectFinishes(r);
        this.emitState();
    }
    emitState() {
        if (this.lastState) {
            for (let t of this.stateCbs){
                t(this.lastState);
            }
        }
    }
    detectFinishes(t) {
        let n = j.workspace.getConfiguration("claudeAgentManager").get("notifyOnFinish", true);
        for (let s of t.agents){
            let o = this.lastStatus.get(s.id);
            if (this.firstBuildDone && o === "running" && (s.status === "done" || s.status === "error")) {
                let r = s.status === "done";
                let i = {
                    color: r ? "#89d185" : "#f48771",
                    icon: r ? "✓" : "✕",
                    title: `${s.name} ${r ? "finished" : "errored"}`,
                    body: s.task.slice(0, 80)
                };
                for (let a of this.toastCbs){
                    a(i);
                }
                if (n) {
                    let a = `Claude agent \u201C${s.name}\u201D ${r ? "finished" : "hit an error"}.`;
                    if (r) {
                        j.window.showInformationMessage(a);
                    } else {
                        j.window.showWarningMessage(a);
                    }
                }
            }
            this.lastStatus.set(s.id, s.status);
        }
        this.firstBuildDone = true;
    }
};
function tt(e) {
    if (e >= 1000000) {
        return `${(e / 1000000).toFixed(1)}M`;
    }
    if (e >= 1000) {
        return `${(e / 1000).toFixed(1)}k`;
    }
    return String(e);
}
function Re(e) {
    Mt(e);
    Dt(e);
    let t = new Q;
    e.subscriptions.push(t);
    let n = g.window.createStatusBarItem(g.StatusBarAlignment.Left, 100);
    n.command = "workbench.view.extension.claudeAgentManager";
    e.subscriptions.push(n);
    t.onState((r)=>Bt(n, r));
    Bt(n, undefined);
    n.show();
    let s = new N(e, t);
    e.subscriptions.push(g.window.registerWebviewViewProvider(N.viewId, s, {
        webviewOptions: {
            retainContextWhenHidden: true
        }
    }));
    let o;
    e.subscriptions.push(g.commands.registerCommand("claudeAgentManager.openInEditor", ()=>{
        if (o) {
            o.reveal(g.ViewColumn.Active);
            return;
        }
        o = g.window.createWebviewPanel("claudeAgentManager.panel", "Claude Agent Manager", g.ViewColumn.Active, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        o.iconPath = g.Uri.joinPath(e.extensionUri, "media", "claudecode-color.svg");
        Y(e, t, o.webview, o.onDidDispose);
        o.onDidDispose(()=>{
            o = undefined;
        });
    }));
    e.subscriptions.push(g.commands.registerCommand("claudeAgentManager.refresh", ()=>t.refresh()), g.commands.registerCommand("claudeAgentManager.toggleScope", async ()=>{
        let r = g.workspace.getConfiguration("claudeAgentManager");
        let i = r.get("scope", "workspace") === "workspace" ? "all" : "workspace";
        await r.update("scope", i, g.ConfigurationTarget.Global);
        g.window.setStatusBarMessage(`Claude Agents scope: ${i}`, 2000);
    }), g.commands.registerCommand("claudeAgentManager.cycleLayout", async ()=>{
        let r = g.workspace.getConfiguration("claudeAgentManager");
        let i = [
            "tree",
            "cards",
            "split"
        ];
        let a = r.get("defaultLayout", "tree");
        let d = i[(i.indexOf(a) + 1) % i.length];
        await r.update("defaultLayout", d, g.ConfigurationTarget.Global);
        g.window.setStatusBarMessage(`Claude Agents layout: ${d}`, 2000);
    }));
    e.subscriptions.push(g.workspace.onDidChangeConfiguration((r)=>{
        if (r.affectsConfiguration("claudeAgentManager")) {
            t.refresh();
        }
    }));
    t.start();
}
function Bt(e, t) {
    if (!t || t.empty) {
        e.text = "$(sparkle) Claude: idle";
        e.tooltip = "Claude Agent Manager — no active sessions (click to open)";
        return;
    }
    let length = t.agents.filter((o)=>o.status === "running").length;
    let s = t.agents.reduce((acc, agent)=>acc + agent.tokens, 0);
    if (length > 0) {
        e.text = `$(sync~spin) Claude: ${length} running \xB7 ${tt(s)} tok`;
        e.tooltip = `${length} agent(s) running \xB7 ${tt(s)} tokens \u2014 click to open Claude Agent Manager`;
    } else {
        e.text = `$(sparkle) Claude: idle \xB7 ${tt(s)} tok`;
        e.tooltip = "No agents running — click to open Claude Agent Manager";
    }
}
function Pe() {}
if (0) {
    module.exports = {
        activate,
        deactivate
    };
}

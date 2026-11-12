/**
 * 由 scripts/build.mjs 从 src/client 构建。不要手改这个文件。
 */
window.__ModuleLoader__.load({
  id: '@jjblau2021/dsh-dev-flow',
  factory(require) {
    const loaded = require('react');
    const React = loaded && typeof loaded.useState === 'function' ? loaded : loaded.default;
    const module = { exports: {} };
    const exports = module.exports;
    "use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/locale.ts
var NAMESPACE = "devFlow";
var zh = {
  "tab.title": "\u5DE5\u4F5C\u6D41",
  "tab.description": "\u67E5\u770B\u591A\u4ED3\u5E93\u5F00\u53D1\u4EFB\u52A1\u3001\u69FD\u4F4D\u548C\u4EE3\u7406",
  "switch.label": "\u5DE5\u4F5C\u6D41",
  "page.overview": "\u6982\u89C8",
  "page.tasks": "\u4EFB\u52A1",
  "page.slots": "\u69FD\u4F4D",
  "page.agents": "\u4EE3\u7406",
  "filter.all": "\u5168\u90E8",
  "filter.pending": "\u5F85\u9A8C\u6536",
  "filter.dev": "\u5F00\u53D1\u4E2D",
  "filter.earlier": "\u66F4\u65E9",
  "action.accept": "\u53D1\u8D77\u9A8C\u6536",
  "action.working": "\u6B63\u5728\u53D1\u8D77",
  "toast.started": "\u5DF2\u53D1\u8D77\u9A8C\u6536",
  "action.pass": "\u901A\u8FC7",
  "action.fail": "\u4E0D\u901A\u8FC7",
  "status.review": "\u5F85\u786E\u8BA4",
  "action.refresh": "\u5237\u65B0",
  "action.save": "\u4FDD\u5B58",
  "action.init": "\u521D\u59CB\u5316",
  "empty.init": "\u5C1A\u672A\u521D\u59CB\u5316\u3002\u521D\u59CB\u5316\u540E\u624D\u4F1A\u626B\u63CF\u4ED3\u5E93\u3002",
  "empty.root": "\u8BF7\u5728\u5DE5\u4F5C\u533A\u6839\u6253\u5F00\u4F1A\u8BDD",
  "settings.summary": "\u5F00\u53D1\u4E0E\u9A8C\u6536\u7684\u6A21\u578B\u3001\u76EE\u5F55\u548C\u5206\u652F",
  "metric.projects": "\u9879\u76EE",
  "metric.agents": "\u6D3B\u8DC3\u5B50\u4EE3\u7406",
  "metric.tasks": "\u6D3B\u8DC3\u4EFB\u52A1",
  "metric.slots": "\u6D3B\u8DC3\u69FD\u4F4D",
  "metric.pending": "\u5F85\u9A8C\u6536",
  "metric.dirty": "\u4E3B\u5E72\u4E0D\u5E72\u51C0",
  "section.devTasks": "\u5F00\u53D1\u4EFB\u52A1",
  "section.acceptTasks": "\u9A8C\u6536\u4EFB\u52A1",
  "section.emptyDev": "\u6CA1\u6709\u5F00\u53D1\u4EFB\u52A1",
  "section.emptyAccept": "\u6CA1\u6709\u9A8C\u6536\u4EFB\u52A1",
  "section.trunks": "\u4E3B\u5E72",
  "section.active": "\u6D3B\u8DC3\u4E2D",
  "section.none": "\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u4EE3\u7406",
  "agent.lead": "\u4E3B\u4F1A\u8BDD",
  "agent.leadDetail": "\u4E0D\u5F00\u53D1",
  "agent.dispatch": "\u8C03\u5EA6",
  "agent.running": "\u5904\u7406\u4E2D",
  "agent.idle": "\u7A7A\u95F2",
  "agent.last": "\u4E0A\u4E00\u4EFB\u52A1",
  "slot.dev": "\u5F00\u53D1",
  "slot.accept": "\u9A8C\u6536",
  "slot.free": "\u7A7A\u95F2",
  "slot.busy": "\u5360\u7528",
  "slot.missing": "\u672A\u5EFA\u7ACB",
  "slot.reusable": "\u53EF\u590D\u7528",
  "slot.noDev": "\u8FD8\u6CA1\u6709\u5F00\u53D1\u69FD\u4F4D",
  "slot.noAccept": "\u4E0D\u8BA1\u5165\u9A8C\u6536\u5206\u6BCD",
  "trunk.clean": "\u5E72\u51C0",
  "trunk.dirty": "\u4E0D\u5E72\u51C0",
  "status.developing": "\u5F00\u53D1\u4E2D",
  "status.failed": "\u5931\u8D25",
  "status.waiting": "\u7B49\u5F85",
  "status.pending-acceptance": "\u5F85\u9A8C\u6536",
  "status.accepted": "\u5DF2\u5B8C\u6210",
  "status.merged": "\u5DF2\u5B8C\u6210",
  "status.pending-merge": "\u5F85\u5408\u5165",
  "status.abandoned": "\u653E\u5F03",
  "status.accepting": "\u5F85\u786E\u8BA4",
  "status.rejected": "\u4E0D\u901A\u8FC7",
  "hint.order": "\u6309\u52FE\u9009\u987A\u5E8F\u5E76\u5165",
  "hint.pick": "\u5148\u52FE\u9009\u5F85\u9A8C\u6536\u4EFB\u52A1"
};
var en = {
  "tab.title": "Workflow",
  "tab.description": "Tasks, slots, and agents for a multi-repo workspace",
  "switch.label": "Workflow",
  "page.overview": "Overview",
  "page.tasks": "Tasks",
  "page.slots": "Slots",
  "page.agents": "Agents",
  "filter.all": "All",
  "filter.pending": "Pending",
  "filter.dev": "Developing",
  "filter.earlier": "Earlier",
  "action.accept": "Start acceptance",
  "action.working": "Starting",
  "toast.started": "Acceptance started",
  "action.pass": "Pass",
  "action.fail": "Fail",
  "status.review": "Waiting for review",
  "action.refresh": "Refresh",
  "action.save": "Save",
  "action.init": "Initialize",
  "empty.init": "Not initialized. Repositories are scanned after initialization.",
  "empty.root": "Open the session at the workspace root",
  "settings.summary": "Models, directories, and branch names",
  "metric.projects": "Projects",
  "metric.agents": "Active agents",
  "metric.tasks": "Active tasks",
  "metric.slots": "Active slots",
  "metric.pending": "Pending",
  "metric.dirty": "Dirty trunks",
  "section.devTasks": "Development",
  "section.acceptTasks": "Acceptance",
  "section.emptyDev": "No development tasks",
  "section.emptyAccept": "No acceptance tasks",
  "section.trunks": "Trunks",
  "section.active": "Active",
  "section.none": "No agent is running",
  "agent.lead": "Lead",
  "agent.leadDetail": "Does not implement",
  "agent.dispatch": "Scheduling",
  "agent.running": "Running",
  "agent.idle": "Idle",
  "agent.last": "Previous",
  "slot.dev": "Dev",
  "slot.accept": "Accept",
  "slot.free": "Free",
  "slot.busy": "Busy",
  "slot.missing": "None",
  "slot.reusable": "Reusable",
  "slot.noDev": "No dev slot yet",
  "slot.noAccept": "Not in the acceptance total",
  "trunk.clean": "Clean",
  "trunk.dirty": "Dirty",
  "status.developing": "Developing",
  "status.failed": "Failed",
  "status.waiting": "Waiting",
  "status.pending-acceptance": "Pending",
  "status.accepted": "Done",
  "status.merged": "Done",
  "status.pending-merge": "Awaiting merge",
  "status.abandoned": "Abandoned",
  "status.accepting": "Review",
  "status.rejected": "Rejected",
  "hint.order": "Merge order follows the selection",
  "hint.pick": "Select pending tasks first"
};

// src/client/sheet.ts
var PANEL_STYLE_ID = "dev-flow-panel";
var panelSheet = `
.df {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 12px 16px 24px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.df-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.df-toolbar > :first-child { flex: 1; min-width: 0; }
.df-filters, .df-rowline { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.df-section {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
}
.df-note { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.df-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.df-metric, .df-card, .df-empty {
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-base);
}
.df-metric { padding: 10px 12px; }
.df-kicker {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.df-metric strong {
  display: block;
  margin-top: 2px;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.df-metric[data-tone='info'] strong { color: var(--dsw-alias-state-business-primary); }
.df-metric[data-tone='warn'] strong { color: var(--dsw-alias-state-warn-primary); }
.df-card { overflow: hidden; }
.df-line, .df-task, .df-agent {
  display: grid;
  align-items: center;
  gap: 8px 10px;
  padding: 10px 12px;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}
.df-card > :first-child { border-top: none; }
.df-line { grid-template-columns: minmax(0, 1fr) auto; }
.df-task, .df-agent { grid-template-columns: auto minmax(0, 1fr) auto; }
.df-task[data-pick='true'] { cursor: pointer; }
.df-task[data-on='true'] { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent); }
@media (hover: hover) {
  .df-task[data-pick='true']:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
}
.df-chev { width: 22px; height: 22px; border: 0; padding: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; }
.df-name { font-weight: 560; }
.df-meta { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.df-ok { color: var(--dsw-alias-state-success-primary); }
.df-warn { color: var(--dsw-alias-state-warn-primary); }
.df-bad { color: var(--dsw-alias-state-error-primary); }
.df-muted { color: var(--dsw-alias-label-tertiary); }
.df-repo { padding: 12px 12px 8px; }
.df-slot {
  display: grid;
  grid-template-columns: 64px 52px minmax(0, 1fr);
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  line-height: 18px;
}
.df-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.df-nested { margin: 0 12px 10px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm); overflow: hidden; }
.df-split { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.df-pane { min-height: 96px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
.df-pane-accept { flex: 1; }
.df-split-bar { flex: none; height: 14px; margin: 2px 0; border: 0; padding: 0; background: transparent; cursor: row-resize; display: flex; align-items: center; justify-content: center; }
.df-split-bar::before { content: ''; width: 36px; height: 3px; border-radius: 999px; background: var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.22)); }
.df-split-bar:hover::before, .df-split-bar:focus-visible::before { background: var(--dsw-alias-state-business-primary, rgb(65, 118, 230)); }
.df-foot { display: flex; flex-direction: column; gap: 6px; position: sticky; bottom: 0; padding: 10px 0 4px; background: linear-gradient(to top, var(--dsw-specific-sidebar-fill, rgb(249, 250, 251)) 72%, transparent); }
.df-go { width: 100%; }
.df-hint { margin: 0; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.df-empty { padding: 28px 16px; text-align: center; }
.df-empty p { margin: 8px 0 12px; color: var(--dsw-alias-label-secondary); }
.df-note { position: absolute; left: 16px; bottom: 100%; z-index: 3; display: flex; align-items: center; gap: 6px; height: 22px; padding: 0 6px 0 8px; border-radius: 6px 6px 0 0; border: 0.5px solid var(--dsw-alias-state-business-primary, rgb(65, 118, 230)); background: var(--dsw-alias-bg-base, #fff); color: var(--dsw-alias-state-business-primary, rgb(65, 118, 230)); opacity: 0.45; transition: opacity 160ms ease; }
.df-note[data-on='true'] { background: var(--dsw-alias-state-business-primary, rgb(65, 118, 230)); color: #fff; }
.df-note:hover, .df-note:focus-within { opacity: 1; }
.df-note-title { flex: none; font-size: 12px; line-height: 18px; font-weight: 560; }
.df-toggle { display: flex; align-items: center; width: 26px; height: 14px; padding: 1px; border: 0; border-radius: 999px; background: color-mix(in srgb, currentColor 18%, #fff); cursor: pointer; }
.df-note[data-on='true'] .df-toggle { justify-content: flex-end; background: #fff; }
.df-toggle i { width: 12px; height: 12px; border-radius: 50%; background: var(--dsw-alias-label-tertiary, #8b93a7); }
.df-note[data-on='true'] .df-toggle i { background: var(--dsw-alias-state-business-primary, rgb(65, 118, 230)); }
.df-form { display: flex; flex-direction: column; gap: 10px; }
.df-field { display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.df-field input {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
}
.df-check { width: 16px; height: 16px; margin: 0; }
.df-toasts { position: fixed; top: 16px; right: 16px; z-index: 1300; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; pointer-events: none; }
.df-toast { pointer-events: auto; display: flex; align-items: center; gap: 8px; max-width: min(360px, calc(100vw - 32px)); padding: 10px 14px; border-radius: var(--dsw-radius-lg, 10px); background: var(--dsw-alias-toast-bg, rgb(53, 54, 56)); color: var(--dsw-alias-toast-label, #fff); box-shadow: var(--dsw-shadow-lv3, 0 12px 32px #0003); font-size: 13px; line-height: 20px; animation: df-toast-in 200ms cubic-bezier(.2,.8,.2,1); }
.df-toast[data-closing='true'] { animation: df-toast-out 180ms ease-in forwards; pointer-events: none; }
.df-toast[data-tone='error'] .df-toast-mark { color: var(--dsw-alias-state-error-primary); }
.df-toast-text { min-width: 0; overflow-wrap: anywhere; }
.df-toast-mark { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
@keyframes df-toast-in { from { opacity: 0; transform: translateX(calc(100% + 20px)); } to { opacity: 1; transform: none; } }
@keyframes df-toast-out { to { opacity: 0; transform: translateX(calc(100% + 20px)); } }
@media (prefers-reduced-motion: reduce) { .df-toast, .df-toast[data-closing='true'] { animation: none; } }
`;
function ensureSheet() {
  if (typeof document === "undefined") return;
  let style = document.getElementById(PANEL_STYLE_ID);
  if (style === null) {
    style = document.createElement("style");
    style.id = PANEL_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = panelSheet;
}

// src/client/ui.tsx
function loadUi() {
  try {
    return require("@deepseek-ai/dsh-client-ui-primitives") ?? {};
  } catch {
    return {};
  }
}
function Dot({ ui, state }) {
  return ui.StateDot ? /* @__PURE__ */ React.createElement(ui.StateDot, { state }) : /* @__PURE__ */ React.createElement("span", { "data-state": state });
}
function ActionButton({
  ui,
  children,
  onClick,
  disabled,
  title,
  variant = "outline",
  size = "sm",
  type = "button",
  className
}) {
  if (ui.Button) {
    return /* @__PURE__ */ React.createElement(ui.Button, { type, className, variant, size, disabled, title, onClick }, children);
  }
  return /* @__PURE__ */ React.createElement("button", { type, className, disabled, title, onClick }, children);
}

// src/client/pages.tsx
var { useEffect, useRef, useState } = React;
function Title({ t }) {
  return /* @__PURE__ */ React.createElement("span", null, t("tab.title"));
}
function WorkflowSwitch({
  ui,
  sessionId,
  call,
  parentSessionId,
  t
}) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (parentSessionId || !sessionId) return void 0;
    const controller = new AbortController();
    call("snapshot", { sessionId }, controller.signal).then((value) => {
      const snapshot = value;
      setEnabled(snapshot?.enabled === true);
      setError(snapshot?.problem || "");
    }).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
    return () => controller.abort();
  }, [sessionId, parentSessionId, call]);
  if (parentSessionId) return null;
  const label = t?.("switch.label") ?? "\u5DE5\u4F5C\u6D41";
  const toggle = (next) => {
    setEnabled(next);
    call("session-set", { sessionId, enabled: next }).catch((reason) => {
      setError(reason instanceof Error ? reason.message : String(reason));
    });
  };
  return /* @__PURE__ */ React.createElement("span", { className: "df-note", "data-on": enabled ? "true" : "false", title: error || (enabled ? "dev-flow \u5DF2\u5F00\u542F" : "dev-flow \u5DF2\u5173\u95ED") }, /* @__PURE__ */ React.createElement("span", { className: "df-note-title" }, "dev-flow"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "df-toggle", role: "switch", "aria-checked": enabled, "aria-label": label, onClick: () => toggle(!enabled) }, /* @__PURE__ */ React.createElement("i", null)));
}
function Panel(props) {
  return /* @__PURE__ */ React.createElement(PanelBoundary, null, /* @__PURE__ */ React.createElement(PanelView, { ...props }));
}
var PanelBoundary = class extends React.Component {
  state = { error: "" };
  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  render() {
    if (this.state.error !== "") return /* @__PURE__ */ React.createElement("p", { className: "df-note", role: "status" }, this.state.error);
    return this.props.children;
  }
};
function PanelView({ ui, sessionId, call, t }) {
  const [page, setPage] = useState("overview");
  const [data, setData] = useState(null);
  const [picked, setPicked] = useState([]);
  const { show, node } = useToast();
  const load = (failure) => call("snapshot", { sessionId }).then((value) => {
    setData(value);
    const snapshot = value;
    if (failure) show(textOf(failure), "error");
    else if (snapshot?.problem) show(snapshot.problem, "error");
  }).catch((reason) => show(textOf(reason), "error"));
  useEffect(() => {
    void load();
  }, [sessionId]);
  const pages = [
    { value: "overview", label: t("page.overview"), id: "dev-flow-tab-overview", panelId: "dev-flow-panel-overview" },
    { value: "tasks", label: t("page.tasks"), id: "dev-flow-tab-tasks", panelId: "dev-flow-panel-tasks" },
    { value: "slots", label: t("page.slots"), id: "dev-flow-tab-slots", panelId: "dev-flow-panel-slots" },
    { value: "agents", label: t("page.agents"), id: "dev-flow-tab-agents", panelId: "dev-flow-panel-agents" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "df" }, node, /* @__PURE__ */ React.createElement("div", { className: "df-toolbar" }, ui.SegmentedTabs ? /* @__PURE__ */ React.createElement(ui.SegmentedTabs, { size: "sm", label: t("tab.title"), items: pages, value: page, onChange: (value) => setPage(value) }) : /* @__PURE__ */ React.createElement("div", { role: "tablist", className: "df-filters" }, pages.map((item) => /* @__PURE__ */ React.createElement("button", { key: item.value, type: "button", "aria-selected": page === item.value, onClick: () => setPage(item.value) }, item.label))), /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "ghost", onClick: () => {
    void load();
  } }, t("action.refresh"))), !data ? null : data.problem ? null : !data.initialized ? /* @__PURE__ */ React.createElement(Uninitialized, { ui, t, sessionId, call, reload: load }) : /* @__PURE__ */ React.createElement(PageBody, { ui, page, data, t, picked, setPicked, sessionId, call, reload: load, show }));
}
function Uninitialized({ ui, t, sessionId, call, reload }) {
  return /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("empty.init")), /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "primary", onClick: () => {
    call("init", { sessionId }).then(() => reload()).catch((reason) => reload(reason));
  } }, t("action.init")));
}
function PageBody(props) {
  if (props.page === "overview") return /* @__PURE__ */ React.createElement(Overview, { ui: props.ui, data: props.data, t: props.t });
  if (props.page === "tasks") return /* @__PURE__ */ React.createElement(Tasks, { ...props });
  if (props.page === "slots") return /* @__PURE__ */ React.createElement(Slots, { ui: props.ui, data: props.data, t: props.t });
  return /* @__PURE__ */ React.createElement(Agents, { ui: props.ui, data: props.data, t: props.t });
}
function Overview({ ui, data, t }) {
  const dev = data.counts.devSlots;
  const accept = data.counts.acceptSlots;
  const cards = [
    [t("metric.projects"), data.counts.projects],
    [t("metric.agents"), `${data.counts.activeAgents}/${data.counts.agentLimit}`, data.counts.activeAgents > 0 ? "info" : void 0],
    [t("metric.tasks"), data.counts.activeTasks],
    [t("metric.slots"), data.counts.activeSlots],
    [t("metric.pending"), data.counts.pending, data.counts.pending > 0 ? "warn" : void 0],
    [t("metric.dirty"), `${data.counts.dirtyTrunks}/${data.counts.projects}`, data.counts.dirtyTrunks > 0 ? "warn" : void 0]
  ];
  const running = (data.agents ?? []).filter((agent) => agent.status === "running");
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "df-metrics" }, cards.map(([label, value, tone]) => /* @__PURE__ */ React.createElement("div", { key: label, className: "df-metric", "data-tone": tone }, /* @__PURE__ */ React.createElement("div", { className: "df-kicker" }, label), /* @__PURE__ */ React.createElement("strong", null, String(value))))), /* @__PURE__ */ React.createElement("h3", { className: "df-section" }, t("section.trunks")), /* @__PURE__ */ React.createElement("div", { className: "df-card" }, (data.trunks ?? []).map((repo) => /* @__PURE__ */ React.createElement("div", { key: repo.name, className: "df-line" }, /* @__PURE__ */ React.createElement("span", { className: "df-name" }, repo.name), /* @__PURE__ */ React.createElement("span", { className: repo.dirty ? "df-warn" : "df-ok" }, repo.dirty ? t("trunk.dirty") : t("trunk.clean"))))), /* @__PURE__ */ React.createElement("h3", { className: "df-section" }, t("section.active")), running.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "df-note" }, t("section.none")) : /* @__PURE__ */ React.createElement("div", { className: "df-card" }, running.map((agent) => /* @__PURE__ */ React.createElement("div", { key: agent.id, className: "df-line" }, /* @__PURE__ */ React.createElement("span", null, agent.id, " \xB7 ", agent.kind === "accept" ? t("slot.accept") : t("slot.dev"), " \xB7 ", taskTitle(data, agent.taskId)), /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, slotSummary(data, agent))))), dev || accept ? /* @__PURE__ */ React.createElement("p", { className: "df-note" }, `${t("slot.dev")} ${dev?.used ?? 0}/${dev?.total ?? 0} \xB7 ${t("slot.accept")} ${accept?.used ?? 0}/${accept?.total ?? 0}`) : null);
}
function Tasks({
  ui,
  data,
  t,
  picked,
  setPicked,
  sessionId,
  call,
  reload,
  show
}) {
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState({});
  const [devHeight, setDevHeight] = useState(240);
  const splitRef = useRef(null);
  const devAll = data.tasks.filter((task) => task.kind !== "accept");
  const devRows = devAll.filter((task) => matchFilter(filter, task));
  const acceptRows = data.tasks.filter((task) => task.kind === "accept");
  const reason = acceptReason(data, picked, t);
  const selected = data.tasks.filter((task) => task.selectable && picked.includes(task.id));
  const filters = [
    ["all", t("filter.all")],
    ["pending", t("filter.pending")],
    ["dev", t("filter.dev")],
    ["earlier", t("filter.earlier")]
  ];
  const launch = () => {
    if (busy || reason !== "") return;
    setBusy(true);
    start(call, sessionId, picked, setPicked, reload).then(() => show(t("toast.started"), "info")).catch(() => void 0).finally(() => setBusy(false));
  };
  const dragSplit = (event) => {
    const startY = event.clientY;
    const startHeight = devHeight;
    const bounds = splitRef.current?.getBoundingClientRect();
    const limit = bounds ? bounds.height - 140 : 480;
    const move = (next) => {
      setDevHeight(Math.min(limit, Math.max(120, startHeight + next.clientY - startY)));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "df-split", ref: splitRef }, /* @__PURE__ */ React.createElement("div", { className: "df-pane", style: { height: devHeight } }, /* @__PURE__ */ React.createElement("div", { className: "df-filters" }, filters.map(([value, label]) => {
    const count = devAll.filter((task) => matchFilter(value, task)).length;
    const text = `${label} ${count}`;
    return ui.Pill ? /* @__PURE__ */ React.createElement(ui.Pill, { key: value, active: filter === value, onClick: () => setFilter(value) }, text) : /* @__PURE__ */ React.createElement("button", { key: value, type: "button", "aria-pressed": filter === value, onClick: () => setFilter(value) }, text);
  })), /* @__PURE__ */ React.createElement("h3", { className: "df-section" }, t("section.devTasks")), /* @__PURE__ */ React.createElement("div", { className: "df-card" }, devRows.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("section.emptyDev"))) : devRows.map((task) => /* @__PURE__ */ React.createElement(TaskLine, { key: task.id, ui, t, task, picked, setPicked }))), /* @__PURE__ */ React.createElement("div", { className: "df-foot" }, /* @__PURE__ */ React.createElement(ActionButton, { ui, className: "df-go", variant: "primary", disabled: busy || reason !== "", title: reason, onClick: launch }, busy ? t("action.working") : t("action.accept")), /* @__PURE__ */ React.createElement("p", { className: "df-hint" }, reason !== "" ? reason : selected.length > 0 ? `${t("hint.order")}\uFF1A${selected.map((task) => task.title).join(" \u2192 ")}` : t("hint.pick")))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "df-split-bar", "aria-label": "\u8C03\u6574\u5F00\u53D1\u4EFB\u52A1\u548C\u9A8C\u6536\u4EFB\u52A1\u7684\u9AD8\u5EA6", onPointerDown: dragSplit }), /* @__PURE__ */ React.createElement("div", { className: "df-pane df-pane-accept" }, /* @__PURE__ */ React.createElement("h3", { className: "df-section" }, t("section.acceptTasks")), /* @__PURE__ */ React.createElement("div", { className: "df-card" }, acceptRows.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("section.emptyAccept"))) : acceptRows.map((batch) => {
    const open = opened[batch.id] ?? batch.status === "accepting";
    const children = containedTasks(data, batch);
    return /* @__PURE__ */ React.createElement("div", { key: batch.id }, /* @__PURE__ */ React.createElement(
      TaskLine,
      {
        ui,
        t,
        task: batch,
        picked,
        setPicked,
        sessionId,
        call,
        reload,
        open,
        onToggle: () => setOpened({ ...opened, [batch.id]: !open })
      }
    ), open ? /* @__PURE__ */ React.createElement("div", { className: "df-nested" }, children.map((task) => /* @__PURE__ */ React.createElement(TaskLine, { key: task.id, ui, t, task, picked, setPicked, nested: true }))) : null);
  }))));
}
function TaskLine({
  ui,
  t,
  task,
  picked,
  setPicked,
  sessionId,
  call,
  reload,
  nested = false,
  open,
  onToggle
}) {
  const chosen = !nested && task.selectable && picked.includes(task.id);
  const toggle = () => {
    if (!nested && task.selectable) setPicked(togglePick(picked, task.id));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "df-task", "data-pick": !nested && task.selectable ? "true" : "false", "data-on": chosen ? "true" : "false", onClick: toggle }, !nested && task.selectable ? /* @__PURE__ */ React.createElement("input", { className: "df-check", type: "checkbox", checked: chosen, onClick: (event) => event.stopPropagation(), onChange: toggle }) : /* @__PURE__ */ React.createElement(Dot, { ui, state: dotOf(task.status) }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "df-name" }, onToggle ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "df-chev", "aria-expanded": open, onClick: (event) => {
    event.stopPropagation();
    onToggle();
  } }, open ? "\u25BE" : "\u25B8") : null, task.title), /* @__PURE__ */ React.createElement("div", { className: "df-meta" }, taskMeta(task, t))), /* @__PURE__ */ React.createElement("div", { className: "df-actions" }, /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: task.status }), !nested && task.kind === "accept" && task.status === "accepting" && call && reload ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ActionButton, { ui, onClick: (event) => {
    event.stopPropagation();
    finish(call, sessionId, task.id, "accepted", reload);
  } }, t("action.pass")), /* @__PURE__ */ React.createElement(ActionButton, { ui, onClick: (event) => {
    event.stopPropagation();
    finish(call, sessionId, task.id, "rejected", reload);
  } }, t("action.fail"))) : null));
}
function containedTasks(data, batch) {
  const ids = batch.taskIds ?? [];
  const fromIds = ids.map((id) => data.tasks.find((task) => task.kind !== "accept" && task.id === id)).filter((task) => task !== void 0);
  if (fromIds.length > 0) return fromIds;
  return data.tasks.filter((task) => task.kind !== "accept" && task.batchId === batch.id);
}
function Slots({ ui, data, t }) {
  const dev = data.counts.devSlots;
  const accept = data.counts.acceptSlots;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "df-note" }, `${t("slot.dev")} ${dev?.used ?? 0}/${dev?.total ?? 0} \xB7 ${t("slot.accept")} ${accept?.used ?? 0}/${accept?.total ?? 0}`), data.repos.map((repo) => /* @__PURE__ */ React.createElement("section", { key: repo.name, className: "df-card" }, /* @__PURE__ */ React.createElement("div", { className: "df-repo" }, /* @__PURE__ */ React.createElement("strong", null, repo.name), " ", /* @__PURE__ */ React.createElement("span", { className: repo.dirty ? "df-warn" : "df-ok" }, repo.dirty ? t("trunk.dirty") : t("trunk.clean"))), repo.devSlots.length === 0 ? /* @__PURE__ */ React.createElement(SlotLine, { t, kind: "dev", state: "missing", detail: t("slot.noDev") }) : repo.devSlots.map((slot) => /* @__PURE__ */ React.createElement(SlotLine, { key: slot.number, t, kind: "dev", number: slot.number, state: slot.taskId ? "busy" : "free", detail: devDetail(data, repo, slot, t) })), /* @__PURE__ */ React.createElement(
    SlotLine,
    {
      t,
      kind: "accept",
      number: repo.acceptSlot?.number,
      state: repo.acceptSlot ? repo.acceptSlot.batchId ? "busy" : "free" : "missing",
      detail: acceptDetail(repo, t)
    }
  ))));
}
function SlotLine({ t, kind, number, state, detail }) {
  const label = `${kind === "dev" ? t("slot.dev") : t("slot.accept")} ${number ?? ""}`.trim();
  const tone = state === "busy" ? "df-warn" : state === "free" ? "df-ok" : "df-muted";
  const text = state === "busy" ? t("slot.busy") : state === "free" ? t("slot.free") : t("slot.missing");
  return /* @__PURE__ */ React.createElement("div", { className: "df-slot" }, /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("span", { className: tone }, text), /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, detail));
}
function visibleAgents(agents) {
  const running = agents.filter((agent) => agent.status === "running");
  const latestIdle = /* @__PURE__ */ new Map();
  for (const agent of agents) {
    if (agent.status === "running") continue;
    latestIdle.set(agent.kind ?? "dev", agent);
  }
  return [...running, ...latestIdle.values()];
}
function Agents({ ui, data, t }) {
  const rows = [{ id: t("agent.lead"), status: "lead", kind: "lead" }, ...visibleAgents(data.agents)];
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "df-note" }, `${t("metric.agents")} ${data.counts.activeAgents}/${data.counts.agentLimit}`), /* @__PURE__ */ React.createElement("div", { className: "df-card" }, rows.map((agent) => /* @__PURE__ */ React.createElement("div", { key: agent.id, className: "df-agent" }, /* @__PURE__ */ React.createElement(Dot, { ui, state: agent.status === "running" ? "ongoing" : "idle" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "df-name" }, agent.id), /* @__PURE__ */ React.createElement("div", { className: "df-meta" }, agentDetail(data, agent, t))), /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: agent.status === "running" ? "running" : agent.status === "lead" ? "lead" : "idle" })))));
}
function StatusTag({ ui, t, status }) {
  const label = status === "running" ? t("agent.running") : status === "idle" ? t("agent.idle") : status === "lead" ? t("agent.dispatch") : t(`status.${status}`) || status;
  const tone = status === "failed" || status === "rejected" ? "danger" : status === "accepted" || status === "merged" ? "success" : status === "pending-merge" ? "warning" : status === "developing" || status === "running" ? "info" : status === "pending-acceptance" || status === "waiting" || status === "accepting" ? "warning" : "neutral";
  return ui.Tag ? /* @__PURE__ */ React.createElement(ui.Tag, { tone }, label) : /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, label);
}
function SettingsForm({ ui, view, call, t }) {
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (view === "summary") return void 0;
    const controller = new AbortController();
    call("settings-get", {}, controller.signal).then((value) => setDraft(value)).catch((reason) => setMessage(reason instanceof Error ? reason.message : String(reason)));
    return () => controller.abort();
  }, [view, call]);
  if (view === "summary") return /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, t("settings.summary"));
  if (!draft) return /* @__PURE__ */ React.createElement("p", { className: "df-note" }, message || "\u2026");
  const fields = [
    ["devModel", "\u5F00\u53D1\u4EFB\u52A1\u6A21\u578B"],
    ["acceptModel", "\u9A8C\u6536\u4EFB\u52A1\u6A21\u578B"],
    ["devDir", "\u5F00\u53D1\u69FD\u4F4D\u76EE\u5F55"],
    ["acceptDir", "\u9A8C\u6536\u69FD\u4F4D\u76EE\u5F55"],
    ["taskBranch", "\u4EFB\u52A1\u5206\u652F\u683C\u5F0F"],
    ["acceptBranch", "\u9A8C\u6536\u5206\u652F\u683C\u5F0F"]
  ];
  return /* @__PURE__ */ React.createElement("form", { className: "df-form", onSubmit: (event) => {
    event.preventDefault();
    call("settings-set", { settings: draft }).then((saved) => {
      setDraft(saved);
      setMessage("\u5DF2\u4FDD\u5B58");
    }).catch((reason) => setMessage(reason instanceof Error ? reason.message : String(reason)));
  } }, fields.map(([key, label]) => /* @__PURE__ */ React.createElement("label", { key, className: "df-field" }, label, /* @__PURE__ */ React.createElement("input", { value: draft[key] ?? "", onChange: (event) => setDraft({ ...draft, [key]: event.target.value }) }))), /* @__PURE__ */ React.createElement(ActionButton, { ui, type: "submit", variant: "primary" }, t("action.save")), message ? /* @__PURE__ */ React.createElement("p", { className: "df-note", role: "status" }, message) : null);
}
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = (text, tone = "error") => {
    if (text === "") return;
    if (timer.current !== null) clearTimeout(timer.current);
    setToast({ id: `${Date.now()}`, text, tone, closing: false });
    timer.current = setTimeout(() => {
      setToast((current) => current === null ? current : { ...current, closing: true });
      timer.current = setTimeout(() => {
        setToast(null);
        timer.current = null;
      }, 200);
    }, 2600);
  };
  const node = toast === null ? null : /* @__PURE__ */ React.createElement("div", { className: "df-toasts" }, /* @__PURE__ */ React.createElement("div", { className: "df-toast", "data-tone": toast.tone, "data-closing": toast.closing ? "true" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "df-toast-mark" }), /* @__PURE__ */ React.createElement("span", { className: "df-toast-text" }, toast.text)));
  return { show, node };
}
function textOf(reason) {
  return reason instanceof Error ? reason.message : String(reason);
}
function start(call, sessionId, picked, setPicked, reload) {
  const id = `batch-${Date.now().toString(36)}`;
  return call("accept-start", { sessionId, id, taskIds: picked }).then(() => {
    setPicked([]);
    return reload();
  }).catch((reason) => {
    reload(reason);
    throw reason;
  });
}
function finish(call, sessionId, id, result, reload) {
  call("accept-finish", { sessionId, id, result }).then(() => reload()).catch((reason) => reload(reason));
}
function togglePick(picked, id) {
  return picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id];
}
function dotOf(status) {
  if (status === "developing") return "ongoing";
  if (status === "failed") return "error";
  if (status === "accepted" || status === "merged") return "done";
  if (status === "pending-merge") return "warning";
  if (status === "waiting" || status === "pending-acceptance" || status === "accepting") return "warning";
  return "idle";
}
function matchFilter(filter, task) {
  if (filter === "pending") return task.status === "pending-acceptance";
  if (filter === "dev") return task.status === "developing" || task.status === "waiting" || task.status === "failed";
  if (filter === "earlier") return task.status === "accepted" || task.status === "merged" || task.status === "abandoned" || task.status === "rejected";
  return true;
}
function acceptReason(data, picked, t) {
  if (!data.enabled) return "\u4F1A\u8BDD\u672A\u542F\u7528\u5DE5\u4F5C\u6D41";
  const selected = data.tasks.filter((task) => task.selectable && picked.includes(task.id));
  if (selected.length === 0) return t("hint.pick");
  if (data.counts.activeAgents >= data.counts.agentLimit) return "\u5B50\u4EE3\u7406\u5DF2\u8FBE\u4E0A\u9650";
  const busy = selected.flatMap((task) => task.repos).filter((name) => data.repos.find((repo) => repo.name === name)?.acceptSlot?.batchId);
  if (busy.length > 0) return `${busy[0]} \u7684\u9A8C\u6536\u69FD\u4F4D\u6B63\u5728\u5360\u7528`;
  return "";
}
function taskTitle(data, id) {
  if (!id) return "";
  return data.tasks.find((task) => task.id === id)?.title ?? id;
}
function slotSummary(data, agent) {
  const task = data.tasks.find((item) => item.id === agent.taskId);
  if (!task?.slots) return "";
  return Object.entries(task.slots).map(([repo, slot]) => slot.number ? `${repo}-${slot.number}` : `${repo} ${slot.port ?? ""}`).join("\u3001");
}
function taskMeta(task, t) {
  const slots = Object.entries(task.slots ?? {}).map(([repo, slot]) => {
    if (slot.port) return `${repo} ${t("slot.accept")} \xB7 ${t("status.accepting") === "\u5F85\u786E\u8BA4" ? "\u7AEF\u53E3" : "port"} ${slot.port}`;
    return [slot.number ? `${repo}-${slot.number}` : repo, slot.branch].filter(Boolean).join(" \xB7 ");
  });
  if (task.batchId && task.kind === "dev") slots.push(`${t("status.accepting") === "\u5F85\u786E\u8BA4" ? "\u6279\u6B21" : "batch"} ${task.batchId}`);
  if (task.warnings?.length) slots.push(task.warnings.join("\uFF0C"));
  return slots.join(" \xB7 ");
}
function devDetail(data, repo, slot, t) {
  if (!slot.taskId) return t("slot.reusable");
  const title = taskTitle(data, slot.taskId);
  return [title, slot.branch].filter(Boolean).join(" \xB7 ");
}
function acceptDetail(repo, t) {
  if (!repo.acceptSlot) return t("slot.noAccept");
  if (!repo.acceptSlot.batchId) return repo.acceptSlot.port ? `${t("status.accepting") === "\u5F85\u786E\u8BA4" ? "\u7AEF\u53E3" : "port"} ${repo.acceptSlot.port}` : t("slot.free");
  return [`${t("status.accepting") === "\u5F85\u786E\u8BA4" ? "\u7AEF\u53E3" : "port"} ${repo.acceptSlot.port ?? ""}`, repo.acceptSlot.batchId].filter(Boolean).join(" \xB7 ");
}
function agentDetail(data, agent, t) {
  if (agent.kind === "lead" || agent.status === "lead") return t("agent.leadDetail");
  if (agent.status === "running") {
    const title = taskTitle(data, agent.taskId);
    return [agent.kind === "accept" ? t("slot.accept") : t("slot.dev"), title].filter(Boolean).join(" \xB7 ");
  }
  if (agent.lastTaskId) return `${t("agent.last")} \xB7 ${taskTitle(data, agent.lastTaskId)}`;
  return t("agent.idle");
}

// src/client/plugin.tsx
var TYPE_ID = "@jjblau2021/dsh-dev-flow";
var CHANNEL = "/dev-flow";
var PACKAGE_NAME = "@jjblau2021/dsh-dev-flow";
function workspaceOf(ctx, sessionId) {
  if (sessionId === "") return "";
  const sessions = ctx.sessions ?? ctx.get?.("sessions");
  try {
    const cwd = sessions?.list?.getSnapshot?.()?.byId?.[sessionId]?.cwd;
    return typeof cwd === "string" ? cwd : "";
  } catch {
    return "";
  }
}
function definition(t) {
  return {
    id: TYPE_ID,
    kind: "dev-flow",
    priority: "extension",
    title: () => t("tab.title"),
    guide: [{
      id: "open",
      order: 46,
      title: () => t("tab.title"),
      description: () => t("tab.description")
    }]
  };
}
function apply(ctx) {
  ensureSheet();
  const ui = loadUi();
  const disposeLocale = ctx.locale.register(NAMESPACE, { zh, en });
  ctx.effect(() => disposeLocale, "dev-flow: locale");
  const t = ctx.locale.bind(NAMESPACE);
  ctx.effect(() => ctx.sidebarRightTabs.register(definition(t)), "dev-flow: type");
  const call = async (endpoint, payload, signal) => {
    const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : "";
    const workspace = workspaceOf(ctx, sessionId);
    const envelope = await ctx.connection.rpc.call(CHANNEL, endpoint, {
      ...payload ?? {},
      ...workspace === "" ? {} : { workspace }
    }, signal);
    if (!envelope?.ok) throw new Error(envelope?.error?.message || "dev-flow \u8BF7\u6C42\u5931\u8D25");
    return envelope.value;
  };
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
    name: "sidebar.right.pane.tab",
    key: TYPE_ID,
    locale: NAMESPACE,
    inject: (sessionId) => ({ ...typeof sessionId === "string" ? { sessionId } : {}, call, ui })
  }, Panel)), "dev-flow: body");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab.title", () => ctx.slots.register({
    name: "sidebar.right.pane.tab.title",
    key: TYPE_ID,
    locale: NAMESPACE
  }, Title)), "dev-flow: title");
  ctx.effect(() => ctx.slots.inject("conversation.input.overlay", () => ctx.slots.register({
    name: "conversation.input.overlay",
    id: "dev-flow-switch",
    order: 10,
    locale: NAMESPACE,
    inject: (sessionId) => ({ ...typeof sessionId === "string" ? { sessionId } : {}, call, ui })
  }, WorkflowSwitch)), "dev-flow: switch");
  ctx.effect(() => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
    name: "plugins.bundle.config",
    key: PACKAGE_NAME,
    locale: NAMESPACE,
    inject: () => ({ call, ui })
  }, SettingsForm)), "dev-flow: settings");
}

// src/client/index.tsx
var inject = ["slots", "locale", "sidebarRightTabs", "connection", "sessions"];

    const plugin = module.exports;
    if (typeof plugin.apply !== 'function') throw new Error('dev-flow: 构建产物缺少 apply');
    return plugin;
  },
});

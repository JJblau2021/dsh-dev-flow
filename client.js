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
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
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

// src/client/diff.ts
var DIFF_TYPE_ID = "@jjblau2021/dsh-dev-flow/diff";
var DIFF_KIND = "devFlowDiff";
var DIFF_SCHEME = "dsh-resource://dev-flow-diff/";
var DIFF_PATTERN = "dsh-resource://dev-flow-diff/**";
function diffAddress(target) {
  const title = target.title === "" ? target.taskId : target.title;
  return DIFF_SCHEME + [target.taskId, title].map((part) => encodeURIComponent(part)).join("/");
}
function parseDiffAddress(address) {
  if (address === void 0 || !address.startsWith(DIFF_SCHEME)) return void 0;
  const parts = address.slice(DIFF_SCHEME.length).split("/");
  if (parts.length !== 2) return void 0;
  try {
    const [taskId, title] = parts.map((part) => decodeURIComponent(part));
    if (taskId === "") return void 0;
    return { taskId, title: title === "" ? taskId : title };
  } catch {
    return void 0;
  }
}
function diffTitle(address) {
  return parseDiffAddress(address)?.title ?? "";
}
function navigatedIndex(params) {
  const index = params?.index;
  return typeof index === "number" && Number.isSafeInteger(index) && index >= 0 ? index : void 0;
}
function absoluteFileAddress(path) {
  const normalized = path.replace(/\\/gu, "/");
  const unc = normalized.startsWith("//");
  const absolute = normalized.replace(/^\/+/, "");
  const encoded = absolute.split("/").map((segment) => encodeURIComponent(segment).replace(/%3A/giu, ":")).join("/");
  return `dsh-resource://file/absolute/${unc ? "/" : ""}${encoded}`;
}
function diffLabelsOf(t) {
  const fallback = {
    "diff.loading": "\u52A0\u8F7D\u4E2D",
    "diff.missing": "\u6587\u4EF6\u5DF2\u4E0D\u5B58\u5728",
    "diff.error": "\u8BFB\u53D6\u5931\u8D25",
    "presented.retry": "\u91CD\u8BD5",
    "diff.binary": "\u4E8C\u8FDB\u5236\u6587\u4EF6",
    "diff.oversized": "\u6587\u4EF6\u8FC7\u5927",
    "diff.coarse": "\u5927\u7EB2\u6A21\u5F0F",
    "diff.truncated": "\u53EA\u663E\u793A\u524D {count} \u884C"
  };
  return (key, params) => {
    const localized = t(key);
    const text = localized === key || localized === "" ? fallback[key] ?? key : localized;
    return params ? text.replace(/\{(\w+)\}/gu, (whole, name) => params[name] ?? whole) : text;
  };
}
function hunksFromPatch(patch) {
  const hunks = [];
  let current = null;
  for (const line of patch.split("\n")) {
    const head = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/u.exec(line);
    if (head !== null) {
      current = { oldStart: Number(head[1]), oldLines: Number(head[2] ?? 1), newStart: Number(head[3]), newLines: Number(head[4] ?? 1), lines: [] };
      hunks.push(current);
      continue;
    }
    if (current === null) continue;
    if (line.startsWith("\\")) continue;
    if (line.startsWith("diff --git") || line.startsWith("index ") || line.startsWith("--- ") || line.startsWith("+++ ")) {
      current = null;
      continue;
    }
    if (line === "") continue;
    current.lines.push(line);
  }
  return hunks;
}
function diffStateOf(file) {
  if (file.binary) return { kind: "binary", path: file.path, display: file.path };
  return {
    kind: "text",
    path: file.path,
    display: file.path,
    before: !/^--- \/dev\/null$/mu.test(file.patch),
    after: !/^\+\+\+ \/dev\/null$/mu.test(file.patch),
    hunks: file.hunks?.length ? file.hunks : hunksFromPatch(file.patch),
    coarse: false
  };
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

// src/client/vendor/FileDiff.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// df:dev-flow:css-registry
var chunks = [];
function register(text) {
  chunks.push(text);
}
function all() {
  return chunks.join("\n");
}

// src/client/vendor/FileDiff.module.css
register("/** Shared comparison layout, header, states, and numbered diff lines for previews and review tabs. */\n.df-root-ed1877 { --diff-empty-fill: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover) 50%, transparent); display: flex; flex-direction: column; box-sizing: border-box; width: 100%; min-height: 0; color: var(--dsw-alias-label-primary); }\n.df-header-ed1877 { display: flex; flex: 0 0 auto; gap: 6px; align-items: center; box-sizing: border-box; height: 38px; padding: 0 6px 0 8px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); }\n.df-status-ed1877 { display: flex; gap: 12px; align-items: center; margin: 0; padding: 16px; font-size: 13px; color: var(--dsw-alias-label-secondary); }\n.df-body-ed1877 { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; overflow: auto; padding: 8px 0 16px; font: var(--dsw-font-markdown-code-block); }\n.df-columns-ed1877 { display: grid; flex: 1 1 auto; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 0; }\n/* One intrinsic-width track keeps every hunk and row painted across the scrollable content. */\n.df-column-ed1877, .df-body-ed1877[data-review-view='unified']:not([data-review-wrap]) { display: grid; grid-template-columns: minmax(max-content, 100%); align-content: start; }\n.df-column-ed1877 { min-width: 0; overflow-x: scroll; overscroll-behavior: none; }\n.df-column-ed1877 + .df-column-ed1877 { border-left: 0.5px solid var(--dsw-alias-border-l3); }\n.df-sideLine-ed1877 { display: grid; grid-template-columns: 3.5em max-content; box-sizing: border-box; min-width: 100%; width: max-content; min-height: 22px; line-height: 22px; white-space: pre; }\n.df-note-ed1877 { margin: 0; padding: 4px 16px 8px; font: var(--dsw-font-xs-13); color: var(--dsw-alias-label-tertiary); }\n.df-hunk-ed1877 { margin-bottom: 8px; }\n.df-hunkHeader-ed1877 { padding: 4px 16px; color: var(--dsw-alias-label-tertiary); white-space: pre; }\n.df-line-ed1877 { display: grid; grid-template-columns: 3.5em 3.5em 1.2em minmax(0, 1fr); box-sizing: border-box; min-height: 22px; line-height: 22px; white-space: pre; }\n.df-splitLine-ed1877 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 22px; line-height: 22px; white-space: pre; }\n.df-cell-ed1877 { display: grid; grid-template-columns: 3.5em minmax(0, 1fr); box-sizing: border-box; min-width: 0; }\n.df-cell-ed1877 + .df-cell-ed1877 { border-left: 0.5px solid var(--dsw-alias-border-l3); }\n.df-number-ed1877 { padding-right: 8px; color: var(--dsw-alias-label-tertiary); text-align: right; user-select: none; }\n.df-sign-ed1877 { text-align: center; user-select: none; }\n.df-text-ed1877 { padding-right: 16px; }\n.df-body-ed1877[data-review-wrap] .df-line-ed1877, .df-body-ed1877[data-review-wrap] .df-splitLine-ed1877 { white-space: pre-wrap; }\n.df-body-ed1877[data-review-wrap] .df-text-ed1877 { overflow-wrap: anywhere; }\n.df-add-ed1877 { --diff-gutter-fill: var(--dsw-alias-file-diff-added-gutter); --diff-marker: var(--dsw-alias-file-diff-added-marker); background: var(--dsw-alias-file-diff-added-bg); }\n.df-del-ed1877 { --diff-gutter-fill: var(--dsw-alias-file-diff-deleted-gutter); --diff-marker: var(--dsw-alias-file-diff-deleted-marker); background: var(--dsw-alias-file-diff-deleted-bg); }\n.df-add-ed1877 .df-number-ed1877, .df-del-ed1877 .df-number-ed1877 { background: var(--diff-gutter-fill); color: var(--diff-marker); }\n.df-add-ed1877 .df-number-ed1877:first-child, .df-del-ed1877 .df-number-ed1877:first-child { box-shadow: inset 3px 0 0 var(--diff-marker); }\n.df-add-ed1877 .df-sign-ed1877, .df-del-ed1877 .df-sign-ed1877 { color: var(--diff-marker); }\n.df-context-ed1877 .df-text-ed1877 { color: var(--dsw-alias-label-secondary); }\n.df-empty-ed1877 { background: var(--diff-empty-fill); }\n");
var FileDiff_default = { "root": "df-root-ed1877", "header": "df-header-ed1877", "status": "df-status-ed1877", "body": "df-body-ed1877", "columns": "df-columns-ed1877", "column": "df-column-ed1877", "sideLine": "df-sideLine-ed1877", "note": "df-note-ed1877", "hunk": "df-hunk-ed1877", "hunkHeader": "df-hunkHeader-ed1877", "line": "df-line-ed1877", "splitLine": "df-splitLine-ed1877", "cell": "df-cell-ed1877", "number": "df-number-ed1877", "sign": "df-sign-ed1877", "text": "df-text-ed1877", "add": "df-add-ed1877", "del": "df-del-ed1877", "context": "df-context-ed1877", "empty": "df-empty-ed1877" };

// src/client/vendor/FileDiff.tsx
var MAX_RENDERED_LINES = 5e3;
function highlightedSide(rows, side, highlighter) {
  const source = rows.flatMap((row) => {
    const no = row[side];
    return no === void 0 ? [] : [{ no, text: row.text }];
  });
  if (source.length === 0) return /* @__PURE__ */ new Map();
  const highlighted = highlighter(source.map((line) => line.text).join("\n"));
  if (highlighted === void 0) return void 0;
  return new Map(source.map((line, index) => {
    return [line.no, highlighted[index] ?? []];
  }));
}
function hunkHighlights(hunk, highlighter) {
  const rows = hunkRows(hunk);
  return { old: highlightedSide(rows, "old", highlighter), new: highlightedSide(rows, "new", highlighter) };
}
function DiffText({ text, spans }) {
  return /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.text, "data-diff-code": spans === void 0 ? void 0 : "" }, spans === void 0 ? text : spans.map((span, index) => /* @__PURE__ */ React.createElement("span", { key: index, style: span.style }, span.text)));
}
function hunkRows(hunk) {
  let oldNo = hunk.oldStart;
  let newNo = hunk.newStart;
  return hunk.lines.map((line) => {
    const text = line.slice(1);
    switch (line[0]) {
      case "+":
        return { kind: "add", old: void 0, new: newNo++, text };
      case "-":
        return { kind: "del", old: oldNo++, new: void 0, text };
      default:
        return { kind: "context", old: oldNo++, new: newNo++, text };
    }
  });
}
function splitRows(hunk) {
  const rows = [];
  let dels = [];
  let adds = [];
  const flush = () => {
    for (let at = 0; at < Math.max(dels.length, adds.length); at += 1) {
      const left = dels[at];
      const right = adds[at];
      rows.push({ ...left === void 0 ? {} : { left }, ...right === void 0 ? {} : { right } });
    }
    dels = [];
    adds = [];
  };
  for (const row of hunkRows(hunk)) {
    if (row.kind === "del") dels.push({ no: row.old, text: row.text, kind: "del" });
    else if (row.kind === "add") adds.push({ no: row.new, text: row.text, kind: "add" });
    else {
      flush();
      rows.push({ left: { no: row.old, text: row.text, kind: "context" }, right: { no: row.new, text: row.text, kind: "context" } });
    }
  }
  flush();
  return rows;
}
function renderedHunks(hunks) {
  let budget = MAX_RENDERED_LINES;
  const kept = [];
  for (const hunk of hunks) {
    if (budget === 0) return { hunks: kept, truncated: true };
    kept.push(hunk.lines.length <= budget ? hunk : { ...hunk, lines: hunk.lines.slice(0, budget) });
    budget -= Math.min(budget, hunk.lines.length);
  }
  return { hunks: kept, truncated: hunks.some((hunk, at) => kept[at] !== hunk) };
}
function noteOf(diff) {
  if (!diff.before) return "diff.created";
  if (!diff.after) return "diff.deleted";
  if (diff.hunks.length === 0) return "diff.unchanged";
  return void 0;
}
function FileDiff({ state, split, wrap, retry, t }) {
  if (state === void 0 || state === "loading") return /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.status, role: "status" }, t("diff.loading"));
  if (state === "missing") return /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.status }, t("diff.missing"));
  if (state === "error") {
    return /* @__PURE__ */ React.createElement("div", { className: FileDiff_default.status }, /* @__PURE__ */ React.createElement("span", null, t("diff.error")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { size: "sm", onClick: retry }, t("presented.retry")));
  }
  if (state.kind === "binary") return /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.status }, t("diff.binary"));
  if (state.kind === "oversized") return /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.status }, t("diff.oversized"));
  const hasAdditions = state.hunks.some((hunk) => hunk.lines.some((line) => line.startsWith("+")));
  const hasDeletions = state.hunks.some((hunk) => hunk.lines.some((line) => line.startsWith("-")));
  const oneSided = hasAdditions !== hasDeletions;
  return /* @__PURE__ */ React.createElement(TextDiff, { diff: state, split: split && !oneSided, wrap, t });
}
function splitRowKind(row) {
  return row.left?.kind === "del" ? "del" : row.right?.kind === "add" ? "add" : "context";
}
function hunkHeader(hunk) {
  return `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
}
function SplitColumns({ hunks, highlights }) {
  const paired = (0, import_react.useMemo)(() => hunks.map((hunk) => ({ header: hunkHeader(hunk), rows: splitRows(hunk) })), [hunks]);
  const columns = (0, import_react.useRef)({ left: null, right: null });
  const offsets = (0, import_react.useRef)({ left: { scrollLeft: 0, scrollTop: 0 }, right: { scrollLeft: 0, scrollTop: 0 } });
  const follow = (side) => (event) => {
    const peer = side === "left" ? "right" : "left";
    const other = columns.current[peer];
    if (other === null) return;
    for (const axis of ["scrollLeft", "scrollTop"]) {
      const value = event.currentTarget[axis];
      if (offsets.current[side][axis] === value) continue;
      offsets.current[side][axis] = value;
      other[axis] = value;
      offsets.current[peer][axis] = other[axis];
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: FileDiff_default.columns }, ["left", "right"].map((side) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: side,
      className: FileDiff_default.column,
      "data-diff-side": side,
      ref: (element) => {
        columns.current[side] = element;
      },
      onScroll: follow(side)
    },
    paired.map((hunk, position) => /* @__PURE__ */ React.createElement("section", { key: position, className: FileDiff_default.hunk }, /* @__PURE__ */ React.createElement("div", { className: FileDiff_default.hunkHeader, "data-diff-hunk-header": true }, hunk.header), hunk.rows.map((row, at) => {
      const cell = row[side];
      const spans = cell === void 0 ? void 0 : highlights[position]?.[side === "left" ? "old" : "new"]?.get(cell.no);
      return /* @__PURE__ */ React.createElement("div", { key: at, className: `${FileDiff_default.sideLine} ${cell === void 0 ? FileDiff_default.empty : FileDiff_default[cell.kind]}`, "data-diff-line": splitRowKind(row) }, /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.number }, cell?.no ?? ""), /* @__PURE__ */ React.createElement(DiffText, { text: cell?.text ?? "", spans }));
    })))
  )));
}
function TextDiff({ diff, split, wrap, t }) {
  const note = noteOf(diff);
  const { hunks, truncated } = (0, import_react.useMemo)(() => renderedHunks(diff.hunks), [diff.hunks]);
  const highlighter = (0, import_dsh_client_ui_primitives.useCodeHighlighter)((0, import_dsh_client_ui_primitives.languageForPath)(diff.path));
  const highlights = (0, import_react.useMemo)(() => hunks.map((hunk) => hunkHighlights(hunk, highlighter)), [hunks, highlighter]);
  return /* @__PURE__ */ React.createElement("div", { className: FileDiff_default.body, "data-review-view": split ? "split" : "unified", "data-review-wrap": wrap || void 0 }, note !== void 0 && /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.note, "data-diff-note": hunks.length === 0 ? "empty" : "metadata" }, t(note)), diff.coarse && /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.note, "data-diff-coarse": true }, t("diff.coarse")), truncated && /* @__PURE__ */ React.createElement("p", { className: FileDiff_default.note, "data-diff-truncated": true }, t("diff.truncated", { count: String(MAX_RENDERED_LINES) })), split && !wrap ? /* @__PURE__ */ React.createElement(SplitColumns, { hunks, highlights }) : hunks.map((hunk, position) => {
    const highlighted = highlights[position];
    return /* @__PURE__ */ React.createElement("section", { key: position, className: FileDiff_default.hunk }, /* @__PURE__ */ React.createElement("div", { className: FileDiff_default.hunkHeader, "data-diff-hunk-header": true }, hunkHeader(hunk)), split ? splitRows(hunk).map((row, at) => /* @__PURE__ */ React.createElement("div", { key: at, className: FileDiff_default.splitLine, "data-diff-line": splitRowKind(row) }, /* @__PURE__ */ React.createElement("span", { className: `${FileDiff_default.cell} ${row.left === void 0 ? FileDiff_default.empty : FileDiff_default[row.left.kind]}` }, /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.number }, row.left?.no ?? ""), /* @__PURE__ */ React.createElement(DiffText, { text: row.left?.text ?? "", spans: row.left === void 0 ? void 0 : highlighted?.old?.get(row.left.no) })), /* @__PURE__ */ React.createElement("span", { className: `${FileDiff_default.cell} ${row.right === void 0 ? FileDiff_default.empty : FileDiff_default[row.right.kind]}` }, /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.number }, row.right?.no ?? ""), /* @__PURE__ */ React.createElement(DiffText, { text: row.right?.text ?? "", spans: row.right === void 0 ? void 0 : highlighted?.new?.get(row.right.no) })))) : hunkRows(hunk).map((row, at) => /* @__PURE__ */ React.createElement("div", { key: at, className: `${FileDiff_default.line} ${FileDiff_default[row.kind]}`, "data-diff-line": row.kind }, /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.number }, row.old ?? ""), /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.number }, row.new ?? ""), /* @__PURE__ */ React.createElement("span", { className: FileDiff_default.sign }, row.kind === "add" ? "+" : row.kind === "del" ? "-" : " "), /* @__PURE__ */ React.createElement(DiffText, { text: row.text, spans: row.kind === "add" ? highlighted?.new?.get(row.new) : highlighted?.old?.get(row.old) }))));
  }));
}

// src/client/diff-tab.tsx
var { useEffect, useState } = React;
var views = /* @__PURE__ */ new Map();
var appliedRevisions = /* @__PURE__ */ new Map();
var DEFAULT_VIEW = { index: 0, split: true, wrap: false };
function DiffTab({
  sessionId,
  call,
  t,
  ui,
  useTabInfo
}) {
  const info = typeof useTabInfo === "function" ? useTabInfo() : void 0;
  const tab = info?.tab;
  const address = tab === void 0 ? void 0 : tab.navigation?.address ?? tab.contentId;
  const target = parseDiffAddress(address);
  const tabId = tab?.id ?? "";
  const [view, setView] = useState(() => views.get(tabId) ?? DEFAULT_VIEW);
  const [files, setFiles] = useState(null);
  const [failed, setFailed] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (tabId !== "") views.set(tabId, view);
  }, [tabId, view]);
  useEffect(() => {
    const signal = tab?.signal;
    if (signal === void 0 || tabId === "") return void 0;
    const forget = () => {
      views.delete(tabId);
      appliedRevisions.delete(tabId);
    };
    signal.addEventListener("abort", forget, { once: true });
    return () => signal.removeEventListener("abort", forget);
  }, [tab?.signal, tabId]);
  const taskId = target?.taskId;
  useEffect(() => {
    if (sessionId === void 0 || taskId === void 0) {
      setFiles([]);
      return void 0;
    }
    const controller = new AbortController();
    setFiles(null);
    setFailed("");
    call("task-diff", { sessionId, taskId }, controller.signal).then((value) => {
      if (!controller.signal.aborted) setFiles(value?.files ?? []);
    }).catch((reason) => {
      if (!controller.signal.aborted) setFailed(reason instanceof Error ? reason.message : String(reason));
    });
    return () => controller.abort();
  }, [sessionId, call, taskId, attempt]);
  const revision = tab?.navigation?.revision ?? 0;
  const requested = navigatedIndex(tab?.navigation?.params);
  useEffect(() => {
    if (files === null || files.length === 0 || tabId === "") return;
    if ((appliedRevisions.get(tabId) ?? -1) === revision) return;
    appliedRevisions.set(tabId, revision);
    setView((prev) => ({ ...prev, index: Math.min(requested ?? prev.index, files.length - 1) }));
  }, [files, revision, requested, tabId]);
  const labels = diffLabelsOf(t);
  const index = files === null || files.length === 0 ? 0 : Math.min(view.index, files.length - 1);
  const file = files?.[index];
  const retry = () => setAttempt((value) => value + 1);
  const openFile = () => {
    if (file === void 0 || sessionId === void 0 || taskId === void 0 || typeof tab?.actions?.openResource !== "function") return;
    const actions = tab.actions;
    call("snapshot", { sessionId }).then((value) => {
      const task = value?.tasks?.find((row) => row.id === taskId);
      const slot = task?.slots?.[file.repo]?.path;
      if (typeof slot === "string" && slot !== "") actions.openResource?.(absoluteFileAddress(`${slot}/${file.path}`));
    }).catch(() => void 0);
  };
  const pathOf = (entry) => `${entry.repo}/${entry.path}`;
  const counts = (entry) => entry.binary ? /* @__PURE__ */ React.createElement("span", { className: "df-review-label" }, t("diff.binary")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "df-diff-add" }, `+${entry.added}`), /* @__PURE__ */ React.createElement("span", { className: "df-diff-del" }, `-${entry.deleted}`));
  const Menu = ui.Menu;
  const PathLabel = ui.PathLabel;
  const Chevron2 = ui.IconChevronDownOutlineRegular;
  const selector = Menu === void 0 ? /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "df-review-file df-review-native-select",
      "aria-label": t("review.selectFile"),
      value: String(index),
      onChange: (event) => setView((prev) => ({ ...prev, index: Number(event.target.value) }))
    },
    (files ?? []).map((entry, at) => /* @__PURE__ */ React.createElement("option", { key: `${at}-${entry.repo}:${entry.path}`, value: String(at) }, pathOf(entry)))
  ) : /* @__PURE__ */ React.createElement(
    Menu,
    {
      className: "df-review-selector",
      open: menuOpen,
      autoFocus: true,
      portal: true,
      align: "start",
      dense: true,
      onClose: () => setMenuOpen(false),
      anchor: /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "df-review-select",
          "aria-haspopup": "menu",
          "aria-expanded": menuOpen,
          "aria-label": t("review.selectFile"),
          title: file === void 0 ? "" : pathOf(file),
          onClick: () => setMenuOpen((value) => !value)
        },
        PathLabel === void 0 ? /* @__PURE__ */ React.createElement("span", { className: "df-review-file" }, file === void 0 ? "" : pathOf(file)) : /* @__PURE__ */ React.createElement(PathLabel, { path: file === void 0 ? "" : pathOf(file) }),
        Chevron2 === void 0 ? null : /* @__PURE__ */ React.createElement(Chevron2, { size: 12 })
      ),
      items: (files ?? []).map((entry, at) => ({
        id: String(at),
        label: /* @__PURE__ */ React.createElement("span", { className: "df-menu-item" }, /* @__PURE__ */ React.createElement("span", { className: "df-menu-path" }, pathOf(entry)), /* @__PURE__ */ React.createElement("span", { className: "df-menu-counts" }, counts(entry)))
      })),
      selectedId: String(index),
      onSelect: (id) => {
        setView((prev) => ({ ...prev, index: Number(id) }));
        setMenuOpen(false);
      }
    }
  );
  return /* @__PURE__ */ React.createElement("div", { className: "df-review" }, /* @__PURE__ */ React.createElement("div", { className: "df-review-head" }, files === null || files.length === 0 ? /* @__PURE__ */ React.createElement("span", { className: "df-review-file" }, target?.title ?? "") : selector, file === void 0 ? null : /* @__PURE__ */ React.createElement("span", { className: "df-review-counts" }, counts(file)), files === null || files.length === 0 ? null : /* @__PURE__ */ React.createElement("span", { className: "df-review-tools" }, /* @__PURE__ */ React.createElement(Tooltip, { ui, label: t(view.split ? "review.unified" : "review.split") }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "df-review-tool",
      "aria-pressed": view.split,
      "aria-label": t("review.splitAria"),
      onClick: () => setView((prev) => ({ ...prev, split: !prev.split }))
    },
    ui.IconCompareSplitOutlineRegular === void 0 ? /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u25A5") : /* @__PURE__ */ React.createElement(ui.IconCompareSplitOutlineRegular, { className: "df-review-compare-icon" })
  )), /* @__PURE__ */ React.createElement(Tooltip, { ui, label: t(view.wrap ? "review.nowrap" : "review.wrap") }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "df-review-tool",
      "aria-pressed": view.wrap,
      "aria-label": t("review.wrapAria"),
      onClick: () => setView((prev) => ({ ...prev, wrap: !prev.wrap }))
    },
    view.wrap ? ui.IconNowrapFillRegular === void 0 ? /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u21B5") : /* @__PURE__ */ React.createElement(ui.IconNowrapFillRegular, null) : ui.IconWrapFillRegular === void 0 ? /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u21A9") : /* @__PURE__ */ React.createElement(ui.IconWrapFillRegular, null)
  )), /* @__PURE__ */ React.createElement(Tooltip, { ui, label: t("review.openFile") }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "df-review-tool", "aria-label": t("review.openFile"), onClick: openFile }, ui.IconInspectOutlineRegular === void 0 ? /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2315") : /* @__PURE__ */ React.createElement(ui.IconInspectOutlineRegular, null))))), /* @__PURE__ */ React.createElement("div", { className: "df-review-body" }, failed !== "" ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, failed), /* @__PURE__ */ React.createElement(ActionButton, { ui, onClick: retry }, t("presented.retry"))) : files === null ? /* @__PURE__ */ React.createElement(FileDiff, { state: "loading", split: view.split, wrap: view.wrap, retry, t: labels }) : files.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("review.empty"))) : file === void 0 ? /* @__PURE__ */ React.createElement(FileDiff, { state: "missing", split: view.split, wrap: view.wrap, retry, t: labels }) : /* @__PURE__ */ React.createElement(FileDiff, { state: diffStateOf(file), split: view.split, wrap: view.wrap, retry, t: labels })));
}
function Tooltip({ ui, label, children }) {
  if (ui.Tooltip === void 0) return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
  const Tip = ui.Tooltip;
  return /* @__PURE__ */ React.createElement(Tip, { label, side: "bottom", delayMs: 500 }, children);
}

// src/client/locale.ts
var NAMESPACE = "devFlow";
var zh = {
  "tab.title": "dev-flow",
  "tab.diff": "diff",
  "tab.description": "\u67E5\u770B\u591A\u4ED3\u5E93\u5F00\u53D1\u4EFB\u52A1\u3001\u69FD\u4F4D\u548C\u4EE3\u7406",
  "switch.label": "\u5DE5\u4F5C\u6D41",
  "page.overview": "\u6982\u89C8",
  "page.tasks": "\u4EFB\u52A1",
  "page.slots": "\u69FD\u4F4D",
  "page.agents": "\u4EE3\u7406",
  "page.bases": "\u57FA\u7EBF",
  "filter.all": "\u5168\u90E8",
  "filter.pending": "\u5F85\u9A8C\u6536",
  "filter.dev": "\u5F00\u53D1\u4E2D",
  "filter.earlier": "\u66F4\u65E9",
  "action.accept": "\u53D1\u8D77\u9A8C\u6536",
  "action.working": "\u6B63\u5728\u53D1\u8D77",
  "toast.started": "\u5DF2\u53D1\u8D77\u9A8C\u6536",
  "action.pass": "\u901A\u8FC7",
  "action.merge": "\u5408\u5165",
  "action.delete": "\u5220\u9664",
  "action.deleting": "\u6B63\u5728\u5220\u9664",
  "hint.deleteSingle": "\u5220\u9664\u4EFB\u52A1\u5E76\u5220\u9664\u4EFB\u52A1\u5206\u652F\uFF0C\u65E0\u6CD5\u6062\u590D",
  "hint.deleteTasks": "\u5220\u9664 {count} \u4E2A\u4EFB\u52A1\uFF0C\u540C\u65F6\u5220\u9664\u5BF9\u5E94\u4EFB\u52A1\u5206\u652F\uFF0C\u65E0\u6CD5\u6062\u590D",
  "hint.deleteBlocked": "\u52FE\u9009\u91CC\u6709\u4E0D\u53EF\u5220\u9664\u7684\u4EFB\u52A1\uFF1A\u53EA\u6709\u5DF2\u7ED3\u675F\u4E14\u6CA1\u6709\u88AB\u5176\u5B83\u4EFB\u52A1\u4F9D\u8D56\u7684\u4EFB\u52A1\u53EF\u4EE5\u5220\u9664",
  "toast.deletedTasks": "\u5DF2\u5220\u9664 {count} \u4E2A\u4EFB\u52A1",
  "toast.deleteWarnings": "\u5DF2\u5220\u9664 {count} \u4E2A\u4EFB\u52A1\uFF0C\u4F46\u8FD9\u4E9B\u5206\u652F\u6CA1\u5220\u6389\uFF1A{warnings}",
  "action.detail": "\u8BE6\u60C5",
  "diff.copy": "\u590D\u5236",
  "diff.copied": "\u5DF2\u590D\u5236",
  "diff.collapse": "\u6536\u8D77",
  "diff.loading": "\u52A0\u8F7D\u4E2D",
  "diff.missing": "\u6587\u4EF6\u5DF2\u4E0D\u5B58\u5728",
  "diff.error": "\u8BFB\u53D6\u5931\u8D25",
  "diff.binary": "\u4E8C\u8FDB\u5236\u6587\u4EF6",
  "diff.oversized": "\u6587\u4EF6\u8FC7\u5927",
  "diff.created": "\u65B0\u6587\u4EF6",
  "diff.deleted": "\u5DF2\u5220\u9664",
  "diff.unchanged": "\u5185\u5BB9\u6CA1\u6709\u53D8\u5316",
  "diff.coarse": "\u5927\u7EB2\u6A21\u5F0F",
  "diff.truncated": "\u53EA\u663E\u793A\u524D {count} \u884C",
  "review.selectFile": "\u9009\u62E9\u8981\u67E5\u770B\u7684\u6587\u4EF6",
  "review.split": "\u5207\u6362\u4E3A\u5DE6\u53F3\u5BF9\u6BD4",
  "review.unified": "\u5207\u6362\u4E3A\u5355\u680F\u5BF9\u6BD4",
  "review.splitAria": "\u5DE6\u53F3\u5BF9\u6BD4",
  "review.wrap": "\u5F00\u542F\u81EA\u52A8\u6362\u884C",
  "review.nowrap": "\u5173\u95ED\u81EA\u52A8\u6362\u884C",
  "review.wrapAria": "\u81EA\u52A8\u6362\u884C",
  "review.openFile": "\u5728\u4FA7\u8FB9\u680F\u6253\u5F00\u6574\u4E2A\u6587\u4EF6",
  "review.empty": "\u8FD9\u6B21\u6539\u52A8\u6CA1\u6709\u6587\u4EF6",
  "action.fail": "\u4E0D\u901A\u8FC7",
  "status.review": "\u5F85\u786E\u8BA4",
  "action.refresh": "\u5237\u65B0",
  "action.save": "\u4FDD\u5B58",
  "action.saving": "\u4FDD\u5B58\u4E2D",
  "action.cancel": "\u53D6\u6D88",
  "action.edit": "\u7F16\u8F91",
  "action.newBase": "\u65B0\u5EFA\u57FA\u7EBF\u7EC4",
  "action.init": "\u521D\u59CB\u5316",
  "empty.init": "\u5C1A\u672A\u521D\u59CB\u5316\u3002\u521D\u59CB\u5316\u540E\u624D\u4F1A\u626B\u63CF\u4ED3\u5E93\u3002",
  "empty.root": "\u8BF7\u5728\u5DE5\u4F5C\u533A\u6839\u6253\u5F00\u4F1A\u8BDD",
  "settings.summary": "\u5F00\u53D1\u4E0E\u9A8C\u6536\u7684\u6A21\u578B\u3001\u76EE\u5F55\u548C\u5206\u652F",
  "metric.projects": "\u9879\u76EE",
  "metric.agents": "\u6D3B\u8DC3\u5B50\u4EE3\u7406",
  "metric.tasks": "\u6D3B\u8DC3\u4EFB\u52A1",
  "metric.slots": "\u6D3B\u8DC3\u69FD\u4F4D",
  "metric.pending": "\u5F85\u9A8C\u6536",
  "metric.dirty": "\u57FA\u7EBF\u4E0D\u5E72\u51C0",
  "section.scheduleTasks": "\u8C03\u5EA6\u4EFB\u52A1",
  "section.emptySchedule": "\u6CA1\u6709\u8C03\u5EA6\u4EFB\u52A1",
  "section.devTasks": "\u5F00\u53D1\u4EFB\u52A1",
  "section.acceptTasks": "\u9A8C\u6536\u4EFB\u52A1",
  "section.emptyDev": "\u6CA1\u6709\u5F00\u53D1\u4EFB\u52A1",
  "section.emptyAccept": "\u6CA1\u6709\u9A8C\u6536\u4EFB\u52A1",
  "fact.depends": "\u4F9D\u8D56",
  "fact.merged": "\u5DF2\u5E76\u5165",
  "fact.state": "\u72B6\u6001",
  "fact.notMerged": "\u672A\u5E76\u5165",
  "fact.warning": "\u8B66\u544A",
  "section.projects": "\u9879\u76EE",
  "section.bases": "\u57FA\u7EBF",
  "empty.bases": "\u8FD8\u6CA1\u6709\u57FA\u7EBF",
  "empty.basesHint": "\u7528\u4EFB\u52A1\u6216\u8C03\u5EA6\u6307\u5B9A\u57FA\u7EBF\u5206\u652F\u540E\uFF0C\u4F1A\u81EA\u52A8\u5EFA\u7ACB\u57FA\u7EBF\u69FD\u4F4D",
  "base.current": "\u5F53\u524D",
  "base.default": "\u9ED8\u8BA4",
  "base.root": "\u6839\u76EE\u5F55\u68C0\u51FA",
  "base.slot": "\u57FA\u7EBF\u69FD\u4F4D",
  "base.busy": "\u5176\u5B83\u68C0\u51FA\u5360\u7528",
  "base.missing": "\u69FD\u4F4D\u7F3A\u5931",
  "base.none": "\u672A\u5EFA\u7ACB\u69FD\u4F4D",
  "base.tasks": "{count} \u4E2A\u4EFB\u52A1",
  "base.label": "\u540D\u79F0",
  "base.labelPlaceholder": "\u7559\u7A7A\u65F6\u7528\u7B2C\u4E00\u6761\u5206\u652F\u540D",
  "base.branch": "\u5206\u652F",
  "base.noBranches": "\u6CA1\u6709\u53EF\u9009\u5206\u652F",
  "base.branchesStale": "\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u5206\u652F\u5217\u8868\uFF0C\u73B0\u5728\u53EA\u80FD\u9009\u5F53\u524D\u5206\u652F\uFF1B\u8BF7\u91CD\u542F DSH \u540E\u518D\u8BD5\u3002",
  "base.needMember": "\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u9879\u76EE",
  "base.needBranch": "\u8BF7\u4E3A\u9009\u4E2D\u7684\u9879\u76EE\u9009\u62E9\u5206\u652F",
  "base.saved": "\u5DF2\u4FDD\u5B58\u57FA\u7EBF\u7EC4",
  "base.editor.create": "\u65B0\u5EFA\u57FA\u7EBF\u7EC4",
  "base.editor.edit": "\u7F16\u8F91\u57FA\u7EBF\u7EC4 #{number}",
  "base.count": "{count} \u6761\u57FA\u7EBF",
  "base.projects": "{count} \u4E2A\u9879\u76EE",
  "base.noRepo": "\u8FD8\u6CA1\u6709\u5206\u914D\u4ED3\u5E93",
  "base.clean": "\u5E72\u51C0",
  "base.dirty": "\u4E0D\u5E72\u51C0",
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
  "status.developing": "\u5F00\u53D1\u4E2D",
  "status.awaiting-agent": "\u5F85\u6D3E\u53D1",
  "status.scheduling": "\u8C03\u5EA6\u4E2D",
  "status.dispatched": "\u5DF2\u8C03\u5EA6",
  "status.failed": "\u5931\u8D25",
  "status.waiting": "\u7B49\u5F85",
  "status.pending-acceptance": "\u5F85\u9A8C\u6536",
  "status.accepted": "\u5DF2\u5B8C\u6210",
  "status.merged": "\u5DF2\u5B8C\u6210",
  "status.pending-merge": "\u5F85\u5408\u5165",
  "status.abandoned": "\u653E\u5F03",
  "status.accepting": "\u9A8C\u6536\u4E2D",
  "status.idle": "\u7A7A\u95F2",
  "status.rejected": "\u4E0D\u901A\u8FC7",
  "hint.order": "\u6309\u52FE\u9009\u987A\u5E8F\u5E76\u5165",
  "hint.pick": "\u5148\u52FE\u9009\u5F85\u9A8C\u6536\u4EFB\u52A1",
  "hint.baseMismatch": "\u6240\u9009\u4EFB\u52A1\u7684\u57FA\u7EBF\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5206\u5F00\u9A8C\u6536"
};
var en = {
  "tab.title": "dev-flow",
  "tab.diff": "diff",
  "tab.description": "Tasks, slots, and agents for a multi-repo workspace",
  "switch.label": "Workflow",
  "page.overview": "Overview",
  "page.tasks": "Tasks",
  "page.slots": "Slots",
  "page.agents": "Agents",
  "page.bases": "Baselines",
  "filter.all": "All",
  "filter.pending": "Pending",
  "filter.dev": "Developing",
  "filter.earlier": "Earlier",
  "action.accept": "Start acceptance",
  "action.working": "Starting",
  "toast.started": "Acceptance started",
  "action.pass": "Pass",
  "action.merge": "Merge",
  "action.delete": "Delete",
  "action.deleting": "Deleting",
  "hint.deleteSingle": "Delete the task and its task branch; this cannot be undone",
  "hint.deleteTasks": "Delete {count} tasks and their task branches; this cannot be undone",
  "hint.deleteBlocked": "Selection contains tasks that cannot be deleted; only finished tasks without other dependents can be deleted",
  "toast.deletedTasks": "Deleted {count} tasks",
  "toast.deleteWarnings": "Deleted {count} tasks, but these branches were not removed: {warnings}",
  "action.detail": "Details",
  "diff.copy": "Copy",
  "diff.copied": "Copied",
  "diff.collapse": "Collapse",
  "diff.loading": "Loading",
  "diff.missing": "File no longer exists",
  "diff.error": "Failed to load",
  "diff.binary": "Binary file",
  "diff.oversized": "File too large",
  "diff.created": "New file",
  "diff.deleted": "Deleted",
  "diff.unchanged": "No content changes",
  "diff.coarse": "Outline mode",
  "diff.truncated": "Showing the first {count} lines",
  "review.selectFile": "Choose the file to review",
  "review.split": "Switch to split view",
  "review.unified": "Switch to unified view",
  "review.splitAria": "Split view",
  "review.wrap": "Enable line wrap",
  "review.nowrap": "Disable line wrap",
  "review.wrapAria": "Line wrap",
  "review.openFile": "Open the whole file in the sidebar",
  "review.empty": "Nothing changed in this task",
  "action.fail": "Fail",
  "status.review": "Waiting for review",
  "action.refresh": "Refresh",
  "action.save": "Save",
  "action.saving": "Saving",
  "action.cancel": "Cancel",
  "action.edit": "Edit",
  "action.newBase": "New baseline group",
  "action.init": "Initialize",
  "empty.init": "Not initialized. Repositories are scanned after initialization.",
  "empty.root": "Open the session at the workspace root",
  "settings.summary": "Models, directories, and branch names",
  "metric.projects": "Projects",
  "metric.agents": "Active agents",
  "metric.tasks": "Active tasks",
  "metric.slots": "Active slots",
  "metric.pending": "Pending",
  "metric.dirty": "Dirty baselines",
  "section.scheduleTasks": "Scheduling",
  "section.emptySchedule": "No scheduling tasks",
  "section.devTasks": "Development",
  "section.acceptTasks": "Acceptance",
  "section.emptyDev": "No development tasks",
  "section.emptyAccept": "No acceptance tasks",
  "fact.depends": "Depends on",
  "fact.merged": "Merged",
  "fact.state": "State",
  "fact.notMerged": "Not merged",
  "fact.warning": "Warning",
  "section.projects": "Projects",
  "section.bases": "Baselines",
  "empty.bases": "No baselines yet",
  "empty.basesHint": "Name a baseline branch when creating a task or schedule; its base slot is created automatically",
  "base.current": "Current",
  "base.default": "Default",
  "base.root": "Root checkout",
  "base.slot": "Base slot",
  "base.busy": "Checked out elsewhere",
  "base.missing": "Slot missing",
  "base.none": "No slot yet",
  "base.tasks": "{count} tasks",
  "base.label": "Label",
  "base.labelPlaceholder": "Defaults to the first branch name",
  "base.branch": "Branch",
  "base.noBranches": "No branch available",
  "base.branchesStale": "The host returned no branch list, so only the current branch is available. Restart DSH and try again.",
  "base.needMember": "Select at least one project",
  "base.needBranch": "Choose a branch for every selected project",
  "base.saved": "Baseline group saved",
  "base.editor.create": "New baseline group",
  "base.editor.edit": "Edit baseline group #{number}",
  "base.count": "{count} baselines",
  "base.projects": "{count} projects",
  "base.noRepo": "No repository yet",
  "base.clean": "Clean",
  "base.dirty": "Dirty",
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
  "status.developing": "Developing",
  "status.awaiting-agent": "Not started",
  "status.scheduling": "Scheduling",
  "status.dispatched": "Dispatched",
  "status.failed": "Failed",
  "status.waiting": "Waiting",
  "status.pending-acceptance": "Pending",
  "status.accepted": "Done",
  "status.merged": "Done",
  "status.pending-merge": "Awaiting merge",
  "status.abandoned": "Abandoned",
  "status.accepting": "Accepting",
  "status.idle": "Idle",
  "status.rejected": "Rejected",
  "hint.order": "Merge order follows the selection",
  "hint.pick": "Select pending tasks first",
  "hint.baseMismatch": "Selected tasks use different baselines; review them in separate batches"
};

// src/client/sheet.ts
var PANEL_STYLE_ID = "dev-flow-panel";
var panelSheet = `
/* \u57FA\u7840\uFF1A\u6240\u6709\u989C\u8272\u8D70\u4E3B\u9898\u53D8\u91CF\uFF0C\u6DF1\u6D45\u8272\u90FD\u8DDF DSH \u8D70 */
.df {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 10px 16px 16px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
[data-sidebar-right-tab]:has(> .df) { position: relative; }

/* \u9876\u90E8\u5DE5\u5177\u6761\u4E0E\u7B5B\u9009 */
.df-toolbar { display: flex; align-items: center; gap: 8px; flex: none; }
.df-toolbar > :first-child { flex: 1; min-width: 0; }
.df-filters, .df-rowline { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.df-view > .df-filters { flex: none; padding: 8px 16px 6px; }
.df-view > .df-foot { flex: none; position: static; padding: 10px 16px 8px; }

/* \u5206\u533A\u6807\u9898 */
.df-section { margin: 6px 0 0; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; color: var(--dsw-alias-label-tertiary); }

/* \u6307\u6807 */
.df-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; padding: 2px 0 8px; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-metric, .df-empty { border: 0; background: transparent; }
.df-metric { padding: 2px 0; }
.df-kicker { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
.df-metric strong {
  display: block;
  margin-top: 1px;
  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 17px;
  line-height: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.df-metric[data-tone='info'] strong { color: var(--dsw-alias-state-business-primary); }
.df-metric[data-tone='warn'] strong { color: var(--dsw-alias-state-warn-primary); }

/* \u5217\u8868\uFF1A\u901A\u680F\u3001\u53D1\u4E1D\u5206\u9694\uFF0C\u4E0D\u7528\u5361\u7247\u6846 */
.df-card { border: 0; border-radius: 0; background: transparent; }
.df-line, .df-agent { display: grid; align-items: center; gap: 8px 10px; padding: 8px 16px; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-line { grid-template-columns: minmax(0, 1fr) auto; }
.df-agent { grid-template-columns: auto minmax(0, 1fr) auto; }
.df-line:hover, .df-agent:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }

/* \u4EFB\u52A1\u884C */
.df-tree { display: flex; flex-direction: column; width: 100%; box-sizing: border-box; border-bottom: 0.5px solid var(--dsw-alias-border-l2); transition: background-color 120ms ease; position: relative; }
.df-tree[data-tone='success'] > .df-tree-head { box-shadow: inset 2px 0 0 var(--dsw-alias-state-success-primary); }
.df-tree[data-tone='warn'] > .df-tree-head { box-shadow: inset 2px 0 0 var(--dsw-alias-state-warn-primary); }
.df-tree[data-tone='error'] > .df-tree-head { box-shadow: inset 2px 0 0 var(--dsw-alias-state-error-primary); }
.df-tree[data-tone='info'] > .df-tree-head { box-shadow: inset 2px 0 0 var(--dsw-alias-state-business-primary); }
.df-tree[data-clickable='true'] .df-tree-head { cursor: pointer; }
.df-tree[data-clickable='true'] > .df-tree-head:active { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent); }
.df-tree[data-clickable='true']:focus-visible { outline: 1px solid var(--dsw-alias-state-business-primary); outline-offset: -1px; }
.df-tree[data-open='true'] { background: color-mix(in srgb, var(--dsw-alias-label-primary) 3%, transparent); }
.df-tree[data-open='true'] > .df-tree-head { background: transparent; }
.df-tree-head { transition: background-color 120ms ease; }

.df-tree-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 9px 16px;
  box-sizing: border-box;
  text-align: left;
}
.df-tree-content { display: flex; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
.df-tree-title { flex: 0 0 auto; min-width: 0; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 560; }
.df-chev {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transform: rotate(-90deg);
  transition: transform 120ms ease, color 120ms ease;
}
.df-chev[data-expanded='true'] { transform: none; }
.df-chev:hover { color: var(--dsw-alias-label-primary); }
.df-chev svg { display: block; }
.df-chev-space { width: 12px; flex: none; }
.df-tree .df-actions { display: flex; align-items: center; gap: 7px; flex: none; }
.df-tree-time { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.df-tree .df-chips { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; overflow: hidden; display: flex; gap: 5px; mask-image: linear-gradient(to right, #000 calc(100% - 10px), transparent); }
.df-tree .df-chips .df-chip { flex: none; max-width: 150px; }
.df-tree-children { display: flex; flex-direction: column; padding-left: 20px; }
.df-tree-children > .df-tree { background: transparent; }
.df-tree-children > .df-tree { border-bottom: 0; }
.df-tree-children > .df-tree > .df-tree-head { padding-left: 14px; }
.df-facts { display: flex; flex-direction: column; gap: 2px; padding: 1px 16px 8px 36px; }
.df-tree-children > .df-tree > .df-facts { padding-left: 34px; }
.df-line { grid-template-columns: minmax(0, 1fr) auto; }
.df-agent { grid-template-columns: auto minmax(0, 1fr) auto; }
.df-line:hover, .df-agent:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }

/* \u4EFB\u52A1\u884C */
.df-tree { display: flex; flex-direction: column; gap: 2px; width: 100%; box-sizing: border-box; border-bottom: 0.5px solid var(--dsw-alias-border-l2); transition: background-color 120ms ease; }
.df-fact { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; align-items: baseline; }
.df-fact-slot { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; white-space: nowrap; }
.df-fact-detail { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; overflow-wrap: anywhere; }

/* \u6587\u4EF6\u6539\u52A8 */
.df-files { margin: 2px 16px 8px 36px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 8px; overflow: visible; background: var(--dsw-alias-bg-base); }
.df-file-item { position: relative; border-top: 0.5px solid var(--dsw-alias-border-l2); }
.df-file-item:first-child { border-top: 0; }
.df-file-row { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 6px 10px; cursor: pointer; }
.df-file-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-file-path { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code, ui-monospace, Menlo, monospace); font-size: 11px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.df-diff-counts { flex: none; display: inline-flex; gap: 8px; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; font-variant-numeric: tabular-nums; }
.df-diff-add { color: var(--dsw-alias-state-success-primary); }
.df-diff-del { color: var(--dsw-alias-state-error-primary); }

/* \u60AC\u505C\u6C14\u6CE1 */
.df-hover-card { display: none; position: absolute; left: 12px; top: calc(100% + 4px); z-index: 20; width: min(520px, calc(100% - 24px)); max-height: 240px; overflow: hidden; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base)); box-shadow: var(--dsw-elevation-panel, 0 12px 32px #0003); }
.df-file-item:hover .df-hover-card { display: flex; flex-direction: column; }
.df-hover-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; padding: 8px 10px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); }
.df-hover-path { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; color: var(--dsw-alias-label-secondary); }
.df-hover-body { flex: 1; min-height: 0; max-height: 200px; overflow: auto; }

/* diff \u9875\uFF1A\u6587\u4EF6\u9009\u62E9\u5668 + \u5BF9\u6BD4\u5DE5\u5177\u680F */
.df-review { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.df-review-head { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; height: 38px; padding: 0 6px 0 8px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); }
.df-review-selector { flex: 0 1 auto; min-width: 0; }
.df-review-select { display: inline-flex; align-items: center; gap: 4px; box-sizing: border-box; max-width: 100%; height: 28px; padding: 0 6px 0 8px; border: 0; border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-primary); cursor: pointer; font: inherit; font-size: 12px; line-height: 20px; }
.df-review-select[aria-expanded='true'] { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-review-select:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-review-select svg { display: block; flex: none; }
.df-review-file { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; color: var(--dsw-alias-label-secondary); }
.df-review-native-select { max-width: 100%; height: 28px; }
.df-review-counts { display: inline-flex; flex: none; gap: 6px; align-items: center; margin-right: auto; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; line-height: 20px; }
.df-review-label { color: var(--dsw-alias-label-tertiary); }
.df-review-tools { display: inline-flex; flex: none; gap: 2px; align-items: center; margin-left: auto; }
.df-review-tool { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 6px; border: 0; border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-secondary); font-size: 13px; cursor: pointer; }
.df-review-tool svg { width: 15px; height: 15px; }
.df-review-tool:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-review-tool[aria-pressed='true'] .df-review-compare-icon { transform: rotate(90deg); }
.df-review-body { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
.df-review-body > * { flex: 1 1 auto; min-height: 0; }
.df-menu-item { display: flex; gap: 12px; align-items: center; justify-content: space-between; min-width: 0; }
.df-menu-path { min-width: 0; overflow: hidden; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.df-menu-counts { display: inline-flex; flex: none; gap: 6px; align-items: center; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 12px; line-height: 20px; }

/* \u540D\u79F0\u3001\u6807\u7B7E\u3001\u836F\u4E38 */
.df-name { font-weight: 560; display: flex; align-items: center; gap: 6px; min-width: 0; }
.df-meta { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }
.df-branch {
  color: var(--dsw-alias-label-tertiary);
  font-weight: 400;
  font-size: 10.5px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.df-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.df-chip {
  padding: 1px 7px;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 10.5px;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.df-task-chips { gap: 4px; flex: 1 1 auto; min-width: 0; flex-wrap: nowrap; overflow: hidden; }
.df-tree .df-actions { display: flex; align-items: center; gap: 6px; flex: none; justify-self: end; margin-left: auto; }
.df-tree .df-chips { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; overflow: hidden; }
.df-tree-head > .df-check, .df-tree-head > span[data-state], .df-tree-head > span:not(.df-tree-content) { flex: none; }
.df-tree .df-tree-content { flex: 1 1 auto; min-width: 0; }
.df-tree .df-chips .df-chip { flex: none; max-width: 150px; }
.df-ok { color: var(--dsw-alias-state-success-primary); }
.df-warn { color: var(--dsw-alias-state-warn-primary); }
.df-bad { color: var(--dsw-alias-state-error-primary); }
.df-muted { color: var(--dsw-alias-label-tertiary); }
.df-empty-line { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }
.df-empty { padding: 26px 18px; text-align: center; }
.df-empty p { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 1.65; }

/* \u6D3B\u8DC3\u4EE3\u7406 */
.df-active { display: flex; flex-direction: column; gap: 0; }
.df-active-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 16px 9px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  box-shadow: inset 2px 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 60%, transparent);
  background: transparent;
  border-radius: 0;
}
.df-active-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.df-active-title { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.df-live {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dsw-alias-state-business-primary);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent);
  display: inline-block;
  animation: df-pulse 2.4s ease-out infinite;
}
@keyframes df-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent); }
  70%, 100% { box-shadow: 0 0 0 6px transparent; }
}

/* \u69FD\u4F4D\u3001\u4ED3\u5E93 */
.df-repo { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; padding: 8px 16px 6px; font-size: 12px; color: var(--dsw-alias-label-primary); }
.df-line-states { display: inline-flex; align-items: center; gap: 8px; }
.df-base { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; justify-content: space-between; padding: 6px 16px; border-top: 0.5px solid var(--dsw-alias-border-l2); font-size: 11px; line-height: 17px; }
.df-base:first-of-type { border-top: 0; }
.df-base-name { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; }
.df-base-branch { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code, ui-monospace, monospace); color: var(--dsw-alias-label-secondary); }
.df-base-branch.is-current { color: var(--dsw-alias-label-primary); font-weight: 560; }
.df-base-flag { flex: none; padding: 0 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 15px; }
.df-base-meta { display: flex; flex: 1 1 100%; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 4px 10px; min-width: 0; }
.df-base-loc { padding: 0 6px; border-radius: 999px; font-size: 10px; line-height: 15px; }
.df-base-loc[data-location='root'] { color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent); }
.df-base-loc[data-location='slot'] { color: var(--dsw-alias-state-business-primary); background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent); }
.df-base-loc[data-location='busy'], .df-base-loc[data-location='missing'] { color: var(--dsw-alias-state-warn-primary); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent); }
.df-base-loc[data-location='none'] { color: var(--dsw-alias-label-tertiary); background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-base-head { font-family: var(--ds-font-family-code, ui-monospace, monospace); color: var(--dsw-alias-label-tertiary); }
.df-base-toolbar { display: flex; flex: none; justify-content: flex-end; }
.df-base-actions { margin-left: auto; }
.df-base-editor { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 8px; background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base)); }
.df-base-label-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.df-base-label-row input { flex: 1; min-width: 0; height: 28px; padding: 0 8px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
.df-base-edit-row { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 1.2fr); align-items: center; gap: 8px; font-size: 12px; }
.df-base-edit-row select { height: 28px; min-width: 0; padding: 0 6px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
.df-base-edit-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary); }
.df-base-error { margin: 0; color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 17px; }
.df-base-warn { margin: 0; color: var(--dsw-alias-state-warn-primary); font-size: 12px; line-height: 17px; }
.df-base-edit-actions { display: flex; justify-content: flex-end; gap: 8px; }
.df-slot { display: grid; grid-template-columns: minmax(0, 1.2fr) 52px minmax(0, 1fr); gap: 8px; padding: 6px 16px; font-size: 11px; line-height: 17px; }

/* \u5B50\u9762\u677F */
.df-views { position: relative; flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; margin: 0 -16px; overflow: hidden; }
.df-view { position: relative; min-height: 0; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
.df-view[data-open='true'] { flex: 1 1 0; min-height: 0; }
.df-view[data-open='false'] { flex: none; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-view-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 16px 0 12px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: grab;
  text-align: left;
  touch-action: none;
  transition: background-color 120ms ease;
}
.df-view-head:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-view-head:active { cursor: grabbing; }
.df-view-chev { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: var(--dsw-alias-label-tertiary); transform: rotate(-90deg); transition: transform 120ms ease; }
.df-view[data-open='true'] > .df-view-head .df-view-chev { transform: none; }
.df-view-count { margin-left: auto; color: var(--dsw-alias-label-tertiary); font-weight: 500; font-variant-numeric: tabular-nums; }
.df-view-body { display: block; flex: 1 1 0; min-height: 0; max-height: 100%; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 0 0 10px; }
.df-view-body > * + * { margin-top: 8px; }
.df-drop { position: absolute; left: 10px; right: 10px; height: 2px; margin-top: -1px; background: var(--dsw-alias-state-business-primary); pointer-events: none; z-index: 4; }
.df-sash { position: absolute; left: 0; right: 0; bottom: -3px; height: 6px; cursor: row-resize; z-index: 2; touch-action: none; }
.df-sash::before { content: ''; position: absolute; left: 0; right: 0; top: 2px; height: 1px; background: var(--dsw-alias-border-l2); }
.df-sash:hover::before { top: 1px; height: 2px; background: var(--dsw-alias-state-business-primary); }

/* \u9A8C\u6536\u6279\u6B21\u5185\u90E8 */

/* \u8C03\u5EA6\u4EFB\u52A1 */

/* \u5E95\u90E8\u6279\u91CF\u64CD\u4F5C */
.df-foot { display: flex; flex-direction: column; gap: 6px; padding: 10px 0 4px; }
.df-go { width: 100%; }
.df-hint { margin: 0; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }

/* \u8F93\u5165\u6846\u4E0A\u7684\u5F00\u5173 */
.df-note {
  position: absolute;
  left: 16px;
  bottom: 100%;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 6px 0 8px;
  border-radius: 6px 6px 0 0;
  border: 0.5px solid var(--dsw-alias-state-business-primary);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-state-business-primary);
  opacity: 0.45;
  transition: opacity 160ms ease;
}
.df-note[data-on='true'] { background: var(--dsw-alias-state-business-primary); color: var(--dsw-alias-bg-base); }
.df-note:hover, .df-note:focus-within { opacity: 1; }
.df-note-title { flex: none; font-size: 12px; line-height: 18px; font-weight: 560; }
.df-toggle { display: flex; align-items: center; width: 26px; height: 14px; padding: 1px; border: 0; border-radius: 999px; background: color-mix(in srgb, currentColor 18%, var(--dsw-alias-bg-base)); cursor: pointer; }
.df-note[data-on='true'] .df-toggle { justify-content: flex-end; background: var(--dsw-alias-bg-base); }
.df-toggle i { width: 12px; height: 12px; border-radius: 50%; background: var(--dsw-alias-label-tertiary); }
.df-note[data-on='true'] .df-toggle i { background: var(--dsw-alias-state-business-primary); }

/* \u8BBE\u7F6E\u8868\u5355 */
.df-form { display: flex; flex-direction: column; gap: 10px; }
.df-field { display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.df-field input {
  box-sizing: border-box;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
}
.df-field input:focus-visible, .df-task-chev:focus-visible, .df-chev:focus-visible, .df-view-head:focus-visible, .df-schedule-toggle:focus-visible, .df-toggle:focus-visible, .df-note:focus-visible {
  outline: 1px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}
.df-check { width: 14px; height: 14px; margin: 0; accent-color: var(--dsw-alias-state-business-primary); }

/* \u53F3\u4E0A\u89D2\u63D0\u793A */
.df-toasts { position: fixed; top: 16px; right: 16px; z-index: 1300; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; pointer-events: none; }
.df-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: min(360px, calc(100vw - 32px));
  padding: 9px 13px;
  border-radius: var(--dsw-radius-lg, 10px);
  background: var(--dsw-alias-toast-bg, rgb(53, 54, 56));
  color: var(--dsw-alias-toast-label, #fff);
  box-shadow: var(--dsw-shadow-lv3, 0 12px 32px #0003);
  font-size: 12px;
  line-height: 18px;
  animation: df-toast-in 200ms cubic-bezier(.2,.8,.2,1);
}
.df-toast[data-closing='true'] { animation: df-toast-out 180ms ease-in forwards; pointer-events: none; }
.df-toast[data-tone='error'] .df-toast-mark { color: var(--dsw-alias-state-error-primary); }
.df-toast-text { min-width: 0; overflow-wrap: anywhere; }
.df-toast-mark { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex: none; }
@keyframes df-toast-in { from { opacity: 0; transform: translateX(calc(100% + 20px)); } to { opacity: 1; transform: none; } }
@keyframes df-toast-out { to { opacity: 0; transform: translateX(calc(100% + 20px)); } }
@media (prefers-reduced-motion: reduce) { .df-toast, .df-toast[data-closing='true'], .df-live, .df-view-chev { animation: none; transition: none; } }
`;
function ensureSheet() {
  if (typeof document === "undefined") return;
  let style = document.getElementById(PANEL_STYLE_ID);
  if (style === null) {
    style = document.createElement("style");
    style.id = PANEL_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `${panelSheet}
${all()}`;
}

// src/client/snapshot.ts
function normalizeSnapshot(value) {
  if (value === null || typeof value !== "object") return null;
  const snapshot = value;
  if (Array.isArray(snapshot.projects)) {
    snapshot.projects = snapshot.projects.map((project) => typeof project === "string" ? { name: project, dirty: false } : project);
  }
  if (!Array.isArray(snapshot.bases)) snapshot.bases = [];
  if (snapshot.counts !== void 0 && snapshot.counts.dirtyBases === void 0) {
    snapshot.counts.dirtyBases = snapshot.counts.dirtyTrunks ?? 0;
  }
  return snapshot;
}

// src/client/pages.tsx
var { useEffect: useEffect2, useRef: useRef2, useState: useState2 } = React;
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
  const [enabled, setEnabled] = useState2(false);
  const [error, setError] = useState2("");
  useEffect2(() => {
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
function PanelView({ ui, sessionId, call, t, openDiff }) {
  const [page, setPage] = useState2("overview");
  const [data, setData] = useState2(null);
  const [picked, setPicked] = useState2([]);
  const { show, node } = useToast();
  const load = (failure) => call("snapshot", { sessionId }).then((value) => {
    const snapshot = normalizeSnapshot(value);
    setData(snapshot);
    if (failure) show(textOf(failure), "error");
    else if (snapshot?.problem) show(snapshot.problem, "error");
  }).catch((reason) => show(textOf(reason), "error"));
  useEffect2(() => {
    void load();
  }, [sessionId]);
  const pages = [
    { value: "overview", label: t("page.overview"), id: "dev-flow-tab-overview", panelId: "dev-flow-panel-overview" },
    { value: "tasks", label: t("page.tasks"), id: "dev-flow-tab-tasks", panelId: "dev-flow-panel-tasks" },
    { value: "slots", label: t("page.slots"), id: "dev-flow-tab-slots", panelId: "dev-flow-panel-slots" },
    { value: "bases", label: t("page.bases"), id: "dev-flow-tab-bases", panelId: "dev-flow-panel-bases" },
    { value: "agents", label: t("page.agents"), id: "dev-flow-tab-agents", panelId: "dev-flow-panel-agents" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "df" }, node, /* @__PURE__ */ React.createElement("div", { className: "df-toolbar" }, ui.SegmentedTabs ? /* @__PURE__ */ React.createElement(ui.SegmentedTabs, { size: "sm", label: t("tab.title"), items: pages, value: page, onChange: (value) => setPage(value) }) : /* @__PURE__ */ React.createElement("div", { role: "tablist", className: "df-filters" }, pages.map((item) => /* @__PURE__ */ React.createElement("button", { key: item.value, type: "button", "aria-selected": page === item.value, onClick: () => setPage(item.value) }, item.label))), /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "ghost", onClick: () => {
    void load();
  } }, t("action.refresh"))), !data ? null : data.problem ? null : !data.initialized ? /* @__PURE__ */ React.createElement(Uninitialized, { ui, t, sessionId, call, reload: load, workspace: data.workspace }) : /* @__PURE__ */ React.createElement(PageBody, { ui, page, data, t, picked, setPicked, sessionId, call, reload: load, show, openDiff }));
}
function Uninitialized({ ui, t, sessionId, call, reload, workspace }) {
  return /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("empty.init")), workspace ? /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, workspace) : null, /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "primary", onClick: () => {
    call("init", { sessionId }).then(() => reload()).catch((reason) => reload(reason));
  } }, t("action.init")));
}
function PageBody(props) {
  if (props.page === "overview") return /* @__PURE__ */ React.createElement(Overview, { ui: props.ui, data: props.data, t: props.t });
  if (props.page === "tasks") return /* @__PURE__ */ React.createElement(Tasks, { ...props });
  if (props.page === "slots") return /* @__PURE__ */ React.createElement(Slots, { ui: props.ui, data: props.data, t: props.t });
  if (props.page === "bases") return /* @__PURE__ */ React.createElement(Bases, { ui: props.ui, data: props.data, t: props.t, call: props.call, reload: props.reload, show: props.show, sessionId: props.sessionId });
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
    [t("metric.dirty"), `${data.counts.dirtyBases}/${data.counts.projects}`, data.counts.dirtyBases > 0 ? "warn" : void 0]
  ];
  const running = (data.agents ?? []).filter((agent) => agent.status === "running");
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "df-metrics" }, cards.map(([label, value, tone]) => /* @__PURE__ */ React.createElement("div", { key: label, className: "df-metric", "data-tone": tone }, /* @__PURE__ */ React.createElement("div", { className: "df-kicker" }, label), /* @__PURE__ */ React.createElement("strong", null, String(value))))), /* @__PURE__ */ React.createElement("h3", { className: "df-section" }, t("section.projects")), /* @__PURE__ */ React.createElement("div", { className: "df-card" }, (data.projects ?? []).map((project) => /* @__PURE__ */ React.createElement("div", { key: project.name, className: "df-line" }, /* @__PURE__ */ React.createElement("span", { className: "df-name" }, project.name, project.branch ? /* @__PURE__ */ React.createElement("span", { className: "df-branch" }, project.branch) : null), /* @__PURE__ */ React.createElement("span", { className: "df-line-states" }, /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, t("base.count").replace("{count}", String(project.bases ?? 0))), /* @__PURE__ */ React.createElement("span", { className: project.dirty ? "df-warn" : "df-ok" }, project.dirty ? t("base.dirty") : t("base.clean")))))), /* @__PURE__ */ React.createElement("h3", { className: "df-section" }, t("section.active")), running.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "df-empty-line" }, t("section.none")) : /* @__PURE__ */ React.createElement("div", { className: "df-active" }, running.map((agent) => /* @__PURE__ */ React.createElement("article", { key: agent.id, className: "df-active-card" }, /* @__PURE__ */ React.createElement("div", { className: "df-active-top" }, /* @__PURE__ */ React.createElement("span", { className: "df-name" }, /* @__PURE__ */ React.createElement("span", { className: "df-live", "aria-hidden": "true" }), agent.id), /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: agentPhase(agent) })), /* @__PURE__ */ React.createElement("div", { className: "df-active-title" }, taskTitle(data, agent.taskId)), /* @__PURE__ */ React.createElement("div", { className: "df-chips" }, agentSlots(data, agent).map((slot) => /* @__PURE__ */ React.createElement("span", { key: slot, className: "df-chip" }, slot)))))), dev || accept ? /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, `${t("slot.dev")} ${dev?.used ?? 0}/${dev?.total ?? 0} \xB7 ${t("slot.accept")} ${accept?.used ?? 0}/${accept?.total ?? 0}`) : null);
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
  show,
  openDiff
}) {
  const [filter, setFilter] = useState2("all");
  const [busy, setBusy] = useState2(false);
  const [opened, setOpened] = useState2({});
  const [scheduleOpen, setScheduleOpen] = useState2({});
  const [pickedBatches, setPickedBatches] = useState2([]);
  const [removing, setRemoving] = useState2(false);
  const [details, setDetails] = useState2({});
  const detailProps = (id) => ({
    detailsOpen: details[id] === true,
    onToggleDetails: () => setDetails({ ...details, [id]: !details[id] })
  });
  const [layout, setLayout] = useState2(loadPaneLayout);
  const [dropY, setDropY] = useState2(null);
  const dragged = useRef2(false);
  const dropAt = useRef2(null);
  const splitRef = useRef2(null);
  const { order, open, heights } = layout;
  const newest = (left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""));
  const devAll = data.tasks.filter((task) => task.kind !== "accept").sort(newest);
  const devRows = devAll.filter((task) => matchFilter(filter, task));
  const acceptRows = data.tasks.filter((task) => task.kind === "accept").sort(newest);
  const reason = acceptReason(data, picked, t);
  const pickedDev = data.tasks.filter((task) => task.kind !== "accept" && picked.includes(task.id));
  const acceptSelected = pickedDev.filter((task) => task.selectable === true);
  const deleteSelected = pickedDev.filter((task) => task.deletable === true);
  const acceptBlocked = pickedDev.filter((task) => task.selectable !== true);
  const deleteBlocked = pickedDev.filter((task) => task.deletable !== true);
  const showAccept = pickedDev.length > 0 && acceptBlocked.length === 0;
  const showDelete = deleteSelected.length > 0;
  const deleteHint = t("hint.deleteTasks").replace("{count}", String(deleteSelected.length));
  const deleteReason = deleteBlocked.length === 0 ? "" : `${t("hint.deleteBlocked")}\uFF1A${deleteBlocked.map((task) => task.title).join("\u3001")}`;
  const filters = [
    ["all", t("filter.all")],
    ["pending", t("filter.pending")],
    ["dev", t("filter.dev")],
    ["earlier", t("filter.earlier")]
  ];
  const launch = () => {
    if (busy || reason !== "") return;
    setBusy(true);
    start(call, sessionId, acceptSelected.map((task) => task.id), setPicked, reload).then(() => show(t("toast.started"), "info")).catch(() => void 0).finally(() => setBusy(false));
  };
  const removeOne = (id) => {
    void removeTasks(call, sessionId, [id], picked, setPicked, setRemoving, reload, show, t);
  };
  const removeSelected = () => {
    void removeTasks(call, sessionId, deleteSelected.map((task) => task.id), picked, setPicked, setRemoving, reload, show, t);
  };
  const resizePane = (id, event) => {
    event.preventDefault();
    event.stopPropagation();
    const section = event.currentTarget.parentElement;
    const parent = splitRef.current;
    if (!section || !parent) return;
    const startY = event.clientY;
    const startHeight = section.getBoundingClientRect().height;
    const limit = parent.getBoundingClientRect().height;
    const move = (next) => {
      const height = Math.round(Math.min(Math.max(120, limit - 80), Math.max(120, startHeight + next.clientY - startY)));
      setLayout((prev) => ({ ...prev, heights: { ...prev.heights, [id]: height } }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  const pressHeader = (id, event) => {
    if (event.button !== 0) return;
    const startY = event.clientY;
    let moved = false;
    const move = (next) => {
      if (!moved && Math.abs(next.clientY - startY) < 4) return;
      moved = true;
      dragged.current = true;
      const parent = splitRef.current;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const sections = [...parent.querySelectorAll("[data-pane]")];
      let index = sections.length;
      let line = parentRect.height;
      for (let i = 0; i < sections.length; i += 1) {
        const rect = sections[i].getBoundingClientRect();
        if (next.clientY < rect.top + rect.height / 2) {
          index = i;
          line = rect.top - parentRect.top;
          break;
        }
      }
      dropAt.current = index;
      setDropY(line);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      const index = dropAt.current;
      dropAt.current = null;
      setDropY(null);
      if (!moved || index === null) return;
      setLayout((prev) => {
        const from = prev.order.indexOf(id);
        if (from < 0 || index === from || index === from + 1) return prev;
        const next = prev.order.filter((item) => item !== id);
        next.splice(index > from ? index - 1 : index, 0, id);
        return { ...prev, order: next };
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  useEffect2(() => {
    savePaneLayout(layout);
  }, [layout]);
  const schedules = [...data.schedules ?? []].sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")));
  const visible = order.filter((id) => open[id]);
  const paneStyle = (id) => {
    if (!open[id] || visible.length < 2 || id === visible[visible.length - 1]) return void 0;
    return { flex: `0 0 ${heights[id] ?? 220}px` };
  };
  const togglePane = (id) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    setLayout((prev) => ({ ...prev, open: { ...prev.open, [id]: !prev.open[id] } }));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "df-views", ref: splitRef }, dropY !== null ? /* @__PURE__ */ React.createElement("div", { className: "df-drop", style: { top: dropY } }) : null, order.map((id) => {
    const laterOpen = order.slice(order.indexOf(id) + 1).some((next) => open[next]);
    const title = id === "schedule" ? t("section.scheduleTasks") : id === "dev" ? t("section.devTasks") : t("section.acceptTasks");
    const count = id === "schedule" ? schedules.length : id === "dev" ? devAll.length : acceptRows.length;
    return /* @__PURE__ */ React.createElement("section", { key: id, className: "df-view", "data-pane": id, "data-open": open[id] ? "true" : "false", style: paneStyle(id) }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "df-view-head",
        "aria-expanded": open[id],
        onClick: () => togglePane(id),
        onPointerDown: (event) => pressHeader(id, event)
      },
      /* @__PURE__ */ React.createElement("span", { className: "df-view-chev", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Chevron, null)),
      title,
      /* @__PURE__ */ React.createElement("span", { className: "df-view-count" }, count)
    ), id === "schedule" && open.schedule ? /* @__PURE__ */ React.createElement("div", { className: "df-view-body" }, schedules.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("section.emptySchedule"))) : schedules.map((schedule) => /* @__PURE__ */ React.createElement(ScheduleItem, { key: schedule.id, ui, t, schedule, open: scheduleOpen[schedule.id] === true, onToggle: () => setScheduleOpen({ ...scheduleOpen, [schedule.id]: scheduleOpen[schedule.id] !== true }) }))) : null, id === "dev" && open.dev ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "df-filters" }, filters.map(([value, label]) => {
      const count2 = devAll.filter((task) => matchFilter(value, task)).length;
      const text = `${label} ${count2}`;
      return ui.Pill ? /* @__PURE__ */ React.createElement(ui.Pill, { key: value, active: filter === value, onClick: () => setFilter(value) }, text) : /* @__PURE__ */ React.createElement("button", { key: value, type: "button", "aria-pressed": filter === value, onClick: () => setFilter(value) }, text);
    })), /* @__PURE__ */ React.createElement("div", { className: "df-view-body" }, /* @__PURE__ */ React.createElement("div", { className: "df-card" }, devRows.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("section.emptyDev"))) : devRows.map((task) => /* @__PURE__ */ React.createElement(DevTaskItem, { key: task.id, ui, t, task, picked, setPicked, sessionId, call, reload, show, onDeleteTask: removeOne, ...detailProps(task.id), onOpenDiff: (file, index) => openDiff?.(task.id, task.title, index) })))), showAccept || showDelete ? /* @__PURE__ */ React.createElement("div", { className: "df-foot" }, showAccept ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ActionButton, { ui, className: "df-go", variant: "primary", disabled: busy || reason !== "", title: reason, onClick: launch }, busy ? t("action.working") : t("action.accept")), /* @__PURE__ */ React.createElement("p", { className: "df-hint" }, reason !== "" ? reason : `${t("hint.order")}\uFF1A${acceptSelected.map((task) => task.title).join(" \u2192 ")}`)) : null, showDelete ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ActionButton, { ui, className: "df-go", disabled: removing || deleteReason !== "", title: deleteReason || deleteHint, onClick: removeSelected }, removing ? t("action.deleting") : t("action.delete")), /* @__PURE__ */ React.createElement("p", { className: "df-hint" }, deleteReason !== "" ? deleteReason : deleteHint)) : null) : null) : null, id === "accept" && open.accept ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "df-view-body" }, /* @__PURE__ */ React.createElement("div", { className: "df-card" }, acceptRows.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("section.emptyAccept"))) : acceptRows.map((batch) => {
      const children = containedTasks(data, batch);
      const open2 = children.length > 0 && (opened[batch.id] ?? batch.status === "accepting");
      const deletable = batch.status !== "accepting";
      return /* @__PURE__ */ React.createElement(
        AcceptTaskItem,
        {
          key: batch.id,
          ui,
          t,
          batch,
          picked,
          setPicked,
          sessionId,
          call,
          reload,
          show,
          pickedBatches,
          setPickedBatches,
          open: open2,
          onToggle: children.length > 0 ? () => setOpened({ ...opened, [batch.id]: !open2 }) : void 0,
          children
        }
      );
    }))), pickedBatches.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-foot" }, /* @__PURE__ */ React.createElement(ActionButton, { ui, className: "df-go", disabled: removing, onClick: () => removeBatches(call, sessionId, pickedBatches, setPickedBatches, setRemoving, reload, show) }, removing ? t("action.deleting") : t("action.delete")), /* @__PURE__ */ React.createElement("p", { className: "df-hint" }, `${pickedBatches.length} \u4E2A\u9A8C\u6536\u4EFB\u52A1\uFF0C\u5220\u9664\u65F6\u4E00\u5E76\u5220\u6389\u9A8C\u6536\u5206\u652F`)) : null) : null, open[id] && laterOpen ? /* @__PURE__ */ React.createElement("div", { className: "df-sash", role: "separator", "aria-orientation": "horizontal", "aria-label": "\u8C03\u6574\u9762\u677F\u9AD8\u5EA6", onPointerDown: (event) => resizePane(id, event) }) : null);
  }));
}
var PANE_KEY = "dsh-dev-flow.task-panes";
var PANE_IDS = ["schedule", "dev", "accept"];
function isPaneId(value) {
  return PANE_IDS.includes(value);
}
function loadPaneLayout() {
  const fallback = { order: [...PANE_IDS], open: { schedule: true, dev: true, accept: true }, heights: { schedule: 220, dev: 260, accept: 220 } };
  try {
    const raw = localStorage.getItem(PANE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const order = (parsed.order ?? []).filter(isPaneId);
    for (const id of PANE_IDS) if (!order.includes(id)) order.push(id);
    return {
      order,
      open: { schedule: parsed.open?.schedule !== false, dev: parsed.open?.dev !== false, accept: parsed.open?.accept !== false },
      heights: { ...fallback.heights, ...parsed.heights }
    };
  } catch {
    return fallback;
  }
}
function savePaneLayout(layout) {
  try {
    localStorage.setItem(PANE_KEY, JSON.stringify(layout));
  } catch {
  }
}
function toneOf(status) {
  if (status === "merged" || status === "accepted" || status === "dispatched") return "success";
  if (status === "failed" || status === "rejected") return "error";
  if (status === "pending-merge" || status === "waiting" || status === "pending-acceptance" || status === "accepting" || status === "awaiting-agent") return "warn";
  if (status === "developing" || status === "running" || status === "scheduling") return "info";
  return "neutral";
}
function Chevron() {
  return /* @__PURE__ */ React.createElement("svg", { width: "10", height: "10", viewBox: "0 0 10 10", "aria-hidden": "true", focusable: "false" }, /* @__PURE__ */ React.createElement("path", { d: "M1.6 3.6 L5 7 L8.4 3.6", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round" }));
}
function TreeItem({
  kind,
  title,
  chips,
  leading,
  actions,
  facts,
  expanded = false,
  expandable = false,
  onToggle,
  onClick,
  children,
  depth = 0,
  tone,
  time
}) {
  const row = onToggle ?? onClick;
  return /* @__PURE__ */ React.createElement("div", { className: `df-tree df-tree-${kind}`, "data-tone": tone ?? "neutral", "data-open": expanded ? "true" : "false", "data-clickable": row ? "true" : "false", "data-depth": depth, tabIndex: row ? 0 : void 0, onKeyDown: (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      row?.();
    }
  } }, /* @__PURE__ */ React.createElement("div", { className: "df-tree-head", onClick: (event) => {
    const target = event.target;
    if (target && target.closest(".df-tree") !== event.currentTarget.parentElement) return;
    row?.();
  } }, expandable ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "df-chev", "data-expanded": expanded ? "true" : "false", "aria-expanded": expanded, onClick: (event) => {
    event.stopPropagation();
    onToggle?.();
  } }, /* @__PURE__ */ React.createElement(Chevron, null)) : /* @__PURE__ */ React.createElement("span", { className: "df-chev-space", "aria-hidden": "true" }), leading, /* @__PURE__ */ React.createElement("span", { className: "df-tree-content" }, /* @__PURE__ */ React.createElement("span", { className: "df-tree-title" }, title), chips.length > 0 ? /* @__PURE__ */ React.createElement("span", { className: "df-chips df-task-chips" }, chips.map((chip) => /* @__PURE__ */ React.createElement("span", { key: chip, className: "df-chip" }, chip))) : null), /* @__PURE__ */ React.createElement("span", { className: "df-actions" }, time ? /* @__PURE__ */ React.createElement("span", { className: "df-tree-time" }, time) : null, actions)), expanded && facts && facts.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-facts" }, facts.map((fact, index) => /* @__PURE__ */ React.createElement("div", { key: `${index}-${fact.slot}-${fact.detail}`, className: "df-fact" }, /* @__PURE__ */ React.createElement("span", { className: "df-fact-slot" }, fact.slot), fact.detail ? /* @__PURE__ */ React.createElement("span", { className: "df-fact-detail" }, fact.detail) : null))) : null, expanded && children ? /* @__PURE__ */ React.createElement("div", { className: "df-tree-children" }, children) : null);
}
function ScheduleItem({ ui, t, schedule, open, onToggle, depth = 0 }) {
  const tasks = [...schedule.tasks ?? []].sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")));
  const [openTasks, setOpenTasks] = useState2({});
  return /* @__PURE__ */ React.createElement(
    TreeItem,
    {
      kind: "schedule",
      title: schedule.title,
      chips: [
        ...schedule.baseGroup ? [`#${schedule.baseGroup}`] : [],
        ...schedule.base ? [schedule.base] : [],
        ...schedule.usage?.totalTokens ? [formatTokens(schedule.usage.totalTokens)] : []
      ],
      time: createdText(schedule.createdAt),
      actions: /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: schedule.status }),
      facts: [
        ...schedule.base ? [{ slot: t("page.bases"), detail: schedule.baseGroup ? `#${schedule.baseGroup} \xB7 ${schedule.base}` : schedule.base }] : [],
        ...(schedule.warnings ?? []).map((warning) => ({ slot: t("fact.warning"), detail: warning }))
      ],
      expandable: true,
      expanded: open,
      onToggle,
      depth,
      tone: toneOf(schedule.status)
    },
    tasks.map((task) => {
      const facts = [
        {
          slot: "\u4F9D\u8D56",
          detail: task.dependsOn.length === 0 ? "\u65E0" : task.dependsOn.map((dep) => `${dep.title}${dep.merged ? `\uFF0C\u5DF2\u5E76\u5165 ${dep.branch}` : "\uFF0C\u672A\u5E76\u5165"}`).join("\uFF1B")
        },
        ...task.slots.map((slot) => ({
          slot: "\u69FD\u4F4D",
          detail: `${slot.number ? `${slot.repo}-${slot.number}` : slot.repo}${slot.branch ? ` \xB7 ${slot.branch}` : ""}`
        }))
      ];
      return /* @__PURE__ */ React.createElement(
        TreeItem,
        {
          key: task.id,
          kind: "dev",
          title: task.title,
          chips: task.slots.map((slot) => slot.number ? `${slot.repo}-${slot.number}` : slot.repo),
          actions: /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: shownStatus({ ...task, kind: "dev", repos: [] }) }),
          facts,
          expandable: true,
          expanded: openTasks[task.id] === true,
          onToggle: () => setOpenTasks({ ...openTasks, [task.id]: openTasks[task.id] !== true }),
          depth: depth + 1
        }
      );
    })
  );
}
function DevTaskItem({
  ui,
  t,
  task,
  picked,
  setPicked,
  sessionId,
  call,
  reload,
  show,
  detailsOpen = false,
  onToggleDetails,
  onOpenDiff,
  onDeleteTask,
  nested = false,
  reviewing = false,
  batchId,
  depth = 0
}) {
  const facts = taskFacts(task, t);
  const deps = task.dependsOn ?? [];
  const [openDeps, setOpenDeps] = useState2({});
  const [selfOpen, setSelfOpen] = useState2(false);
  const [diff, setDiff] = useState2(null);
  const loadDiff = () => {
    if (diff !== null || !call || nested) return;
    call("task-diff", { sessionId, taskId: task.id }).then((value) => setDiff(value)).catch(() => setDiff({ files: [], repos: [] }));
  };
  const toggle = () => {
    if (!openDetails) loadDiff();
    toggleDetails();
  };
  const openDetails = onToggleDetails === void 0 ? selfOpen : detailsOpen;
  const toggleDetails = onToggleDetails ?? (() => setSelfOpen(!selfOpen));
  const expandable = facts.length > 0 || deps.length > 0;
  const pickable = task.selectable === true || task.deletable === true;
  const leading = pickable ? /* @__PURE__ */ React.createElement("input", { className: "df-check", type: "checkbox", checked: picked.includes(task.id), onClick: (event) => event.stopPropagation(), onChange: () => setPicked(togglePick(picked, task.id)) }) : void 0;
  return /* @__PURE__ */ React.createElement(
    TreeItem,
    {
      kind: "dev",
      title: task.title,
      chips: [...baseChips(task), ...taskBranchChips(task), ...taskChips(task)],
      time: createdText(task.createdAt),
      leading,
      actions: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: shownStatus(task) }), task.status === "pending-merge" && task.kind !== "accept" && call && reload ? /* @__PURE__ */ React.createElement(ActionButton, { ui, onClick: (event) => {
        event.stopPropagation();
        mergeTask(call, sessionId, task.id, reload, show);
      } }, t("action.merge")) : null, task.deletable && !nested && call && reload && onDeleteTask ? /* @__PURE__ */ React.createElement(ActionButton, { ui, title: t("hint.deleteSingle"), onClick: (event) => {
        event.stopPropagation();
        onDeleteTask(task.id);
      } }, t("action.delete")) : null, nested && reviewing && task.acceptance !== "accepted" && batchId && call && reload ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ActionButton, { ui, onClick: (event) => {
        event.stopPropagation();
        finishTask(call, sessionId, batchId, task.id, "accepted", reload);
      } }, t("action.pass")), /* @__PURE__ */ React.createElement(ActionButton, { ui, onClick: (event) => {
        event.stopPropagation();
        finishTask(call, sessionId, batchId, task.id, "rejected", reload);
      } }, t("action.fail"))) : null),
      facts,
      expandable,
      expanded: openDetails,
      onToggle: expandable ? toggle : void 0,
      onClick: pickable ? () => setPicked(togglePick(picked, task.id)) : void 0,
      depth,
      tone: toneOf(shownStatus(task))
    },
    diff !== null && diff.files.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "df-files" }, diff.files.map((file, index) => {
      const key = `${file.repo}:${file.path}`;
      return /* @__PURE__ */ React.createElement("div", { key, className: "df-file-item" }, /* @__PURE__ */ React.createElement("div", { className: "df-file-row", onClick: (event) => {
        event.stopPropagation();
        onOpenDiff?.(file, index);
      } }, /* @__PURE__ */ React.createElement("span", { className: "df-file-path" }, file.path), file.binary ? /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, "binary") : /* @__PURE__ */ React.createElement("span", { className: "df-diff-counts" }, /* @__PURE__ */ React.createElement("span", { className: "df-diff-add" }, `+${file.added}`), /* @__PURE__ */ React.createElement("span", { className: "df-diff-del" }, `-${file.deleted}`))), file.binary ? null : /* @__PURE__ */ React.createElement("div", { className: "df-hover-card", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "df-hover-head" }, /* @__PURE__ */ React.createElement("span", { className: "df-hover-path" }, file.path), /* @__PURE__ */ React.createElement("span", { className: "df-diff-counts" }, /* @__PURE__ */ React.createElement("span", { className: "df-diff-add" }, `+${file.added}`), /* @__PURE__ */ React.createElement("span", { className: "df-diff-del" }, `-${file.deleted}`))), /* @__PURE__ */ React.createElement("div", { className: "df-hover-body" }, /* @__PURE__ */ React.createElement(FileDiff, { state: diffStateOf(file), split: false, wrap: false, retry: () => void 0, t: diffLabelsOf(t) }))));
    })) : null,
    deps.map((dep) => /* @__PURE__ */ React.createElement(
      TreeItem,
      {
        key: `dep-${dep.id}`,
        kind: "dev",
        title: dep.title,
        chips: [],
        actions: /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: dep.status }),
        facts: [
          { slot: t("fact.state"), detail: t(`status.${dep.status}`) || dep.status },
          { slot: t("fact.merged"), detail: dep.merged ? dep.branch ?? "" : t("fact.notMerged") }
        ],
        expandable: true,
        expanded: openDeps[dep.id] === true,
        onToggle: () => setOpenDeps({ ...openDeps, [dep.id]: openDeps[dep.id] !== true }),
        depth: depth + 1,
        tone: toneOf(dep.status)
      }
    ))
  );
}
function AcceptTaskItem({
  ui,
  t,
  batch,
  picked,
  setPicked,
  sessionId,
  call,
  reload,
  show,
  pickedBatches,
  setPickedBatches,
  open,
  onToggle,
  children,
  depth = 0
}) {
  const deletable = batch.status !== "accepting";
  const leading = deletable ? /* @__PURE__ */ React.createElement("input", { className: "df-check", type: "checkbox", checked: pickedBatches.includes(batch.id), onClick: (event) => event.stopPropagation(), onChange: () => setPickedBatches(togglePick(pickedBatches, batch.id)) }) : void 0;
  return /* @__PURE__ */ React.createElement(
    TreeItem,
    {
      kind: "accept",
      title: batch.title,
      chips: [...baseChips(batch), ...taskChips(batch)],
      time: createdText(batch.createdAt),
      leading,
      actions: /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: shownStatus(batch) }),
      expandable: onToggle !== void 0,
      expanded: open,
      onToggle,
      onClick: deletable ? () => setPickedBatches(togglePick(pickedBatches, batch.id)) : void 0,
      depth,
      tone: toneOf(shownStatus(batch))
    },
    children.map((task) => /* @__PURE__ */ React.createElement(DevTaskItem, { key: task.id, ui, t, task, picked, setPicked, sessionId, call, reload, show, nested: true, reviewing: batch.status === "accepting", batchId: batch.id, depth: depth + 1 }))
  );
}
function containedTasks(data, batch) {
  const ids = batch.taskIds ?? [];
  const fromIds = ids.map((id) => data.tasks.find((task) => task.kind !== "accept" && task.id === id)).filter((task) => task !== void 0);
  const rows = fromIds.length > 0 ? fromIds : data.tasks.filter((task) => task.kind !== "accept" && task.batchId === batch.id);
  return rows.sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")));
}
function Slots({ ui, data, t }) {
  const dev = data.counts.devSlots;
  const accept = data.counts.acceptSlots;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, `${t("slot.dev")} ${dev?.used ?? 0}/${dev?.total ?? 0} \xB7 ${t("slot.accept")} ${accept?.used ?? 0}/${accept?.total ?? 0}`), data.repos.map((repo) => /* @__PURE__ */ React.createElement("section", { key: repo.name, className: "df-card" }, /* @__PURE__ */ React.createElement("div", { className: "df-repo" }, /* @__PURE__ */ React.createElement("strong", null, repo.name), repo.branch ? /* @__PURE__ */ React.createElement("span", { className: "df-branch" }, repo.branch) : null, /* @__PURE__ */ React.createElement("span", { className: repo.dirty ? "df-warn" : "df-ok" }, repo.dirty ? t("base.dirty") : t("base.clean"))), repo.devSlots.length === 0 ? /* @__PURE__ */ React.createElement(SlotLine, { t, kind: "dev", state: "missing", detail: t("slot.noDev") }) : repo.devSlots.map((slot) => /* @__PURE__ */ React.createElement(SlotLine, { key: slot.number, t, kind: "dev", repo: repo.name, number: slot.number, state: slot.taskId ? "busy" : "free", detail: devDetail(data, repo, slot, t) })), /* @__PURE__ */ React.createElement(
    SlotLine,
    {
      t,
      kind: "accept",
      repo: repo.name,
      number: repo.acceptSlot?.number,
      state: repo.acceptSlot ? repo.acceptSlot.batchId ? "busy" : "free" : "missing",
      detail: acceptDetail(repo, t)
    }
  ))));
}
function baseDraftOf(projects, group) {
  const rows = {};
  for (const project of projects) {
    const member = group?.repos.find((item) => item.repo === project.name);
    const branches = project.branches ?? [];
    rows[project.name] = member !== void 0 ? { enabled: true, branch: member.branch } : { enabled: false, branch: project.branch ?? project.defaultBranch ?? branches[0] ?? "" };
  }
  return { number: group?.number ?? null, label: group?.label ?? "", rows };
}
function Bases({
  ui,
  data,
  t,
  call,
  reload,
  show,
  sessionId
}) {
  const groups = data.baseGroups ?? [];
  const projects = data.projects ?? [];
  const [draft, setDraft] = useState2(null);
  const [saving, setSaving] = useState2(false);
  const [error, setError] = useState2("");
  const openCreate = () => {
    setDraft(baseDraftOf(projects));
    setError("");
  };
  const openEdit = (group) => {
    setDraft(baseDraftOf(projects, group));
    setError("");
  };
  const close = () => {
    if (saving) return;
    setDraft(null);
    setError("");
  };
  const setRow = (repo, next) => {
    if (draft === null) return;
    setDraft({ ...draft, rows: { ...draft.rows, [repo]: next } });
  };
  const save = () => {
    if (draft === null || saving) return;
    const members = Object.entries(draft.rows).filter(([, row]) => row.enabled).map(([repo, row]) => ({ repo, branch: row.branch }));
    if (members.length === 0) {
      setError(t("base.needMember"));
      return;
    }
    if (members.some((member) => member.branch === "")) {
      setError(t("base.needBranch"));
      return;
    }
    setSaving(true);
    setError("");
    call("base-save", { sessionId, number: draft.number, label: draft.label, members }).then(() => {
      setDraft(null);
      show(t("base.saved"), "info");
      return reload();
    }).catch((reason) => {
      const text = textOf(reason);
      setError(text);
      show(text, "error");
    }).finally(() => setSaving(false));
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "df-base-toolbar" }, /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "primary", onClick: openCreate, disabled: draft !== null }, t("action.newBase"))), draft !== null ? /* @__PURE__ */ React.createElement("section", { className: "df-card df-base-editor" }, /* @__PURE__ */ React.createElement("div", { className: "df-repo" }, /* @__PURE__ */ React.createElement("strong", null, draft.number === null ? t("base.editor.create") : t("base.editor.edit").replace("{number}", draft.number))), /* @__PURE__ */ React.createElement("label", { className: "df-base-label-row" }, /* @__PURE__ */ React.createElement("span", null, t("base.label")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: draft.label,
      placeholder: t("base.labelPlaceholder"),
      disabled: saving,
      onChange: (event) => setDraft({ ...draft, label: event.target.value })
    }
  )), projects.some((project) => !Array.isArray(project.branches)) ? /* @__PURE__ */ React.createElement("p", { className: "df-base-warn", role: "status" }, t("base.branchesStale")) : null, projects.map((project) => {
    const row = draft.rows[project.name] ?? { enabled: false, branch: "" };
    const branches = [...new Set([...project.branches ?? [], row.branch].filter((branch) => branch !== ""))].sort();
    return /* @__PURE__ */ React.createElement("div", { key: project.name, className: "df-base-edit-row" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: row.enabled,
        disabled: saving,
        "aria-label": project.name,
        onChange: () => setRow(project.name, { ...row, enabled: !row.enabled })
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "df-base-edit-name" }, project.name), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: row.branch,
        disabled: !row.enabled || saving,
        "aria-label": `${project.name} ${t("base.branch")}`,
        onChange: (event) => setRow(project.name, { ...row, branch: event.target.value })
      },
      branches.length === 0 ? /* @__PURE__ */ React.createElement("option", { value: "" }, t("base.noBranches")) : null,
      branches.map((branch) => /* @__PURE__ */ React.createElement("option", { key: branch, value: branch }, branch))
    ));
  }), error !== "" ? /* @__PURE__ */ React.createElement("p", { className: "df-base-error", role: "alert" }, error) : null, /* @__PURE__ */ React.createElement("div", { className: "df-base-edit-actions" }, /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "ghost", onClick: close, disabled: saving }, t("action.cancel")), /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "primary", onClick: save, disabled: saving }, saving ? t("action.saving") : t("action.save")))) : null, groups.length === 0 && draft === null ? /* @__PURE__ */ React.createElement("div", { className: "df-empty" }, /* @__PURE__ */ React.createElement("p", null, t("empty.bases")), /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, t("empty.basesHint"))) : null, groups.map((group) => /* @__PURE__ */ React.createElement("section", { key: group.number, className: "df-card" }, /* @__PURE__ */ React.createElement("div", { className: "df-repo" }, /* @__PURE__ */ React.createElement("strong", null, `#${group.number}`), /* @__PURE__ */ React.createElement("span", { className: "df-branch" }, group.label), /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, t("base.projects").replace("{count}", String(group.repos.length))), /* @__PURE__ */ React.createElement("span", { className: "df-base-actions" }, /* @__PURE__ */ React.createElement(ActionButton, { ui, variant: "ghost", onClick: () => openEdit(group), title: t("action.edit") }, t("action.edit")))), group.repos.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "df-empty-line" }, t("base.noRepo")) : null, group.repos.map((base) => /* @__PURE__ */ React.createElement("div", { key: base.repo, className: "df-base" }, /* @__PURE__ */ React.createElement("span", { className: "df-base-name" }, /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, base.repo), /* @__PURE__ */ React.createElement("span", { className: base.current ? "df-base-branch is-current" : "df-base-branch" }, base.branch), base.default ? /* @__PURE__ */ React.createElement("span", { className: "df-base-flag" }, t("base.default")) : null, base.current ? /* @__PURE__ */ React.createElement("span", { className: "df-base-flag" }, t("base.current")) : null), /* @__PURE__ */ React.createElement("span", { className: "df-base-meta" }, /* @__PURE__ */ React.createElement("span", { className: "df-base-loc", "data-location": base.location }, t(`base.${base.location}`)), /* @__PURE__ */ React.createElement("span", { className: base.dirty ? "df-warn" : "df-ok" }, base.dirty ? t("base.dirty") : t("base.clean")), /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, t("base.tasks").replace("{count}", String(base.tasks))), base.shortHead ? /* @__PURE__ */ React.createElement("span", { className: "df-base-head" }, base.shortHead) : null))))));
}
function SlotLine({ t, kind, repo, number, state, detail }) {
  const label = repo && number ? `${repo}-${number}` : `${kind === "dev" ? t("slot.dev") : t("slot.accept")} ${number ?? ""}`.trim();
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
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, `${t("metric.agents")} ${data.counts.activeAgents}/${data.counts.agentLimit}`), /* @__PURE__ */ React.createElement("div", { className: "df-card" }, rows.map((agent) => /* @__PURE__ */ React.createElement("div", { key: agent.id, className: "df-agent" }, /* @__PURE__ */ React.createElement(Dot, { ui, state: agent.status === "running" ? "ongoing" : "idle" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "df-name" }, agent.id), /* @__PURE__ */ React.createElement("div", { className: "df-meta" }, agentDetail(data, agent, t))), /* @__PURE__ */ React.createElement(StatusTag, { ui, t, status: agent.status === "lead" ? "lead" : agentPhase(agent) })))));
}
function StatusTag({ ui, t, status }) {
  const label = status === "running" ? t("agent.running") : status === "idle" ? t("agent.idle") : status === "lead" ? t("agent.dispatch") : t(`status.${status}`) || status;
  const tone = status === "failed" || status === "rejected" ? "danger" : status === "accepted" || status === "merged" ? "success" : status === "pending-merge" || status === "awaiting-agent" ? "warning" : status === "developing" || status === "running" || status === "scheduling" ? "info" : status === "pending-acceptance" || status === "waiting" || status === "accepting" ? "warning" : "neutral";
  return ui.Tag ? /* @__PURE__ */ React.createElement(ui.Tag, { tone }, label) : /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, label);
}
function SettingsForm({ ui, view, call, t }) {
  const [draft, setDraft] = useState2(null);
  const [message, setMessage] = useState2("");
  useEffect2(() => {
    if (view === "summary") return void 0;
    const controller = new AbortController();
    call("settings-get", {}, controller.signal).then((value) => setDraft(value)).catch((reason) => setMessage(reason instanceof Error ? reason.message : String(reason)));
    return () => controller.abort();
  }, [view, call]);
  if (view === "summary") return /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, t("settings.summary"));
  if (!draft) return /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, message || "\u2026");
  const fields = [
    ["devModel", "\u5F00\u53D1\u4EFB\u52A1\u6A21\u578B"],
    ["acceptModel", "\u9A8C\u6536\u4EFB\u52A1\u6A21\u578B"],
    ["devDir", "\u5F00\u53D1\u69FD\u4F4D\u76EE\u5F55"],
    ["acceptDir", "\u9A8C\u6536\u69FD\u4F4D\u76EE\u5F55"],
    ["baseDir", "\u57FA\u7EBF\u69FD\u4F4D\u76EE\u5F55"],
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
  const [toast, setToast] = useState2(null);
  const timer = useRef2(null);
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
function removeBatches(call, sessionId, ids, setPicked, setBusy, reload, show) {
  setBusy(true);
  call("accept-delete", { sessionId, ids }).then(() => {
    setPicked([]);
    show?.(`\u5DF2\u5220\u9664 ${ids.length} \u4E2A\u9A8C\u6536\u4EFB\u52A1`, "info");
    return reload();
  }).catch((reason) => reload(reason)).finally(() => setBusy(false));
}
function removeTasks(call, sessionId, ids, picked, setPicked, setBusy, reload, show, t) {
  if (ids.length === 0) return;
  setBusy(true);
  call("task-delete", { sessionId, ids }).then((value) => {
    const result = value;
    const deleted = Array.isArray(result?.deleted) ? result.deleted : ids;
    const warnings = Array.isArray(result?.deleteWarnings) ? result.deleteWarnings : [];
    setPicked(picked.filter((id) => !deleted.includes(id)));
    if (warnings.length > 0) {
      show?.(t("toast.deleteWarnings").replace("{count}", String(deleted.length)).replace("{warnings}", warnings.join("\uFF1B")), "error");
    } else {
      show?.(t("toast.deletedTasks").replace("{count}", String(deleted.length)), "info");
    }
    return reload();
  }).catch((reason) => reload(reason)).finally(() => setBusy(false));
}
function mergeTask(call, sessionId, taskId, reload, show) {
  call("task-merge", { sessionId, taskId }).then((value) => {
    const task = value?.tasks?.find((item) => item.id === taskId);
    if (task?.status === "pending-merge") show?.(task.warnings?.join("\uFF0C") || "\u6CA1\u6709\u5408\u5165", "error");
    else show?.("\u5DF2\u5408\u5165\u57FA\u7EBF", "info");
    return reload();
  }).catch((reason) => reload(reason));
}
function finishTask(call, sessionId, id, taskId, result, reload) {
  call("accept-task", { sessionId, id, taskId, result }).then(() => reload()).catch((reason) => reload(reason));
}
function togglePick(picked, id) {
  return picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id];
}
function shownStatus(task) {
  if (task.kind !== "accept" && task.status === "developing" && task.agentStatus !== "running") return "awaiting-agent";
  return task.status;
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
  const perRepo = /* @__PURE__ */ new Map();
  for (const task of selected) {
    for (const name of task.repos) {
      const bases = perRepo.get(name) ?? /* @__PURE__ */ new Set();
      bases.add(task.base ?? "");
      perRepo.set(name, bases);
    }
  }
  if ([...perRepo.values()].some((bases) => bases.size > 1)) return t("hint.baseMismatch");
  return "";
}
function taskTitle(data, id) {
  if (!id) return "";
  return data.tasks.find((task) => task.id === id)?.title ?? id;
}
function agentPhase(agent) {
  if (agent.status !== "running") return "idle";
  if (agent.kind === "accept") return "accepting";
  if (agent.kind === "schedule") return "scheduling";
  return "developing";
}
function agentSlots(data, agent) {
  const task = data.tasks.find((item) => item.id === agent.taskId || item.id === agent.lastTaskId);
  if (!task?.slots) return [];
  return Object.entries(task.slots).map(([repo, slot]) => slot.number ? `${repo}-${slot.number}` : `${repo} ${slot.port ?? ""}`.trim());
}
function baseChips(task) {
  if (task.kind === "accept") return Object.values(task.bases ?? {}).filter((base) => typeof base === "string" && base !== "");
  const chips = [];
  if (typeof task.baseGroup === "string" && task.baseGroup !== "") chips.push(`#${task.baseGroup}`);
  if (typeof task.base === "string" && task.base !== "") chips.push(task.base);
  return chips;
}
function taskChips(task) {
  return Object.entries(task.slots ?? {}).map(([repo, slot]) => {
    if (slot.port) return `${repo} \xB7 ${slot.port}`;
    return slot.number ?? repo;
  });
}
function createdText(createdAt) {
  if (!createdAt) return void 0;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return void 0;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function taskBranchChips(task) {
  return Object.values(task.slots ?? {}).map((slot) => slot.branch).filter((branch) => typeof branch === "string" && branch !== "");
}
function taskFacts(task, t) {
  const zh2 = t("page.tasks") === "\u4EFB\u52A1";
  const batchLabel = zh2 ? "\u6279\u6B21" : "batch";
  const rows = [];
  for (const [repo, slot] of Object.entries(task.slots ?? {})) {
    if (slot.branch) rows.push({ slot: repo, detail: slot.branch });
  }
  if (task.batchId && task.kind === "dev") rows.push({ slot: batchLabel, detail: task.batchId });
  if (task.warnings?.length) rows.push({ slot: t("status.pending-merge"), detail: task.warnings.join("\uFF0C") });
  if (task.usage?.totalTokens) rows.push({ slot: "token", detail: formatTokens(task.usage.totalTokens) });
  return rows;
}
function formatTokens(total) {
  if (total >= 1e4) return `${Math.round(total / 1e3)}k`;
  if (total >= 1e3) return `${(total / 1e3).toFixed(1)}k`;
  return String(total);
}
function devDetail(data, repo, slot, t) {
  if (!slot.taskId) return t("slot.reusable");
  const title = taskTitle(data, slot.taskId);
  return [title, slot.branch].filter(Boolean).join(" \xB7 ");
}
function acceptDetail(repo, t) {
  if (!repo.acceptSlot) return t("slot.noAccept");
  const portLabel = t("page.tasks") === "\u4EFB\u52A1" ? "\u7AEF\u53E3" : "port";
  if (!repo.acceptSlot.batchId) return repo.acceptSlot.port ? `${portLabel} ${repo.acceptSlot.port}` : t("slot.free");
  return [`${portLabel} ${repo.acceptSlot.port ?? ""}`, repo.acceptSlot.batchId].filter(Boolean).join(" \xB7 ");
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
function diffDefinition(t) {
  return {
    id: DIFF_TYPE_ID,
    kind: DIFF_KIND,
    priority: "extension",
    patterns: [DIFF_PATTERN],
    title: (address) => diffTitle(address) || t("tab.diff")
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
    inject: (sessionId) => ({
      ...typeof sessionId === "string" ? { sessionId } : {},
      call,
      ui,
      openDiff: (taskId, title, index) => ctx.sidebarRight.openResource(diffAddress({ taskId, title }), { params: { index } })
    })
  }, Panel)), "dev-flow: body");
  ctx.effect(() => ctx.sidebarRightTabs.register(diffDefinition(t)), "dev-flow: diff type");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
    name: "sidebar.right.pane.tab",
    key: DIFF_TYPE_ID,
    locale: NAMESPACE,
    inject: (sessionId) => ({ ...typeof sessionId === "string" ? { sessionId } : {}, call, t, ui })
  }, DiffTab)), "dev-flow: diff body");
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
var inject = ["slots", "locale", "sidebarRightTabs", "sidebarRight", "connection", "sessions"];

    const plugin = module.exports;
    if (typeof plugin.apply !== 'function') throw new Error('dev-flow: 构建产物缺少 apply');
    return plugin;
  },
});

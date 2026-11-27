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
function ActionButton({
  ui,
  children,
  onClick,
  disabled,
  title,
  variant = "outline",
  size = "sm",
  type = "button",
  className,
  ariaLabel
}) {
  if (ui.Button) {
    return /* @__PURE__ */ React.createElement(ui.Button, { type, className, variant, size, disabled, title, "aria-label": ariaLabel, onClick }, children);
  }
  return /* @__PURE__ */ React.createElement("button", { type, className, disabled, title, "aria-label": ariaLabel, onClick }, children);
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
register("/** Shared comparison layout, header, states, and numbered diff lines for previews and review tabs. */\n.df-root-683bfa { --diff-empty-fill: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover) 50%, transparent); display: flex; flex-direction: column; box-sizing: border-box; width: 100%; min-height: 0; color: var(--dsw-alias-label-primary); }\n.df-header-683bfa { display: flex; flex: 0 0 auto; gap: 6px; align-items: center; box-sizing: border-box; height: 38px; padding: 0 6px 0 8px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); }\n.df-status-683bfa { display: flex; gap: 12px; align-items: center; margin: 0; padding: 16px; font-size: 13px; color: var(--dsw-alias-label-secondary); }\n.df-body-683bfa { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; overflow: auto; padding: 8px 0 16px; font: var(--dsw-font-markdown-code-block); }\n.df-columns-683bfa { display: grid; flex: 1 1 auto; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 0; }\n/* One intrinsic-width track keeps every hunk and row painted across the scrollable content. */\n.df-column-683bfa, .df-body-683bfa[data-review-view='unified']:not([data-review-wrap]) { display: grid; grid-template-columns: minmax(max-content, 100%); align-content: start; }\n.df-column-683bfa { min-width: 0; overflow-x: scroll; overscroll-behavior: none; }\n.df-column-683bfa + .df-column-683bfa { border-left: 0.5px solid var(--dsw-alias-border-l3); }\n.df-sideLine-683bfa { display: grid; grid-template-columns: 3.5em max-content; box-sizing: border-box; min-width: 100%; width: max-content; min-height: 22px; line-height: 22px; white-space: pre; }\n.df-note-683bfa { margin: 0; padding: 4px 16px 8px; font: var(--dsw-font-xs-13); color: var(--dsw-alias-label-tertiary); }\n.df-hunk-683bfa { margin-bottom: 8px; }\n.df-hunkHeader-683bfa { padding: 4px 16px; color: var(--dsw-alias-label-tertiary); white-space: pre; }\n.df-line-683bfa { display: grid; grid-template-columns: 3.5em 3.5em 1.2em minmax(0, 1fr); box-sizing: border-box; min-height: 22px; line-height: 22px; white-space: pre; }\n.df-splitLine-683bfa { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 22px; line-height: 22px; white-space: pre; }\n.df-cell-683bfa { display: grid; grid-template-columns: 3.5em minmax(0, 1fr); box-sizing: border-box; min-width: 0; }\n.df-cell-683bfa + .df-cell-683bfa { border-left: 0.5px solid var(--dsw-alias-border-l3); }\n.df-number-683bfa { padding-right: 8px; color: var(--dsw-alias-label-tertiary); text-align: right; user-select: none; }\n.df-sign-683bfa { text-align: center; user-select: none; }\n.df-text-683bfa { padding-right: 16px; }\n.df-body-683bfa[data-review-wrap] .df-line-683bfa, .df-body-683bfa[data-review-wrap] .df-splitLine-683bfa { white-space: pre-wrap; }\n.df-body-683bfa[data-review-wrap] .df-text-683bfa { overflow-wrap: anywhere; }\n.df-add-683bfa { --diff-gutter-fill: var(--dsw-alias-file-diff-added-gutter); --diff-marker: var(--dsw-alias-file-diff-added-marker); background: var(--dsw-alias-file-diff-added-bg); }\n.df-del-683bfa { --diff-gutter-fill: var(--dsw-alias-file-diff-deleted-gutter); --diff-marker: var(--dsw-alias-file-diff-deleted-marker); background: var(--dsw-alias-file-diff-deleted-bg); }\n.df-add-683bfa .df-number-683bfa, .df-del-683bfa .df-number-683bfa { background: var(--diff-gutter-fill); color: var(--diff-marker); }\n.df-add-683bfa .df-number-683bfa:first-child, .df-del-683bfa .df-number-683bfa:first-child { box-shadow: inset 3px 0 0 var(--diff-marker); }\n.df-add-683bfa .df-sign-683bfa, .df-del-683bfa .df-sign-683bfa { color: var(--diff-marker); }\n.df-context-683bfa .df-text-683bfa { color: var(--dsw-alias-label-secondary); }\n.df-empty-683bfa { background: var(--diff-empty-fill); }\n");
var FileDiff_default = { "root": "df-root-683bfa", "header": "df-header-683bfa", "status": "df-status-683bfa", "body": "df-body-683bfa", "columns": "df-columns-683bfa", "column": "df-column-683bfa", "sideLine": "df-sideLine-683bfa", "note": "df-note-683bfa", "hunk": "df-hunk-683bfa", "hunkHeader": "df-hunkHeader-683bfa", "line": "df-line-683bfa", "splitLine": "df-splitLine-683bfa", "cell": "df-cell-683bfa", "number": "df-number-683bfa", "sign": "df-sign-683bfa", "text": "df-text-683bfa", "add": "df-add-683bfa", "del": "df-del-683bfa", "context": "df-context-683bfa", "empty": "df-empty-683bfa" };

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
  "action.pause": "\u6682\u505C",
  "action.resume": "\u7EE7\u7EED",
  "action.stop": "\u505C\u6B62",
  "hint.pause": "\u6682\u505C\u4F1A\u4E2D\u65AD\u5F00\u53D1\u5B50\u4EE3\u7406\uFF0C\u4F46\u4FDD\u7559\u5DE5\u4F5C\u6811\u548C\u69FD\u4F4D",
  "hint.resume": "\u7EE7\u7EED\u540E\u7531\u4E3B\u4F1A\u8BDD\u91CD\u65B0\u6D3E\u53D1\u5B50\u4EE3\u7406",
  "hint.stop": "\u505C\u6B62\u4F1A\u4E2D\u65AD\u5B50\u4EE3\u7406\u3001\u91CA\u653E\u69FD\u4F4D\u5E76\u7ED3\u675F\u4EFB\u52A1\uFF1B\u4EFB\u52A1\u5206\u652F\u4FDD\u7559",
  "toast.pause": "\u5DF2\u6682\u505C\u5F00\u53D1\u4EFB\u52A1",
  "toast.resume": "\u5DF2\u7EE7\u7EED\u5F00\u53D1\u4EFB\u52A1",
  "toast.stop": "\u5DF2\u505C\u6B62\u5F00\u53D1\u4EFB\u52A1",
  "hint.deleteSingle": "\u5220\u9664\u4EFB\u52A1\u5E76\u5220\u9664\u4EFB\u52A1\u5206\u652F\uFF0C\u65E0\u6CD5\u6062\u590D",
  "hint.deleteTasks": "\u5220\u9664 {count} \u4E2A\u4EFB\u52A1\uFF0C\u540C\u65F6\u5220\u9664\u5BF9\u5E94\u4EFB\u52A1\u5206\u652F\uFF0C\u65E0\u6CD5\u6062\u590D",
  "hint.deleteBlocked": "\u52FE\u9009\u91CC\u6709\u4E0D\u53EF\u5220\u9664\u7684\u4EFB\u52A1\uFF1A\u53EA\u6709\u5DF2\u7ED3\u675F\u4E14\u6CA1\u6709\u88AB\u5176\u5B83\u4EFB\u52A1\u4F9D\u8D56\u7684\u4EFB\u52A1\u53EF\u4EE5\u5220\u9664",
  "hint.notSelectable": "\u8BE5\u4EFB\u52A1\u5F53\u524D\u4E0D\u80FD\u9009",
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
  "settings.summary": "\u5F00\u53D1\u4E0E\u9A8C\u6536\u7684\u6A21\u578B\u3001\u63A8\u7406\u7B49\u7EA7\u3001\u76EE\u5F55\u548C\u5206\u652F",
  "metric.agents": "\u5B50\u4EE3\u7406",
  "metric.baseSlots": "\u57FA\u7EBF\u69FD\u4F4D",
  "metric.devTasks": "\u5F00\u53D1\u4EFB\u52A1",
  "metric.active": "\u6D3B\u8DC3",
  "metric.limit": "\u4E0A\u9650",
  "metric.total": "\u603B\u6570",
  "overview.metrics": "\u6307\u6807\u603B\u89C8",
  "overview.noTasks": "\u6CA1\u6709\u672A\u5B8C\u6210\u7684\u4EFB\u52A1",
  "overview.allShown": "\u5DF2\u663E\u793A\u5168\u90E8\u672A\u5B8C\u6210\u4EFB\u52A1",
  "filter.allProjects": "\u5168\u90E8\u9879\u76EE",
  "project.idle": "\u6B63\u5E38",
  "project.dirty": "\u57FA\u7EBF\u4E0D\u5E72\u51C0",
  "project.active": "\u5F00\u53D1\u6D3B\u8DC3\u4E2D",
  "project.pending": "\u4EFB\u52A1\u5F85\u9A8C\u6536",
  "section.emptyProjects": "\u6CA1\u6709\u9879\u76EE",
  "section.open": "\u6D3B\u8DC3\u4EFB\u52A1",
  "nav.projects": "\u9879\u76EE",
  "metric.dirtyBases": "\u57FA\u7EBF\u6539\u52A8",
  "section.scheduleTasks": "\u8C03\u5EA6\u4EFB\u52A1",
  "section.emptySchedule": "\u6CA1\u6709\u8C03\u5EA6\u4EFB\u52A1",
  "section.scheduleHint": "\u8C03\u5EA6\u5668\u6BCF 30 \u79D2\u626B\u4E00\u6B21\u961F\u5217\uFF0C\u628A\u7B49\u5F85\u4E2D\u7684\u4EFB\u52A1\u6D3E\u7ED9\u7A7A\u95F2\u69FD\u4F4D",
  "section.scheduleEvery": "\u6BCF 30 \u79D2\u5DE1\u68C0",
  "fact.concurrency": "\u5E76\u53D1",
  "fact.changeFiles": "\u6539\u52A8\u6587\u4EF6",
  "action.expand": "\u5C55\u5F00",
  "action.collapse": "\u6536\u8D77",
  "section.devTasks": "\u5F00\u53D1\u4EFB\u52A1",
  "section.acceptTasks": "\u9A8C\u6536\u4EFB\u52A1",
  "section.emptyDev": "\u6CA1\u6709\u5F00\u53D1\u4EFB\u52A1",
  "section.emptyAccept": "\u6CA1\u6709\u9A8C\u6536\u4EFB\u52A1",
  "section.emptyDetail": "\u70B9\u51FB\u4EFB\u4E00\u8C03\u5EA6 / \u5F00\u53D1 / \u9A8C\u6536\u4EFB\u52A1\u67E5\u770B\u8BE6\u60C5",
  "section.emptyBatchTasks": "\u672C\u6279\u6B21\u6CA1\u6709\u5173\u8054\u7684\u5F00\u53D1\u4EFB\u52A1",
  "fact.slot": "\u69FD\u4F4D",
  "fact.branch": "\u5206\u652F",
  "fact.base": "\u57FA\u7EBF",
  "fact.batch": "\u9A8C\u6536\u6279\u6B21",
  "fact.taskCount": "\u4EFB\u52A1\u6570",
  "fact.depends": "\u4F9D\u8D56",
  "fact.merged": "\u5DF2\u5E76\u5165",
  "fact.state": "\u72B6\u6001",
  "fact.notMerged": "\u672A\u5E76\u5165",
  "fact.warning": "\u8B66\u544A",
  "fact.usage": "\u7528\u91CF",
  "fact.paused": "\u6682\u505C\u4E8E",
  "fact.stopped": "\u505C\u6B62\u4E8E",
  "usage.total": "\u5171",
  "usage.input": "\u8F93\u5165",
  "usage.output": "\u8F93\u51FA",
  "usage.cache": "\u7F13\u5B58",
  "section.projects": "\u9879\u76EE\u6982\u89C8",
  "overview.tasks": "\u4EFB\u52A1\u6982\u89C8",
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
  "status.paused": "\u5DF2\u6682\u505C",
  "status.stopped": "\u5DF2\u505C\u6B62",
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
  "hint.baseMismatch": "\u6240\u9009\u4EFB\u52A1\u7684\u57FA\u7EBF\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5206\u5F00\u9A8C\u6536",
  "slots.empty": "\u8FD8\u6CA1\u6709\u4ED3\u5E93",
  "slots.emptyRepo": "\u8FD9\u4E2A\u4ED3\u5E93\u8FD8\u6CA1\u6709\u69FD\u4F4D",
  "slots.accept": "\u9A8C\u6536",
  "slots.acceptFree": "\u9A8C\u6536\u7A7A\u95F2",
  "bases.empty": "\u8FD8\u6CA1\u6709\u57FA\u7EBF",
  "bases.emptyGroup": "\u8FD9\u4E00\u7EC4\u8FD8\u6CA1\u6709\u6210\u5458",
  "bases.repos": "\u4E2A\u9879\u76EE",
  "bases.root": "\u6839\u76EE\u5F55\u68C0\u51FA",
  "bases.slot": "\u57FA\u7EBF\u69FD\u4F4D",
  "bases.busy": "\u88AB\u5360\u7528",
  "bases.missing": "\u69FD\u4F4D\u7F3A\u5931",
  "bases.none": "\u672A\u5EFA\u7ACB",
  "agents.main": "\u4E3B\u4F1A\u8BDD",
  "agents.sub": "\u5B50\u4EE3\u7406",
  "agents.mainHint": "\u53EA\u505A\u8C03\u5EA6\uFF0C\u6BCF 30 \u79D2\u5DE1\u68C0",
  "agents.notCounted": "\u4E0D\u8BA1\u5165",
  "agents.running": "\u8FD0\u884C\u4E2D",
  "agents.empty": "\u6CA1\u6709\u5B50\u4EE3\u7406",
  "status.running": "\u8FD0\u884C\u4E2D",
  "status.none": "\u672A\u5EFA\u7ACB"
};
var en = {
  "tab.title": "dev-flow",
  "tab.diff": "diff",
  "tab.description": "Tasks, slots, and agents for a multi-repo workspace",
  "switch.label": "Workflow",
  "page.overview": "Overview",
  "slots.empty": "No repositories yet",
  "slots.emptyRepo": "No slots in this repository",
  "slots.accept": "Accept",
  "slots.acceptFree": "Accept free",
  "bases.empty": "No baselines yet",
  "bases.emptyGroup": "No members in this group",
  "bases.repos": "repos",
  "bases.root": "Root checkout",
  "bases.slot": "Base slot",
  "bases.busy": "In use",
  "bases.missing": "Slot missing",
  "bases.none": "Not created",
  "agents.main": "Main session",
  "agents.sub": "Subagents",
  "agents.mainHint": "Schedules only, sweeps every 30s",
  "agents.notCounted": "Not counted",
  "agents.running": "Running",
  "agents.empty": "No subagents",
  "status.running": "Running",
  "status.none": "Not created",
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
  "action.pause": "Pause",
  "action.resume": "Resume",
  "action.stop": "Stop",
  "hint.pause": "Pausing interrupts the dev subagent but keeps the worktree and slot",
  "hint.resume": "Resuming lets the lead dispatch a subagent again",
  "hint.stop": "Stopping interrupts the subagent, releases the slot, and ends the task; the task branch is kept",
  "toast.pause": "Dev task paused",
  "toast.resume": "Dev task resumed",
  "toast.stop": "Dev task stopped",
  "hint.deleteSingle": "Delete the task and its task branch; this cannot be undone",
  "hint.deleteTasks": "Delete {count} tasks and their task branches; this cannot be undone",
  "hint.deleteBlocked": "Selection contains tasks that cannot be deleted; only finished tasks without other dependents can be deleted",
  "hint.notSelectable": "This task cannot be selected now",
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
  "settings.summary": "Models, reasoning effort, directories, and branch names",
  "metric.agents": "Agents",
  "metric.baseSlots": "Base slots",
  "metric.devTasks": "Dev tasks",
  "metric.active": "Active",
  "metric.limit": "Limit",
  "metric.total": "Total",
  "overview.metrics": "Metrics overview",
  "overview.noTasks": "No unfinished tasks",
  "overview.allShown": "All unfinished tasks shown",
  "filter.allProjects": "All projects",
  "project.idle": "All clear",
  "project.dirty": "Dirty baselines",
  "project.active": "Development active",
  "project.pending": "Awaiting acceptance",
  "section.emptyProjects": "No projects",
  "section.open": "Active",
  "nav.projects": "Projects",
  "metric.dirtyBases": "Changed bases",
  "section.scheduleTasks": "Scheduling",
  "section.emptySchedule": "No scheduling tasks",
  "section.emptyDetail": "Pick a scheduled, dev or acceptance row to see details",
  "section.emptyBatchTasks": "No dev tasks in this batch",
  "fact.concurrency": "concurrency",
  "fact.changeFiles": "Changed files",
  "section.devTasks": "Development",
  "section.acceptTasks": "Acceptance",
  "section.emptyDev": "No development tasks",
  "section.emptyAccept": "No acceptance tasks",
  "fact.slot": "Slot",
  "fact.branch": "Branch",
  "fact.base": "Baseline",
  "fact.batch": "Acceptance batch",
  "fact.taskCount": "Tasks",
  "fact.depends": "Depends on",
  "fact.merged": "Merged",
  "fact.state": "State",
  "fact.notMerged": "Not merged",
  "fact.warning": "Warning",
  "fact.usage": "Usage",
  "fact.paused": "Paused at",
  "fact.stopped": "Stopped at",
  "usage.total": "total",
  "usage.input": "in",
  "usage.output": "out",
  "usage.cache": "cache",
  "section.projects": "Project overview",
  "overview.tasks": "Task overview",
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
  "status.paused": "Paused",
  "status.stopped": "Stopped",
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
.df-pane-tools { display: flex; align-items: flex-start; gap: 8px; padding: 8px 16px 6px; flex: none; width: 100%; box-sizing: border-box; }
.df-pane-tools .df-filters { flex: 1 1 0; min-width: 0; padding: 0; }
.df-pane-actions { display: flex; align-items: center; gap: 4px; flex: none; }
.df-icon-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; }
.df-icon-btn-active { color: var(--dsw-alias-state-business-primary); background: var(--dsw-alias-interactive-bg-hover); }
.df-icon-badge { position: absolute; top: -4px; right: -4px; min-width: 14px; height: 14px; padding: 0 3px; border-radius: 7px; background: var(--dsw-alias-state-business-primary); color: #fff; font-size: 9px; line-height: 14px; text-align: center; }
.df-view > .df-foot { flex: none; position: static; padding: 10px 16px 8px; }

/* \u5206\u533A\u6807\u9898 */
.df-section { margin: 4px 0 0; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; color: var(--dsw-alias-label-tertiary); }
/* \u6982\u89C8\u6298\u53E0\u9762\u677F\uFF1A\u590D\u7528\u4EFB\u52A1\u9875 .df-view \u7684\u6298\u53E0\u5934\uFF0C\u4EC5\u8986\u5199\u6982\u89C8\u9700\u8981\u7684\u5E03\u5C40 */
.df-fold { display: flex; flex-direction: column; flex: none; min-width: 0; }
.df-fold + .df-fold { border-top: 0.5px solid var(--dsw-alias-border-l2); }
.df-fold.df-view { overflow: visible; }
.df-fold.df-view[data-open='true'] { flex: none; }
.df-fold.df-view[data-open='false'] { border-bottom: 0; }
.df-fold.df-fold-fill.df-view[data-open='true'] { flex: 1 0 auto; }
.df-fold.df-fold-fill.df-view[data-open='false'] { flex: none; }
.df-fold.df-view > .df-view-head { position: relative; padding: 0; cursor: pointer; }
.df-fold.df-view > .df-view-head:active { cursor: pointer; }
.df-fold.df-view > .df-view-head .df-view-chev { position: absolute; left: -15px; top: 50%; margin-top: -7px; }
.df-fold.df-view > .df-view-body { flex: none; max-height: none; overflow: visible; padding: 2px 0 10px; }
.df-fold.df-view > .df-fold-body { display: flex; flex-direction: column; gap: 8px; }
.df-fold.df-view > .df-fold-body > * + * { margin-top: 0; }
.df-fold.df-view > .df-fold-body-fill { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; min-height: 0; max-height: none; overflow: visible; padding: 0; }
.df-fold-body-fill .df-task-panel { flex: 1 1 auto; min-height: 180px; margin: 0 -16px 0; border-top: 0; overflow-y: auto; }
.df-subsection { margin: 2px 0 0; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.df-subsection-count { font-weight: 500; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

/* \u6982\u89C8\uFF1A\u6574\u9875\u6EDA\u52A8\uFF0C\u9879\u76EE\u7B5B\u9009\uFF0C\u4E09\u683C\u6307\u6807 */
.df-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 0; margin: 0 -16px; padding: 0 16px; }
.df-scope { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; }
.df-scope .df-filters { flex: 1 1 220px; min-width: 0; margin-left: -8px; }
.df-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 12px; row-gap: 8px; padding: 2px 0; }
.df-metric, .df-empty { border: 0; background: transparent; }
.df-metric { padding: 1px 0; }
.df-kicker { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
.df-metric-value { display: flex; align-items: baseline; gap: 2px; margin-top: 1px; }
.df-metric-part { display: inline-flex; align-items: baseline; gap: 2px; }
.df-metric-sep { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 24px; }
.df-metric strong {
  display: inline;
  margin-top: 0;
  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 17px;
  line-height: 24px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.df-metric strong[data-tone='info'] { color: var(--dsw-alias-state-business-primary); }
.df-metric strong[data-tone='warn'] { color: var(--dsw-alias-state-warn-primary); }
.df-metric-legend { display: block; margin-top: 1px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }

/* \u9879\u76EE\u6982\u89C8 */
.df-project { display: flex; flex-direction: column; gap: 2px; padding: 6px 0; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-project:last-child { border-bottom: 0; }
.df-project[data-scoped='true'] { margin-left: -8px; padding-left: 8px; background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); box-shadow: inset 2px 0 0 var(--dsw-alias-state-business-primary); }
.df-project-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.df-project-head .df-name { flex: 0 1 auto; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.df-project-desc { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 16px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.df-project-status { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px; flex: 0 1 auto; max-width: 62%; margin-left: auto; }
.df-project-tag { gap: 4px; }
.df-status-count { margin-left: 4px; font-weight: 600; font-variant-numeric: tabular-nums; opacity: 0.85; }
.df-filter-count { margin-left: 4px; font-weight: 500; font-variant-numeric: tabular-nums; opacity: 0.7; }

/* \u6982\u89C8\u4EFB\u52A1\u884C */
.df-task-line { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-task-line:last-child { border-bottom: 0; }
.df-task-main { display: flex; flex-direction: column; gap: 4px; flex: 1 1 auto; min-width: 0; }
.df-task-main .df-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.df-task-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
.df-task-side { display: flex; align-items: center; gap: 6px; flex: none; }
.df-task-panel { display: flex; flex-direction: column; flex: 1 0 auto; min-height: 180px; margin: 4px -16px 0; padding: 10px 16px 12px; background: var(--dsw-alias-bg-layer-2); border-top: 0.5px solid var(--dsw-alias-border-l2); }
.df-task-panel .df-section { margin-top: 0; }
.df-task-panel .df-subsection { margin-top: 6px; }
.df-task-rest { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; min-height: 56px; padding: 12px 0 4px; color: var(--dsw-alias-label-tertiary); font-size: 11px; text-align: center; }
.df-task-side .df-meta { white-space: nowrap; }

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
.df-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); align-items: baseline; gap: 2px 24px; padding: 1px 16px 8px 36px; }
.df-tree-children > .df-tree > .df-facts { padding-left: 34px; }
.df-line { grid-template-columns: minmax(0, 1fr) auto; }
.df-agent { grid-template-columns: auto minmax(0, 1fr) auto; }
.df-line:hover, .df-agent:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }

/* \u4EFB\u52A1\u884C */
.df-tree { display: flex; flex-direction: column; gap: 2px; width: 100%; box-sizing: border-box; border-bottom: 0.5px solid var(--dsw-alias-border-l2); transition: background-color 120ms ease; }
.df-fact { display: grid; grid-template-columns: max-content minmax(0, 1fr); align-items: baseline; gap: 8px; min-width: 0; }
.df-fact-wide { grid-column: 1 / -1; }
.df-fact-slot { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; white-space: nowrap; min-width: 48px; }
.df-fact-detail { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; overflow-wrap: anywhere; }

/* \u6587\u4EF6\u6539\u52A8 */
.df-files { margin: 2px 16px 8px 16px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 8px; overflow: visible; background: var(--dsw-alias-bg-base); }
.df-tree-children > .df-tree > .df-tree-children > .df-files { margin-left: 14px; }
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
.df-foot .df-cancel { width: auto; align-self: center; }
.df-go { width: 100%; }
.df-hint { margin: 0; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }

/* \u8BBE\u7F6E\u8868\u5355\u91CC\u7684\u8BF4\u660E\u6587\u5B57\uFF08\u4E0D\u662F\u8F93\u5165\u6846\u4E0A\u7684\u5F00\u5173\uFF09 */
.df-form-note {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}

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
/* \u6A21\u578B\u9009\u62E9\uFF1A\u6A21\u578B + \u63A8\u7406\u7B49\u7EA7\u4E24\u884C\uFF0C\u548C Composer \u7684 ModelSelect \u540C\u6784 */
.df-model-field { position: relative; }
.df-model-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 30px;
  padding: 0 10px;
  box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.df-model-trigger:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-model-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.df-model-hint { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.df-model-pop {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow: auto;
  padding: 4px;
  box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}
.df-model-group { display: flex; flex-direction: column; gap: 2px; }
.df-model-provider { padding: 6px 8px 2px; color: var(--dsw-alias-label-tertiary); font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; }
.df-model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.df-model-option:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-model-option[aria-selected='true'] { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent); }
.df-model-option-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.df-model-check { flex: none; color: var(--dsw-alias-state-business-primary); }
.df-model-error { margin: 0; padding: 8px; color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; }
.df-check { width: 14px; height: 14px; margin: 0; accent-color: var(--dsw-alias-state-business-primary); }
.df-check:disabled { opacity: 0.4; cursor: not-allowed; }

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
var DEV_ACTIVE = /* @__PURE__ */ new Set(["waiting", "developing", "paused", "failed"]);
function baseCounts(bases) {
  return {
    active: bases.filter((base) => base.tasks > 0).length,
    dirty: bases.filter((base) => base.dirty).length,
    total: bases.length
  };
}
function devCounts(tasks) {
  const dev = tasks.filter((task) => task.kind !== "accept");
  return {
    developing: dev.filter((task) => DEV_ACTIVE.has(task.status)).length,
    pending: dev.filter((task) => task.status === "pending-acceptance").length,
    total: dev.length
  };
}
function normalizeSnapshot(value) {
  if (value === null || typeof value !== "object") return null;
  const snapshot = value;
  const projects = Array.isArray(snapshot.projects) ? snapshot.projects.map((project) => typeof project === "string" ? { name: project, dirty: false } : project) : [];
  snapshot.projects = projects;
  if (!Array.isArray(snapshot.bases)) snapshot.bases = [];
  if (!Array.isArray(snapshot.tasks)) snapshot.tasks = [];
  if (!Array.isArray(snapshot.agents)) snapshot.agents = [];
  if (snapshot.counts !== void 0) {
    if (snapshot.counts.dirtyBases === void 0) {
      snapshot.counts.dirtyBases = snapshot.counts.dirtyTrunks ?? 0;
    }
    if (snapshot.counts.baseSlots === void 0) {
      snapshot.counts.baseSlots = baseCounts(snapshot.bases);
    }
    if (snapshot.counts.devTasks === void 0) {
      snapshot.counts.devTasks = devCounts(snapshot.tasks);
    }
  }
  for (const project of projects) {
    if (project.stats !== void 0) continue;
    const bases = snapshot.bases.filter((base) => base.repo === project.name);
    const tasks = snapshot.tasks.filter((task) => task.kind !== "accept" && (task.repos ?? []).includes(project.name));
    const activeAgents = snapshot.agents.filter(
      (agent) => agent.status === "running" && snapshot.tasks.some((task) => task.id === agent.taskId && (task.repos ?? []).includes(project.name))
    ).length;
    project.stats = { activeAgents, baseSlots: baseCounts(bases), devTasks: devCounts(tasks) };
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
function SettingsForm({ ui, view, call, t }) {
  const [draft, setDraft] = useState2(null);
  const [catalog, setCatalog] = useState2(null);
  const [catalogError, setCatalogError] = useState2("");
  const [routeSession, setRouteSession] = useState2(void 0);
  const [message, setMessage] = useState2("");
  useEffect2(() => {
    if (view === "summary") return void 0;
    const controller = new AbortController();
    call("settings-get", {}, controller.signal).then((value) => setDraft(value)).catch((reason) => setMessage(reason instanceof Error ? reason.message : String(reason)));
    call("subagent-routes", {}, controller.signal).then((value) => {
      const routes = value;
      if (routes.providers?.some((provider) => provider.models.length > 0)) {
        setCatalog(routes);
        setRouteSession(routes.sessionId ?? null);
        return void 0;
      }
      return call("models-list", {}, controller.signal).then((fallback) => setCatalog(fallback));
    }).catch(() => call("models-list", {}, controller.signal).then((fallback) => setCatalog(fallback)).catch((reason) => setCatalogError(reason instanceof Error ? reason.message : String(reason))));
    return () => controller.abort();
  }, [view, call]);
  if (view === "summary") return /* @__PURE__ */ React.createElement("span", { className: "df-meta" }, t("settings.summary"));
  if (!draft) return /* @__PURE__ */ React.createElement("p", { className: "df-meta" }, message || "\u2026");
  const textFields = [
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
  } }, /* @__PURE__ */ React.createElement(
    ModelField,
    {
      ui,
      label: "\u5F00\u53D1\u4EFB\u52A1\u6A21\u578B",
      value: draft.devModel,
      catalog,
      error: catalogError,
      onChange: (next) => setDraft({ ...draft, devModel: next })
    }
  ), /* @__PURE__ */ React.createElement(
    ModelField,
    {
      ui,
      label: "\u9A8C\u6536\u4EFB\u52A1\u6A21\u578B",
      value: draft.acceptModel,
      catalog,
      error: catalogError,
      onChange: (next) => setDraft({ ...draft, acceptModel: next })
    }
  ), routeSession === void 0 ? null : /* @__PURE__ */ React.createElement("p", { className: "df-form-note" }, "\u6A21\u578B\u5217\u8868\u6765\u81EA\u6700\u8FD1\u4F1A\u8BDD", routeSession === null ? "" : ` ${routeSession}`, " \u7684\u53EF\u7528\u8DEF\u7531\uFF1B\u65B0\u4F1A\u8BDD\u53EF\u80FD\u4E0D\u540C\u3002"), textFields.map(([key, label]) => /* @__PURE__ */ React.createElement("label", { key, className: "df-field" }, label, /* @__PURE__ */ React.createElement("input", { value: draft[key] ?? "", onChange: (event) => setDraft({ ...draft, [key]: event.target.value }) }))), /* @__PURE__ */ React.createElement(ActionButton, { ui, type: "submit", variant: "primary" }, t("action.save")), message ? /* @__PURE__ */ React.createElement("p", { className: "df-form-note", role: "status" }, message) : null);
}
function modelChoiceOf(value) {
  if (value === null || value === void 0 || value === "") return null;
  if (typeof value === "string") return { provider: "", model: value, reasoningEffort: null };
  if (typeof value.model !== "string" || value.model === "") return null;
  return value;
}
function catalogEntry(catalog, choice) {
  if (choice === null || catalog === null) return void 0;
  for (const provider of catalog.providers) {
    if (choice.provider !== "" && provider.id !== choice.provider) continue;
    const model = provider.models.find((item) => item.id === choice.model);
    if (model !== void 0) return model;
  }
  return void 0;
}
function ModelChevron({ ui }) {
  const Icon = ui.IconChevronDownOutlineRegular;
  return Icon === void 0 ? /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u203A") : /* @__PURE__ */ React.createElement(Icon, { size: 12 });
}
function ModelField({ ui, label, value, catalog, error, onChange }) {
  const [open, setOpen] = useState2(null);
  const root = useRef2(null);
  useEffect2(() => {
    if (open === null) return void 0;
    const close = (event) => {
      if (root.current?.contains(event.target) === true) return;
      setOpen(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const choice = modelChoiceOf(value);
  const selected = catalogEntry(catalog, choice);
  const efforts = selected?.efforts ?? [];
  const effort = choice?.reasoningEffort === null || choice?.reasoningEffort === void 0 ? "\u6A21\u578B\u9ED8\u8BA4" : efforts.find((item) => item.id === choice.reasoningEffort)?.name ?? choice.reasoningEffort;
  const groups = catalog?.providers.filter((provider) => provider.models.length > 0) ?? [];
  return /* @__PURE__ */ React.createElement("div", { className: "df-field df-model-field", ref: root }, /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "df-model-trigger",
      "aria-haspopup": "listbox",
      "aria-expanded": open === "model",
      onClick: () => setOpen(open === "model" ? null : "model")
    },
    /* @__PURE__ */ React.createElement("span", { className: "df-model-value" }, selected?.name ?? choice?.model ?? "\u8DDF\u968F\u4E3B\u4F1A\u8BDD"),
    /* @__PURE__ */ React.createElement(ModelChevron, { ui })
  ), efforts.length > 0 ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "df-model-trigger",
      "aria-haspopup": "listbox",
      "aria-expanded": open === "effort",
      onClick: () => setOpen(open === "effort" ? null : "effort")
    },
    /* @__PURE__ */ React.createElement("span", { className: "df-model-hint" }, "\u63A8\u7406\u7B49\u7EA7"),
    /* @__PURE__ */ React.createElement("span", { className: "df-model-value" }, effort),
    /* @__PURE__ */ React.createElement(ModelChevron, { ui })
  ) : null, open === null ? null : /* @__PURE__ */ React.createElement("div", { className: "df-model-pop", role: "listbox", "aria-label": label }, open === "model" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      role: "option",
      "aria-selected": choice === null,
      className: "df-model-option",
      onClick: () => {
        onChange(null);
        setOpen(null);
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u8DDF\u968F\u4E3B\u4F1A\u8BDD"),
    choice === null ? /* @__PURE__ */ React.createElement("span", { className: "df-model-check" }, "\u2713") : null
  ), groups.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "df-model-error" }, error || "\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u6A21\u578B\u5217\u8868\uFF0C\u8BF7\u5B8C\u5168\u91CD\u542F DSH \u540E\u518D\u8BD5") : groups.map((provider) => /* @__PURE__ */ React.createElement("div", { key: provider.id, className: "df-model-group" }, /* @__PURE__ */ React.createElement("span", { className: "df-model-provider" }, provider.name), provider.models.map((model) => {
    const active = choice?.provider === provider.id && choice.model === model.id;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: `${provider.id}:${model.id}`,
        type: "button",
        role: "option",
        "aria-selected": active,
        className: "df-model-option",
        title: model.description ?? "",
        onClick: () => {
          onChange({ provider: provider.id, model: model.id, reasoningEffort: model.defaultEffort ?? null });
          setOpen(null);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "df-model-option-name" }, model.name),
      active ? /* @__PURE__ */ React.createElement("span", { className: "df-model-check" }, "\u2713") : null
    );
  })))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      role: "option",
      "aria-selected": choice?.reasoningEffort === null || choice?.reasoningEffort === void 0,
      className: "df-model-option",
      onClick: () => {
        if (choice !== null) onChange({ ...choice, reasoningEffort: null });
        setOpen(null);
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u6A21\u578B\u9ED8\u8BA4"),
    choice?.reasoningEffort === null || choice?.reasoningEffort === void 0 ? /* @__PURE__ */ React.createElement("span", { className: "df-model-check" }, "\u2713") : null
  ), efforts.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.id,
      type: "button",
      role: "option",
      "aria-selected": choice?.reasoningEffort === item.id,
      className: "df-model-option",
      title: item.description ?? "",
      onClick: () => {
        if (choice !== null) onChange({ ...choice, reasoningEffort: item.id });
        setOpen(null);
      }
    },
    /* @__PURE__ */ React.createElement("span", { className: "df-model-option-name" }, item.name),
    choice?.reasoningEffort === item.id ? /* @__PURE__ */ React.createElement("span", { className: "df-model-check" }, "\u2713") : null
  )))));
}

// src/client/panel/Panel.tsx
var import_react4 = require("react");

// src/client/panel/parts.tsx
var import_react2 = require("react");

// src/client/panel/store.ts
var PREFIX = "dev-flow:panels:";
function storage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}
function readPaneLayout(group) {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + group);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || !Array.isArray(value.order)) return null;
    return {
      order: value.order.filter((key) => typeof key === "string"),
      sizes: value.sizes ?? {},
      collapsed: value.collapsed ?? {}
    };
  } catch {
    return null;
  }
}
function writePaneLayout(group, layout) {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(PREFIX + group, JSON.stringify(layout));
  } catch {
  }
}

// src/client/panel/ui.module.css
register("/* \u9762\u677F UI \u57FA\u7840\u4EF6\uFF1A\u9875\u5934\u3001\u5B50\u9762\u677F\u3001\u5217\u8868\u9879\u3001\u72B6\u6001\u3001\u952E\u503C\u4E0E\u8868\u5355\u3002\n   \u989C\u8272\u3001\u5706\u89D2\u3001\u5B57\u53F7\u5168\u90E8\u53D6 DSH \u8BED\u4E49\u53D8\u91CF\uFF0C\u4E0D\u5199\u5B57\u9762\u8272\u503C\u3002 */\n\n.df-pane-7d3126 {\n  position: absolute;\n  inset: 0;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  min-height: 0;\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  line-height: 20px;\n}\n\n/* \u2500\u2500 \u9875\u5934\uFF1A\u6587\u672C tab + \u65F6\u95F4 + \u5237\u65B0 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.df-head-7d3126 {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  flex: none;\n  height: 38px;\n  padding: 0 8px 0 16px;\n  border-bottom: 0.5px solid var(--dsw-alias-border-l3);\n}\n\n.df-tab-7d3126,\n.df-tabOn-7d3126 {\n  appearance: none;\n  border: 0;\n  flex: none;\n  padding: 0 10px;\n  height: 26px;\n  border-radius: var(--dsw-radius-sm, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 20px;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: color 0.1s ease, background 0.1s ease;\n}\n\n/* \u7B2C\u4E00\u4E2A tab \u7684\u5185\u8FB9\u8DDD\u62B5\u6D88\u6389\uFF0C\u8BA9\u6587\u5B57\u4E0E\u9875\u5934\u5DE6\u5185\u8FB9\u8DDD\uFF0816px\uFF09\u4E25\u683C\u5BF9\u9F50 */\n.df-tab-7d3126:first-of-type,\n.df-tabOn-7d3126:first-of-type {\n  margin-left: -10px;\n}\n\n.df-tab-7d3126:hover {\n  color: var(--dsw-alias-label-primary);\n}\n\n.df-tab-7d3126:focus-visible,\n.df-tabOn-7d3126:focus-visible {\n  outline: 1px solid var(--dsw-alias-border-l2);\n  outline-offset: 1px;\n}\n\n.df-tabOn-7d3126 {\n  color: var(--dsw-alias-label-primary);\n  font-weight: 500;\n}\n\n@media (hover: hover) {\n  .df-tab-7d3126:hover {\n    background: var(--dsw-alias-interactive-bg-hover);\n    color: var(--dsw-alias-label-primary);\n  }\n}\n\n.df-stamp-7d3126 {\n  margin-left: auto;\n  padding: 0 8px 0 12px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 16px;\n  font-variant-numeric: tabular-nums;\n}\n\n.df-iconButton-7d3126 {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: none;\n  width: 26px;\n  height: 26px;\n  border: 0;\n  border-radius: var(--dsw-radius-sm, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n}\n\n@media (hover: hover) {\n  .df-iconButton-7d3126:hover {\n    background: var(--dsw-alias-interactive-bg-hover);\n    color: var(--dsw-alias-label-primary);\n  }\n}\n\n/* \u2500\u2500 \u5B50\u9762\u677F \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.df-group-7d3126 {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow: hidden;\n}\n\n.df-panel-7d3126 {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  flex: 0 1 auto;\n  min-height: 0;\n  overflow: hidden;\n  border-top: 0.5px solid var(--dsw-alias-border-l3);\n}\n\n/* \u4E0A\u8FB9\u6846\u5C31\u662F\u62D6\u62FD\u624B\u67C4\uFF1A\u70ED\u533A\u76D6\u5728\u8FB9\u6846\u4E0A\u4E0B\u5404 4px\u3002 */\n.df-grip-7d3126 {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: -4px;\n  height: 9px;\n  z-index: 2;\n  cursor: row-resize;\n  background: transparent;\n}\n\n.df-grip-7d3126::after {\n  content: '';\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 4px;\n  height: 1px;\n  background: transparent;\n  transition: background-color 120ms ease;\n}\n\n@media (hover: hover) {\n  .df-grip-7d3126:hover::after {\n    background: var(--dsw-alias-border-l2);\n  }\n}\n\n.df-group-7d3126>.df-panel-7d3126:first-child {\n  border-top: 0;\n}\n\n.df-panelHead-7d3126 {\n  appearance: none;\n  outline: none;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  width: auto;\n  margin: 0 8px;\n  height: 24px;\n  padding: 0 8px;\n  border: 0;\n  border-radius: 0;\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary);\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n  transition: color 120ms ease;\n}\n\n/* \u53EA\u9760\u58A8\u8272\u4E0E\u7BAD\u5934\u53D8\u6DF1\u8868\u793A\u53EF\u70B9\uFF1A\u6574\u884C\u94FA\u5E95\u8272\u4F1A\u50CF\u201C\u88AB\u9009\u4E2D\u201D\uFF0C\u592A\u91CD */\n@media (hover: hover) {\n  .df-panelHead-7d3126:hover {\n    color: var(--dsw-alias-label-secondary);\n  }\n\n  .df-panelHead-7d3126:hover .df-headStatus-7d3126 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.df-panelChev-7d3126 {\n    color: var(--dsw-alias-label-secondary);\n  }\n}\n\n.df-panelHead-7d3126:active {\n  color: var(--dsw-alias-label-primary);\n}\n\n/* \u6807\u9898\u4E0A\u4E0D\u753B\u4EFB\u4F55\u76D2\u5B50\uFF1A\u65E0\u5E95\u8272\u3001\u65E0\u63CF\u8FB9\u3001\u65E0\u5706\u89D2 */\n.df-panelHead-7d3126::before,\n.df-panelHead-7d3126::after {\n  content: none;\n}\n\n/* \u70B9\u51FB\u540E\u4E0D\u8981\u7559\u4E0B\u4E00\u4E2A\u65B9\u6846\uFF1A\u9F20\u6807\u70B9\u51FB\u7ED9 background \u53CD\u9988\uFF0C\u952E\u76D8\u805A\u7126\u624D\u663E\u793A\u6D45\u5E95\u3002\n   \u5BBF\u4E3B\u9875\u9762\u7ED9 button \u7684 :focus-visible \u63CF\u8FB9\u4F18\u5148\u7EA7\u66F4\u9AD8\uFF0C\u8FD9\u91CC\u663E\u5F0F\u538B\u6389\u3002 */\n.df-panelHead-7d3126:focus,\n.df-panelHead-7d3126:focus-visible,\n.df-panelHead-7d3126:focus-within {\n  outline: none !important;\n  box-shadow: none !important;\n}\n\n.df-panelHead-7d3126:focus-visible {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.df-panelTitle-7d3126 {\n  font-size: 13px;\n  font-weight: 400;\n  white-space: nowrap;\n}\n\n.df-panelCount-7d3126 {\n  color: inherit;\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n}\n\n.df-panelTail-7d3126 {\n  margin-left: auto;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.df-headStatus-7d3126 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.df-panelChev-7d3126 {\n  display: inline-flex;\n  color: var(--dsw-alias-label-tertiary);\n  transform: rotate(0deg);\n  transition: transform 120ms ease;\n}\n\n.df-panelOpen-7d3126 .df-headStatus-7d3126 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n  line-height: 16px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.df-panelOpen-7d3126 .df-panelChev-7d3126 {\n  transform: rotate(90deg);\n}\n\n.df-panelBody-7d3126 {\n  flex: 1;\n  min-height: 0;\n  overflow: auto;\n  padding-bottom: 4px;\n}\n\n.df-panelCollapsed-7d3126 .df-panelBody-7d3126 {\n  display: none;\n}\n\n.df-panelOpen-7d3126 {\n  flex-grow: 1;\n}\n\n.df-sash-7d3126 {\n  flex: none;\n  height: 9px;\n  cursor: row-resize;\n  position: relative;\n}\n\n.df-sash-7d3126::after {\n  content: '';\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 3px;\n  height: 1px;\n  background: transparent;\n}\n\n@media (hover: hover) {\n  .df-sash-7d3126:hover::after {\n    background: var(--dsw-alias-border-l2);\n  }\n}\n\n.df-sashActive-7d3126::after {\n  background: var(--dsw-alias-border-l2);\n}\n\n/* \u2500\u2500 \u5217\u8868\u9879 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.df-item-7d3126 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  height: 38px;\n  padding: 0 16px;\n  border-radius: var(--dsw-radius-sm, 6px);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* \u53EF\u70B9\u7684\u884C\u4E00\u5B9A\u6709\u53CD\u9988\uFF1A\u6307\u9488 + \u60AC\u505C\u5E95\u8272\uFF0C\u5426\u5219\u7528\u6237\u4E0D\u77E5\u9053\u80FD\u70B9\u3002 */\n.df-item-7d3126[role='button'] {\n  cursor: pointer;\n}\n\n.df-item-7d3126[role='button']:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-l2);\n  outline-offset: -2px;\n}\n\n@media (hover: hover) {\n  .df-item-7d3126[role='button']:hover {\n    background: var(--dsw-alias-interactive-bg-hover);\n  }\n}\n\n.df-itemSub-7d3126 {\n  height: 30px;\n  padding-left: 44px;\n  font-size: 12px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n@media (hover: hover) {\n  .df-item-7d3126:hover {\n    background: var(--dsw-alias-interactive-bg-hover);\n  }\n}\n\n.df-itemOn-7d3126 {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n.df-icon-7d3126 {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: none;\n  width: 20px;\n  height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.df-name-7d3126 {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  flex: 1;\n  min-width: 0;\n  white-space: nowrap;\n  overflow: hidden;\n}\n\n.df-nameText-7d3126 {\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.df-itemHint-7d3126 {\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.df-suffix-7d3126 {\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  font-family: var(--dsw-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n.df-trail-7d3126 {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  flex: none;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  white-space: nowrap;\n}\n\n.df-pair-7d3126 {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 5px;\n}\n\n.df-pairLabel-7d3126 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n}\n\n.df-pairValue-7d3126 {\n  color: var(--dsw-alias-label-primary);\n  font-size: 13px;\n  font-weight: 500;\n  font-variant-numeric: tabular-nums;\n}\n\n/* \u2500\u2500 \u72B6\u6001\uFF1A\u706F + \u8BCD \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.df-status-7d3126 {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  white-space: nowrap;\n}\n\n.df-lamp-7d3126 {\n  position: relative;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  flex: none;\n  background: var(--dsw-alias-label-tertiary);\n}\n\n.df-lampOk-7d3126 { background: var(--dsw-alias-state-success-primary); }\n.df-lampWarn-7d3126 { background: var(--dsw-alias-state-warn-primary); }\n.df-lampErr-7d3126 { background: var(--dsw-alias-state-error-primary); }\n.df-lampIdle-7d3126 { background: var(--dsw-alias-label-tertiary); }\n\n.df-lampRun-7d3126 {\n  width: 7px;\n  height: 7px;\n  background: var(--dsw-alias-state-business-primary);\n  animation: breathe 1.9s ease-in-out infinite;\n}\n\n.df-lampRun-7d3126::after {\n  content: '';\n  position: absolute;\n  inset: -2px;\n  border-radius: 50%;\n  background: var(--dsw-alias-state-business-primary);\n  opacity: 0.22;\n}\n\n@keyframes breathe {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.45; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .df-lampRun-7d3126 { animation: none; }\n}\n\n/* \u2500\u2500 \u6307\u6807\u4E0E\u8BF4\u660E \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.df-metrics-7d3126 {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 14px 10px;\n  padding: 14px 16px 14px;\n}\n\n.df-metric-7d3126 {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.df-metricValue-7d3126 {\n  font-size: 22px;\n  line-height: 28px;\n  font-weight: 500;\n  font-variant-numeric: tabular-nums;\n}\n\n.df-metricLabel-7d3126 {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n}\n\n.df-note-7d3126 {\n  padding: 0 16px 8px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n\n.df-pane-7d3126,\n.df-pane-7d3126 * {\n  box-sizing: border-box;\n}\n\n.df-empty-7d3126 {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  min-height: 96px;\n  padding: 24px 16px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 18px;\n  text-align: center;\n}\n\n.df-emptyIcon-7d3126 {\n  display: inline-flex;\n  color: var(--dsw-alias-label-tertiary);\n  opacity: 0.9;\n}\n\n.df-noteIndent-7d3126 {\n  padding: 2px 16px 6px 44px;\n  line-height: 18px;\n}\n\n.df-disclosure-7d3126 {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: none;\n  width: 20px;\n  height: 20px;\n  margin: -2px;\n  padding: 0;\n  border: 0;\n  border-radius: var(--dsw-radius-sm, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary);\n  cursor: pointer;\n}\n\n@media (hover: hover) {\n  .df-disclosure-7d3126:hover {\n    background: var(--dsw-alias-interactive-bg-hover);\n    color: var(--dsw-alias-label-secondary);\n  }\n}\n\n.df-disclosure-7d3126:focus-visible {\n  outline: 1px solid var(--dsw-alias-border-l3);\n  outline-offset: 1px;\n}\n\n.df-disclosureOpen-7d3126,\n.df-disclosureClosed-7d3126 {\n  display: inline-flex;\n  transition: transform 120ms ease;\n}\n\n.df-disclosureClosed-7d3126 {\n  transform: rotate(0deg);\n}\n\n.df-disclosureOpen-7d3126 {\n  transform: rotate(90deg);\n}\n\n.df-progress-7d3126 {\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  font-variant-numeric: tabular-nums;\n}\n\n.df-detail-7d3126 {\n  padding: 2px 16px 12px;\n}\n\n.df-detailHead-7d3126 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 4px 0 8px;\n}\n\n/* \u8BE6\u60C5\u6807\u9898\u524D\u7684\u7C7B\u578B\u56FE\u6807\uFF1A\u4E0E\u5217\u8868\u884C\u540C\u6B3E\uFF0C\u5C3A\u5BF8\u5BF9\u9F50 13px \u6587\u5B57 */\n.df-detailHeadIcon-7d3126 {\n  flex: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 18px;\n  height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.df-detailHeadTitle-7d3126 {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 13px;\n  line-height: 20px;\n  font-weight: 500;\n  color: var(--dsw-alias-label-primary);\n}\n\n.df-kvGrid-7d3126 {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  column-gap: 24px;\n}\n\n.df-kvRow-7d3126 {\n  display: flex;\n  gap: 12px;\n  align-items: baseline;\n  min-height: 26px;\n  padding: 3px 0;\n}\n\n.df-kvLabel-7d3126 {\n  flex: none;\n  width: 44px;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.df-kvValue-7d3126 {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  overflow-wrap: anywhere;\n}\n\n.df-fileList-7d3126 {\n  margin-top: 10px;\n}\n\n.df-alert-7d3126 {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  margin: 2px 0 10px;\n  padding: 9px 10px;\n  /* \u5DE6\u4FA7 2px \u72B6\u6001\u8272\u7AD6\u6761 + \u4E00\u5708\u53D1\u4E1D\u63CF\u8FB9\uFF1A\u4E0D\u9760\u5E95\u8272\u4E5F\u80FD\u4E00\u773C\u770B\u89C1 */\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-left: 2px solid currentColor;\n  border-radius: var(--dsw-radius-sm, 6px);\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.df-alertIcon-7d3126 {\n  flex: none;\n  display: flex;\n  padding-top: 2px;\n}\n\n.df-alertBody-7d3126 {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n\n.df-alertLine-7d3126 {\n  font-size: 13px;\n  line-height: 20px;\n  color: var(--dsw-alias-label-primary);\n  word-break: break-word;\n}\n\n.df-detailList-7d3126 {\n  display: flex;\n  flex-direction: column;\n  margin: 2px 0 6px;\n}\n\n/* \u8BE6\u60C5\u91CC\u7684\u4EFB\u52A1\u884C\u548C\u5217\u8868\u9875\u5B8C\u5168\u540C\u4E00\u5957\uFF1A\u62B5\u6D88 .df-detail-7d3126 \u7684 16px \u5185\u8FB9\u8DDD\uFF0C\n   \u8BA9 38px \u7684 Item \u4E0E\u5217\u8868\u9875\u7684\u884C\u4E00\u6837\u8D34\u7740\u9762\u677F\u5DE6\u53F3\u8FB9\u754C\u3002 */\n.df-detailList-7d3126 > * {\n  margin: 0 -16px;\n}\n\n.df-fileRow-7d3126 {\n  display: flex;\n  gap: 10px;\n  align-items: baseline;\n  min-height: 26px;\n  padding: 3px 0;\n}\n\n.df-filePath-7d3126 {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-family: var(--dsw-alias-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);\n  font-size: 11px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.df-fileAdd-7d3126 {\n  font-variant-numeric: tabular-nums;\n  font-size: 12px;\n  color: var(--dsw-alias-state-success-primary);\n}\n\n.df-fileDel-7d3126 {\n  font-variant-numeric: tabular-nums;\n  font-size: 12px;\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.df-emptyText-7d3126 {\n  margin: 0;\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--dsw-alias-state-error-primary);\n  text-align: center;\n  word-break: break-word;\n}\n");
var ui_default = { "pane": "df-pane-7d3126", "head": "df-head-7d3126", "tab": "df-tab-7d3126", "tabOn": "df-tabOn-7d3126", "stamp": "df-stamp-7d3126", "iconButton": "df-iconButton-7d3126", "group": "df-group-7d3126", "panel": "df-panel-7d3126", "grip": "df-grip-7d3126", "panelHead": "df-panelHead-7d3126", "headStatus": "df-headStatus-7d3126", "panelChev": "df-panelChev-7d3126", "panelTitle": "df-panelTitle-7d3126", "panelCount": "df-panelCount-7d3126", "panelTail": "df-panelTail-7d3126", "panelOpen": "df-panelOpen-7d3126", "panelBody": "df-panelBody-7d3126", "panelCollapsed": "df-panelCollapsed-7d3126", "sash": "df-sash-7d3126", "sashActive": "df-sashActive-7d3126", "item": "df-item-7d3126", "itemSub": "df-itemSub-7d3126", "itemOn": "df-itemOn-7d3126", "icon": "df-icon-7d3126", "name": "df-name-7d3126", "nameText": "df-nameText-7d3126", "itemHint": "df-itemHint-7d3126", "suffix": "df-suffix-7d3126", "trail": "df-trail-7d3126", "pair": "df-pair-7d3126", "pairLabel": "df-pairLabel-7d3126", "pairValue": "df-pairValue-7d3126", "status": "df-status-7d3126", "lamp": "df-lamp-7d3126", "lampOk": "df-lampOk-7d3126", "lampWarn": "df-lampWarn-7d3126", "lampErr": "df-lampErr-7d3126", "lampIdle": "df-lampIdle-7d3126", "lampRun": "df-lampRun-7d3126", "metrics": "df-metrics-7d3126", "metric": "df-metric-7d3126", "metricValue": "df-metricValue-7d3126", "metricLabel": "df-metricLabel-7d3126", "note": "df-note-7d3126", "empty": "df-empty-7d3126", "emptyIcon": "df-emptyIcon-7d3126", "noteIndent": "df-noteIndent-7d3126", "disclosure": "df-disclosure-7d3126", "disclosureOpen": "df-disclosureOpen-7d3126", "disclosureClosed": "df-disclosureClosed-7d3126", "progress": "df-progress-7d3126", "detail": "df-detail-7d3126", "detailHead": "df-detailHead-7d3126", "detailHeadIcon": "df-detailHeadIcon-7d3126", "detailHeadTitle": "df-detailHeadTitle-7d3126", "kvGrid": "df-kvGrid-7d3126", "kvRow": "df-kvRow-7d3126", "kvLabel": "df-kvLabel-7d3126", "kvValue": "df-kvValue-7d3126", "fileList": "df-fileList-7d3126", "alert": "df-alert-7d3126", "alertIcon": "df-alertIcon-7d3126", "alertBody": "df-alertBody-7d3126", "alertLine": "df-alertLine-7d3126", "detailList": "df-detailList-7d3126", "fileRow": "df-fileRow-7d3126", "filePath": "df-filePath-7d3126", "fileAdd": "df-fileAdd-7d3126", "fileDel": "df-fileDel-7d3126", "emptyText": "df-emptyText-7d3126" };

// src/client/panel/parts.tsx
var LAMP_CLASS = {
  ok: ui_default.lampOk,
  warn: ui_default.lampWarn,
  err: ui_default.lampErr,
  idle: ui_default.lampIdle,
  run: ui_default.lampRun
};
function Status({ tone, label }) {
  return /* @__PURE__ */ React.createElement("span", { className: ui_default.status }, /* @__PURE__ */ React.createElement("i", { className: `${ui_default.lamp} ${LAMP_CLASS[tone]}`, "aria-hidden": "true" }), label);
}
function Item({
  icon,
  title,
  suffix,
  trail,
  sub,
  onClick,
  selected,
  titleAttr,
  dataId
}) {
  const className = [ui_default.item, sub ? ui_default.itemSub : "", selected ? ui_default.itemOn : ""].filter(Boolean).join(" ");
  const body = /* @__PURE__ */ React.createElement(React.Fragment, null, icon === void 0 ? null : /* @__PURE__ */ React.createElement("span", { className: ui_default.icon }, icon), /* @__PURE__ */ React.createElement("span", { className: ui_default.name }, /* @__PURE__ */ React.createElement("span", { className: ui_default.nameText, title: titleAttr }, title), suffix === void 0 ? null : /* @__PURE__ */ React.createElement("span", { className: ui_default.suffix }, suffix)), trail === void 0 ? null : /* @__PURE__ */ React.createElement("span", { className: ui_default.trail }, trail));
  const dataAttr = dataId === void 0 ? {} : { "data-task-id": dataId };
  if (!onClick) return /* @__PURE__ */ React.createElement("div", { className, ...dataAttr }, body);
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className,
      ...dataAttr,
      role: "button",
      tabIndex: 0,
      onClick,
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }
    },
    body
  );
}
function Pairs({ items }) {
  const shown = items.filter((item) => item.value > 0);
  if (shown.length === 0) return null;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, shown.map((item) => /* @__PURE__ */ React.createElement("span", { key: item.label, className: ui_default.pair }, /* @__PURE__ */ React.createElement("span", { className: ui_default.pairLabel }, item.label), /* @__PURE__ */ React.createElement(
    "span",
    {
      className: ui_default.pairValue,
      style: item.tone === "err" ? { color: "var(--dsw-alias-state-error-primary)" } : void 0
    },
    item.value
  ))));
}
var HEAD = 24;
var MIN_BODY = 40;
function SplitGroup({ panes, footer, expandKey, expandSignal }) {
  const [sizes, setSizes] = (0, import_react2.useState)([]);
  const [layoutTick, setLayoutTick] = (0, import_react2.useState)(0);
  const [collapsed, setCollapsed] = (0, import_react2.useState)(() => panes.map((pane) => pane.collapsed === true));
  const [order, setOrder] = (0, import_react2.useState)(() => panes.map((_, index) => index));
  const bodies = (0, import_react2.useRef)([]);
  const panels = (0, import_react2.useRef)([]);
  const expanded = (0, import_react2.useRef)({});
  const avail = (0, import_react2.useRef)(0);
  const [, setResizing] = (0, import_react2.useState)(-1);
  const keys = panes.map((pane) => pane.key).join("|");
  const groupKey = `group:${keys}`;
  const orderRef = (0, import_react2.useRef)(order);
  const sizesRef = (0, import_react2.useRef)(sizes);
  const collapsedRef = (0, import_react2.useRef)(collapsed);
  orderRef.current = order;
  sizesRef.current = sizes;
  collapsedRef.current = collapsed;
  (0, import_react2.useEffect)(() => {
    setCollapsed((prev) => prev.length === panes.length ? prev : panes.map((pane, index) => prev[index] ?? pane.collapsed === true));
    setSizes((prev) => prev.length === panes.length ? prev : []);
    setLayoutTick((value) => value + 1);
  }, [panes.length]);
  const restored = (0, import_react2.useRef)(null);
  const pendingSizes = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    if (restored.current === groupKey) return;
    restored.current = groupKey;
    const saved = readPaneLayout(groupKey);
    if (!saved) return;
    const byKey = new Map(panes.map((pane, index) => [pane.key, index]));
    const nextOrder = [];
    for (const key of saved.order) {
      const index = byKey.get(key);
      if (index !== void 0 && !nextOrder.includes(index)) nextOrder.push(index);
    }
    for (let index = 0; index < panes.length; index += 1) {
      if (!nextOrder.includes(index)) nextOrder.push(index);
    }
    setOrder(nextOrder);
    setCollapsed(panes.map((pane) => saved.collapsed[pane.key] ?? pane.collapsed === true));
    pendingSizes.current = saved.sizes;
    setLayoutTick((value) => value + 1);
  }, [groupKey]);
  const persist = () => {
    const layout = {
      order: orderRef.current.map((index) => panes[index].key),
      sizes: {},
      collapsed: {}
    };
    const total = avail.current;
    panes.forEach((pane, index) => {
      const shut = collapsedRef.current[index] === true;
      layout.collapsed[pane.key] = shut;
      if (!shut && total > 0 && sizesRef.current[index]) {
        layout.sizes[pane.key] = Math.round(sizesRef.current[index] / total * 1e3) / 1e3;
      }
    });
    writePaneLayout(groupKey, layout);
  };
  (0, import_react2.useLayoutEffect)(() => {
    const host = panels.current[order[0]]?.parentElement;
    if (!host) return;
    const frame = requestAnimationFrame(() => {
      avail.current = host.clientHeight;
      const content = panes.map((_, index) => {
        if (collapsed[index]) return HEAD;
        const inner = bodies.current[index]?.scrollHeight ?? 0;
        const raw = HEAD + inner;
        return Math.max(HEAD + 20, raw > HEAD + 76 ? Math.ceil(raw / 38) * 38 : raw);
      });
      const saved = pendingSizes.current;
      if (saved) {
        pendingSizes.current = null;
        const next2 = panes.map((pane, index) => {
          if (collapsed[index]) return HEAD;
          const ratio = saved[pane.key];
          if (typeof ratio !== "number" || ratio <= 0) return content[index];
          return Math.max(HEAD + 20, Math.round(ratio * avail.current));
        });
        let excess2 = next2.reduce((sum, value) => sum + value, 0) - avail.current;
        while (excess2 > 0.5) {
          let widest = -1;
          let room = 0;
          for (let index = 0; index < next2.length; index += 1) {
            const spare = next2[index] - (HEAD + 20);
            if (!collapsed[index] && spare > room) {
              room = spare;
              widest = index;
            }
          }
          if (widest < 0 || room <= 0) break;
          const cut = Math.min(room, excess2);
          next2[widest] -= cut;
          excess2 -= cut;
        }
        setSizes(next2);
        return;
      }
      const total = content.reduce((sum, value) => sum + value, 0);
      const openOrder = order.filter((index) => collapsed[index] !== true);
      const tailIndex = openOrder[openOrder.length - 1];
      if (total <= avail.current) {
        const next2 = content.slice();
        for (let index = 0; index < next2.length; index += 1) {
          if (collapsed[index] === true) next2[index] = HEAD;
        }
        const open = next2.reduce((sum, value, index) => collapsed[index] ? sum : sum + value, 0);
        if (tailIndex !== void 0 && collapsed[tailIndex] !== true) {
          next2[tailIndex] += Math.max(0, avail.current - open);
        }
        setSizes(next2);
        return;
      }
      let remain = avail.current;
      const next = content.slice();
      for (let k = 0; k < order.length; k += 1) {
        const index = order[k];
        if (index === tailIndex) next[index] = Math.max(HEAD + 20, remain);
        else if (collapsed[index] === true) next[index] = HEAD;
        else next[index] = Math.max(HEAD + MIN_BODY, Math.floor(avail.current * content[index] / total / 38) * 38);
        remain -= next[index];
      }
      let excess = next.reduce((sum, value) => sum + value, 0) - avail.current;
      while (excess > 0.5) {
        let widest = -1;
        let room = 0;
        for (let k = 0; k < next.length; k += 1) {
          const spare = next[k] - (HEAD + (collapsed[k] ? 0 : 20));
          if (spare > room) {
            room = spare;
            widest = k;
          }
        }
        if (widest < 0 || room <= 0) break;
        const cut = Math.min(room, excess);
        next[widest] -= cut;
        excess -= cut;
      }
      setSizes(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [keys, layoutTick]);
  const floorOf = (index) => HEAD + (collapsed[index] ? 0 : MIN_BODY);
  const toggle = (index) => {
    const closing = collapsed[index] !== true;
    setSizes((prev) => {
      if (prev.length !== panes.length) return prev;
      const next = [...prev];
      if (closing) {
        expanded.current[index] = prev[index];
        next[index] = HEAD;
        return next;
      }
      let need = (expanded.current[index] ?? HEAD + 140) - HEAD;
      next[index] = HEAD;
      const spare = Math.max(0, avail.current - prev.reduce((sum, value) => sum + value, 0));
      const fromSpare = Math.min(need, spare);
      next[index] += fromSpare;
      need -= fromSpare;
      const position = order.indexOf(index);
      for (const at of [position + 1, position - 1]) {
        if (need <= 0) break;
        const neighbour = order[at];
        if (neighbour === void 0) continue;
        const take = Math.min(need, Math.max(0, next[neighbour] - floorOf(neighbour)));
        next[neighbour] -= take;
        next[index] += take;
        need -= take;
      }
      return next;
    });
    setCollapsed((prev) => prev.map((value, at) => at === index ? !value : value));
    requestAnimationFrame(persist);
  };
  (0, import_react2.useEffect)(() => {
    if (expandSignal === void 0 || expandSignal === 0 || expandKey === void 0) return;
    const index = panes.findIndex((pane) => pane.key === expandKey);
    if (index < 0 || collapsed[index] !== true) return;
    toggle(index);
  }, [expandSignal, expandKey]);
  const floorOfRef = (index) => HEAD + (collapsedRef.current[index] ? 0 : MIN_BODY);
  const beginResize = (top, bottom, event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const snapshot = [...sizesRef.current];
    if (snapshot.length !== panes.length) return;
    const startY = event.clientY;
    setResizing(top);
    const onMove = (moveEvent) => {
      const total = snapshot[top] + snapshot[bottom];
      const delta = moveEvent.clientY - startY;
      const size = Math.min(Math.max(snapshot[top] + delta, floorOfRef(top)), total - floorOfRef(bottom));
      setSizes((prev) => {
        const next = [...prev];
        next[top] = size;
        next[bottom] = total - size;
        return next;
      });
    };
    const onUp = () => {
      setResizing(-1);
      requestAnimationFrame(persist);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };
  const beginMove = (index, event) => {
    if (event.button !== 0) return;
    const button = event.currentTarget;
    const startY = event.clientY;
    let moved = false;
    const onMove = (moveEvent) => {
      if (!moved && Math.abs(moveEvent.clientY - startY) < 4) return;
      moved = true;
      const host = panels.current[index]?.parentElement;
      if (!host) return;
      const offset = moveEvent.clientY - host.getBoundingClientRect().top;
      const currentOrder = orderRef.current;
      let acc = 0;
      let target = 0;
      for (let k = 0; k < currentOrder.length; k += 1) {
        const at = currentOrder[k];
        const size = collapsedRef.current[at] ? HEAD : sizesRef.current[at] ?? 0;
        if (offset > acc + size / 2) target = k + 1;
        acc += size;
      }
      setOrder((prev) => {
        const position = prev.indexOf(index);
        let to = target;
        if (to > position) to -= 1;
        if (to === position) return prev;
        const next = [...prev];
        next.splice(position, 1);
        next.splice(to, 0, index);
        return next;
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!moved) {
        toggle(index);
        button.blur();
      } else {
        requestAnimationFrame(persist);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };
  const openList = order.filter((index) => collapsed[index] !== true);
  const view = order;
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.group }, view.map((index, position) => {
    const pane = panes[index];
    const isCollapsed = collapsed[index] === true;
    const size = sizes[index];
    const style = size === void 0 ? { flex: "1 1 0" } : {
      flexBasis: isCollapsed ? HEAD : size,
      // 展开块吃掉剩余高度；收起块固定 24px。
      flexGrow: !isCollapsed && index === openList[openList.length - 1] ? 1 : 0,
      flexShrink: isCollapsed ? 0 : 1
    };
    return /* @__PURE__ */ React.createElement(
      "section",
      {
        key: pane.key,
        className: `${ui_default.panel} ${isCollapsed ? ui_default.panelCollapsed : ui_default.panelOpen}`,
        style,
        ref: (node) => {
          panels.current[index] = node;
        }
      },
      position > 0 && !isCollapsed && collapsed[view[position - 1]] !== true && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: ui_default.grip,
          role: "separator",
          "aria-orientation": "horizontal",
          title: "\u62D6\u52A8\u8C03\u6574\u9AD8\u5EA6",
          onPointerDown: (event) => beginResize(view[position - 1], index, event)
        }
      ),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: ui_default.panelHead,
          "aria-expanded": !isCollapsed,
          onPointerDown: (event) => beginMove(index, event)
        },
        /* @__PURE__ */ React.createElement("span", { className: ui_default.panelTitle }, pane.title),
        pane.count === void 0 ? null : /* @__PURE__ */ React.createElement("span", { className: ui_default.panelCount }, pane.count),
        /* @__PURE__ */ React.createElement("span", { className: ui_default.panelTail }, pane.actions, /* @__PURE__ */ React.createElement("span", { className: ui_default.panelChev }, Chevron()))
      ),
      /* @__PURE__ */ React.createElement("div", { className: ui_default.panelBody, ref: (node) => {
        bodies.current[index] = node;
      } }, pane.content)
    );
  }), footer);
}
var Boundary = class extends React.Component {
  state = { message: null };
  static getDerivedStateFromError(error) {
    return { message: error instanceof Error ? error.message : String(error) };
  }
  render() {
    if (this.state.message !== null) {
      return /* @__PURE__ */ React.createElement("div", { className: ui_default.empty }, /* @__PURE__ */ React.createElement("p", { className: ui_default.emptyText }, this.state.message));
    }
    return this.props.children;
  }
};
function Alert({ items, tone = "warn" }) {
  if (items.length === 0) return null;
  const color = tone === "err" ? "var(--dsw-alias-state-error-primary)" : "var(--dsw-alias-state-warn-primary)";
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.alert, role: "status", style: { color } }, /* @__PURE__ */ React.createElement("span", { className: ui_default.alertIcon }, IconWarning()), /* @__PURE__ */ React.createElement("span", { className: ui_default.alertBody }, items.map((item, index) => /* @__PURE__ */ React.createElement("span", { key: `${index}:${item}`, className: ui_default.alertLine }, item))));
}
function Empty({ icon, text }) {
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.empty }, /* @__PURE__ */ React.createElement("span", { className: ui_default.emptyIcon }, icon ?? IconTray()), /* @__PURE__ */ React.createElement("span", null, text));
}
function Svg({ children, size = 16, viewBox = "0 0 16 16", strokeWidth = 1 }) {
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox,
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    children
  );
}
function Chevron() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 14, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "m9 18 6-6-6-6" }));
}
function IconDevTask() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 18, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }), /* @__PURE__ */ React.createElement("path", { d: "M10 12.5 8 15l2 2.5" }), /* @__PURE__ */ React.createElement("path", { d: "m14 12.5 2 2.5-2 2.5" }));
}
function IconAcceptTask() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 18, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "m13 13.5 2-2.5-2-2.5" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }), /* @__PURE__ */ React.createElement("path", { d: "M9 8.5 7 11l2 2.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }));
}
function IconRepo() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 18, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "M10 10.5 8 13l2 2.5" }), /* @__PURE__ */ React.createElement("path", { d: "m14 10.5 2 2.5-2 2.5" }), /* @__PURE__ */ React.createElement("path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" }));
}
function IconAgent() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 18, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "M12 8V4H8" }), /* @__PURE__ */ React.createElement("path", { d: "M2 14h2" }), /* @__PURE__ */ React.createElement("path", { d: "M20 14h2" }), /* @__PURE__ */ React.createElement("path", { d: "M15 13v2" }), /* @__PURE__ */ React.createElement("path", { d: "M9 13v2" }), /* @__PURE__ */ React.createElement("path", { d: "M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2" }));
}
function IconChat() {
  return /* @__PURE__ */ React.createElement(Svg, null, /* @__PURE__ */ React.createElement("path", { d: "M3.6 5.2a1.6 1.6 0 0 1 1.6-1.6h5.6a1.6 1.6 0 0 1 1.6 1.6v3.2a1.6 1.6 0 0 1-1.6 1.6H7l-2.6 2v-2H5.2a1.6 1.6 0 0 1-1.6-1.6Z" }));
}
function IconTray() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 28 }, /* @__PURE__ */ React.createElement("path", { d: "M3.2 9.2h2.6l1.2 2h4l1.2-2h2.6" }), /* @__PURE__ */ React.createElement("path", { d: "M3.2 9.2 5 4.9A1.4 1.4 0 0 1 6.3 4h5.4a1.4 1.4 0 0 1 1.3.9l1.8 4.3v4.2a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4Z" }));
}
function IconWarning() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 16, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }), /* @__PURE__ */ React.createElement("path", { d: "M12 9v4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 17h.01" }));
}
function IconSchedule() {
  return /* @__PURE__ */ React.createElement(Svg, { size: 18, viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "m3 17 2 2 4-4" }), /* @__PURE__ */ React.createElement("path", { d: "m3 7 2 2 4-4" }), /* @__PURE__ */ React.createElement("path", { d: "M13 6h8" }), /* @__PURE__ */ React.createElement("path", { d: "M13 12h8" }), /* @__PURE__ */ React.createElement("path", { d: "M13 18h8" }));
}
function IconRefresh() {
  return /* @__PURE__ */ React.createElement(Svg, { viewBox: "0 0 24 24", strokeWidth: 1.5 }, /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), /* @__PURE__ */ React.createElement("path", { d: "M21 3v5h-5" }), /* @__PURE__ */ React.createElement("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), /* @__PURE__ */ React.createElement("path", { d: "M8 16H3v5" }));
}

// src/client/panel/Tasks.tsx
var import_react3 = require("react");

// src/client/panel/status.ts
var TONES = {
  developing: "run",
  running: "run",
  accepting: "run",
  scheduling: "run",
  dispatched: "ok",
  "pending-acceptance": "ok",
  accepted: "ok",
  merged: "ok",
  "pending-merge": "warn",
  busy: "warn",
  failed: "err",
  rejected: "err",
  waiting: "idle",
  paused: "idle",
  stopped: "idle",
  idle: "idle",
  "awaiting-agent": "idle",
  abandoned: "idle",
  review: "idle"
};
function toneOf(status) {
  return TONES[status] ?? "idle";
}
function statusText(t, status) {
  const key = `status.${status}`;
  const text = t(key);
  return text === key ? status : text;
}
var ORDER = {
  failed: 0,
  "pending-acceptance": 1,
  "pending-merge": 2,
  developing: 3,
  waiting: 4,
  paused: 5
};
var CLOSED = /* @__PURE__ */ new Set(["accepted", "merged", "abandoned", "stopped"]);
function isOpenTask(status) {
  return !CLOSED.has(status);
}
function openTaskOrder(status) {
  return ORDER[status] ?? 9;
}

// src/client/panel/Tasks.tsx
function usageText(usage) {
  if (!usage || usage.totalTokens <= 0) return "";
  if (usage.totalTokens >= 1e3) return `${(usage.totalTokens / 1e3).toFixed(1)}k`;
  return String(usage.totalTokens);
}
function slotText(task) {
  const entries = Object.entries(task.slots ?? {});
  if (entries.length > 0) return entries.map(([repo, slot]) => `${repo}/${slot.number ?? ""}`).join("\u3000");
  return (task.repos ?? []).join("\u3000");
}
function Tasks({ data, t, call, sessionId, focus }) {
  const [picked, setPicked] = (0, import_react3.useState)(null);
  const [diff, setDiff] = (0, import_react3.useState)(null);
  const [pickTick, setPickTick] = (0, import_react3.useState)(0);
  const tasks = data.tasks ?? [];
  const schedules = data.schedules ?? [];
  const newest = (a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
  const dev = tasks.filter((task) => task.kind !== "accept").sort((a, b) => openTaskOrder(a.status) - openTaskOrder(b.status) || newest(a, b));
  const accept = tasks.filter((task) => task.kind === "accept").sort((a, b) => (a.status === "accepting" ? 0 : 1) - (b.status === "accepting" ? 0 : 1) || newest(a, b));
  const pickedTask = picked?.kind === "task" ? picked.task : null;
  const pickedSchedule = picked?.kind === "schedule" ? picked.schedule : null;
  const pickedId = picked?.kind === "task" ? picked.task.id : picked?.schedule.id ?? null;
  (0, import_react3.useEffect)(() => {
    setDiff(null);
    if (!pickedTask || pickedTask.kind === "accept") return void 0;
    let alive = true;
    call("task-diff", { sessionId, taskId: pickedTask.id }).then((value) => {
      if (alive) setDiff(value ?? null);
    }).catch(() => {
      if (alive) setDiff(null);
    });
    return () => {
      alive = false;
    };
  }, [pickedTask?.id, pickedTask?.kind, sessionId, call]);
  (0, import_react3.useEffect)(() => {
    if (!focus) return;
    const task = (data.tasks ?? []).find((item) => item.id === focus.id);
    if (task) pickTask(task);
  }, [focus?.tick]);
  const pickTask = (task) => {
    const full = tasks.find((item) => item.id === task.id) ?? task;
    setPicked({ kind: "task", task: full });
    setPickTick((value) => value + 1);
  };
  const pickSchedule = (schedule) => {
    setPicked({ kind: "schedule", schedule });
    setPickTick((value) => value + 1);
  };
  const panes = [
    {
      key: "schedule",
      title: t("section.scheduleTasks"),
      count: schedules.length,
      actions: /* @__PURE__ */ React.createElement("span", { className: ui_default.headStatus }, /* @__PURE__ */ React.createElement(
        Status,
        {
          tone: "ok",
          label: `${t("section.scheduleEvery")}\u3000${t("fact.concurrency")} ${data.counts.activeAgents}/${data.counts.agentLimit}`
        }
      )),
      content: /* @__PURE__ */ React.createElement(SchedulePane, { schedules, t, pickedId, onPick: pickSchedule })
    },
    {
      key: "dev",
      title: t("section.devTasks"),
      count: dev.length,
      content: dev.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: t("section.emptyDev") }) : dev.map((task) => /* @__PURE__ */ React.createElement(
        DevRow,
        {
          key: task.id,
          task,
          t,
          selected: pickedTask?.id === task.id,
          onSelect: () => pickTask(task)
        }
      ))
    },
    {
      key: "accept",
      title: t("section.acceptTasks"),
      count: accept.length,
      content: accept.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: t("section.emptyAccept") }) : accept.map((batch) => /* @__PURE__ */ React.createElement(
        AcceptRow,
        {
          key: batch.id,
          batch,
          tasks,
          t,
          selected: pickedTask?.id === batch.id,
          onSelect: () => pickTask(batch)
        }
      ))
    },
    {
      key: "detail",
      title: t("action.detail"),
      content: pickedTask ? /* @__PURE__ */ React.createElement(
        DetailPane,
        {
          task: pickedTask,
          diff,
          t,
          onPick: pickTask,
          contained: pickedTask.kind === "accept" ? containedTasks(tasks, pickedTask) : void 0
        }
      ) : pickedSchedule ? /* @__PURE__ */ React.createElement(ScheduleDetail, { schedule: pickedSchedule, t }) : /* @__PURE__ */ React.createElement(Empty, { text: t("section.emptyDetail") })
    }
  ];
  return /* @__PURE__ */ React.createElement(SplitGroup, { panes, expandKey: "detail", expandSignal: pickTick });
}
function SchedulePane({
  schedules,
  t,
  pickedId,
  onPick
}) {
  if (schedules.length === 0) return /* @__PURE__ */ React.createElement(Empty, { text: t("section.emptySchedule") });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, schedules.map((schedule) => {
    const target = schedule.slots?.[0];
    return /* @__PURE__ */ React.createElement(
      Item,
      {
        key: schedule.id,
        icon: /* @__PURE__ */ React.createElement("span", { className: ui_default.suffix }, schedule.baseGroup ?? "\xB7"),
        title: schedule.title,
        titleAttr: schedule.title,
        suffix: target ? [target.repo, target.number].filter(Boolean).join("/") : void 0,
        trail: /* @__PURE__ */ React.createElement(Status, { tone: toneOf(schedule.status), label: statusText(t, schedule.status) }),
        selected: pickedId === schedule.id,
        onClick: () => onPick(schedule)
      }
    );
  }));
}
function DevRow({
  task,
  t,
  selected,
  onSelect
}) {
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      icon: /* @__PURE__ */ React.createElement(IconDevTask, null),
      title: task.title,
      titleAttr: task.title,
      suffix: slotText(task),
      trail: /* @__PURE__ */ React.createElement(Status, { tone: toneOf(task.status), label: statusText(t, task.status) }),
      selected,
      onClick: onSelect
    }
  );
}
function AcceptRow({
  batch,
  tasks,
  t,
  selected,
  onSelect
}) {
  const contained = containedTasks(tasks, batch);
  const passed = contained.filter((task) => task.status === "accepted" || task.acceptance === "accepted").length;
  const total = contained.length || (batch.taskIds ?? []).length;
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      icon: /* @__PURE__ */ React.createElement(IconAcceptTask, null),
      title: batch.title,
      titleAttr: batch.title,
      trail: /* @__PURE__ */ React.createElement("span", { className: ui_default.progress }, `${passed}/${total}`),
      selected,
      onClick: onSelect
    }
  );
}
function containedTasks(tasks, batch) {
  const ids = batch.taskIds ?? [];
  const fromIds = ids.map((id) => tasks.find((task) => task.kind !== "accept" && task.id === id)).filter((task) => task !== void 0);
  const rows = fromIds.length > 0 ? fromIds : tasks.filter((task) => task.kind !== "accept" && task.batchId === batch.id);
  return rows.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}
function kv(label, value) {
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.kvRow }, /* @__PURE__ */ React.createElement("span", { className: ui_default.kvLabel }, label), /* @__PURE__ */ React.createElement("span", { className: ui_default.kvValue }, value));
}
function fileList(files, t) {
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.fileList }, files.map((file) => /* @__PURE__ */ React.createElement("div", { key: `${file.repo}:${file.path}`, className: ui_default.fileRow }, /* @__PURE__ */ React.createElement("span", { className: ui_default.filePath }, file.binary ? `${file.path}\uFF08binary\uFF09` : file.path), /* @__PURE__ */ React.createElement("span", { className: ui_default.fileAdd }, `+${file.added}`), /* @__PURE__ */ React.createElement("span", { className: ui_default.fileDel }, `-${file.deleted}`))));
}
function DetailPane({ task, diff, t, contained, onPick }) {
  const files = diff?.files ?? [];
  const entries = Object.entries(task.bases ?? {});
  const base = entries.length > 0 ? entries.map(([repo, branch]) => `${repo} ${branch}`).join("\u3000") : task.base ?? "\u2014";
  const isBatch = task.kind === "accept";
  const deps = task.dependsOn ?? [];
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.detail }, /* @__PURE__ */ React.createElement("div", { className: ui_default.detailHead }, /* @__PURE__ */ React.createElement("span", { className: ui_default.detailHeadIcon }, isBatch ? /* @__PURE__ */ React.createElement(IconAcceptTask, null) : /* @__PURE__ */ React.createElement(IconDevTask, null)), /* @__PURE__ */ React.createElement("span", { className: ui_default.detailHeadTitle, title: task.title }, task.title), /* @__PURE__ */ React.createElement(Status, { tone: toneOf(task.status), label: statusText(t, task.status) })), task.warnings && task.warnings.length > 0 ? /* @__PURE__ */ React.createElement(Alert, { items: task.warnings }) : null, /* @__PURE__ */ React.createElement("div", { className: ui_default.kvGrid }, kv(t("fact.slot"), slotText(task) || "\u2014"), kv(t("fact.branch"), Object.values(task.slots ?? {})[0]?.branch || "\u2014"), kv(t("fact.base"), base), kv(t("fact.usage"), usageText(task.usage) || "\u2014"), task.pausedAt ? kv(t("fact.paused"), task.pausedAt) : null, task.stoppedAt ? kv(t("fact.stopped"), task.stoppedAt) : null, isBatch && contained && contained.length > 0 ? kv(t("section.devTasks"), String(contained.length)) : null, !isBatch && deps.length > 0 ? kv(t("fact.depends"), String(deps.length)) : null, files.length > 0 ? kv(t("fact.changeFiles"), String(files.length)) : null), isBatch && contained && contained.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: ui_default.detailList }, contained.map((child) => /* @__PURE__ */ React.createElement(
    DevRow,
    {
      key: child.id,
      task: child,
      t,
      selected: false,
      onSelect: () => onPick?.(child)
    }
  ))) : null, !isBatch && deps.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: ui_default.detailList }, deps.map((dep) => /* @__PURE__ */ React.createElement(
    Item,
    {
      key: dep.id,
      icon: /* @__PURE__ */ React.createElement(IconDevTask, null),
      title: dep.title,
      titleAttr: dep.title,
      suffix: dep.merged ? t("fact.merged") : t("fact.notMerged"),
      trail: /* @__PURE__ */ React.createElement(Status, { tone: toneOf(dep.status), label: statusText(t, dep.status) }),
      onClick: onPick ? () => onPick(dep) : void 0
    }
  ))) : null, files.length > 0 ? fileList(files, t) : null);
}
function ScheduleDetail({ schedule, t }) {
  const target = schedule.slots?.[0];
  const slots = (schedule.slots ?? []).map((slot) => [slot.repo, slot.number].filter(Boolean).join("/")).filter((value) => value !== "");
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.detail }, /* @__PURE__ */ React.createElement("div", { className: ui_default.detailHead }, /* @__PURE__ */ React.createElement("span", { className: ui_default.detailHeadIcon }, /* @__PURE__ */ React.createElement(IconSchedule, null)), /* @__PURE__ */ React.createElement("span", { className: ui_default.detailHeadTitle, title: schedule.title }, schedule.title), /* @__PURE__ */ React.createElement(Status, { tone: toneOf(schedule.status), label: statusText(t, schedule.status) })), /* @__PURE__ */ React.createElement("div", { className: ui_default.kvGrid }, kv(t("fact.base"), schedule.base ?? schedule.baseGroup ?? "\u2014"), kv(t("fact.slot"), slots.join("\u3000") || (target ? [target.repo, target.number].filter(Boolean).join("/") : "\u2014")), kv(t("fact.taskCount"), `${schedule.taskIds.length}`), kv(t("fact.usage"), usageText(schedule.usage) || "\u2014")));
}

// src/client/panel/Slots.tsx
function Slots({ data, t }) {
  const repos = data.repos ?? [];
  const tasks = new Map((data.tasks ?? []).map((task) => [task.id, task]));
  if (repos.length === 0) return /* @__PURE__ */ React.createElement(Empty, { text: t("slots.empty") });
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.group, style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
    SplitGroup,
    {
      panes: repos.map((repo) => {
        const used = repo.devSlots.filter((slot) => slot.taskId).length;
        const branch = repo.branch ?? repo.defaultBranch ?? "";
        return {
          key: `repo:${repo.name}`,
          title: repo.name,
          count: used,
          actions: /* @__PURE__ */ React.createElement("span", { className: ui_default.suffix }, branch, repo.dirty ? ` \xB7 ${t("metric.dirtyBases")}` : ""),
          content: /* @__PURE__ */ React.createElement(React.Fragment, null, repo.devSlots.map((slot) => {
            const task = slot.taskId ? tasks.get(slot.taskId) : void 0;
            return /* @__PURE__ */ React.createElement(
              Item,
              {
                key: `dev:${slot.number}`,
                icon: /* @__PURE__ */ React.createElement(IconDevTask, null),
                title: task ? task.title : t("status.idle"),
                titleAttr: task ? task.title : void 0,
                suffix: slot.branch ?? task?.repos?.[0],
                trail: task ? /* @__PURE__ */ React.createElement(Status, { tone: toneOf(task.status), label: statusText(t, task.status) }) : /* @__PURE__ */ React.createElement("span", { className: ui_default.suffix }, slot.number)
              }
            );
          }), acceptRow(repo, tasks, t), repo.devSlots.length === 0 && repo.acceptSlot === null ? /* @__PURE__ */ React.createElement(Empty, { text: t("slots.emptyRepo") }) : null)
        };
      })
    }
  ));
}
function acceptRow(repo, tasks, t) {
  const slot = repo.acceptSlot;
  if (slot === null) {
    return /* @__PURE__ */ React.createElement(
      Item,
      {
        key: "accept",
        icon: /* @__PURE__ */ React.createElement(IconAcceptTask, null),
        title: /* @__PURE__ */ React.createElement("span", { className: ui_default.itemHint }, t("status.none")),
        suffix: t("slots.accept"),
        trail: /* @__PURE__ */ React.createElement(Status, { tone: "idle", label: t("status.none") })
      }
    );
  }
  const batch = slot.batchId ? tasks.get(slot.batchId) : void 0;
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      key: "accept",
      icon: /* @__PURE__ */ React.createElement(IconAcceptTask, null),
      title: batch ? batch.title : t("slots.acceptFree"),
      titleAttr: batch ? batch.title : void 0,
      suffix: `:${slot.port ?? "\u2014"}`,
      trail: batch ? /* @__PURE__ */ React.createElement(Status, { tone: toneOf(batch.status), label: statusText(t, batch.status) }) : /* @__PURE__ */ React.createElement(Status, { tone: "idle", label: t("status.idle") })
    }
  );
}

// src/client/panel/Bases.tsx
var LOCATION = {
  root: { key: "bases.root", tone: "idle" },
  slot: { key: "bases.slot", tone: "idle" },
  busy: { key: "bases.busy", tone: "warn" },
  missing: { key: "bases.missing", tone: "err" },
  none: { key: "bases.none", tone: "idle" }
};
function Bases({ data, t }) {
  const groups = data.baseGroups ?? [];
  if (groups.length === 0) return /* @__PURE__ */ React.createElement(Empty, { text: t("bases.empty") });
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.group, style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
    SplitGroup,
    {
      panes: groups.map((group) => ({
        key: `group:${group.number}`,
        title: groupTitle(group),
        count: group.repos.length,
        content: group.repos.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: t("bases.emptyGroup") }) : group.repos.map((row) => memberRow(row, t))
      }))
    }
  ));
}
function memberRow(row, t) {
  const state = LOCATION[row.location] ?? LOCATION.none;
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      key: `${row.repo}:${row.branch}:${row.id}`,
      icon: /* @__PURE__ */ React.createElement(IconRepo, null),
      title: row.repo,
      titleAttr: `${row.repo} ${row.branch}`,
      suffix: row.branch,
      trail: /* @__PURE__ */ React.createElement(Status, { tone: state.tone, label: t(state.key) })
    }
  );
}
function groupTitle(group) {
  return `${group.number} ${group.label}`;
}
var BASE_ROW_HINT = ui_default.item;

// src/client/panel/Agents.tsx
function Agents({ data, t }) {
  const counts = data.counts;
  const agents = data.agents ?? [];
  const tasks = new Map((data.tasks ?? []).map((task) => [task.id, task]));
  const limit = counts.agentLimit ?? 0;
  const active = counts.activeAgents ?? 0;
  const accepting = agents.filter((agent) => agent.status === "accepting").length;
  const idle = Math.max(0, limit - active);
  const metrics = [
    {
      key: "running",
      value: /* @__PURE__ */ React.createElement(React.Fragment, null, active, /* @__PURE__ */ React.createElement("span", { className: ui_default.metricLabel, style: { fontSize: 13, marginLeft: 1 } }, `/${limit}`)),
      label: t("agents.running")
    },
    { key: "accepting", value: accepting, label: t("status.accepting") },
    { key: "idle", value: idle, label: t("status.idle") }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.group, style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { className: ui_default.metrics }, metrics.map((metric) => /* @__PURE__ */ React.createElement("div", { key: metric.key, className: ui_default.metric }, /* @__PURE__ */ React.createElement("span", { className: ui_default.metricValue }, metric.value), /* @__PURE__ */ React.createElement("span", { className: ui_default.metricLabel }, metric.label)))), /* @__PURE__ */ React.createElement(
    SplitGroup,
    {
      panes: [
        {
          key: "main",
          title: t("agents.main"),
          content: /* @__PURE__ */ React.createElement(
            Item,
            {
              icon: /* @__PURE__ */ React.createElement(IconChat, null),
              title: t("agents.mainHint"),
              titleAttr: t("agents.mainHint"),
              trail: /* @__PURE__ */ React.createElement(Status, { tone: "idle", label: t("agents.notCounted") })
            }
          )
        },
        {
          key: "sub",
          title: t("agents.sub"),
          count: agents.length,
          content: agents.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: t("agents.empty") }) : agents.map((agent) => agentRow(agent, tasks, t))
        }
      ]
    }
  ));
}
function agentRow(agent, tasks, t) {
  const task = agent.taskId ? tasks.get(agent.taskId) : agent.lastTaskId ? tasks.get(agent.lastTaskId) : void 0;
  const status = agent.status === "running" ? "running" : agent.status || "idle";
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      key: agent.id,
      icon: /* @__PURE__ */ React.createElement(IconAgent, null),
      title: agent.id,
      titleAttr: agent.id,
      suffix: task ? task.title : t("status.idle"),
      trail: /* @__PURE__ */ React.createElement(Status, { tone: toneOf(status), label: statusText(t, status) })
    }
  );
}

// src/client/panel/Panel.tsx
var PAGES = ["overview", "tasks", "slots", "bases", "agents"];
function textOf(value) {
  return value instanceof Error ? value.message : String(value);
}
function stamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function Panel({ sessionId, call, t }) {
  const [page, setPage] = (0, import_react4.useState)("overview");
  const [focus, setFocus] = (0, import_react4.useState)(null);
  const [data, setData] = (0, import_react4.useState)(null);
  const [error, setError] = (0, import_react4.useState)("");
  const [at, setAt] = (0, import_react4.useState)(() => /* @__PURE__ */ new Date());
  const alive = (0, import_react4.useRef)(true);
  (0, import_react4.useEffect)(() => () => {
    alive.current = false;
  }, []);
  const root = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    const node = root.current;
    if (!node) return;
    const onCapture = (event) => {
      const target = event.target;
      const row = target?.closest?.("[data-task-id]");
      if (!row) return;
      const id = row.getAttribute("data-task-id");
      if (!id) return;
      setFocus({ id, tick: Date.now() });
      setPage("tasks");
    };
    node.addEventListener("click", onCapture, true);
    return () => node.removeEventListener("click", onCapture, true);
  }, []);
  const load = (failure) => call("snapshot", { sessionId }).then((value) => {
    if (!alive.current) return;
    const snapshot = normalizeSnapshot(value);
    setData(snapshot);
    setAt(/* @__PURE__ */ new Date());
    setError(failure ? textOf(failure) : snapshot?.problem ?? "");
  }).catch((reason) => {
    if (alive.current) setError(textOf(reason));
  });
  (0, import_react4.useEffect)(() => {
    void load();
  }, [sessionId]);
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.pane, ref: root }, /* @__PURE__ */ React.createElement("div", { className: ui_default.head }, PAGES.map((id) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: id,
      type: "button",
      className: id === page ? ui_default.tabOn : ui_default.tab,
      "aria-current": id === page,
      onClick: () => setPage(id)
    },
    t(`page.${id}`)
  )), /* @__PURE__ */ React.createElement("span", { className: ui_default.stamp }, stamp(at)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: ui_default.iconButton,
      title: t("action.refresh"),
      "aria-label": t("action.refresh"),
      onClick: () => {
        void load();
      }
    },
    /* @__PURE__ */ React.createElement(IconRefresh, null)
  )), error === "" ? null : /* @__PURE__ */ React.createElement("p", { className: ui_default.note, role: "status" }, error), data === null ? null : data.initialized === false ? /* @__PURE__ */ React.createElement(Empty, { text: t("empty.init") }) : /* @__PURE__ */ React.createElement(Boundary, null, page === "overview" ? /* @__PURE__ */ React.createElement(Overview, { data, t, onOpenTask: (task) => {
    setFocus({ id: task.id, tick: Date.now() });
    setPage("tasks");
  } }) : page === "tasks" ? /* @__PURE__ */ React.createElement(Tasks, { data, t, call, sessionId, focus }) : page === "slots" ? /* @__PURE__ */ React.createElement(Slots, { data, t }) : page === "bases" ? /* @__PURE__ */ React.createElement(Bases, { data, t }) : /* @__PURE__ */ React.createElement(Agents, { data, t })));
}
function Overview({ data, t, onOpenTask }) {
  const tasks = (data.tasks ?? []).filter((task) => isOpenTask(task.status)).sort((a, b) => openTaskOrder(a.status) - openTaskOrder(b.status));
  const projects = data.projects ?? [];
  const counts = data.counts;
  const metrics = [
    { key: "projects", label: t("nav.projects"), value: counts.projects },
    {
      key: "agents",
      label: t("metric.agents"),
      value: /* @__PURE__ */ React.createElement(React.Fragment, null, counts.activeAgents, /* @__PURE__ */ React.createElement("span", { className: ui_default.metricLabel, style: { fontSize: 13, marginLeft: 1 } }, `/${counts.agentLimit ?? 0}`))
    },
    { key: "tasks", label: t("metric.devTasks"), value: counts.activeTasks },
    { key: "slots", label: t("metric.baseSlots"), value: counts.activeSlots },
    { key: "pending", label: t("status.pending-acceptance"), value: counts.pending },
    { key: "dirty", label: t("metric.dirtyBases"), value: counts.dirtyBases }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: ui_default.group, style: { overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { className: ui_default.metrics }, metrics.map((metric) => /* @__PURE__ */ React.createElement("div", { key: metric.key, className: ui_default.metric }, /* @__PURE__ */ React.createElement("span", { className: ui_default.metricValue }, metric.value), /* @__PURE__ */ React.createElement("span", { className: ui_default.metricLabel }, metric.label)))), /* @__PURE__ */ React.createElement(
    SplitGroup,
    {
      panes: [
        {
          key: "open",
          title: t("section.open"),
          count: tasks.length,
          content: tasks.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: t("overview.noTasks") }) : tasks.map((task) => /* @__PURE__ */ React.createElement(TaskItem, { key: task.id, task, t, onOpen: () => onOpenTask(task) }))
        },
        {
          key: "projects",
          title: t("nav.projects"),
          count: projects.length,
          content: projects.length === 0 ? /* @__PURE__ */ React.createElement(Empty, { text: t("overview.noTasks") }) : projects.map((project) => /* @__PURE__ */ React.createElement(ProjectItem, { key: project.name, project, tasks, t }))
        }
      ]
    }
  ));
}
function TaskItem({ task, t, onOpen }) {
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      icon: task.kind === "accept" ? /* @__PURE__ */ React.createElement(IconAcceptTask, null) : /* @__PURE__ */ React.createElement(IconDevTask, null),
      title: task.title,
      suffix: task.repos[0],
      trail: /* @__PURE__ */ React.createElement(Status, { tone: toneOf(task.status), label: statusText(t, task.status) }),
      titleAttr: `${task.title} \xB7 ${t("action.detail")}`,
      onClick: onOpen,
      dataId: task.id
    }
  );
}
var COUNT_ORDER = [
  { status: "developing", label: "status.developing" },
  { status: "waiting", label: "status.waiting" },
  { status: "pending-acceptance", label: "status.pending-acceptance" },
  { status: "pending-merge", label: "status.pending-merge" },
  { status: "failed", label: "status.failed", tone: "err" }
];
function ProjectItem({ project, tasks, t }) {
  const mine = tasks.filter((task) => task.repos.includes(project.name));
  const pairs = COUNT_ORDER.map((entry) => ({
    label: t(entry.label),
    value: mine.filter((task) => task.status === entry.status).length,
    tone: entry.tone
  }));
  return /* @__PURE__ */ React.createElement(
    Item,
    {
      icon: /* @__PURE__ */ React.createElement(IconRepo, null),
      title: project.name,
      titleAttr: project.path ?? project.name,
      trail: /* @__PURE__ */ React.createElement(Pairs, { items: pairs })
    }
  );
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

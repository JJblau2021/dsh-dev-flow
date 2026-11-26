import { all as allCss } from 'dev-flow:css-registry'

export const PANEL_STYLE_ID = 'dev-flow-panel'

export const panelSheet = `
/* 基础：所有颜色走主题变量，深浅色都跟 DSH 走 */
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

/* 顶部工具条与筛选 */
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

/* 分区标题 */
.df-section { margin: 4px 0 0; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; color: var(--dsw-alias-label-tertiary); }
/* 概览折叠面板：复用任务页 .df-view 的折叠头，仅覆写概览需要的布局 */
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

/* 概览：整页滚动，项目筛选，三格指标 */
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

/* 项目概览 */
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

/* 概览任务行 */
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

/* 列表：通栏、发丝分隔，不用卡片框 */
.df-card { border: 0; border-radius: 0; background: transparent; }
.df-line, .df-agent { display: grid; align-items: center; gap: 8px 10px; padding: 8px 16px; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-line { grid-template-columns: minmax(0, 1fr) auto; }
.df-agent { grid-template-columns: auto minmax(0, 1fr) auto; }
.df-line:hover, .df-agent:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }

/* 任务行 */
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

/* 任务行 */
.df-tree { display: flex; flex-direction: column; gap: 2px; width: 100%; box-sizing: border-box; border-bottom: 0.5px solid var(--dsw-alias-border-l2); transition: background-color 120ms ease; }
.df-fact { display: grid; grid-template-columns: max-content minmax(0, 1fr); align-items: baseline; gap: 8px; min-width: 0; }
.df-fact-wide { grid-column: 1 / -1; }
.df-fact-slot { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; white-space: nowrap; min-width: 48px; }
.df-fact-detail { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; overflow-wrap: anywhere; }

/* 文件改动 */
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

/* 悬停气泡 */
.df-hover-card { display: none; position: absolute; left: 12px; top: calc(100% + 4px); z-index: 20; width: min(520px, calc(100% - 24px)); max-height: 240px; overflow: hidden; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 10px; background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base)); box-shadow: var(--dsw-elevation-panel, 0 12px 32px #0003); }
.df-file-item:hover .df-hover-card { display: flex; flex-direction: column; }
.df-hover-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; padding: 8px 10px; border-bottom: 0.5px solid var(--dsw-alias-border-l3); background: var(--dsw-alias-bg-layer-2); }
.df-hover-path { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11px; color: var(--dsw-alias-label-secondary); }
.df-hover-body { flex: 1; min-height: 0; max-height: 200px; overflow: auto; }

/* diff 页：文件选择器 + 对比工具栏 */
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

/* 名称、标签、药丸 */
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

/* 活跃代理 */
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

/* 槽位、仓库 */
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

/* 子面板 */
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

/* 验收批次内部 */

/* 调度任务 */

/* 底部批量操作 */
.df-foot { display: flex; flex-direction: column; gap: 6px; padding: 10px 0 4px; }
.df-foot .df-cancel { width: auto; align-self: center; }
.df-go { width: 100%; }
.df-hint { margin: 0; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }

/* 设置表单里的说明文字（不是输入框上的开关） */
.df-form-note {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}

/* 输入框上的开关 */
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

/* 设置表单 */
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
/* 模型选择：模型 + 推理等级两行，和 Composer 的 ModelSelect 同构 */
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

/* 右上角提示 */
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
`

export function ensureSheet() {
  if (typeof document === 'undefined') return
  let style = document.getElementById(PANEL_STYLE_ID)
  if (style === null) {
    style = document.createElement('style')
    style.id = PANEL_STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `${panelSheet}\n${allCss()}`
}

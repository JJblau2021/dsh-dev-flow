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
.df-view > .df-foot { flex: none; position: static; padding: 10px 16px 8px; }

/* 分区标题 */
.df-section { margin: 6px 0 0; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; color: var(--dsw-alias-label-tertiary); }

/* 指标 */
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

/* 列表：通栏、发丝分隔，不用卡片框 */
.df-card { border: 0; border-radius: 0; background: transparent; }
.df-line, .df-agent { display: grid; align-items: center; gap: 8px 10px; padding: 8px 16px; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
.df-line { grid-template-columns: minmax(0, 1fr) auto; }
.df-agent { grid-template-columns: auto minmax(0, 1fr) auto; }
.df-line:hover, .df-agent:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(38, 49, 72, 0.06)); }
.df-trunk-live { box-shadow: inset 2px 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 60%, transparent); }
.df-trunk-states { display: inline-flex; align-items: center; gap: 8px; }

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
.df-tree-title { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 560; }
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
.df-tree .df-chips { flex: 0 1 auto; min-width: 0; flex-wrap: nowrap; overflow: hidden; display: flex; gap: 5px; }
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
.df-trunk-live { box-shadow: inset 2px 0 0 color-mix(in srgb, var(--dsw-alias-state-business-primary) 60%, transparent); }
.df-trunk-states { display: inline-flex; align-items: center; gap: 8px; }

/* 任务行 */
.df-tree { display: flex; flex-direction: column; gap: 2px; width: 100%; box-sizing: border-box; border-bottom: 0.5px solid var(--dsw-alias-border-l2); transition: background-color 120ms ease; }
.df-fact { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; align-items: baseline; }
.df-fact-slot { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; white-space: nowrap; }
.df-fact-detail { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; overflow-wrap: anywhere; }

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
.df-tree-head > .df-check, .df-tree-head > span[data-state], .df-tree-head > span { flex: none; }
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
.df-repo { display: flex; align-items: center; gap: 8px; padding: 8px 16px 6px; font-size: 12px; color: var(--dsw-alias-label-primary); }
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
.df-go { width: 100%; }
.df-hint { margin: 0; text-align: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 17px; }

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
.df-check { width: 14px; height: 14px; margin: 0; accent-color: var(--dsw-alias-state-business-primary); }

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
  style.textContent = panelSheet
}

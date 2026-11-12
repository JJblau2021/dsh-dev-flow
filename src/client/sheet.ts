export const PANEL_STYLE_ID = 'dev-flow-panel'

export const panelSheet = `
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

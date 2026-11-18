/** 一条任务的 diff 页：文件选择器 + 一次改动的全部文件，对齐 DSH 自带的 changes-review 页。 */
import type React from 'react'

const { useEffect, useState } = React
import { absoluteFileAddress, diffLabelsOf, diffStateOf, navigatedIndex, parseDiffAddress } from './diff'
import { ActionButton, type UiKit } from './ui'
import type { Call, Snapshot, TabInfo, TaskDiff, TaskDiffFile, Translate } from './types'
import { FileDiff } from './vendor/FileDiff'

/** 一个 diff 页的阅读状态：当前文件、左右对比、是否换行。 */
interface DiffView {
  index: number
  split: boolean
  wrap: boolean
}

/** 阅读状态按 tab 存，切走再切回来不重置。 */
const views = new Map<string, DiffView>()
/** 每个 tab 已经应用过的导航 revision，挂载/卸载之间保持，避免重挂时把用户选的文件拉回去。 */
const appliedRevisions = new Map<string, number>()
const DEFAULT_VIEW: DiffView = { index: 0, split: true, wrap: false }

/**
 * 渲染一条任务的 diff：页内用选择器切换这条任务的所有文件。
 * @param props - 所在会话、RPC、翻译、可选的宿主组件和 tab 信息钩子。
 * @returns 带文件选择与对比工具栏的比较视图。
 */
export function DiffTab({
  sessionId, call, t, ui, useTabInfo,
}: {
  sessionId?: string
  call: Call
  t: Translate
  ui: UiKit
  useTabInfo?: () => TabInfo
}) {
  const info = typeof useTabInfo === 'function' ? useTabInfo() : undefined
  const tab = info?.tab
  const address = tab === undefined ? undefined : (tab.navigation?.address ?? tab.contentId)
  const target = parseDiffAddress(address)
  const tabId = tab?.id ?? ''
  const [view, setView] = useState<DiffView>(() => views.get(tabId) ?? DEFAULT_VIEW)
  const [files, setFiles] = useState<TaskDiffFile[] | null>(null)
  const [failed, setFailed] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { if (tabId !== '') views.set(tabId, view) }, [tabId, view])
  // tab 关闭时清掉它自己的阅读状态。
  useEffect(() => {
    const signal = tab?.signal
    if (signal === undefined || tabId === '') return undefined
    const forget = () => { views.delete(tabId); appliedRevisions.delete(tabId) }
    signal.addEventListener('abort', forget, { once: true })
    return () => signal.removeEventListener('abort', forget)
  }, [tab?.signal, tabId])
  const taskId = target?.taskId
  useEffect(() => {
    if (sessionId === undefined || taskId === undefined) {
      setFiles([])
      return undefined
    }
    const controller = new AbortController()
    setFiles(null)
    setFailed('')
    call('task-diff', { sessionId, taskId }, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setFiles((value as TaskDiff | undefined)?.files ?? [])
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setFailed(reason instanceof Error ? reason.message : String(reason))
      })
    return () => controller.abort()
  }, [sessionId, call, taskId, attempt])
  // 每次导航带着这次要看的文件下标；只应用一次，之后用户可以自己切换。
  const revision = tab?.navigation?.revision ?? 0
  const requested = navigatedIndex(tab?.navigation?.params)
  useEffect(() => {
    if (files === null || files.length === 0 || tabId === '') return
    if ((appliedRevisions.get(tabId) ?? -1) === revision) return
    appliedRevisions.set(tabId, revision)
    setView((prev) => ({ ...prev, index: Math.min(requested ?? prev.index, files.length - 1) }))
  }, [files, revision, requested, tabId])
  const labels = diffLabelsOf(t)
  const index = files === null || files.length === 0 ? 0 : Math.min(view.index, files.length - 1)
  const file = files?.[index]
  const retry = () => setAttempt((value) => value + 1)
  const openFile = () => {
    if (file === undefined || sessionId === undefined || taskId === undefined || typeof tab?.actions?.openResource !== 'function') return
    const actions = tab.actions
    call('snapshot', { sessionId }).then((value) => {
      const task = (value as Snapshot | undefined)?.tasks?.find((row) => row.id === taskId)
      const slot = task?.slots?.[file.repo]?.path
      if (typeof slot === 'string' && slot !== '') actions.openResource?.(absoluteFileAddress(`${slot}/${file.path}`))
    }).catch(() => undefined)
  }
  const pathOf = (entry: TaskDiffFile) => `${entry.repo}/${entry.path}`
  const counts = (entry: TaskDiffFile) => entry.binary
    ? <span className="df-review-label">{t('diff.binary')}</span>
    : (
      <>
        <span className="df-diff-add">{`+${entry.added}`}</span>
        <span className="df-diff-del">{`-${entry.deleted}`}</span>
      </>
    )
  const Menu = ui.Menu
  const PathLabel = ui.PathLabel
  const Chevron = ui.IconChevronDownOutlineRegular
  const selector = Menu === undefined
    ? (
      <select
        className="df-review-file df-review-native-select"
        aria-label={t('review.selectFile')}
        value={String(index)}
        onChange={(event) => setView((prev) => ({ ...prev, index: Number(event.target.value) }))}
      >
        {(files ?? []).map((entry, at) => <option key={`${at}-${entry.repo}:${entry.path}`} value={String(at)}>{pathOf(entry)}</option>)}
      </select>
    )
    : (
      <Menu
        className="df-review-selector"
        open={menuOpen}
        autoFocus
        portal
        align="start"
        dense
        onClose={() => setMenuOpen(false)}
        anchor={(
          <button
            type="button"
            className="df-review-select"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t('review.selectFile')}
            title={file === undefined ? '' : pathOf(file)}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {PathLabel === undefined
              ? <span className="df-review-file">{file === undefined ? '' : pathOf(file)}</span>
              : <PathLabel path={file === undefined ? '' : pathOf(file)} />}
            {Chevron === undefined ? null : <Chevron size={12} />}
          </button>
        )}
        items={(files ?? []).map((entry, at) => ({
          id: String(at),
          label: (
            <span className="df-menu-item">
              <span className="df-menu-path">{pathOf(entry)}</span>
              <span className="df-menu-counts">{counts(entry)}</span>
            </span>
          ),
        }))}
        selectedId={String(index)}
        onSelect={(id: string) => { setView((prev) => ({ ...prev, index: Number(id) })); setMenuOpen(false) }}
      />
    )
  return (
    <div className="df-review">
      <div className="df-review-head">
        {files === null || files.length === 0 ? <span className="df-review-file">{target?.title ?? ''}</span> : selector}
        {file === undefined ? null : <span className="df-review-counts">{counts(file)}</span>}
        {files === null || files.length === 0 ? null : (
          <span className="df-review-tools">
            <Tooltip ui={ui} label={t(view.split ? 'review.unified' : 'review.split')}>
              <button
                type="button"
                className="df-review-tool"
                aria-pressed={view.split}
                aria-label={t('review.splitAria')}
                onClick={() => setView((prev) => ({ ...prev, split: !prev.split }))}
              >
                {ui.IconCompareSplitOutlineRegular === undefined ? <span aria-hidden="true">▥</span> : <ui.IconCompareSplitOutlineRegular className="df-review-compare-icon" />}
              </button>
            </Tooltip>
            <Tooltip ui={ui} label={t(view.wrap ? 'review.nowrap' : 'review.wrap')}>
              <button
                type="button"
                className="df-review-tool"
                aria-pressed={view.wrap}
                aria-label={t('review.wrapAria')}
                onClick={() => setView((prev) => ({ ...prev, wrap: !prev.wrap }))}
              >
                {view.wrap
                  ? (ui.IconNowrapFillRegular === undefined ? <span aria-hidden="true">↵</span> : <ui.IconNowrapFillRegular />)
                  : (ui.IconWrapFillRegular === undefined ? <span aria-hidden="true">↩</span> : <ui.IconWrapFillRegular />)}
              </button>
            </Tooltip>
            <Tooltip ui={ui} label={t('review.openFile')}>
              <button type="button" className="df-review-tool" aria-label={t('review.openFile')} onClick={openFile}>
                {ui.IconInspectOutlineRegular === undefined ? <span aria-hidden="true">⌕</span> : <ui.IconInspectOutlineRegular />}
              </button>
            </Tooltip>
          </span>
        )}
      </div>
      <div className="df-review-body">
        {failed !== ''
          ? (
            <div className="df-empty">
              <p>{failed}</p>
              <ActionButton ui={ui} onClick={retry}>{t('presented.retry')}</ActionButton>
            </div>
          )
          : files === null
            ? <FileDiff state="loading" split={view.split} wrap={view.wrap} retry={retry} t={labels} />
            : files.length === 0
              ? <div className="df-empty"><p>{t('review.empty')}</p></div>
              : file === undefined
                ? <FileDiff state="missing" split={view.split} wrap={view.wrap} retry={retry} t={labels} />
                : <FileDiff state={diffStateOf(file)} split={view.split} wrap={view.wrap} retry={retry} t={labels} />}
      </div>
    </div>
  )
}

/**
 * 有 Tooltip 时包一层；宿主没提供时直接渲染按钮。
 * @param props - 提示文案、宿主组件与按钮。
 * @returns 带提示的按钮。
 */
function Tooltip({ ui, label, children }: { ui: UiKit, label: string, children: React.ReactNode }) {
  if (ui.Tooltip === undefined) return <>{children}</>
  const Tip = ui.Tooltip
  return <Tip label={label} side="bottom" delayMs={500}>{children}</Tip>
}

import type React from 'react'

const { useEffect, useRef, useState } = React
import type { AgentRow, Call, DevSlot, RepoRow, ScheduleRow, Settings, Snapshot, TaskDiff, TaskDiffFile, TaskRow, Translate } from './types'
import { ActionButton, Dot, type UiKit } from './ui'
import { FileDiff } from './vendor/FileDiff'
import { diffLabelsOf, diffStateOf } from './diff'

/** 打开一条任务 diff 的入口：由插件在 Sidebar 里新开一个 tab，并选中这次的文件。 */
type OpenDiff = (taskId: string, title: string, index: number) => void

type PageId = 'overview' | 'tasks' | 'slots' | 'agents'

export function Title({ t }: { t: Translate }) {
  return <span>{t('tab.title')}</span>
}

export function WorkflowSwitch({
  ui, sessionId, call, parentSessionId, t,
}: {
  ui: UiKit
  sessionId?: string
  call: Call
  parentSessionId?: string
  t?: Translate
}) {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (parentSessionId || !sessionId) return undefined
    const controller = new AbortController()
    call('snapshot', { sessionId }, controller.signal)
      .then((value) => {
        const snapshot = value as Snapshot | undefined
        setEnabled(snapshot?.enabled === true)
        setError(snapshot?.problem || '')
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
    return () => controller.abort()
  }, [sessionId, parentSessionId, call])
  if (parentSessionId) return null
  const label = t?.('switch.label') ?? '工作流'
  const toggle = (next: boolean) => {
    setEnabled(next)
    call('session-set', { sessionId, enabled: next }).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : String(reason))
    })
  }
  return (
    <span className="df-note" data-on={enabled ? 'true' : 'false'} title={error || (enabled ? 'dev-flow 已开启' : 'dev-flow 已关闭')}>
      <span className="df-note-title">dev-flow</span>
      <button type="button" className="df-toggle" role="switch" aria-checked={enabled} aria-label={label} onClick={() => toggle(!enabled)}>
        <i />
      </button>
    </span>
  )
}

export function Panel(props: { ui: UiKit, sessionId?: string, call: Call, t: Translate, openDiff?: OpenDiff }) {
  return <PanelBoundary><PanelView {...props} /></PanelBoundary>
}

class PanelBoundary extends React.Component<{ children: React.ReactNode }, { error: string }> {
  state = { error: '' }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  render() {
    if (this.state.error !== '') return <p className="df-note" role="status">{this.state.error}</p>
    return this.props.children
  }
}

function PanelView({ ui, sessionId, call, t, openDiff }: { ui: UiKit, sessionId?: string, call: Call, t: Translate, openDiff?: OpenDiff }) {
  const [page, setPage] = useState<PageId>('overview')
  const [data, setData] = useState<Snapshot | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const { show, node } = useToast()
  const load = (failure?: unknown) => call('snapshot', { sessionId })
    .then((value) => {
      setData(value as Snapshot)
      const snapshot = value as Snapshot | undefined
      if (failure) show(textOf(failure), 'error')
      else if (snapshot?.problem) show(snapshot.problem, 'error')
    })
    .catch((reason: unknown) => show(textOf(reason), 'error'))
  useEffect(() => { void load() }, [sessionId])
  const pages = [
    { value: 'overview', label: t('page.overview'), id: 'dev-flow-tab-overview', panelId: 'dev-flow-panel-overview' },
    { value: 'tasks', label: t('page.tasks'), id: 'dev-flow-tab-tasks', panelId: 'dev-flow-panel-tasks' },
    { value: 'slots', label: t('page.slots'), id: 'dev-flow-tab-slots', panelId: 'dev-flow-panel-slots' },
    { value: 'agents', label: t('page.agents'), id: 'dev-flow-tab-agents', panelId: 'dev-flow-panel-agents' },
  ]
  return (
    <div className="df">
      {node}
      <div className="df-toolbar">
        {ui.SegmentedTabs
          ? <ui.SegmentedTabs size="sm" label={t('tab.title')} items={pages} value={page} onChange={(value) => setPage(value as PageId)} />
          : (
            <div role="tablist" className="df-filters">
              {pages.map((item) => (
                <button key={item.value} type="button" aria-selected={page === item.value} onClick={() => setPage(item.value as PageId)}>{item.label}</button>
              ))}
            </div>
          )}
        <ActionButton ui={ui} variant="ghost" onClick={() => { void load() }}>{t('action.refresh')}</ActionButton>
      </div>
      {!data ? null : data.problem ? null : !data.initialized
        ? <Uninitialized ui={ui} t={t} sessionId={sessionId} call={call} reload={load} workspace={data.workspace} />
        : <PageBody ui={ui} page={page} data={data} t={t} picked={picked} setPicked={setPicked} sessionId={sessionId} call={call} reload={load} show={show} openDiff={openDiff} />}
    </div>
  )
}

function Uninitialized({ ui, t, sessionId, call, reload, workspace }: { ui: UiKit, t: Translate, sessionId?: string, call: Call, reload: (failure?: unknown) => unknown, workspace?: string }) {
  return (
    <div className="df-empty">
      <p>{t('empty.init')}</p>
      {workspace ? <p className="df-meta">{workspace}</p> : null}
      <ActionButton ui={ui} variant="primary" onClick={() => { call('init', { sessionId }).then(() => reload()).catch((reason: unknown) => reload(reason)) }}>
        {t('action.init')}
      </ActionButton>
    </div>
  )
}

function PageBody(props: {
  ui: UiKit
  page: PageId
  data: Snapshot
  t: Translate
  picked: string[]
  setPicked: (next: string[]) => void
  sessionId?: string
  call: Call
  reload: (failure?: unknown) => unknown
  show: (text: string, tone?: string) => void
  openDiff?: OpenDiff
}) {
  if (props.page === 'overview') return <Overview ui={props.ui} data={props.data} t={props.t} />
  if (props.page === 'tasks') return <Tasks {...props} />
  if (props.page === 'slots') return <Slots ui={props.ui} data={props.data} t={props.t} />
  return <Agents ui={props.ui} data={props.data} t={props.t} />
}

function Overview({ ui, data, t }: { ui: UiKit, data: Snapshot, t: Translate }) {
  const dev = data.counts.devSlots
  const accept = data.counts.acceptSlots
  const cards: [string, string | number, string?][] = [
    [t('metric.projects'), data.counts.projects],
    [t('metric.agents'), `${data.counts.activeAgents}/${data.counts.agentLimit}`, data.counts.activeAgents > 0 ? 'info' : undefined],
    [t('metric.tasks'), data.counts.activeTasks],
    [t('metric.slots'), data.counts.activeSlots],
    [t('metric.pending'), data.counts.pending, data.counts.pending > 0 ? 'warn' : undefined],
    [t('metric.dirty'), `${data.counts.dirtyTrunks}/${data.counts.projects}`, data.counts.dirtyTrunks > 0 ? 'warn' : undefined],
  ]
  const running = (data.agents ?? []).filter((agent) => agent.status === 'running')
  return (
    <>
      <div className="df-metrics">
        {cards.map(([label, value, tone]) => (
          <div key={label} className="df-metric" data-tone={tone}>
            <div className="df-kicker">{label}</div>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </div>
      <h3 className="df-section">{t('section.trunks')}</h3>
      <div className="df-card">
        {(data.trunks ?? []).map((repo) => {
          const active = trunkActivity(data, repo.name)
          const phase = trunkPhase(active)
          return (
            <div key={repo.name} className={phase === 'idle' ? 'df-line' : 'df-line df-trunk-live'}>
              <span className="df-name">
                {phase === 'idle' ? null : <span className="df-live" aria-hidden="true" />}
                {repo.name}
                {repo.branch ? <span className="df-branch">{repo.branch}</span> : null}
              </span>
              <span className="df-trunk-states">
                <StatusTag ui={ui} t={t} status={phase} />
                <span className={repo.dirty ? 'df-warn' : 'df-ok'}>{repo.dirty ? t('trunk.dirty') : t('trunk.clean')}</span>
              </span>
            </div>
          )
        })}
      </div>
      <h3 className="df-section">{t('section.active')}</h3>
      {running.length === 0 ? <p className="df-empty-line">{t('section.none')}</p> : (
        <div className="df-active">
          {running.map((agent) => (
            <article key={agent.id} className="df-active-card">
              <div className="df-active-top">
                <span className="df-name"><span className="df-live" aria-hidden="true" />{agent.id}</span>
                <StatusTag ui={ui} t={t} status={agentPhase(agent)} />
              </div>
              <div className="df-active-title">{taskTitle(data, agent.taskId)}</div>
              <div className="df-chips">
                {agentSlots(data, agent).map((slot) => <span key={slot} className="df-chip">{slot}</span>)}
              </div>
            </article>
          ))}
        </div>
      )}
      {dev || accept ? <p className="df-meta">{`${t('slot.dev')} ${dev?.used ?? 0}/${dev?.total ?? 0} · ${t('slot.accept')} ${accept?.used ?? 0}/${accept?.total ?? 0}`}</p> : null}
    </>
  )
}

function Tasks({
  ui, data, t, picked, setPicked, sessionId, call, reload, show, openDiff,
}: {
  ui: UiKit
  data: Snapshot
  t: Translate
  picked: string[]
  setPicked: (next: string[]) => void
  sessionId?: string
  call: Call
  reload: (failure?: unknown) => unknown
  show: (text: string, tone?: string) => void
  openDiff?: OpenDiff
}) {
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [scheduleOpen, setScheduleOpen] = useState<Record<string, boolean>>({})
  const [pickedBatches, setPickedBatches] = useState<string[]>([])
  const [removing, setRemoving] = useState(false)
  const [details, setDetails] = useState<Record<string, boolean>>({})
  const detailProps = (id: string) => ({
    detailsOpen: details[id] === true,
    onToggleDetails: () => setDetails({ ...details, [id]: !details[id] }),
  })
  const [layout, setLayout] = useState(loadPaneLayout)
  const [dropY, setDropY] = useState<number | null>(null)
  const dragged = useRef(false)
  const dropAt = useRef<number | null>(null)
  const splitRef = useRef<HTMLDivElement | null>(null)
  const { order, open, heights } = layout
  const newest = (left: TaskRow, right: TaskRow) => String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? ''))
  const devAll = data.tasks.filter((task) => task.kind !== 'accept').sort(newest)
  const devRows = devAll.filter((task) => matchFilter(filter, task))
  const acceptRows = data.tasks.filter((task) => task.kind === 'accept').sort(newest)
  const reason = acceptReason(data, picked, t)
  const selected = data.tasks.filter((task) => task.selectable && picked.includes(task.id))
  const filters = [
    ['all', t('filter.all')],
    ['pending', t('filter.pending')],
    ['dev', t('filter.dev')],
    ['earlier', t('filter.earlier')],
  ] as const
  const launch = () => {
    if (busy || reason !== '') return
    setBusy(true)
    start(call, sessionId, picked, setPicked, reload)
      .then(() => show(t('toast.started'), 'info'))
      .catch(() => undefined)
      .finally(() => setBusy(false))
  }
  const resizePane = (id: PaneId, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const section = event.currentTarget.parentElement
    const parent = splitRef.current
    if (!section || !parent) return
    const startY = event.clientY
    const startHeight = section.getBoundingClientRect().height
    const limit = parent.getBoundingClientRect().height
    const move = (next: PointerEvent) => {
      const height = Math.round(Math.min(Math.max(120, limit - 80), Math.max(120, startHeight + next.clientY - startY)))
      setLayout((prev) => ({ ...prev, heights: { ...prev.heights, [id]: height } }))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }
  const pressHeader = (id: PaneId, event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const startY = event.clientY
    let moved = false
    const move = (next: PointerEvent) => {
      if (!moved && Math.abs(next.clientY - startY) < 4) return
      moved = true
      dragged.current = true
      const parent = splitRef.current
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()
      const sections = [...parent.querySelectorAll<HTMLElement>('[data-pane]')]
      let index = sections.length
      let line = parentRect.height
      for (let i = 0; i < sections.length; i += 1) {
        const rect = sections[i].getBoundingClientRect()
        if (next.clientY < rect.top + rect.height / 2) {
          index = i
          line = rect.top - parentRect.top
          break
        }
      }
      dropAt.current = index
      setDropY(line)
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      const index = dropAt.current
      dropAt.current = null
      setDropY(null)
      if (!moved || index === null) return
      setLayout((prev) => {
        const from = prev.order.indexOf(id)
        if (from < 0 || index === from || index === from + 1) return prev
        const next = prev.order.filter((item) => item !== id)
        next.splice(index > from ? index - 1 : index, 0, id)
        return { ...prev, order: next }
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }
  useEffect(() => { savePaneLayout(layout) }, [layout])
  const schedules = [...(data.schedules ?? [])].sort((left, right) => String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? '')))
  const visible = order.filter((id) => open[id])
  const paneStyle = (id: PaneId) => {
    if (!open[id] || visible.length < 2 || id === visible[visible.length - 1]) return undefined
    return { flex: `0 0 ${heights[id] ?? 220}px` }
  }
  const togglePane = (id: PaneId) => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    setLayout((prev) => ({ ...prev, open: { ...prev.open, [id]: !prev.open[id] } }))
  }
  return (
    <div className="df-views" ref={splitRef}>
      {dropY !== null ? <div className="df-drop" style={{ top: dropY }} /> : null}
      {order.map((id) => {
        const laterOpen = order.slice(order.indexOf(id) + 1).some((next) => open[next])
        const title = id === 'schedule' ? t('section.scheduleTasks') : id === 'dev' ? t('section.devTasks') : t('section.acceptTasks')
        const count = id === 'schedule' ? schedules.length : id === 'dev' ? devAll.length : acceptRows.length
        return (
      <section key={id} className="df-view" data-pane={id} data-open={open[id] ? 'true' : 'false'} style={paneStyle(id)}>
        <button
          type="button"
          className="df-view-head"
          aria-expanded={open[id]}
          onClick={() => togglePane(id)}
          onPointerDown={(event) => pressHeader(id, event)}
        >
          <span className="df-view-chev" aria-hidden="true"><Chevron /></span>
          {title}
          <span className="df-view-count">{count}</span>
        </button>
        {id === 'schedule' && open.schedule ? (
          <div className="df-view-body">
            {schedules.length === 0 ? <div className="df-empty"><p>{t('section.emptySchedule')}</p></div> : schedules.map((schedule) => (
              <ScheduleItem key={schedule.id} ui={ui} t={t} schedule={schedule} open={scheduleOpen[schedule.id] === true} onToggle={() => setScheduleOpen({ ...scheduleOpen, [schedule.id]: scheduleOpen[schedule.id] !== true })} />
            ))}
          </div>
        ) : null}
        {id === 'dev' && open.dev ? <>
      <div className="df-filters">
        {filters.map(([value, label]) => {
          const count = devAll.filter((task) => matchFilter(value, task)).length
          const text = `${label} ${count}`
          return ui.Pill
            ? <ui.Pill key={value} active={filter === value} onClick={() => setFilter(value)}>{text}</ui.Pill>
            : <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{text}</button>
        })}
      </div>
      <div className="df-view-body">
      <div className="df-card">
        {devRows.length === 0 ? <div className="df-empty"><p>{t('section.emptyDev')}</p></div> : devRows.map((task) => (
          <DevTaskItem key={task.id} ui={ui} t={t} task={task} picked={picked} setPicked={setPicked} sessionId={sessionId} call={call} reload={reload} show={show} {...detailProps(task.id)} onOpenDiff={(file, index) => openDiff?.(task.id, task.title, index)} />
        ))}
      </div>
      </div>
      {selected.length > 0 ? (
        <div className="df-foot">
          <ActionButton ui={ui} className="df-go" variant="primary" disabled={busy || reason !== ''} title={reason} onClick={launch}>
            {busy ? t('action.working') : t('action.accept')}
          </ActionButton>
          <p className="df-hint">{reason !== '' ? reason : `${t('hint.order')}：${selected.map((task) => task.title).join(' → ')}`}</p>
        </div>
      ) : null}
        </> : null}
        {id === 'accept' && open.accept ? <>
      <div className="df-view-body">
      <div className="df-card">
        {acceptRows.length === 0 ? <div className="df-empty"><p>{t('section.emptyAccept')}</p></div> : acceptRows.map((batch) => {
          const children = containedTasks(data, batch)
          const open = children.length > 0 && (opened[batch.id] ?? batch.status === 'accepting')
          const deletable = batch.status !== 'accepting'
          return (
            <AcceptTaskItem
              key={batch.id}
              ui={ui}
              t={t}
              batch={batch}
              picked={picked}
              setPicked={setPicked}
              sessionId={sessionId}
              call={call}
              reload={reload}
              show={show}
              pickedBatches={pickedBatches}
              setPickedBatches={setPickedBatches}
              open={open}
              onToggle={children.length > 0 ? () => setOpened({ ...opened, [batch.id]: !open }) : undefined}
              children={children}
            />
          )
        })}
      </div>
      </div>
      {pickedBatches.length > 0 ? (
        <div className="df-foot">
          <ActionButton ui={ui} className="df-go" disabled={removing} onClick={() => removeBatches(call, sessionId, pickedBatches, setPickedBatches, setRemoving, reload, show)}>
            {removing ? t('action.deleting') : t('action.delete')}
          </ActionButton>
          <p className="df-hint">{`${pickedBatches.length} 个验收任务，删除时一并删掉验收分支`}</p>
        </div>
      ) : null}
        </> : null}
      {open[id] && laterOpen ? <div className="df-sash" role="separator" aria-orientation="horizontal" aria-label="调整面板高度" onPointerDown={(event) => resizePane(id, event)} /> : null}
      </section>
        )
      })}
    </div>
  )
}

const PANE_KEY = 'dsh-dev-flow.task-panes'
const PANE_IDS = ['schedule', 'dev', 'accept'] as const
type PaneId = typeof PANE_IDS[number]

function isPaneId(value: string): value is PaneId {
  return (PANE_IDS as readonly string[]).includes(value)
}

function loadPaneLayout() {
  const fallback = { order: [...PANE_IDS], open: { schedule: true, dev: true, accept: true }, heights: { schedule: 220, dev: 260, accept: 220 } }
  try {
    const raw = localStorage.getItem(PANE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { order?: string[], open?: Record<string, boolean>, heights?: Partial<Record<PaneId, number>> }
    const order = (parsed.order ?? []).filter(isPaneId)
    for (const id of PANE_IDS) if (!order.includes(id)) order.push(id)
    return {
      order,
      open: { schedule: parsed.open?.schedule !== false, dev: parsed.open?.dev !== false, accept: parsed.open?.accept !== false },
      heights: { ...fallback.heights, ...parsed.heights },
    }
  } catch {
    return fallback
  }
}

function savePaneLayout(layout: ReturnType<typeof loadPaneLayout>) {
  try { localStorage.setItem(PANE_KEY, JSON.stringify(layout)) } catch { /* 浏览器不允许写入时，本次会话仍保持调整结果。 */ }
}

function toneOf(status: string) {
  if (status === 'merged' || status === 'accepted' || status === 'dispatched') return 'success'
  if (status === 'failed' || status === 'rejected') return 'error'
  if (status === 'pending-merge' || status === 'waiting' || status === 'pending-acceptance' || status === 'accepting' || status === 'awaiting-agent') return 'warn'
  if (status === 'developing' || status === 'running' || status === 'scheduling') return 'info'
  return 'neutral'
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M1.6 3.6 L5 7 L8.4 3.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 三种任务共用的树行：左侧展开箭头，整行为热区。 */
function TreeItem({
  kind, title, chips, leading, actions, facts, expanded = false, expandable = false, onToggle, onClick, children, depth = 0, tone, time,
}: {
  kind: 'schedule' | 'dev' | 'accept'
  title: string
  chips: string[]
  leading?: React.ReactNode
  actions?: React.ReactNode
  facts?: { slot: string, detail: string }[]
  expanded?: boolean
  expandable?: boolean
  onToggle?: () => void
  onClick?: () => void
  children?: React.ReactNode
  depth?: number
  tone?: string
  time?: string
}) {
  const row = onToggle ?? onClick
  return (
    <div className={`df-tree df-tree-${kind}`} data-tone={tone ?? 'neutral'} data-open={expanded ? 'true' : 'false'} data-clickable={row ? 'true' : 'false'} data-depth={depth} tabIndex={row ? 0 : undefined} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row?.() } }}>
      <div className="df-tree-head" onClick={(event) => {
        const target = event.target as Element | null
        if (target && target.closest('.df-tree') !== event.currentTarget.parentElement) return
        row?.()
      }}>
        {expandable ? (
          <button type="button" className="df-chev" data-expanded={expanded ? 'true' : 'false'} aria-expanded={expanded} onClick={(event) => { event.stopPropagation(); onToggle?.() }}>
            <Chevron />
          </button>
        ) : <span className="df-chev-space" aria-hidden="true" />}
        {leading}
        <span className="df-tree-content">
          <span className="df-tree-title">{title}</span>
          {chips.length > 0 ? (
            <span className="df-chips df-task-chips">
              {chips.map((chip) => <span key={chip} className="df-chip">{chip}</span>)}
            </span>
          ) : null}
        </span>
        <span className="df-actions">
          {time ? <span className="df-tree-time">{time}</span> : null}
          {actions}
        </span>
      </div>
      {expanded && facts && facts.length > 0 ? (
        <div className="df-facts">
          {facts.map((fact, index) => (
            <div key={`${index}-${fact.slot}-${fact.detail}`} className="df-fact">
              <span className="df-fact-slot">{fact.slot}</span>
              {fact.detail ? <span className="df-fact-detail">{fact.detail}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      {expanded && children ? <div className="df-tree-children">{children}</div> : null}
    </div>
  )
}

/** 调度任务：展开后列出它创建的任务。 */
function ScheduleItem({ ui, t, schedule, open, onToggle, depth = 0 }: {
  ui: UiKit
  t: Translate
  schedule: ScheduleRow
  open: boolean
  onToggle: () => void
  depth?: number
}) {
  const tasks = [...(schedule.tasks ?? [])].sort((left, right) => String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? '')))
  const [openTasks, setOpenTasks] = useState<Record<string, boolean>>({})
  return (
    <TreeItem
      kind="schedule"
      title={schedule.title}
      chips={schedule.usage?.totalTokens ? [formatTokens(schedule.usage.totalTokens)] : []}
      time={createdText(schedule.createdAt)}
      actions={<StatusTag ui={ui} t={t} status={schedule.status} />}
      expandable
      expanded={open}
      onToggle={onToggle}
      depth={depth}
      tone={toneOf(schedule.status)}
    >
      {tasks.map((task) => {
        const facts = [
          {
            slot: '依赖',
            detail: task.dependsOn.length === 0 ? '无' : task.dependsOn.map((dep) => `${dep.title}${dep.merged ? `，已并入 ${dep.branch}` : '，未并入'}`).join('；'),
          },
          ...task.slots.map((slot) => ({
            slot: '槽位',
            detail: `${slot.number ? `${slot.repo}-${slot.number}` : slot.repo}${slot.branch ? ` · ${slot.branch}` : ''}`,
          })),
        ]
        return (
          <TreeItem
            key={task.id}
            kind="dev"
            title={task.title}
            chips={task.slots.map((slot) => (slot.number ? `${slot.repo}-${slot.number}` : slot.repo))}
            actions={<StatusTag ui={ui} t={t} status={shownStatus({ ...task, kind: 'dev', repos: [] } as unknown as TaskRow)} />}
            facts={facts}
            expandable
            expanded={openTasks[task.id] === true}
            onToggle={() => setOpenTasks({ ...openTasks, [task.id]: openTasks[task.id] !== true })}
            depth={depth + 1}
          />
        )
      })}
    </TreeItem>
  )
}

/** 开发任务。 */
function DevTaskItem({
  ui, t, task, picked, setPicked, sessionId, call, reload, show, detailsOpen = false, onToggleDetails, onOpenDiff, nested = false, reviewing = false, batchId, depth = 0,
}: {
  ui: UiKit
  t: Translate
  task: TaskRow
  picked: string[]
  setPicked: (next: string[]) => void
  sessionId?: string
  call?: Call
  reload?: (failure?: unknown) => unknown
  show?: (text: string, tone?: string) => void
  detailsOpen?: boolean
  onToggleDetails?: () => void
  nested?: boolean
  reviewing?: boolean
  batchId?: string
  depth?: number
  onOpenDiff?: (file: TaskDiffFile, index: number) => void
}) {
  const facts = taskFacts(task, t)
  const deps = task.dependsOn ?? []
  const [openDeps, setOpenDeps] = useState<Record<string, boolean>>({})
  const [selfOpen, setSelfOpen] = useState(false)
  const [diff, setDiff] = useState<TaskDiff | null>(null)
  const loadDiff = () => {
    if (diff !== null || !call || nested) return
    call('task-diff', { sessionId, taskId: task.id })
      .then((value) => setDiff(value as TaskDiff))
      .catch(() => setDiff({ files: [], repos: [] }))
  }
  const toggle = () => {
    if (!openDetails) loadDiff()
    toggleDetails()
  }
  const openDetails = onToggleDetails === undefined ? selfOpen : detailsOpen
  const toggleDetails = onToggleDetails ?? (() => setSelfOpen(!selfOpen))
  const expandable = facts.length > 0 || deps.length > 0
  const selectable = !nested && task.selectable === true
  const leading = selectable
    ? <input className="df-check" type="checkbox" checked={picked.includes(task.id)} onClick={(event) => event.stopPropagation()} onChange={() => setPicked(togglePick(picked, task.id))} />
    : undefined
  return (
    <TreeItem
      kind="dev"
      title={task.title}
      chips={[...taskBranchChips(task), ...taskChips(task)]}
      time={createdText(task.createdAt)}
      leading={leading}
      actions={(
        <>
          <StatusTag ui={ui} t={t} status={shownStatus(task)} />
          {task.status === 'pending-merge' && task.kind !== 'accept' && call && reload ? (
            <ActionButton ui={ui} onClick={(event) => { event.stopPropagation(); mergeTask(call, sessionId, task.id, reload, show) }}>{t('action.merge')}</ActionButton>
          ) : null}
          {nested && reviewing && task.acceptance !== 'accepted' && batchId && call && reload ? (
            <>
              <ActionButton ui={ui} onClick={(event) => { event.stopPropagation(); finishTask(call, sessionId, batchId, task.id, 'accepted', reload) }}>{t('action.pass')}</ActionButton>
              <ActionButton ui={ui} onClick={(event) => { event.stopPropagation(); finishTask(call, sessionId, batchId, task.id, 'rejected', reload) }}>{t('action.fail')}</ActionButton>
            </>
          ) : null}
        </>
      )}
      facts={facts}
      expandable={expandable}
      expanded={openDetails}
      onToggle={expandable ? toggle : undefined}
      onClick={selectable ? () => setPicked(togglePick(picked, task.id)) : undefined}
      depth={depth}
      tone={toneOf(shownStatus(task))}
    >
      {diff !== null && diff.files.length > 0 ? (
        <div className="df-files">
          {diff.files.map((file, index) => {
            const key = `${file.repo}:${file.path}`
            return (
              <div key={key} className="df-file-item">
                <div className="df-file-row" onClick={(event) => { event.stopPropagation(); onOpenDiff?.(file, index) }}>
                  <span className="df-file-path">{file.path}</span>
                  {file.binary
                    ? <span className="df-meta">binary</span>
                    : (
                      <span className="df-diff-counts">
                        <span className="df-diff-add">{`+${file.added}`}</span>
                        <span className="df-diff-del">{`-${file.deleted}`}</span>
                      </span>
                    )}
                </div>
                {file.binary ? null : (
                  <div className="df-hover-card" aria-hidden="true">
                    <div className="df-hover-head">
                      <span className="df-hover-path">{file.path}</span>
                      <span className="df-diff-counts">
                        <span className="df-diff-add">{`+${file.added}`}</span>
                        <span className="df-diff-del">{`-${file.deleted}`}</span>
                      </span>
                    </div>
                    <div className="df-hover-body"><FileDiff state={diffStateOf(file)} split={false} wrap={false} retry={() => undefined} t={diffLabelsOf(t)} /></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}
      {deps.map((dep) => (
        <TreeItem
          key={`dep-${dep.id}`}
          kind="dev"
          title={dep.title}
          chips={[]}
          actions={<StatusTag ui={ui} t={t} status={dep.status} />}
          facts={[
            { slot: t('fact.state'), detail: t(`status.${dep.status}`) || dep.status },
            { slot: t('fact.merged'), detail: dep.merged ? (dep.branch ?? '') : t('fact.notMerged') },
          ]}
          expandable
          expanded={openDeps[dep.id] === true}
          onToggle={() => setOpenDeps({ ...openDeps, [dep.id]: openDeps[dep.id] !== true })}
          depth={depth + 1}
          tone={toneOf(dep.status)}
        />
      ))}
    </TreeItem>
  )
}

/** 验收任务：展开后列出这批里的开发任务。 */
function AcceptTaskItem({
  ui, t, batch, picked, setPicked, sessionId, call, reload, show, pickedBatches, setPickedBatches, open, onToggle, children, depth = 0,
}: {
  ui: UiKit
  t: Translate
  batch: TaskRow
  picked: string[]
  setPicked: (next: string[]) => void
  sessionId?: string
  call?: Call
  reload?: (failure?: unknown) => unknown
  show?: (text: string, tone?: string) => void
  pickedBatches: string[]
  setPickedBatches: (next: string[]) => void
  open: boolean
  onToggle?: () => void
  children: TaskRow[]
  depth?: number
}) {
  const deletable = batch.status !== 'accepting'
  const leading = deletable
    ? <input className="df-check" type="checkbox" checked={pickedBatches.includes(batch.id)} onClick={(event) => event.stopPropagation()} onChange={() => setPickedBatches(togglePick(pickedBatches, batch.id))} />
    : undefined
  return (
    <TreeItem
      kind="accept"
      title={batch.title}
      chips={taskChips(batch)}
      time={createdText(batch.createdAt)}
      leading={leading}
      actions={<StatusTag ui={ui} t={t} status={shownStatus(batch)} />}
      expandable={onToggle !== undefined}
      expanded={open}
      onToggle={onToggle}
      onClick={deletable ? () => setPickedBatches(togglePick(pickedBatches, batch.id)) : undefined}
      depth={depth}
      tone={toneOf(shownStatus(batch))}
    >
      {children.map((task) => (
        <DevTaskItem key={task.id} ui={ui} t={t} task={task} picked={picked} setPicked={setPicked} sessionId={sessionId} call={call} reload={reload} show={show} nested reviewing={batch.status === 'accepting'} batchId={batch.id} depth={depth + 1} />
      ))}
    </TreeItem>
  )
}

function containedTasks(data: Snapshot, batch: TaskRow) {
  const ids = batch.taskIds ?? []
  const fromIds = ids
    .map((id) => data.tasks.find((task) => task.kind !== 'accept' && task.id === id))
    .filter((task): task is TaskRow => task !== undefined)
  const rows = fromIds.length > 0 ? fromIds : data.tasks.filter((task) => task.kind !== 'accept' && task.batchId === batch.id)
  return rows.sort((left, right) => String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? '')))
}

function Slots({ ui, data, t }: { ui: UiKit, data: Snapshot, t: Translate }) {
  const dev = data.counts.devSlots
  const accept = data.counts.acceptSlots
  return (
    <>
      <p className="df-meta">{`${t('slot.dev')} ${dev?.used ?? 0}/${dev?.total ?? 0} · ${t('slot.accept')} ${accept?.used ?? 0}/${accept?.total ?? 0}`}</p>
      {data.repos.map((repo) => (
        <section key={repo.name} className="df-card">
          <div className="df-repo">
            <strong>{repo.name}</strong>
            {' '}
            <span className={repo.dirty ? 'df-warn' : 'df-ok'}>{repo.dirty ? t('trunk.dirty') : t('trunk.clean')}</span>
          </div>
          {repo.devSlots.length === 0 ? <SlotLine t={t} kind="dev" state="missing" detail={t('slot.noDev')} /> : repo.devSlots.map((slot) => (
            <SlotLine key={slot.number} t={t} kind="dev" repo={repo.name} number={slot.number} state={slot.taskId ? 'busy' : 'free'} detail={devDetail(data, repo, slot, t)} />
          ))}
          <SlotLine
            t={t}
            kind="accept"
            repo={repo.name}
            number={repo.acceptSlot?.number}
            state={repo.acceptSlot ? (repo.acceptSlot.batchId ? 'busy' : 'free') : 'missing'}
            detail={acceptDetail(repo, t)}
          />
        </section>
      ))}
    </>
  )
}

function SlotLine({ t, kind, repo, number, state, detail }: { t: Translate, kind: 'dev' | 'accept', repo?: string, number?: string, state: 'busy' | 'free' | 'missing', detail: string }) {
  const label = repo && number ? `${repo}-${number}` : `${kind === 'dev' ? t('slot.dev') : t('slot.accept')} ${number ?? ''}`.trim()
  const tone = state === 'busy' ? 'df-warn' : state === 'free' ? 'df-ok' : 'df-muted'
  const text = state === 'busy' ? t('slot.busy') : state === 'free' ? t('slot.free') : t('slot.missing')
  return (
    <div className="df-slot">
      <span>{label}</span>
      <span className={tone}>{text}</span>
      <span className="df-meta">{detail}</span>
    </div>
  )
}

function visibleAgents(agents: AgentRow[]) {
  const running = agents.filter((agent) => agent.status === 'running')
  const latestIdle = new Map<string, AgentRow>()
  for (const agent of agents) {
    if (agent.status === 'running') continue
    latestIdle.set(agent.kind ?? 'dev', agent)
  }
  return [...running, ...latestIdle.values()]
}

function Agents({ ui, data, t }: { ui: UiKit, data: Snapshot, t: Translate }) {
  const rows: AgentRow[] = [{ id: t('agent.lead'), status: 'lead', kind: 'lead' }, ...visibleAgents(data.agents)]
  return (
    <>
      <p className="df-meta">{`${t('metric.agents')} ${data.counts.activeAgents}/${data.counts.agentLimit}`}</p>
      <div className="df-card">
        {rows.map((agent) => (
          <div key={agent.id} className="df-agent">
            <Dot ui={ui} state={agent.status === 'running' ? 'ongoing' : 'idle'} />
            <div>
              <div className="df-name">{agent.id}</div>
              <div className="df-meta">{agentDetail(data, agent, t)}</div>
            </div>
            <StatusTag ui={ui} t={t} status={agent.status === 'lead' ? 'lead' : agentPhase(agent)} />
          </div>
        ))}
      </div>
    </>
  )
}

function StatusTag({ ui, t, status }: { ui: UiKit, t: Translate, status: string }) {
  const label = status === 'running' ? t('agent.running') : status === 'idle' ? t('agent.idle') : status === 'lead' ? t('agent.dispatch') : (t(`status.${status}`) || status)
  const tone = status === 'failed' || status === 'rejected' ? 'danger'
    : status === 'accepted' || status === 'merged' ? 'success'
      : status === 'pending-merge' || status === 'awaiting-agent' ? 'warning'
      : status === 'developing' || status === 'running' || status === 'scheduling' ? 'info'
        : status === 'pending-acceptance' || status === 'waiting' || status === 'accepting' ? 'warning'
          : 'neutral'
  return ui.Tag ? <ui.Tag tone={tone}>{label}</ui.Tag> : <span className="df-meta">{label}</span>
}

export function SettingsForm({ ui, view, call, t }: { ui: UiKit, view?: string, call: Call, t: Translate }) {
  const [draft, setDraft] = useState<Settings | null>(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (view === 'summary') return undefined
    const controller = new AbortController()
    call('settings-get', {}, controller.signal)
      .then((value) => setDraft(value as Settings))
      .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : String(reason)))
    return () => controller.abort()
  }, [view, call])
  if (view === 'summary') return <span className="df-meta">{t('settings.summary')}</span>
  if (!draft) return <p className="df-meta">{message || '…'}</p>
  const fields: [keyof Settings, string][] = [
    ['devModel', '开发任务模型'],
    ['acceptModel', '验收任务模型'],
    ['devDir', '开发槽位目录'],
    ['acceptDir', '验收槽位目录'],
    ['taskBranch', '任务分支格式'],
    ['acceptBranch', '验收分支格式'],
  ]
  return (
    <form className="df-form" onSubmit={(event) => {
      event.preventDefault()
      call('settings-set', { settings: draft as unknown as Record<string, unknown> })
        .then((saved) => { setDraft(saved as Settings); setMessage('已保存') })
        .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : String(reason)))
    }}>
      {fields.map(([key, label]) => (
        <label key={key} className="df-field">
          {label}
          <input value={draft[key] ?? ''} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
        </label>
      ))}
      <ActionButton ui={ui} type="submit" variant="primary">{t('action.save')}</ActionButton>
      {message ? <p className="df-note" role="status">{message}</p> : null}
    </form>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ id: string, text: string, tone: string, closing: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = (text: string, tone = 'error') => {
    if (text === '') return
    if (timer.current !== null) clearTimeout(timer.current)
    setToast({ id: `${Date.now()}`, text, tone, closing: false })
    timer.current = setTimeout(() => {
      setToast((current) => current === null ? current : { ...current, closing: true })
      timer.current = setTimeout(() => {
        setToast(null)
        timer.current = null
      }, 200)
    }, 2600)
  }
  const node = toast === null ? null : (
    <div className="df-toasts">
      <div className="df-toast" data-tone={toast.tone} data-closing={toast.closing ? 'true' : undefined}>
        <span className="df-toast-mark" />
        <span className="df-toast-text">{toast.text}</span>
      </div>
    </div>
  )
  return { show, node }
}

function textOf(reason: unknown) {
  return reason instanceof Error ? reason.message : String(reason)
}

function start(call: Call, sessionId: string | undefined, picked: string[], setPicked: (next: string[]) => void, reload: (failure?: unknown) => unknown) {
  const id = `batch-${Date.now().toString(36)}`
  return call('accept-start', { sessionId, id, taskIds: picked })
    .then(() => { setPicked([]); return reload() })
    .catch((reason: unknown) => {
      reload(reason)
      throw reason
    })
}

function removeBatches(
  call: Call,
  sessionId: string | undefined,
  ids: string[],
  setPicked: (next: string[]) => void,
  setBusy: (next: boolean) => void,
  reload: (failure?: unknown) => unknown,
  show?: (text: string, tone?: string) => void,
) {
  setBusy(true)
  call('accept-delete', { sessionId, ids })
    .then(() => { setPicked([]); show?.(`已删除 ${ids.length} 个验收任务`, 'info'); return reload() })
    .catch((reason: unknown) => reload(reason))
    .finally(() => setBusy(false))
}

function mergeTask(call: Call, sessionId: string | undefined, taskId: string, reload: (failure?: unknown) => unknown, show?: (text: string, tone?: string) => void) {
  call('task-merge', { sessionId, taskId }).then((value) => {
    const task = (value as Snapshot | undefined)?.tasks?.find((item) => item.id === taskId)
    if (task?.status === 'pending-merge') show?.(task.warnings?.join('，') || '没有合入', 'error')
    else show?.('已合入主干', 'info')
    return reload()
  }).catch((reason: unknown) => reload(reason))
}

function finishTask(call: Call, sessionId: string | undefined, id: string, taskId: string, result: 'accepted' | 'rejected', reload: (failure?: unknown) => unknown) {
  call('accept-task', { sessionId, id, taskId, result }).then(() => reload()).catch((reason: unknown) => reload(reason))
}

function togglePick(picked: string[], id: string) {
  return picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id]
}

function shownStatus(task: TaskRow) {
  if (task.kind !== 'accept' && task.status === 'developing' && task.agentStatus !== 'running') return 'awaiting-agent'
  return task.status
}

function matchFilter(filter: string, task: TaskRow) {
  if (filter === 'pending') return task.status === 'pending-acceptance'
  if (filter === 'dev') return task.status === 'developing' || task.status === 'waiting' || task.status === 'failed'
  if (filter === 'earlier') return task.status === 'accepted' || task.status === 'merged' || task.status === 'abandoned' || task.status === 'rejected'
  return true
}

function acceptReason(data: Snapshot, picked: string[], t: Translate) {
  if (!data.enabled) return '会话未启用工作流'
  const selected = data.tasks.filter((task) => task.selectable && picked.includes(task.id))
  if (selected.length === 0) return t('hint.pick')
  if (data.counts.activeAgents >= data.counts.agentLimit) return '子代理已达上限'
  const busy = selected.flatMap((task) => task.repos).filter((name) => data.repos.find((repo) => repo.name === name)?.acceptSlot?.batchId)
  if (busy.length > 0) return `${busy[0]} 的验收槽位正在占用`
  return ''
}

function taskTitle(data: Snapshot, id?: string | null) {
  if (!id) return ''
  return data.tasks.find((task) => task.id === id)?.title ?? id
}

function trunkPhase(active: { kind?: string }[]) {
  if (active.some((item) => item.kind === 'accept')) return 'accepting'
  if (active.some((item) => item.kind === 'schedule')) return 'scheduling'
  if (active.length > 0) return 'developing'
  return 'idle'
}

function agentPhase(agent: AgentRow) {
  if (agent.status !== 'running') return 'idle'
  if (agent.kind === 'accept') return 'accepting'
  if (agent.kind === 'schedule') return 'scheduling'
  return 'developing'
}

function trunkActivity(data: Snapshot, repoName: string) {
  return (data.agents ?? []).flatMap((agent) => {
    if (agent.status !== 'running') return []
    const task = data.tasks.find((item) => item.id === agent.taskId)
    if (!task) return []
    const slots = Object.entries(task.slots ?? {})
      .filter(([repo]) => repo === repoName)
      .map(([, slot]) => slot.number ? `${repoName}-${slot.number}` : repoName)
    const involved = task.repos?.includes(repoName) || slots.length > 0
    if (!involved) return []
    return [{ agent: agent.id, title: task.title, kind: agent.kind, slots }]
  })
}

function agentSlots(data: Snapshot, agent: AgentRow) {
  const task = data.tasks.find((item) => item.id === agent.taskId || item.id === agent.lastTaskId)
  if (!task?.slots) return []
  return Object.entries(task.slots).map(([repo, slot]) => slot.number ? `${repo}-${slot.number}` : `${repo} ${slot.port ?? ''}`.trim())
}

function taskChips(task: TaskRow) {
  return Object.entries(task.slots ?? {}).map(([repo, slot]) => {
    if (slot.port) return `${repo} · ${slot.port}`
    return slot.number ?? repo
  })
}

function createdText(createdAt?: string | null) {
  if (!createdAt) return undefined
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return undefined
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function taskBranchChips(task: TaskRow) {
  return Object.values(task.slots ?? {}).map((slot) => slot.branch).filter((branch): branch is string => typeof branch === 'string' && branch !== '')
}

function taskFacts(task: TaskRow, t: Translate) {
  const zh = t('page.tasks') === '任务'
  const batchLabel = zh ? '批次' : 'batch'
  const rows: { slot: string, detail: string }[] = []
  for (const [repo, slot] of Object.entries(task.slots ?? {})) {
    if (slot.branch) rows.push({ slot: repo, detail: slot.branch })
  }
  if (task.batchId && task.kind === 'dev') rows.push({ slot: batchLabel, detail: task.batchId })
  if (task.warnings?.length) rows.push({ slot: t('status.pending-merge'), detail: task.warnings.join('，') })
  if (task.usage?.totalTokens) rows.push({ slot: 'token', detail: formatTokens(task.usage.totalTokens) })
  return rows
}

function formatTokens(total: number) {
  if (total >= 10000) return `${Math.round(total / 1000)}k`
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k`
  return String(total)
}

function devDetail(data: Snapshot, repo: RepoRow, slot: DevSlot, t: Translate) {
  if (!slot.taskId) return t('slot.reusable')
  const title = taskTitle(data, slot.taskId)
  return [title, slot.branch].filter(Boolean).join(' · ')
}

function acceptDetail(repo: RepoRow, t: Translate) {
  if (!repo.acceptSlot) return t('slot.noAccept')
  const portLabel = t('page.tasks') === '任务' ? '端口' : 'port'
  if (!repo.acceptSlot.batchId) return repo.acceptSlot.port ? `${portLabel} ${repo.acceptSlot.port}` : t('slot.free')
  return [`${portLabel} ${repo.acceptSlot.port ?? ''}`, repo.acceptSlot.batchId].filter(Boolean).join(' · ')
}

function agentDetail(data: Snapshot, agent: AgentRow, t: Translate) {
  if (agent.kind === 'lead' || agent.status === 'lead') return t('agent.leadDetail')
  if (agent.status === 'running') {
    const title = taskTitle(data, agent.taskId)
    return [agent.kind === 'accept' ? t('slot.accept') : t('slot.dev'), title].filter(Boolean).join(' · ')
  }
  if (agent.lastTaskId) return `${t('agent.last')} · ${taskTitle(data, agent.lastTaskId)}`
  return t('agent.idle')
}

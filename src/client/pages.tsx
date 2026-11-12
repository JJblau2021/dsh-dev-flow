import type React from 'react'

const { useEffect, useRef, useState } = React
import type { AgentRow, Call, DevSlot, RepoRow, Settings, Snapshot, TaskRow, Translate } from './types'
import { ActionButton, Dot, type UiKit } from './ui'

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

export function Panel(props: { ui: UiKit, sessionId?: string, call: Call, t: Translate }) {
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

function PanelView({ ui, sessionId, call, t }: { ui: UiKit, sessionId?: string, call: Call, t: Translate }) {
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
        ? <Uninitialized ui={ui} t={t} sessionId={sessionId} call={call} reload={load} />
        : <PageBody ui={ui} page={page} data={data} t={t} picked={picked} setPicked={setPicked} sessionId={sessionId} call={call} reload={load} show={show} />}
    </div>
  )
}

function Uninitialized({ ui, t, sessionId, call, reload }: { ui: UiKit, t: Translate, sessionId?: string, call: Call, reload: (failure?: unknown) => unknown }) {
  return (
    <div className="df-empty">
      <p>{t('empty.init')}</p>
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
        {(data.trunks ?? []).map((repo) => (
          <div key={repo.name} className="df-line">
            <span className="df-name">{repo.name}</span>
            <span className={repo.dirty ? 'df-warn' : 'df-ok'}>{repo.dirty ? t('trunk.dirty') : t('trunk.clean')}</span>
          </div>
        ))}
      </div>
      <h3 className="df-section">{t('section.active')}</h3>
      {running.length === 0 ? <p className="df-note">{t('section.none')}</p> : (
        <div className="df-card">
          {running.map((agent) => (
            <div key={agent.id} className="df-line">
              <span>{agent.id} · {agent.kind === 'accept' ? t('slot.accept') : t('slot.dev')} · {taskTitle(data, agent.taskId)}</span>
              <span className="df-meta">{slotSummary(data, agent)}</span>
            </div>
          ))}
        </div>
      )}
      {dev || accept ? <p className="df-note">{`${t('slot.dev')} ${dev?.used ?? 0}/${dev?.total ?? 0} · ${t('slot.accept')} ${accept?.used ?? 0}/${accept?.total ?? 0}`}</p> : null}
    </>
  )
}

function Tasks({
  ui, data, t, picked, setPicked, sessionId, call, reload, show,
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
}) {
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [devHeight, setDevHeight] = useState(240)
  const splitRef = useRef<HTMLDivElement | null>(null)
  const devAll = data.tasks.filter((task) => task.kind !== 'accept')
  const devRows = devAll.filter((task) => matchFilter(filter, task))
  const acceptRows = data.tasks.filter((task) => task.kind === 'accept')
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
  const dragSplit = (event: React.PointerEvent<HTMLButtonElement>) => {
    const startY = event.clientY
    const startHeight = devHeight
    const bounds = splitRef.current?.getBoundingClientRect()
    const limit = bounds ? bounds.height - 140 : 480
    const move = (next: PointerEvent) => {
      setDevHeight(Math.min(limit, Math.max(120, startHeight + next.clientY - startY)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }
  return (
    <div className="df-split" ref={splitRef}>
      <div className="df-pane" style={{ height: devHeight }}>
      <div className="df-filters">
        {filters.map(([value, label]) => {
          const count = devAll.filter((task) => matchFilter(value, task)).length
          const text = `${label} ${count}`
          return ui.Pill
            ? <ui.Pill key={value} active={filter === value} onClick={() => setFilter(value)}>{text}</ui.Pill>
            : <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{text}</button>
        })}
      </div>
      <h3 className="df-section">{t('section.devTasks')}</h3>
      <div className="df-card">
        {devRows.length === 0 ? <div className="df-empty"><p>{t('section.emptyDev')}</p></div> : devRows.map((task) => (
          <TaskLine key={task.id} ui={ui} t={t} task={task} picked={picked} setPicked={setPicked} />
        ))}
      </div>
      <div className="df-foot">
        <ActionButton ui={ui} className="df-go" variant="primary" disabled={busy || reason !== ''} title={reason} onClick={launch}>
          {busy ? t('action.working') : t('action.accept')}
        </ActionButton>
        <p className="df-hint">{reason !== '' ? reason : selected.length > 0 ? `${t('hint.order')}：${selected.map((task) => task.title).join(' → ')}` : t('hint.pick')}</p>
      </div>
      </div>
      <button type="button" className="df-split-bar" aria-label="调整开发任务和验收任务的高度" onPointerDown={dragSplit} />
      <div className="df-pane df-pane-accept">
      <h3 className="df-section">{t('section.acceptTasks')}</h3>
      <div className="df-card">
        {acceptRows.length === 0 ? <div className="df-empty"><p>{t('section.emptyAccept')}</p></div> : acceptRows.map((batch) => {
          const open = opened[batch.id] ?? batch.status === 'accepting'
          const children = containedTasks(data, batch)
          return (
            <div key={batch.id}>
              <TaskLine
                ui={ui}
                t={t}
                task={batch}
                picked={picked}
                setPicked={setPicked}
                sessionId={sessionId}
                call={call}
                reload={reload}
                open={open}
                onToggle={() => setOpened({ ...opened, [batch.id]: !open })}
              />
              {open ? (
                <div className="df-nested">
                  {children.map((task) => (
                    <TaskLine key={task.id} ui={ui} t={t} task={task} picked={picked} setPicked={setPicked} nested />
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

function TaskLine({
  ui, t, task, picked, setPicked, sessionId, call, reload, nested = false, open, onToggle,
}: {
  ui: UiKit
  t: Translate
  task: TaskRow
  picked: string[]
  setPicked: (next: string[]) => void
  sessionId?: string
  call?: Call
  reload?: (failure?: unknown) => unknown
  nested?: boolean
  open?: boolean
  onToggle?: () => void
}) {
  const chosen = !nested && task.selectable && picked.includes(task.id)
  const toggle = () => { if (!nested && task.selectable) setPicked(togglePick(picked, task.id)) }
  return (
    <div className="df-task" data-pick={!nested && task.selectable ? 'true' : 'false'} data-on={chosen ? 'true' : 'false'} onClick={toggle}>
      {!nested && task.selectable
        ? <input className="df-check" type="checkbox" checked={chosen} onClick={(event) => event.stopPropagation()} onChange={toggle} />
        : <Dot ui={ui} state={dotOf(task.status)} />}
      <div>
        <div className="df-name">
          {onToggle ? <button type="button" className="df-chev" aria-expanded={open} onClick={(event) => { event.stopPropagation(); onToggle() }}>{open ? '▾' : '▸'}</button> : null}
          {task.title}
        </div>
        <div className="df-meta">{taskMeta(task, t)}</div>
      </div>
      <div className="df-actions">
        <StatusTag ui={ui} t={t} status={task.status} />
        {!nested && task.kind === 'accept' && task.status === 'accepting' && call && reload ? (
          <>
            <ActionButton ui={ui} onClick={(event) => { event.stopPropagation(); finish(call, sessionId, task.id, 'accepted', reload) }}>{t('action.pass')}</ActionButton>
            <ActionButton ui={ui} onClick={(event) => { event.stopPropagation(); finish(call, sessionId, task.id, 'rejected', reload) }}>{t('action.fail')}</ActionButton>
          </>
        ) : null}
      </div>
    </div>
  )
}

function containedTasks(data: Snapshot, batch: TaskRow) {
  const ids = batch.taskIds ?? []
  const fromIds = ids
    .map((id) => data.tasks.find((task) => task.kind !== 'accept' && task.id === id))
    .filter((task): task is TaskRow => task !== undefined)
  if (fromIds.length > 0) return fromIds
  return data.tasks.filter((task) => task.kind !== 'accept' && task.batchId === batch.id)
}

function Slots({ ui, data, t }: { ui: UiKit, data: Snapshot, t: Translate }) {
  const dev = data.counts.devSlots
  const accept = data.counts.acceptSlots
  return (
    <>
      <p className="df-note">{`${t('slot.dev')} ${dev?.used ?? 0}/${dev?.total ?? 0} · ${t('slot.accept')} ${accept?.used ?? 0}/${accept?.total ?? 0}`}</p>
      {data.repos.map((repo) => (
        <section key={repo.name} className="df-card">
          <div className="df-repo">
            <strong>{repo.name}</strong>
            {' '}
            <span className={repo.dirty ? 'df-warn' : 'df-ok'}>{repo.dirty ? t('trunk.dirty') : t('trunk.clean')}</span>
          </div>
          {repo.devSlots.length === 0 ? <SlotLine t={t} kind="dev" state="missing" detail={t('slot.noDev')} /> : repo.devSlots.map((slot) => (
            <SlotLine key={slot.number} t={t} kind="dev" number={slot.number} state={slot.taskId ? 'busy' : 'free'} detail={devDetail(data, repo, slot, t)} />
          ))}
          <SlotLine
            t={t}
            kind="accept"
            number={repo.acceptSlot?.number}
            state={repo.acceptSlot ? (repo.acceptSlot.batchId ? 'busy' : 'free') : 'missing'}
            detail={acceptDetail(repo, t)}
          />
        </section>
      ))}
    </>
  )
}

function SlotLine({ t, kind, number, state, detail }: { t: Translate, kind: 'dev' | 'accept', number?: string, state: 'busy' | 'free' | 'missing', detail: string }) {
  const label = `${kind === 'dev' ? t('slot.dev') : t('slot.accept')} ${number ?? ''}`.trim()
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
      <p className="df-note">{`${t('metric.agents')} ${data.counts.activeAgents}/${data.counts.agentLimit}`}</p>
      <div className="df-card">
        {rows.map((agent) => (
          <div key={agent.id} className="df-agent">
            <Dot ui={ui} state={agent.status === 'running' ? 'ongoing' : 'idle'} />
            <div>
              <div className="df-name">{agent.id}</div>
              <div className="df-meta">{agentDetail(data, agent, t)}</div>
            </div>
            <StatusTag ui={ui} t={t} status={agent.status === 'running' ? 'running' : agent.status === 'lead' ? 'lead' : 'idle'} />
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
      : status === 'pending-merge' ? 'warning'
      : status === 'developing' || status === 'running' ? 'info'
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
  if (!draft) return <p className="df-note">{message || '…'}</p>
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

function finish(call: Call, sessionId: string | undefined, id: string, result: 'accepted' | 'rejected', reload: (failure?: unknown) => unknown) {
  call('accept-finish', { sessionId, id, result }).then(() => reload()).catch((reason: unknown) => reload(reason))
}

function togglePick(picked: string[], id: string) {
  return picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id]
}

function dotOf(status: string) {
  if (status === 'developing') return 'ongoing'
  if (status === 'failed') return 'error'
  if (status === 'accepted' || status === 'merged') return 'done'
  if (status === 'pending-merge') return 'warning'
  if (status === 'waiting' || status === 'pending-acceptance' || status === 'accepting') return 'warning'
  return 'idle'
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

function slotSummary(data: Snapshot, agent: AgentRow) {
  const task = data.tasks.find((item) => item.id === agent.taskId)
  if (!task?.slots) return ''
  return Object.entries(task.slots).map(([repo, slot]) => slot.number ? `${repo}-${slot.number}` : `${repo} ${slot.port ?? ''}`).join('、')
}

function taskMeta(task: TaskRow, t: Translate) {
  const slots = Object.entries(task.slots ?? {}).map(([repo, slot]) => {
    if (slot.port) return `${repo} ${t('slot.accept')} · ${t('status.accepting') === '待确认' ? '端口' : 'port'} ${slot.port}`
    return [slot.number ? `${repo}-${slot.number}` : repo, slot.branch].filter(Boolean).join(' · ')
  })
  if (task.batchId && task.kind === 'dev') slots.push(`${t('status.accepting') === '待确认' ? '批次' : 'batch'} ${task.batchId}`)
  if (task.warnings?.length) slots.push(task.warnings.join('，'))
  return slots.join(' · ')
}

function devDetail(data: Snapshot, repo: RepoRow, slot: DevSlot, t: Translate) {
  if (!slot.taskId) return t('slot.reusable')
  const title = taskTitle(data, slot.taskId)
  return [title, slot.branch].filter(Boolean).join(' · ')
}

function acceptDetail(repo: RepoRow, t: Translate) {
  if (!repo.acceptSlot) return t('slot.noAccept')
  if (!repo.acceptSlot.batchId) return repo.acceptSlot.port ? `${t('status.accepting') === '待确认' ? '端口' : 'port'} ${repo.acceptSlot.port}` : t('slot.free')
  return [`${t('status.accepting') === '待确认' ? '端口' : 'port'} ${repo.acceptSlot.port ?? ''}`, repo.acceptSlot.batchId].filter(Boolean).join(' · ')
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

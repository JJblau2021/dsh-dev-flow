import type React from 'react'
import { useEffect, useState } from 'react'
import type { UiKit } from '../ui'
import type { Call, ScheduleRow, Snapshot, TaskDiff, TaskDiffFile, TaskRow, Translate, TokenUsage } from '../types'
import { TaskItem } from './TaskItem'
import { Alert, Empty, IconAcceptTask, IconAction, IconBadgeCheck, IconCancel, IconCircleCheck, IconCircleX, IconDevTask, IconSchedule, IconSelectAll, IconTrash, Item, SplitGroup, Status } from './parts'
import type { PaneDef } from './parts'
import { branchText, slotText, timeText, usageText, AcceptCard, ScheduleCard, TaskCard } from './cards'
import { openTaskOrder, statusText, toneOf } from './status'
import css from './ui.module.css'

type Pick =
  | { kind: 'schedule', schedule: ScheduleRow }
  | { kind: 'task', task: TaskRow }





export function Tasks({ data, t, call, sessionId, focus, reload, ui }: {
  data: Snapshot
  t: Translate
  call: Call
  sessionId?: string
  /** 从概览点进来的任务：切页后自动选中并展开详情。 */
  focus?: { id: string, tick: number } | null
  /** 操作完成后重新拉一次快照。 */
  reload: () => void | Promise<void>
  /** DSH 组件（Tooltip 等）。 */
  ui?: UiKit
}) {
  const [picked, setPicked] = useState<Pick | null>(null)
  const [diff, setDiff] = useState<TaskDiff | null>(null)
  const [pickTick, setPickTick] = useState(0)
  /** null = 普通浏览；delete / accept = 正在批量选择。 */
  const [mode, setMode] = useState<'delete' | 'accept' | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const tasks = data.tasks ?? []
  const schedules = data.schedules ?? []
  const newest = (a: TaskRow, b: TaskRow) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  const dev = tasks
    .filter((task) => task.kind !== 'accept')
    .sort((a, b) => openTaskOrder(a.status) - openTaskOrder(b.status) || newest(a, b))
  const accept = tasks
    .filter((task) => task.kind === 'accept')
    .sort((a, b) => (a.status === 'accepting' ? 0 : 1) - (b.status === 'accepting' ? 0 : 1) || newest(a, b))

  const pickedTask = picked?.kind === 'task' ? picked.task : null
  const pickedSchedule = picked?.kind === 'schedule' ? picked.schedule : null
  const pickedId = picked?.kind === 'task' ? picked.task.id : picked?.schedule.id ?? null

  useEffect(() => {
    setDiff(null)
    if (!pickedTask || pickedTask.kind === 'accept') return undefined
    let alive = true
    call('task-diff', { sessionId, taskId: pickedTask.id })
      .then((value) => { if (alive) setDiff((value as TaskDiff | undefined) ?? null) })
      .catch(() => { if (alive) setDiff(null) })
    return () => { alive = false }
  }, [pickedTask?.id, pickedTask?.kind, sessionId, call])

  useEffect(() => {
    if (!focus) return
    const task = (data.tasks ?? []).find((item) => item.id === focus.id)
    if (task) pickTask(task)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.tick])

  const pickTask = (task: TaskRow) => {
    // 子行可能只带精简字段（依赖行只有 id/title/status/branch），优先用顶层完整对象。
    const full = tasks.find((item) => item.id === task.id) ?? task
    setPicked({ kind: 'task', task: full })
    setPickTick((value) => value + 1)
  }
  const pickSchedule = (schedule: ScheduleRow) => {
    setPicked({ kind: 'schedule', schedule })
    setPickTick((value) => value + 1)
  }

  const run = async (endpoint: string, payload: Record<string, unknown>) => {
    if (busy) return
    setBusy(true)
    setNote('')
    try {
      const result = await call(endpoint, { sessionId, ...payload }) as { deleteWarnings?: string[] } | undefined
      const warnings = result?.deleteWarnings ?? []
      if (warnings.length > 0) setNote(warnings.join('；'))
      setMode(null)
      setChosen([])
      await reload()
    } catch (reason) {
      setNote(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const startMode = (next: 'delete' | 'accept') => {
    setMode(next)
    setChosen([])
    setNote('')
  }

  const canPick = (task: TaskRow) => (mode === 'delete' ? task.deletable === true : task.selectable === true)

  const togglePick = (task: TaskRow) => {
    if (!canPick(task)) {
      setNote(mode === 'delete'
        ? t('note.notDeletable')
        : t('note.notSelectable'))
      return
    }
    setChosen((prev) => (prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id]))
  }

  const confirmBatch = () => {
    if (chosen.length === 0) return
    if (mode === 'delete') {
      void run('task-delete', { ids: chosen })
      return
    }
    void run('accept-start', { id: `b-${Date.now().toString(36)}`, taskIds: chosen })
  }

  const panes: PaneDef[] = [
    {
      key: 'schedule',
      title: t('section.scheduleTasks'),
      count: schedules.length,
      actions: (
        <span className={css.headStatus}>
          <Status
            tone="ok"
            label={`${t('section.scheduleEvery')}　${t('fact.concurrency')} ${data.counts.activeAgents}/${data.counts.agentLimit}`}
          />
        </span>
      ),
      content: <SchedulePane schedules={schedules} t={t} pickedId={pickedId} onPick={pickSchedule} />,
    },
    {
      key: 'dev',
      title: t('section.devTasks'),
      count: dev.length,
      content: (
        <>
          <div className={css.actionbar}>
            <span className={css.actionbarText}>
              {mode === null ? '' : (note !== '' ? note : `${t('note.selected')} ${chosen.length}`)}
            </span>
            {mode === null
              ? (
                <>
                  <IconAction ui={ui} label={t('action.accept')} icon={<IconBadgeCheck />} onClick={() => startMode('accept')} />
                  <IconAction ui={ui} label={t('action.batchDelete')} icon={<IconTrash />} onClick={() => startMode('delete')} />
                </>
              )
              : (
                <>
                  <IconAction ui={ui} label={t('action.cancel')} icon={<IconCancel />} onClick={() => { setMode(null); setChosen([]); setNote('') }} />
                  <IconAction ui={ui} label={t('action.selectAll')} icon={<IconSelectAll />} onClick={() => setChosen(dev.filter(canPick).map((task) => task.id))} />
                  <IconAction
                    ui={ui}
                    label={busy
                      ? (mode === 'delete' ? t('action.deleting') : t('action.working'))
                      : `${mode === 'delete' ? t('action.batchDelete') : t('action.accept')} ${chosen.length}`}
                    icon={mode === 'delete' ? <IconTrash /> : <IconBadgeCheck />}
                    disabled={busy || chosen.length === 0}
                    tone={mode === 'delete' ? 'danger' : 'primary'}
                    onClick={confirmBatch}
                  />
                </>
              )}
          </div>
          {dev.length === 0
            ? <Empty text={t('section.emptyDev')} />
            : dev.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                t={t}
                variant="dev"
                mode={mode}
                picked={mode === null ? undefined : chosen.includes(task.id)}
                selected={pickedTask?.id === task.id}
                onSelect={() => (mode === null ? pickTask(task) : togglePick(task))}
                ui={ui}
                busy={busy}
                onAction={mode === null
                  ? (action) => {
                    if (action === 'delete') void run('task-delete', { ids: [task.id] })
                    else void run('accept-start', { id: `b-${Date.now().toString(36)}`, taskIds: [task.id] })
                  }
                  : undefined}
              />
            ))}
        </>
      ),
    },
    {
      key: 'accept',
      title: t('section.acceptTasks'),
      count: accept.length,
      content: accept.length === 0
        ? <Empty text={t('section.emptyAccept')} />
        : accept.map((batch) => (
          <TaskItem
            key={batch.id}
            task={batch}
            t={t}
            variant="accept"
            ui={ui}
            busy={busy}
            contained={containedTasks(tasks, batch)}
            onJudge={(child, result) => { void run('accept-task', { id: batch.id, taskId: child.id, result }) }}
            selected={pickedTask?.id === batch.id}
            onSelect={() => pickTask(batch)}
          />
        )),
    },
    {
      key: 'detail',
      title: t('action.detail'),
      content: pickedTask
        ? (
          <DetailPane
            task={pickedTask}
            diff={diff}
            t={t}
            ui={ui}
            busy={busy}
            onPick={pickTask}
            contained={pickedTask.kind === 'accept' ? containedTasks(tasks, pickedTask) : undefined}
            onAction={(action) => {
              const endpoint = { pause: 'task-pause', resume: 'task-resume', stop: 'task-stop', merge: 'task-merge', delete: 'task-delete' }[action]
              if (action === 'delete') void run('task-delete', { ids: [pickedTask.id] })
              else void run(endpoint, { taskId: pickedTask.id })
            }}
            onJudge={(child, result) => { void run('accept-task', { id: pickedTask.id, taskId: child.id, result }) }}
          />
        )
        : pickedSchedule
          ? <ScheduleDetail schedule={pickedSchedule} t={t} />
          : <Empty text={t('section.emptyDetail')} />,
    },
  ]

  return <SplitGroup panes={panes} expandKey="detail" expandSignal={pickTick} />
}

/* ── 调度 ─────────────────────────────────────────────────────────── */

function SchedulePane({
  schedules, t, pickedId, onPick,
}: {
  schedules: ScheduleRow[]
  t: Translate
  pickedId: string | null
  onPick: (schedule: ScheduleRow) => void
}) {
  if (schedules.length === 0) return <Empty text={t('section.emptySchedule')} />
  return (
    <>
      {schedules.map((schedule) => {
        const target = schedule.slots?.[0]
        return (
          <Item
            key={schedule.id}
            icon={<IconSchedule />}
            title={schedule.title}
            titleAttr={schedule.title}
            suffix={[
              schedule.baseGroup,
              target ? [target.repo, target.number].filter(Boolean).join('/') : undefined,
            ].filter(Boolean).join('　') || undefined}
            trail={<Status tone={toneOf(schedule.status)} label={statusText(t, schedule.status)} />}
            selected={pickedId === schedule.id}
            onClick={() => onPick(schedule)}
            card={<ScheduleCard schedule={schedule} t={t} />}
          />
        )
      })}
    </>
  )
}

/* ── 开发任务 ─────────────────────────────────────────────────────── */

/* ── 验收批次 ─────────────────────────────────────────────────────── */

function AcceptRow({
  batch, tasks, t, selected, onSelect,
}: {
  batch: TaskRow
  tasks: TaskRow[]
  t: Translate
  selected: boolean
  onSelect: () => void
}) {
  const contained = containedTasks(tasks, batch)
  const passed = contained.filter((task) => task.status === 'accepted' || task.acceptance === 'accepted').length
  const total = contained.length || (batch.taskIds ?? []).length
  return (
    <Item
      icon={<IconAcceptTask />}
      title={batch.title}
      titleAttr={batch.title}
      trail={<span className={css.progress}>{`${passed}/${total}`}</span>}
      selected={selected}
      onClick={onSelect}
      card={<AcceptCard batch={batch} contained={contained} t={t} />}
    />
  )
}

/* ── 详情 ─────────────────────────────────────────────────────────── */

function containedTasks(tasks: TaskRow[], batch: TaskRow): TaskRow[] {
  const ids = batch.taskIds ?? []
  const fromIds = ids
    .map((id) => tasks.find((task) => task.kind !== 'accept' && task.id === id))
    .filter((task): task is TaskRow => task !== undefined)
  const rows = fromIds.length > 0
    ? fromIds
    : tasks.filter((task) => task.kind !== 'accept' && task.batchId === batch.id)
  return rows.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

function kv(label: string, value: React.ReactNode) {
  return (
    <div className={css.kvRow}>
      <span className={css.kvLabel}>{label}</span>
      <span className={css.kvValue}>{value}</span>
    </div>
  )
}

function fileList(files: TaskDiffFile[], t: Translate) {
  return (
    <div className={css.fileList}>
      {files.map((file) => (
        <div key={`${file.repo}:${file.path}`} className={css.fileRow}>
          <span className={css.filePath}>{file.binary ? `${file.path}（binary）` : file.path}</span>
          <span className={css.fileAdd}>{`+${file.added}`}</span>
          <span className={css.fileDel}>{`-${file.deleted}`}</span>
        </div>
      ))}
    </div>
  )
}

function DetailPane({ task, diff, t, ui, contained, onPick, onAction, onJudge, busy }: {
  task: TaskRow
  diff: TaskDiff | null
  t: Translate
  ui?: UiKit
  contained?: TaskRow[]
  onPick?: (task: TaskRow) => void
  onAction?: (action: 'pause' | 'resume' | 'stop' | 'merge' | 'delete') => void
  onJudge?: (child: TaskRow, result: 'accepted' | 'rejected') => void
  busy?: boolean
}) {
  const files = diff?.files ?? []
  const entries = Object.entries(task.bases ?? {})
  const base = entries.length > 0
    ? entries.map(([repo, branch]) => `${repo} ${branch}`).join('　')
    : (task.base ?? '—')
  const isBatch = task.kind === 'accept'
  const deps = task.dependsOn ?? []
  return (
    <div className={css.detail}>
      <div className={css.detailHead}>
        <span className={css.detailHeadIcon}>{isBatch ? <IconAcceptTask /> : <IconDevTask />}</span>
        <span className={css.detailHeadTitle} title={task.title}>{task.title}</span>
        <Status tone={toneOf(task.status)} label={statusText(t, task.status)} />
        {onAction === undefined && onJudge === undefined ? null : (
          <span className={css.detailActions}>
            {actionsFor(task, isBatch, t, onAction, busy)}
          </span>
        )}
      </div>
      {task.warnings && task.warnings.length > 0 ? <Alert items={task.warnings} /> : null}
      <div className={css.kvGrid}>
        {kv(t('fact.slot'), slotText(task) || '—')}
        {kv(t('fact.branch'), Object.values(task.slots ?? {})[0]?.branch || '—')}
        {kv(t('fact.base'), base)}
        {kv(t('fact.usage'), usageText(task.usage) || '—')}
        {kv(t('fact.createdAt'), timeText(task.createdAt) || '—')}
        {task.pausedAt ? kv(t('fact.paused'), task.pausedAt) : null}
        {task.stoppedAt ? kv(t('fact.stopped'), task.stoppedAt) : null}
        {isBatch && contained && contained.length > 0 ? kv(t('section.devTasks'), String(contained.length)) : null}
        {!isBatch && deps.length > 0 ? kv(t('fact.depends'), String(deps.length)) : null}
        {files.length > 0 ? kv(t('fact.changeFiles'), String(files.length)) : null}
      </div>
      {isBatch && contained && contained.length > 0
        ? (
          <div className={css.detailList}>
            {contained.map((child) => (
              <TaskItem
                key={child.id}
                task={child}
                t={t}
                variant="dev"
                selected={false}
                onSelect={() => onPick?.(child)}
                actions={onJudge === undefined || task.status !== 'accepting'
                  ? undefined
                  : (
                    <>
                      <IconAction
                        ui={ui}
                        label={t('action.fail')}
                        icon={<IconCircleX />}
                        disabled={busy}
                        onClick={(event) => { event.stopPropagation(); onJudge(child, 'rejected') }}
                      />
                      <IconAction
                        ui={ui}
                        label={t('action.pass')}
                        icon={<IconCircleCheck />}
                        disabled={busy}
                        onClick={(event) => { event.stopPropagation(); onJudge(child, 'accepted') }}
                      />
                    </>
                  )}
              />
            ))}
          </div>
        )
        : null}
      {!isBatch && deps.length > 0
        ? (
          <div className={css.detailList}>
            {deps.map((dep) => (
              <Item
                key={dep.id}
                icon={<IconDevTask />}
                title={dep.title}
                titleAttr={dep.title}
                suffix={dep.merged ? t('fact.merged') : t('fact.notMerged')}
                trail={<Status tone={toneOf(dep.status)} label={statusText(t, dep.status)} />}
                onClick={onPick ? () => onPick(dep as unknown as TaskRow) : undefined}
              />
            ))}
          </div>
        )
        : null}
      {files.length > 0 ? fileList(files, t) : null}
    </div>
  )
}

function actionsFor(
  task: TaskRow,
  isBatch: boolean,
  t: Translate,
  onAction?: (action: 'pause' | 'resume' | 'stop' | 'merge' | 'delete') => void,
  busy?: boolean,
) {
  if (onAction === undefined || isBatch) return null
  const buttons: { key: 'pause' | 'resume' | 'stop' | 'merge' | 'delete', label: string, danger?: boolean }[] = []
  if (task.pausedAt) buttons.push({ key: 'resume', label: t('action.resume') })
  else if (task.status === 'developing') buttons.push({ key: 'pause', label: t('action.pause') })
  if (task.status === 'developing' || task.pausedAt) buttons.push({ key: 'stop', label: t('action.stop') })
  if (task.status === 'pending-merge') buttons.push({ key: 'merge', label: t('action.merge') })
  if (task.deletable) buttons.push({ key: 'delete', label: t('action.delete'), danger: true })
  if (buttons.length === 0) return null
  return buttons.map((button) => (
    <button
      key={button.key}
      type="button"
      className={`${css.btn} ${button.danger ? css.btnDanger : css.btnPrimary}`}
      disabled={busy}
      onClick={() => onAction(button.key)}
    >
      {button.label}
    </button>
  ))
}

function ScheduleDetail({ schedule, t }: { schedule: ScheduleRow, t: Translate }) {
  const target = schedule.slots?.[0]
  const slots = (schedule.slots ?? [])
    .map((slot) => [slot.repo, slot.number].filter(Boolean).join('/'))
    .filter((value) => value !== '')
  return (
    <div className={css.detail}>
      <div className={css.detailHead}>
        <span className={css.detailHeadIcon}><IconSchedule /></span>
        <span className={css.detailHeadTitle} title={schedule.title}>{schedule.title}</span>
        <Status tone={toneOf(schedule.status)} label={statusText(t, schedule.status)} />
      </div>
      <div className={css.kvGrid}>
        {kv(t('fact.base'), schedule.base ?? schedule.baseGroup ?? '—')}
        {kv(t('fact.slot'), slots.join('　') || (target ? [target.repo, target.number].filter(Boolean).join('/') : '—'))}
        {kv(t('fact.taskCount'), `${schedule.taskIds.length}`)}
        {kv(t('fact.usage'), usageText(schedule.usage) || '—')}
      </div>
    </div>
  )
}

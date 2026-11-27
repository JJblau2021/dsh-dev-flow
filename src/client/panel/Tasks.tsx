import type React from 'react'
import { useEffect, useState } from 'react'
import type { Call, ScheduleRow, Snapshot, TaskDiff, TaskDiffFile, TaskRow, Translate, TokenUsage } from '../types'
import { Empty, IconAcceptTask, IconDevTask, Item, SplitGroup, Status } from './parts'
import type { PaneDef } from './parts'
import { openTaskOrder, statusText, toneOf } from './status'
import css from './ui.module.css'

type Pick =
  | { kind: 'schedule', schedule: ScheduleRow }
  | { kind: 'task', task: TaskRow }

function usageText(usage?: TokenUsage | null): string {
  if (!usage || usage.totalTokens <= 0) return ''
  if (usage.totalTokens >= 1000) return `${(usage.totalTokens / 1000).toFixed(1)}k`
  return String(usage.totalTokens)
}

function slotText(task: TaskRow): string {
  const entries = Object.entries(task.slots ?? {})
  if (entries.length > 0) return entries.map(([repo, slot]) => `${repo}/${slot.number ?? ''}`).join('　')
  return (task.repos ?? []).join('　')
}

export function Tasks({ data, t, call, sessionId, focus }: {
  data: Snapshot
  t: Translate
  call: Call
  sessionId?: string
  /** 从概览点进来的任务：切页后自动选中并展开详情。 */
  focus?: { id: string, tick: number } | null
}) {
  const [picked, setPicked] = useState<Pick | null>(null)
  const [diff, setDiff] = useState<TaskDiff | null>(null)
  const [pickTick, setPickTick] = useState(0)

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
      content: dev.length === 0
        ? <Empty text={t('section.emptyDev')} />
        : dev.map((task) => (
          <DevRow
            key={task.id}
            task={task}
            t={t}
            selected={pickedTask?.id === task.id}
            onSelect={() => pickTask(task)}
          />
        )),
    },
    {
      key: 'accept',
      title: t('section.acceptTasks'),
      count: accept.length,
      content: accept.length === 0
        ? <Empty text={t('section.emptyAccept')} />
        : accept.map((batch) => (
          <AcceptRow
            key={batch.id}
            batch={batch}
            tasks={tasks}
            t={t}
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
            onPick={pickTask}
            contained={pickedTask.kind === 'accept' ? containedTasks(tasks, pickedTask) : undefined}
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
            icon={<span className={css.suffix}>{schedule.baseGroup ?? '·'}</span>}
            title={schedule.title}
            titleAttr={schedule.title}
            suffix={target ? [target.repo, target.number].filter(Boolean).join('/') : undefined}
            trail={<Status tone={toneOf(schedule.status)} label={statusText(t, schedule.status)} />}
            selected={pickedId === schedule.id}
            onClick={() => onPick(schedule)}
          />
        )
      })}
    </>
  )
}

/* ── 开发任务 ─────────────────────────────────────────────────────── */

function DevRow({
  task, t, selected, onSelect,
}: {
  task: TaskRow
  t: Translate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Item
      icon={<IconDevTask />}
      title={task.title}
      titleAttr={task.title}
      suffix={slotText(task)}
      trail={<Status tone={toneOf(task.status)} label={statusText(t, task.status)} />}
      selected={selected}
      onClick={onSelect}
    />
  )
}

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
      <p className={css.detailTitle}>{`${t('fact.changeFiles')} ${files.length}`}</p>
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

function DetailPane({ task, diff, t, contained, onPick }: {
  task: TaskRow
  diff: TaskDiff | null
  t: Translate
  contained?: TaskRow[]
  onPick?: (task: TaskRow) => void
}) {
  const files = diff?.files ?? []
  const entries = Object.entries(task.bases ?? {})
  const base = entries.length > 0
    ? entries.map(([repo, branch]) => `${repo} ${branch}`).join('　')
    : (task.base ?? '—')
  const batchIds = task.taskIds ?? []
  const isBatch = task.kind === 'accept'
  const deps = task.dependsOn ?? []
  return (
    <div className={css.detail}>
      <div className={css.detailHead}>
        <span className={css.detailHeadTitle} title={task.title}>{task.title}</span>
        <Status tone={toneOf(task.status)} label={statusText(t, task.status)} />
      </div>
      <div className={css.kvGrid}>
        {kv(t('fact.slot'), slotText(task) || '—')}
        {kv(t('fact.branch'), Object.values(task.slots ?? {})[0]?.branch || '—')}
        {kv(t('fact.base'), base)}
        {kv(t('fact.usage'), usageText(task.usage) || '—')}
        {isBatch ? kv(t('fact.batch'), `${batchIds.length}`) : null}
        {task.pausedAt ? kv(t('fact.paused'), task.pausedAt) : null}
        {task.stoppedAt ? kv(t('fact.stopped'), task.stoppedAt) : null}
      </div>
      {isBatch && contained && contained.length > 0
        ? (
          <div className={css.fileList}>
            <p className={css.detailTitle}>{`${t('section.devTasks')} ${contained.length}`}</p>
            {contained.map((child) => (
              <div
                key={child.id}
                className={`${css.fileRow} ${onPick ? css.fileRowAction : ''}`}
                onClick={onPick ? () => onPick(child) : undefined}
              >
                <span className={css.filePath}>{child.title}</span>
                <Status tone={toneOf(child.status)} label={statusText(t, child.status)} />
              </div>
            ))}
          </div>
        )
        : null}
      {!isBatch && deps.length > 0
        ? (
          <div className={css.fileList}>
            <p className={css.detailTitle}>{`${t('fact.depends')} ${deps.length}`}</p>
            {deps.map((dep) => (
              <div
                key={dep.id}
                className={`${css.fileRow} ${onPick ? css.fileRowAction : ''}`}
                onClick={onPick ? () => onPick(dep as unknown as TaskRow) : undefined}
              >
                <span className={css.filePath}>
                  {`${dep.title}　${dep.merged ? t('fact.merged') : t('fact.notMerged')}`}
                </span>
                <Status tone={toneOf(dep.status)} label={statusText(t, dep.status)} />
              </div>
            ))}
          </div>
        )
        : null}
      {task.warnings && task.warnings.length > 0 ? kv(t('fact.warning'), task.warnings.join('；')) : null}
      {files.length > 0 ? fileList(files, t) : null}
    </div>
  )
}

function ScheduleDetail({ schedule, t }: { schedule: ScheduleRow, t: Translate }) {
  const target = schedule.slots?.[0]
  const slots = (schedule.slots ?? [])
    .map((slot) => [slot.repo, slot.number].filter(Boolean).join('/'))
    .filter((value) => value !== '')
  return (
    <div className={css.detail}>
      <div className={css.detailHead}>
        <span className={css.detailHeadTitle} title={schedule.title}>{schedule.title}</span>
        <Status tone={toneOf(schedule.status)} label={statusText(t, schedule.status)} />
      </div>
      <div className={css.kvGrid}>
        {kv(t('fact.base'), schedule.base ?? schedule.baseGroup ?? '—')}
        {kv(t('fact.slot'), slots.join('　') || (target ? [target.repo, target.number].filter(Boolean).join('/') : '—'))}
        {kv(t('fact.batch'), `${schedule.taskIds.length}`)}
        {kv(t('fact.usage'), usageText(schedule.usage) || '—')}
      </div>
    </div>
  )
}

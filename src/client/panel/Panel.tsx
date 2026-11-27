import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Call, ProjectRow, Snapshot, TaskRow, Translate } from '../types'
import { normalizeSnapshot } from '../snapshot'
import { Boundary, Empty, IconAcceptTask, IconDevTask, IconRefresh, IconRepo, Item, Pairs, SplitGroup, Status } from './parts'
import { Tasks } from './Tasks'
import { Slots } from './Slots'
import { Bases } from './Bases'
import { Agents } from './Agents'
import { isOpenTask, openTaskOrder, statusText, toneOf } from './status'
import css from './ui.module.css'

type PageId = 'overview' | 'tasks' | 'slots' | 'bases' | 'agents'

const PAGES: PageId[] = ['overview', 'tasks', 'slots', 'bases', 'agents']

function textOf(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}

function stamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function Panel({ sessionId, call, t }: { sessionId?: string, call: Call, t: Translate, ui?: unknown, openDiff?: unknown }) {
  const [page, setPage] = useState<PageId>('overview')
  // 从概览点任务跳过来时携带的意图（id + 递增 tick），任务页消费它来选中并展开详情。
  const [focus, setFocus] = useState<{ id: string, tick: number } | null>(null)
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [at, setAt] = useState(() => new Date())
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  // 兜底：用捕获阶段的点击代理来跳转，避免行内 handler 被事件系统吞掉。
  const root = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = root.current
    if (!node) return
    const onCapture = (event: Event) => {
      const target = event.target as HTMLElement | null
      const row = target?.closest?.('[data-task-id]') as HTMLElement | null
      if (!row) return
      const id = row.getAttribute('data-task-id')
      if (!id) return
      setFocus({ id, tick: Date.now() })
      setPage('tasks')
    }
    node.addEventListener('click', onCapture, true)
    return () => node.removeEventListener('click', onCapture, true)
  }, [])

  const load = (failure?: unknown) => call('snapshot', { sessionId })
    .then((value) => {
      if (!alive.current) return
      const snapshot = normalizeSnapshot(value)
      setData(snapshot)
      setAt(new Date())
      setError(failure ? textOf(failure) : (snapshot?.problem ?? ''))
    })
    .catch((reason: unknown) => { if (alive.current) setError(textOf(reason)) })

  useEffect(() => { void load() }, [sessionId])

  return (
    <div className={css.pane} ref={root}>
      <div className={css.head}>
        {PAGES.map((id) => (
          <button
            key={id}
            type="button"
            className={id === page ? css.tabOn : css.tab}
            aria-current={id === page}
            onClick={() => setPage(id)}
          >
            {t(`page.${id}`)}
          </button>
        ))}
        <span className={css.stamp}>{stamp(at)}</span>
        <button
          type="button"
          className={css.iconButton}
          title={t('action.refresh')}
          aria-label={t('action.refresh')}
          onClick={() => { void load() }}
        >
          <IconRefresh />
        </button>
      </div>
      {error === '' ? null : <p className={css.note} role="status">{error}</p>}
      {data === null
        ? null
        : data.initialized === false
          ? <Empty text={t('empty.init')} />
          : (
            <Boundary>
              {page === 'overview'
                ? <Overview data={data} t={t} onOpenTask={(task) => { setFocus({ id: task.id, tick: Date.now() }); setPage('tasks') }} />
                : page === 'tasks'
                  ? <Tasks data={data} t={t} call={call} sessionId={sessionId} focus={focus} />
                  : page === 'slots'
                    ? <Slots data={data} t={t} />
                    : page === 'bases'
                      ? <Bases data={data} t={t} />
                      : <Agents data={data} t={t} />}
            </Boundary>
          )}
    </div>
  )
}

/* ── 概览 ─────────────────────────────────────────────────────────── */

function Overview({ data, t, onOpenTask }: { data: Snapshot, t: Translate, onOpenTask: (task: TaskRow) => void }) {
  const tasks = (data.tasks ?? [])
    .filter((task) => isOpenTask(task.status))
    .sort((a, b) => openTaskOrder(a.status) - openTaskOrder(b.status))
  const projects = data.projects ?? []
  const counts = data.counts

  const metrics: { key: string, label: string, value: React.ReactNode }[] = [
    { key: 'projects', label: t('nav.projects'), value: counts.projects },
    {
      key: 'agents',
      label: t('metric.agents'),
      value: (
        <>
          {counts.activeAgents}
          <span className={css.metricLabel} style={{ fontSize: 13, marginLeft: 1 }}>{`/${counts.agentLimit ?? 0}`}</span>
        </>
      ),
    },
    { key: 'tasks', label: t('metric.devTasks'), value: counts.activeTasks },
    { key: 'slots', label: t('metric.baseSlots'), value: counts.activeSlots },
    { key: 'pending', label: t('status.pending-acceptance'), value: counts.pending },
    { key: 'dirty', label: t('metric.dirtyBases'), value: counts.dirtyBases },
  ]

  return (
    <div className={css.group} style={{ overflow: 'hidden' }}>
      <div className={css.metrics}>
        {metrics.map((metric) => (
          <div key={metric.key} className={css.metric}>
            <span className={css.metricValue}>{metric.value}</span>
            <span className={css.metricLabel}>{metric.label}</span>
          </div>
        ))}
      </div>
      <SplitGroup
        panes={[
          {
            key: 'open',
            title: t('section.open'),
            count: tasks.length,
            content: tasks.length === 0
              ? <Empty text={t('overview.noTasks')} />
              : tasks.map((task) => (
                <TaskItem key={task.id} task={task} t={t} onOpen={() => onOpenTask(task)} />
              )),
          },
          {
            key: 'projects',
            title: t('nav.projects'),
            count: projects.length,
            content: projects.length === 0
              ? <Empty text={t('overview.noTasks')} />
              : projects.map((project) => (
                <ProjectItem key={project.name} project={project} tasks={tasks} t={t} />
              )),
          },
        ]}
      />
    </div>
  )
}

function TaskItem({ task, t, onOpen }: { task: TaskRow, t: Translate, onOpen: () => void }) {
  return (
    <Item
      icon={task.kind === 'accept' ? <IconAcceptTask /> : <IconDevTask />}
      title={task.title}
      suffix={task.repos[0]}
      trail={<Status tone={toneOf(task.status)} label={statusText(t, task.status)} />}
      titleAttr={`${task.title} · ${t('action.detail')}`}
      onClick={onOpen}
      dataId={task.id}
    />
  )
}

const COUNT_ORDER: { status: string, label: string, tone?: 'err' }[] = [
  { status: 'developing', label: 'status.developing' },
  { status: 'waiting', label: 'status.waiting' },
  { status: 'pending-acceptance', label: 'status.pending-acceptance' },
  { status: 'pending-merge', label: 'status.pending-merge' },
  { status: 'failed', label: 'status.failed', tone: 'err' },
]

function ProjectItem({ project, tasks, t }: { project: ProjectRow, tasks: TaskRow[], t: Translate }) {
  const mine = tasks.filter((task) => task.repos.includes(project.name))
  const pairs = COUNT_ORDER.map((entry) => ({
    label: t(entry.label),
    value: mine.filter((task) => task.status === entry.status).length,
    tone: entry.tone,
  }))
  return (
    <Item
      icon={<IconRepo />}
      title={project.name}
      titleAttr={project.path ?? project.name}
      trail={<Pairs items={pairs} />}
    />
  )
}

import type React from 'react'
import type { ScheduleRow, TaskRow, TokenUsage, Translate } from '../types'
import { Status } from './parts'
import { statusText, toneOf } from './status'
import css from './ui.module.css'

/* ── 文本工具（列表行、详情、气泡共用） ─────────────────────────── */

export function timeText(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function usageText(usage?: TokenUsage | null): string {
  if (!usage || usage.totalTokens <= 0) return ''
  if (usage.totalTokens >= 1000) return `${(usage.totalTokens / 1000).toFixed(1)}k`
  return String(usage.totalTokens)
}

/** 分支名：行右侧与气泡都用它，不再暴露开发槽位号。 */
export function branchText(task: TaskRow): string {
  const branches = Object.values(task.slots ?? {})
    .map((slot) => slot.branch ?? '')
    .filter((branch) => branch !== '')
  return branches.length > 0 ? branches.join('　') : ''
}

export function slotText(task: TaskRow): string {
  const entries = Object.entries(task.slots ?? {})
  if (entries.length > 0) return entries.map(([repo, slot]) => `${repo}/${slot.number ?? ''}`).join('　')
  return (task.repos ?? []).join('　')
}

/* ── 悬停气泡 ───────────────────────────────────────────────────── */

function Row({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className={css.cardRow}>
      <span className={css.cardLabel}>{label}</span>
      <span className={css.cardValue}>{children}</span>
    </div>
  )
}

/** 任务详情气泡：标题 / 分支 / 状态 / 开发槽位 / 基线槽位 / 用量 / 创建于。 */
export function TaskCard({ task, t }: { task: TaskRow, t: Translate }) {
  const base = Object.entries(task.bases ?? {})
    .map(([repo, branch]) => `${repo} ${branch}`)
    .join('　')
  return (
    <>
      <div className={css.cardTitle}>{task.title}</div>
      <Row label={t('fact.branch')}>{branchText(task) || '—'}</Row>
      <Row label={t('fact.state')}>
        <Status tone={toneOf(task.status)} label={statusText(t, task.status)} />
      </Row>
      <Row label={t('fact.slot')}>{slotText(task) || '—'}</Row>
      <Row label={t('fact.base')}>{base || task.base || '—'}</Row>
      <Row label={t('fact.usage')}>{usageText(task.usage) || '—'}</Row>
      <Row label={t('fact.createdAt')}>{timeText(task.createdAt) || '—'}</Row>
    </>
  )
}

/** 验收批次气泡：标题 / 状态 / 开发任务数 / 通过数 / 基线 / 创建于。 */
export function AcceptCard({ batch, contained, t }: { batch: TaskRow, contained: TaskRow[], t: Translate }) {
  const passed = contained.filter((task) => task.status === 'accepted' || task.acceptance === 'accepted').length
  const total = contained.length || (batch.taskIds ?? []).length
  return (
    <>
      <div className={css.cardTitle}>{batch.title}</div>
      <Row label={t('fact.state')}>
        <Status tone={toneOf(batch.status)} label={statusText(t, batch.status)} />
      </Row>
      <Row label={t('section.devTasks')}>{`${total}　·　${t('accept.passed')} ${passed}`}</Row>
      <Row label={t('fact.base')}>{batch.base ?? batch.baseGroup ?? '—'}</Row>
      <Row label={t('fact.usage')}>{usageText(batch.usage) || '—'}</Row>
      <Row label={t('fact.createdAt')}>{timeText(batch.createdAt) || '—'}</Row>
    </>
  )
}

/** 调度任务气泡：标题 / 状态 / 基线 / 目标槽位 / 任务数 / 用量 / 创建于。 */
export function ScheduleCard({ schedule, t }: { schedule: ScheduleRow, t: Translate }) {
  const targets = (schedule.slots ?? [])
    .map((slot) => [slot.repo, slot.number].filter(Boolean).join('/'))
    .filter((text) => text !== '')
  return (
    <>
      <div className={css.cardTitle}>{schedule.title}</div>
      <Row label={t('fact.state')}>
        <Status tone={toneOf(schedule.status)} label={statusText(t, schedule.status)} />
      </Row>
      <Row label={t('fact.base')}>{schedule.base ?? schedule.baseGroup ?? '—'}</Row>
      <Row label={t('fact.slot')}>{targets.join('　') || '—'}</Row>
      <Row label={t('fact.taskCount')}>{String((schedule.taskIds ?? []).length)}</Row>
      <Row label={t('fact.usage')}>{usageText(schedule.usage) || '—'}</Row>
      <Row label={t('fact.createdAt')}>{timeText(schedule.createdAt) || '—'}</Row>
    </>
  )
}

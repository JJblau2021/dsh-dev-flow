import type React from 'react'
import type { TaskRow, Translate } from '../types'
import type { UiKit } from '../ui'
import { AcceptCard, TaskCard, branchText } from './cards'
import {
  IconAcceptTask, IconAction, IconBadgeCheck, IconCheck, IconCircleCheck, IconCircleX,
  IconDevTask, IconTrash, IconTrashOff, Item, Status,
} from './parts'
import { statusText, toneOf } from './status'
import css from './ui.module.css'

export type TaskRowVariant = 'dev' | 'accept' | 'plain'

/**
 * 任务行 + 任务详情气泡：列表页（开发/验收/概览）共用同一套行与气泡，
 * 差别只在图标、右侧内容与悬停操作。
 */
export function TaskItem({
  task, t, ui, variant = 'dev', selected, onSelect, mode, picked, busy,
  onAction, contained, onJudge,
}: {
  task: TaskRow
  t: Translate
  ui?: UiKit
  /** dev = 开发任务（分支后缀 + 发起验收/删除），accept = 验收批次（进度 + 通过/不通过），plain = 概览只读行 */
  variant?: TaskRowVariant
  selected?: boolean
  onSelect?: () => void
  mode?: 'delete' | 'accept' | null
  picked?: boolean
  busy?: boolean
  onAction?: (action: 'accept' | 'delete') => void
  /** 验收批次的子任务，用于气泡里的通过数 */
  contained?: TaskRow[]
  onJudge?: (child: TaskRow, result: 'accepted' | 'rejected') => void
}) {
  const isAccept = variant === 'accept'
  const picking = mode !== null && mode !== undefined
  const icon = picking
    ? (
      <span className={`${css.check} ${picked ? css.checkOn : ''}`}>
        {picked ? <IconCheck size={12} /> : null}
      </span>
    )
    : isAccept ? <IconAcceptTask /> : <IconDevTask />

  const status = <Status tone={toneOf(task.status)} label={statusText(t, task.status)} />
  const card = isAccept
    ? <AcceptCard batch={task} contained={contained ?? []} t={t} />
    : <TaskCard task={task} t={t} />

  if (variant === 'plain') {
    return (
      <Item
        icon={icon}
        title={task.title}
        suffix={branchText(task) || (task.repos ?? [])[0]}
        trail={status}
        titleAttr={`${task.title} · ${t('action.detail')}`}
        onClick={onSelect}
        dataId={task.id}
        card={card}
      />
    )
  }

  const actions = isAccept
    ? (
      onJudge === undefined || task.status !== 'accepting'
        ? null
        : (
          <>
            <IconAction
              ui={ui}
              label={t('action.fail')}
              icon={<IconCircleX />}
              disabled={busy}
              onClick={(event) => { event.stopPropagation(); onJudge(task, 'rejected') }}
            />
            <IconAction
              ui={ui}
              label={t('action.pass')}
              icon={<IconCircleCheck />}
              disabled={busy}
              onClick={(event) => { event.stopPropagation(); onJudge(task, 'accepted') }}
            />
          </>
        )
    )
    : (
      onAction === undefined ? null : (
        <>
          <IconAction
            ui={ui}
            label={t('action.accept')}
            icon={<IconBadgeCheck />}
            disabled={busy || task.selectable !== true}
            onClick={(event) => { event.stopPropagation(); onAction('accept') }}
          />
          <IconAction
            ui={ui}
            label={task.deletable === true ? t('action.delete') : t('action.deleteDisabled')}
            icon={task.deletable === true ? <IconTrash /> : <IconTrashOff />}
            disabled={busy || task.deletable !== true}
            tone="danger"
            onClick={(event) => { event.stopPropagation(); onAction('delete') }}
          />
        </>
      )
    )

  return (
    <Item
      icon={icon}
      title={task.title}
      titleAttr={task.title}
      suffix={isAccept ? undefined : branchText(task)}
      card={card}
      trail={(
        <div className={css.trailSwap}>
          <span className={css.trailStatus}>
            {isAccept
              ? <span className={css.progress}>{progressText(task, contained)}</span>
              : status}
          </span>
          <span className={css.trailActions}>{picking ? null : actions}</span>
        </div>
      )}
      selected={selected}
      onClick={onSelect}
    />
  )
}

function progressText(task: TaskRow, contained?: TaskRow[]): string {
  const rows = contained ?? []
  const passed = rows.filter((row) => row.status === 'accepted' || row.acceptance === 'accepted').length
  const total = rows.length || (task.taskIds ?? []).length
  return `${passed}/${total}`
}

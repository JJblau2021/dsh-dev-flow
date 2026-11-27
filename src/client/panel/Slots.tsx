import type { Snapshot, TaskRow, Translate } from '../types'
import { Empty, IconAcceptTask, IconDevTask, Item, SplitGroup, Status } from './parts'
import { statusText, toneOf } from './status'
import css from './ui.module.css'

/**
 * 槽位页：一个仓库一块子面板。
 * 每块里先是开发槽位（编号、任务、分支、状态），最后一条是验收槽位。
 */
export function Slots({ data, t }: { data: Snapshot, t: Translate }) {
  const repos = data.repos ?? []
  const tasks = new Map<string, TaskRow>((data.tasks ?? []).map((task) => [task.id, task]))
  if (repos.length === 0) return <Empty text={t('slots.empty')} />

  return (
    <div className={css.group} style={{ overflow: 'hidden' }}>
      <SplitGroup
        panes={repos.map((repo) => {
          const used = repo.devSlots.filter((slot) => slot.taskId).length
          const branch = repo.branch ?? repo.defaultBranch ?? ''
          return {
            key: `repo:${repo.name}`,
            title: repo.name,
            count: used,
            actions: (
              <span className={css.suffix}>
                {branch}
                {repo.dirty ? ` · ${t('metric.dirtyBases')}` : ''}
              </span>
            ),
            content: (
              <>
                {repo.devSlots.map((slot) => {
                  const task = slot.taskId ? tasks.get(slot.taskId) : undefined
                  return (
                    <Item
                      key={`dev:${slot.number}`}
                      icon={<IconDevTask />}
                      title={task ? task.title : t('status.idle')}
                      titleAttr={task ? task.title : undefined}
                      suffix={slot.branch ?? task?.repos?.[0]}
                      trail={task
                        ? <Status tone={toneOf(task.status)} label={statusText(t, task.status)} />
                        : <span className={css.suffix}>{slot.number}</span>}
                    />
                  )
                })}
                {acceptRow(repo, tasks, t)}
                {repo.devSlots.length === 0 && repo.acceptSlot === null
                  ? <Empty text={t('slots.emptyRepo')} />
                  : null}
              </>
            ),
          }
        })}
      />
    </div>
  )
}

function acceptRow(repo: NonNullable<Snapshot['repos']>[number], tasks: Map<string, TaskRow>, t: Translate) {
  const slot = repo.acceptSlot
  if (slot === null) {
    return (
      <Item
        key="accept"
        icon={<IconAcceptTask />}
        title={<span className={css.itemHint}>{t('status.none')}</span>}
        suffix={t('slots.accept')}
        trail={<Status tone="idle" label={t('status.none')} />}
      />
    )
  }
  const batch = slot.batchId ? tasks.get(slot.batchId) : undefined
  return (
    <Item
      key="accept"
      icon={<IconAcceptTask />}
      title={batch ? batch.title : t('slots.acceptFree')}
      titleAttr={batch ? batch.title : undefined}
      suffix={`:${slot.port ?? '—'}`}
      trail={batch
        ? <Status tone={toneOf(batch.status)} label={statusText(t, batch.status)} />
        : <Status tone="idle" label={t('status.idle')} />}
    />
  )
}

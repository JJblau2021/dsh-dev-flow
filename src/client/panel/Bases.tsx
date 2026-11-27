import type { BaseGroupRow, BaseRow, Snapshot, Translate } from '../types'
import { Empty, IconRepo, Item, SplitGroup, Status } from './parts'
import type { Tone } from './parts'
import css from './ui.module.css'

const LOCATION: Record<BaseRow['location'], { key: string, tone: Tone }> = {
  root: { key: 'bases.root', tone: 'idle' },
  slot: { key: 'bases.slot', tone: 'idle' },
  busy: { key: 'bases.busy', tone: 'warn' },
  missing: { key: 'bases.missing', tone: 'err' },
  none: { key: 'bases.none', tone: 'idle' },
}

/** 基线页：一个基线组一块子面板，成员按仓库逐行列出。 */
export function Bases({ data, t }: { data: Snapshot, t: Translate }) {
  const groups = data.baseGroups ?? []
  if (groups.length === 0) return <Empty text={t('bases.empty')} />

  return (
    <div className={css.group} style={{ overflow: 'hidden' }}>
      <SplitGroup
        panes={groups.map((group) => ({
          key: `group:${group.number}`,
          title: groupTitle(group),
          count: group.repos.length,
          content: group.repos.length === 0
            ? <Empty text={t('bases.emptyGroup')} />
            : group.repos.map((row) => memberRow(row, t)),
        }))}
      />
    </div>
  )
}

function memberRow(row: BaseRow, t: Translate) {
  const state = LOCATION[row.location] ?? LOCATION.none
  return (
    <Item
      key={`${row.repo}:${row.branch}:${row.id}`}
      icon={<IconRepo />}
      title={row.repo}
      titleAttr={`${row.repo} ${row.branch}`}
      suffix={row.branch}
      trail={<Status tone={state.tone} label={t(state.key)} />}
    />
  )
}

export function groupTitle(group: BaseGroupRow): string {
  return `${group.number} ${group.label}`
}

/** 供其它页面复用的行高常量，避免各处硬编码。 */
export const BASE_ROW_HINT = css.item

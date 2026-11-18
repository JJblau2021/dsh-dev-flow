/** 把宿主返回的快照整理成当前面板能读的形状：兼容还在跑旧内核的宿主进程。 */
import type { Counts, ProjectRow, Snapshot } from './types'

type LegacySnapshot = Snapshot & {
  projects?: (ProjectRow | string)[]
  counts?: Counts & { dirtyTrunks?: number }
}

/**
 * 兼容旧快照：项目名可能还是字符串数组，基线列表和 dirtyBases 可能还没有。
 * @param value - 宿主返回的快照。
 * @returns 补齐字段后的快照；不是对象时返回 null。
 */
export function normalizeSnapshot(value: unknown): Snapshot | null {
  if (value === null || typeof value !== 'object') return null
  const snapshot = value as LegacySnapshot
  if (Array.isArray(snapshot.projects)) {
    snapshot.projects = snapshot.projects.map((project) => (
      typeof project === 'string' ? { name: project, dirty: false } : project
    ))
  }
  if (!Array.isArray(snapshot.bases)) snapshot.bases = []
  if (snapshot.counts !== undefined && snapshot.counts.dirtyBases === undefined) {
    snapshot.counts.dirtyBases = snapshot.counts.dirtyTrunks ?? 0
  }
  return snapshot as Snapshot
}

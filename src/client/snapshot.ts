/** 把宿主返回的快照整理成当前面板能读的形状：兼容还在跑旧内核的宿主进程。 */
import type { BaseSlotCounts, Counts, DevTaskCounts, ProjectRow, Snapshot } from './types'

type LegacySnapshot = Snapshot & {
  projects?: (ProjectRow | string)[]
  counts?: Counts & { dirtyTrunks?: number }
}

const DEV_ACTIVE = new Set(['waiting', 'developing', 'paused', 'failed'])

function baseCounts(bases: Snapshot['bases']): BaseSlotCounts {
  return {
    active: bases.filter((base) => base.tasks > 0).length,
    dirty: bases.filter((base) => base.dirty).length,
    total: bases.length,
  }
}

function devCounts(tasks: Snapshot['tasks']): DevTaskCounts {
  const dev = tasks.filter((task) => task.kind !== 'accept')
  return {
    developing: dev.filter((task) => DEV_ACTIVE.has(task.status)).length,
    pending: dev.filter((task) => task.status === 'pending-acceptance').length,
    total: dev.length,
  }
}

/**
 * 兼容旧快照：项目名可能还是字符串数组，基线列表和 dirtyBases 可能还没有。
 * 新加的三段数字和项目统计也在这里补，避免面板在旧宿主上显示空白。
 * @param value - 宿主返回的快照。
 * @returns 补齐字段后的快照；不是对象时返回 null。
 */
export function normalizeSnapshot(value: unknown): Snapshot | null {
  if (value === null || typeof value !== 'object') return null
  const snapshot = value as LegacySnapshot
  const projects: ProjectRow[] = Array.isArray(snapshot.projects)
    ? snapshot.projects.map((project) => (
      typeof project === 'string' ? { name: project, dirty: false } : project
    ))
    : []
  snapshot.projects = projects
  if (!Array.isArray(snapshot.bases)) snapshot.bases = []
  if (!Array.isArray(snapshot.tasks)) snapshot.tasks = []
  if (!Array.isArray(snapshot.agents)) snapshot.agents = []
  if (snapshot.counts !== undefined) {
    if (snapshot.counts.dirtyBases === undefined) {
      snapshot.counts.dirtyBases = snapshot.counts.dirtyTrunks ?? 0
    }
    if (snapshot.counts.baseSlots === undefined) {
      snapshot.counts.baseSlots = baseCounts(snapshot.bases)
    }
    if (snapshot.counts.devTasks === undefined) {
      snapshot.counts.devTasks = devCounts(snapshot.tasks)
    }
  }
  for (const project of projects) {
    if (project.stats !== undefined) continue
    const bases = snapshot.bases.filter((base) => base.repo === project.name)
    const tasks = snapshot.tasks.filter((task) => task.kind !== 'accept' && (task.repos ?? []).includes(project.name))
    const activeAgents = snapshot.agents.filter(
      (agent) => agent.status === 'running'
        && snapshot.tasks.some((task) => task.id === agent.taskId && (task.repos ?? []).includes(project.name)),
    ).length
    project.stats = { activeAgents, baseSlots: baseCounts(bases), devTasks: devCounts(tasks) }
  }
  return snapshot as Snapshot
}

import { discoverRepos, scan } from './flow.mjs';
import { DEFAULT_SETTINGS } from './settings.mjs';
import { hasState, loadState } from './state.mjs';

const ACTIVE = new Set(['waiting', 'developing', 'failed']);

/**
 * Read-only panel model. Counts stay at zero until `.dev-flow/` exists.
 * @param {string} workspace
 * @param {string} sessionId
 */
export function snapshot(workspace, sessionId) {
  const initialized = hasState(workspace);
  if (!initialized) {
    return {
      initialized: false,
      enabled: false,
      workspace,
      projects: [],
      counts: { projects: 0, activeAgents: 0, agentLimit: DEFAULT_SETTINGS.agentLimit, activeTasks: 0, activeSlots: 0, pending: 0, devSlots: { used: 0, total: 0 }, acceptSlots: { used: 0, total: 0 }, dirtyTrunks: 0 },
      trunks: [],
      tasks: [],
      repos: [],
      agents: [],
    };
  }
  const state = loadState(workspace);
  let repos = [];
  try {
    repos = scan(workspace).repos;
  } catch {
    repos = discoverRepos(workspace).map((item) => ({ name: item, path: item, dirty: false, defaultBranch: '' }));
  }
  const devRecords = Object.values(state.devSlots).flatMap((slots) => Object.values(slots));
  const acceptRecords = Object.values(state.acceptSlots);
  const accepting = Object.values(state.batches).filter((batch) => batch.status === 'accepting');
  const pending = Object.values(state.tasks).filter((task) => task.status === 'pending-acceptance');
  const activeTasks = Object.values(state.tasks).filter((task) => ACTIVE.has(task.status)).length + accepting.length;
  const devUsed = devRecords.filter((slot) => slot.taskId != null).length;
  const acceptUsed = acceptRecords.filter((slot) => slot.batchId != null && slot.batchId !== '').length;
  return {
    initialized: true,
    enabled: state.sessions[sessionId]?.enabled === true,
    workspace,
    projects: repos.map((repo) => repo.name),
    counts: {
      projects: repos.length,
      activeAgents: (state.agents ?? []).filter((agent) => agent.status === 'running').length,
      agentLimit: DEFAULT_SETTINGS.agentLimit,
      activeTasks,
      activeSlots: devUsed + acceptUsed,
      pending: pending.length,
      devSlots: { used: devUsed, total: devRecords.length },
      acceptSlots: { used: acceptUsed, total: acceptRecords.length },
      dirtyTrunks: repos.filter((repo) => repo.dirty).length,
    },
    trunks: repos.map((repo) => ({ name: repo.name, dirty: repo.dirty, branch: repo.defaultBranch })),
    tasks: [
      ...Object.values(state.tasks).map((task) => ({
        id: task.id,
        title: task.title,
        kind: 'dev',
        status: task.status,
        batchId: task.batchId,
        repos: task.repos.map((repo) => repo.name),
        slots: task.slots,
        warnings: task.warnings ?? [],
        selectable: task.status === 'pending-acceptance' && task.batchId == null,
      })),
      ...Object.values(state.batches).map((batch) => ({
        id: batch.id,
        title: `批次 ${batch.id}`,
        kind: 'accept',
        status: batch.status === 'accepting' ? 'accepting' : batch.status,
        batchId: batch.id,
        taskIds: batch.taskIds ?? [],
        repos: Object.keys(batch.repos ?? {}),
        slots: batch.repos,
        selectable: false,
      })),
    ],
    repos: repos.map((repo) => ({
      name: repo.name,
      dirty: repo.dirty,
      devSlots: Object.entries(state.devSlots[repo.name] ?? {}).map(([number, slot]) => ({
        number,
        path: slot.path,
        taskId: slot.taskId,
        branch: slot.taskId ? state.tasks[slot.taskId]?.slots?.[repo.name]?.branch ?? null : null,
      })),
      acceptSlot: state.acceptSlots[repo.name]
        ? {
          number: state.acceptSlots[repo.name].number ?? '01',
          path: state.acceptSlots[repo.name].path,
          port: state.acceptSlots[repo.name].port,
          batchId: state.acceptSlots[repo.name].batchId,
        }
        : null,
    })),
    agents: state.agents ?? [],
  };
}

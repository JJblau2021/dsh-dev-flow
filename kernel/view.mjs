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
      schedules: [],
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
    trunks: repos.map((repo) => ({
      name: repo.name,
      dirty: repo.dirty,
      branch: repo.branch || repo.defaultBranch,
      defaultBranch: repo.defaultBranch,
    })),
    tasks: [
      ...Object.values(state.tasks).map((task) => ({
        id: task.id,
        title: task.title,
        kind: 'dev',
        status: task.status,
        agentStatus: task.agentStatus ?? 'idle',
        batchId: task.batchId,
        repos: task.repos.map((repo) => repo.name),
        slots: task.slots,
        warnings: task.warnings ?? [],
        usage: task.usage ?? null,
        acceptance: task.acceptance ?? null,
        createdAt: task.createdAt ?? null,
        dependsOn: (task.dependsOn ?? []).map((depId) => dependencyView(state, task, depId)),
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
        usage: batch.usage ?? null,
        createdAt: batch.createdAt ?? null,
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
    schedules: Object.values(state.schedules ?? {}).map((schedule) => scheduleView(state, schedule)),
  };
}

function scheduleView(state, schedule) {
  const tasks = (schedule.taskIds ?? []).map((id) => state.tasks[id]).filter(Boolean);
  const slots = tasks.flatMap((task) => Object.entries(task.slots ?? {}).map(([repo, slot]) => ({
    repo,
    number: slot.number,
    branch: slot.branch ?? null,
    taskId: task.id,
  })));
  return {
    id: schedule.id,
    title: schedule.title,
    status: schedule.status,
    taskIds: schedule.taskIds ?? [],
    agentIds: schedule.agentIds ?? [],
    usage: schedule.usage ?? null,
    createdAt: schedule.createdAt ?? null,
    slots,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      createdAt: task.createdAt ?? null,
      agentStatus: task.agentStatus ?? 'idle',
      dependsOn: (task.dependsOn ?? []).map((depId) => dependencyView(state, task, depId)),
      slots: Object.entries(task.slots ?? {}).map(([repo, slot]) => ({
        repo,
        number: slot.number,
        branch: slot.branch ?? null,
      })),
    })),
  };
}

function dependencyView(state, task, depId) {
  const dep = state.tasks[depId];
  const mergedBranches = Object.values(task.slots ?? {}).flatMap((slot) => (slot.dependencies ?? []).map((item) => item.branch));
  const branch = Object.values(dep?.slots ?? {}).map((slot) => slot.branch).find((item) => mergedBranches.includes(item)) ?? null;
  return {
    id: depId,
    title: dep?.title ?? depId,
    status: dep?.status ?? 'missing',
    merged: branch !== null,
    branch,
  };
}

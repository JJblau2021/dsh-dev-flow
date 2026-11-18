import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const resident = new Set();
const pending = [];
let writeImpl = null;

export function statePath(workspace) {
  return path.join(workspace, '.dev-flow', 'state.json');
}

/** Host installs this so writes go through the workspace sandbox instead of raw mkdir. */
export function setStateWriter(writer) {
  writeImpl = writer;
}

export function hasState(workspace) {
  return resident.has(workspace) || existsSync(statePath(workspace));
}

export function flushStateWrites() {
  const batch = pending.splice(0, pending.length);
  return Promise.all(batch);
}

export function emptyState() {
  return {
    version: 3,
    tasks: {},
    devSlots: {},
    acceptSlots: {},
    batches: {},
    sessions: {},
    agents: [],
    schedules: {},
    trunks: null,
    baseGroups: {},
  };
}

/** @param {string} workspace */
export function loadState(workspace) {
  try {
    const parsed = JSON.parse(readFileSync(statePath(workspace), 'utf8'));
    const state = { ...emptyState(), ...parsed };
    if (!Array.isArray(state.agents)) state.agents = [];
    if (state.schedules === undefined || state.schedules === null || Array.isArray(state.schedules)) state.schedules = {};
    if (state.trunks === undefined) state.trunks = null;
    if (migrate(state)) saveState(workspace, state);
    return state;
  } catch (error) {
    if (error.code === 'ENOENT') return emptyState();
    throw error;
  }
}

/** 老状态迁移：先补任务基线，再把平铺的基线槽位收成编号基线组。迁移只做一次。 */
function migrate(state) {
  let changed = false;
  if ((state.version ?? 1) < 2) changed = migrateBranches(state) || changed;
  if ((state.version ?? 1) < 3) changed = migrateGroups(state) || changed;
  if (state.version !== 3) {
    state.version = 3;
    changed = true;
  }
  return changed;
}

/** v1 → v2：任务和槽位按默认分支补出基线分支。 */
function migrateBranches(state) {
  let changed = false;
  for (const task of Object.values(state.tasks ?? {})) {
    const repoNames = Object.keys(task.slots ?? {});
    if ((typeof task.base !== 'string' || task.base === '') && repoNames.length > 0) {
      task.base = defaultBranchOf(task, repoNames[0]);
      changed = true;
    }
    for (const [repo, slot] of Object.entries(task.slots ?? {})) {
      if (typeof slot.target === 'string' && slot.target !== '') continue;
      slot.target = task.base || defaultBranchOf(task, repo);
      changed = true;
    }
  }
  for (const schedule of Object.values(state.schedules ?? {})) {
    if (schedule.base === undefined) {
      schedule.base = null;
      changed = true;
    }
  }
  return changed;
}

/** v2 → v3：平铺的 bases 按分支收成编号基线组，任务和调度补 baseGroup。 */
function migrateGroups(state) {
  let changed = false;
  if (state.baseGroups === undefined || state.baseGroups === null || Array.isArray(state.baseGroups)) {
    state.baseGroups = {};
    changed = true;
  }
  const groups = state.baseGroups;
  const nextNumber = () => {
    const numbers = Object.keys(groups).map((key) => Number(key)).filter((number) => Number.isInteger(number) && number >= 1);
    return String(Math.max(0, ...numbers) + 1).padStart(2, '0');
  };
  const groupFor = (label) => {
    const found = Object.values(groups).find((group) => group.label === label);
    if (found !== undefined) return found;
    const number = nextNumber();
    groups[number] = { number, label, repos: {}, createdAt: new Date().toISOString() };
    changed = true;
    return groups[number];
  };
  const addMember = (group, repo, branch, path) => {
    if (group.repos[repo] !== undefined) return group.repos[repo];
    group.repos[repo] = { branch, path: path ?? null };
    changed = true;
    return group.repos[repo];
  };
  for (const record of Object.values(state.bases ?? {})) {
    if (record === null || typeof record !== 'object' || typeof record.branch !== 'string') continue;
    addMember(groupFor(record.branch), record.repo, record.branch, record.path);
  }
  delete state.bases;
  for (const schedule of Object.values(state.schedules ?? {})) {
    if (schedule.baseGroup !== undefined && schedule.baseGroup !== null) continue;
    const label = typeof schedule.base === 'string' && schedule.base !== '' ? schedule.base : null;
    schedule.baseGroup = label === null ? null : groupFor(label).number;
    changed = true;
  }
  for (const task of Object.values(state.tasks ?? {})) {
    if (task.status === 'merged' || task.status === 'abandoned') continue;
    for (const [repo, slot] of Object.entries(task.slots ?? {})) {
      const branch = slot.target ?? task.base;
      if (typeof branch !== 'string' || branch === '') continue;
      const group = groupFor(branch);
      addMember(group, repo, branch, null);
      if (slot.baseGroup !== group.number) {
        slot.baseGroup = group.number;
        changed = true;
      }
      if (task.baseGroup === undefined || task.baseGroup === null) {
        task.baseGroup = group.number;
        changed = true;
      }
    }
  }
  return changed;
}

function defaultBranchOf(task, repo) {
  const known = task.repos?.find((item) => item.name === repo)?.defaultBranch;
  return typeof known === 'string' && known !== '' ? known : 'main';
}

/** Create `.dev-flow/state.json` when the workspace has not been initialized. */
export function initializeWorkspace(workspace) {
  const state = loadState(workspace);
  saveState(workspace, state);
  return state;
}

/** @param {string} workspace @param {ReturnType<typeof emptyState>} state */
export function saveState(workspace, state) {
  const file = statePath(workspace);
  const body = `${JSON.stringify(state, null, 2)}\n`;
  resident.add(workspace);
  if (writeImpl !== null) {
    pending.push(Promise.resolve().then(() => writeImpl(file, body)));
    return;
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body);
}

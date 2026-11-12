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
    version: 1,
    tasks: {},
    devSlots: {},
    acceptSlots: {},
    batches: {},
    sessions: {},
    agents: [],
    trunks: null,
  };
}

/** @param {string} workspace */
export function loadState(workspace) {
  try {
    const parsed = JSON.parse(readFileSync(statePath(workspace), 'utf8'));
    const state = { ...emptyState(), ...parsed };
    if (!Array.isArray(state.agents)) state.agents = [];
    if (state.trunks === undefined) state.trunks = null;
    return state;
  } catch (error) {
    if (error.code === 'ENOENT') return emptyState();
    throw error;
  }
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

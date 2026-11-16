import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { git, gitResult } from './git.mjs';
import { assertId, branchName, FlowError, resolveSettings } from './settings.mjs';
import { loadState, saveState } from './state.mjs';

const READY = new Set(['pending-acceptance', 'accepted']);

/**
 * @param {string} workspace
 * @param {Partial<import('./settings.mjs').DEFAULT_SETTINGS>} [settings]
 */
export function scan(workspace, settings) {
  const resolved = resolveSettings(settings);
  const repos = ensureTrunks(workspace, resolved);
  return { workspace, settings: resolved, repos };
}

/**
 * @param {string} workspace
 * @param {{ id: string, title: string, repos: string[], dependsOn?: string[], settings?: object }} request
 */
/**
 * 主会话在主干上开始一次调度时创建。开发任务和子代理都挂在它下面。
 * @param {string} workspace
 * @param {{ id: string, title?: string, sessionId?: string }} request
 */
export function startSchedule(workspace, request) {
  const state = loadState(workspace);
  if (state.schedules === undefined) state.schedules = {};
  const id = request.id;
  assertId(id);
  if (state.schedules[id] !== undefined) throw new FlowError(`调度任务 ${id} 已存在`, 'exists');
  const now = new Date().toISOString();
  state.schedules[id] = {
    id,
    title: request.title || id,
    status: 'scheduling',
    sessionId: request.sessionId ?? null,
    taskIds: [],
    agentIds: [],
    createdAt: now,
    updatedAt: now,
  };
  saveState(workspace, state);
  return state.schedules[id];
}

export function createDevTask(workspace, request) {
  const settings = resolveSettings(request.settings);
  const state = loadState(workspace);
  const id = request.id;
  assertId(id);
  if (state.tasks[id] !== undefined) throw new FlowError(`任务 ${id} 已存在`, 'exists');
  const repos = resolveRepos(workspace, request.repos);
  if (repos.length !== 1) throw new FlowError('一个任务只能涉及一个服务，请按服务拆开', 'scope');
  const dependsOn = request.dependsOn ?? [];
  for (const dep of dependsOn) {
    const task = state.tasks[dep];
    if (task === undefined) throw new FlowError(`依赖的任务 ${dep} 不存在`, 'missing-dep');
    if (task.status === 'abandoned') throw new FlowError(`放弃的任务 ${dep} 不能当作代码依赖`, 'abandoned-dep');
  }
  const blocked = dependsOn.filter((dep) => !READY.has(state.tasks[dep].status));
  const now = new Date().toISOString();
  if (request.scheduleId) assertSchedule(state, request.scheduleId);
  if (blocked.length > 0 || runningAgents(state) >= settings.agentLimit) {
    state.tasks[id] = baseTask(request, repos, dependsOn, blocked.length > 0 ? 'waiting' : 'waiting', now);
    state.tasks[id].wait = blocked.length > 0 ? { kind: 'dependency', tasks: blocked } : { kind: 'capacity' };
    linkSchedule(state, request.scheduleId, id, now);
    saveState(workspace, state);
    return { task: state.tasks[id], warnings: [] };
  }

  const warnings = repos.filter((repo) => repo.dirty).map((repo) => `${repo.name} 主干不干净`);
  const created = [];
  try {
    const slots = {};
    for (const repo of repos) {
      const slot = claimDevSlot(workspace, state, settings, repo, id);
      created.push(slot);
      const merged = mergeDependencies(state, repo, slot, dependsOn);
      slots[repo.name] = {
        number: slot.number,
        path: slot.path,
        branch: slot.branch,
        base: git(slot.path, ['rev-parse', 'HEAD']),
        end: null,
        dependencies: merged,
      };
    }
    state.tasks[id] = {
      ...baseTask(request, repos, dependsOn, 'developing', now),
      slots,
      warnings,
    };
    linkSchedule(state, request.scheduleId, id, now);
    saveState(workspace, state);
    return { task: state.tasks[id], warnings };
  } catch (error) {
    rollbackDev(state, id, created);
    saveState(workspace, state);
    throw error;
  }
}

/** @param {string} workspace @param {string} id */
export function completeDevTask(workspace, id) {
  const state = loadState(workspace);
  const task = requireTask(state, id);
  if (task.status !== 'developing' && task.status !== 'failed') {
    throw new FlowError(`任务 ${id} 不能从 ${task.status} 完成`, 'status');
  }
  for (const slot of Object.values(task.slots)) {
    const dirty = git(slot.path, ['status', '--porcelain']);
    if (dirty !== '') throw new FlowError(`任务 ${id} 还有未提交改动`, 'dirty');
    const branch = git(slot.path, ['branch', '--show-current']);
    if (branch !== slot.branch) throw new FlowError(`任务 ${id} 不在任务分支 ${slot.branch} 上`, 'branch');
    slot.end = git(slot.path, ['rev-parse', 'HEAD']);
  }
  task.status = 'pending-acceptance';
  task.agentStatus = 'idle';
  task.updatedAt = new Date().toISOString();
  noteAgent(state, 'dev', task.id, 'idle');
  releaseDevSlots(state, task, 'pending-acceptance');
  saveState(workspace, state);
  return task;
}

/** @param {string} workspace @param {string} id */
export function failDevTask(workspace, id) {
  const state = loadState(workspace);
  const task = requireTask(state, id);
  if (task.status !== 'developing') throw new FlowError(`任务 ${id} 不在开发中`, 'status');
  task.status = 'failed';
  task.agentStatus = 'idle';
  task.updatedAt = new Date().toISOString();
  noteAgent(state, 'dev', task.id, 'idle');
  saveState(workspace, state);
  return task;
}

/** @param {string} workspace @param {string} id */
export function abandonDevTask(workspace, id) {
  const state = loadState(workspace);
  const task = requireTask(state, id);
  if (task.status !== 'developing' && task.status !== 'failed' && task.status !== 'waiting') {
    throw new FlowError(`任务 ${id} 不能放弃`, 'status');
  }
  for (const slot of Object.values(task.slots ?? {})) {
    if (slot.end === null) {
      const result = gitResult(slot.path, ['rev-parse', 'HEAD']);
      slot.end = result.ok ? result.stdout : null;
    }
  }
  task.status = 'abandoned';
  task.agentStatus = 'idle';
  task.updatedAt = new Date().toISOString();
  noteAgent(state, 'dev', task.id, 'idle');
  releaseDevSlots(state, task, 'abandoned');
  saveState(workspace, state);
  return task;
}

/**
 * 删除验收任务，并删掉它占用的验收分支。验收槽位目录保留在磁盘上，只解除占用。
 * 里面还没合入的开发任务退回待验收，可以重新发起。
 * @param {string} workspace
 * @param {string[]} ids
 */
export function deleteAcceptances(workspace, ids) {
  const state = loadState(workspace);
  const catalog = new Map(discoverRepos(workspace).map((repo) => [repoName(workspace, repo), repo]));
  const removed = [];
  for (const id of ids) {
    const batch = state.batches[id];
    if (batch === undefined) continue;
    if (batch.status === 'accepting') throw new FlowError(`验收任务 ${id} 还在进行中，不能删除`, 'status');
    for (const [name, slot] of Object.entries(batch.repos ?? {})) {
      if (slot.branch) {
        if (slot.path && slotExists(slot.path)) gitResult(slot.path, ['checkout', '-f', '--detach']);
        const repoPath = catalog.get(name);
        if (repoPath !== undefined) gitResult(repoPath, ['branch', '-D', slot.branch]);
      }
      const record = state.acceptSlots[name];
      if (record && record.batchId === id) record.batchId = null;
    }
    for (const taskId of batch.taskIds ?? []) {
      const task = state.tasks[taskId];
      if (task === undefined) continue;
      if (task.batchId === id) task.batchId = null;
      if (task.status === 'pending-merge') {
        task.status = 'pending-acceptance';
        task.acceptance = null;
      }
    }
    delete state.batches[id];
    removed.push(id);
  }
  saveState(workspace, state);
  return removed;
}

/**
 * @param {string} workspace
 * @param {{ id: string, taskIds: string[], settings?: object }} request
 */
export function startAcceptance(workspace, request) {
  const settings = resolveSettings(request.settings);
  const state = loadState(workspace);
  assertId(request.id);
  if (state.batches[request.id] !== undefined) throw new FlowError(`验收批次 ${request.id} 已存在`, 'exists');
  if (runningAgents(state) >= settings.agentLimit) throw new FlowError('子代理已达上限', 'capacity');
  const tasks = request.taskIds.map((id) => requireTask(state, id));
  for (const task of tasks) {
    if (task.status !== 'pending-acceptance') throw new FlowError(`任务 ${task.id} 不是待验收`, 'status');
    if (task.batchId) throw new FlowError(`任务 ${task.id} 已在批次 ${task.batchId} 里`, 'busy');
  }
  const repoNames = [...new Set(tasks.flatMap((task) => task.repos.map((repo) => repo.name)))];
  for (const name of repoNames) {
    if (state.acceptSlots[name]?.batchId) throw new FlowError(`${name} 的验收槽位正在占用`, 'busy');
  }
  const catalog = new Map(discoverRepos(workspace).map((repo) => [repoName(workspace, repo), repo]));
  const created = [];
  const registered = repoNames.filter((name) => state.acceptSlots[name] !== undefined);
  try {
    const repos = {};
    const branch = branchName(settings.acceptBranch, request.id);
    for (const name of repoNames) {
      const repoPath = catalog.get(name);
      if (repoPath === undefined) throw new FlowError(`找不到仓库 ${name}`, 'missing-repo');
      const repo = describeRepo(workspace, repoPath);
      const slot = claimAcceptSlot(workspace, state, settings, repo, branch);
      const ordered = tasks.filter((task) => task.repos.some((item) => item.name === name));
      mergeAcceptance(repo, slot, ordered, name);
      repos[name] = { path: slot.path, branch: slot.branch, port: slot.port };
      created.push(slot);
    }
    const now = new Date().toISOString();
    state.batches[request.id] = {
      id: request.id,
      status: 'accepting',
      taskIds: tasks.map((task) => task.id),
      repos,
      createdAt: now,
    };
    for (const task of tasks) task.batchId = request.id;
    for (const name of repoNames) {
      if (state.acceptSlots[name]) state.acceptSlots[name].batchId = request.id;
    }
    saveState(workspace, state);
    return state.batches[request.id];
  } catch (error) {
    rollbackAccept(state, created);
    releaseReservations(state, repoNames, registered);
    saveState(workspace, state);
    throw error;
  }
}

/** 创建失败时，把这次占位但还没登记成批次的槽位放开。 */
function releaseReservations(state, repoNames, registered) {
  for (const name of repoNames) {
    const record = state.acceptSlots[name];
    if (record === undefined) continue;
    if (!registered.includes(name)) {
      delete state.acceptSlots[name];
      continue;
    }
    if (record.batchId === 'reserving') record.batchId = null;
  }
}

/**
 * 对验收批次里的一个开发任务给出通过或不通过。
 * 全部剩余任务都通过，并且都已合入主干后，验收任务才标成通过。
 * @param {string} workspace
 * @param {string} batchId
 * @param {string} taskId
 * @param {'accepted' | 'rejected'} result
 */
export function finishTaskAcceptance(workspace, batchId, taskId, result) {
  const state = loadState(workspace);
  const batch = requireAcceptingBatch(state, batchId);
  if (!batch.taskIds.includes(taskId)) throw new FlowError(`任务 ${taskId} 不在验收批次 ${batchId} 里`, 'missing');
  const task = requireTask(state, taskId);
  const now = new Date().toISOString();
  task.updatedAt = now;
  if (result === 'accepted') {
    task.acceptance = 'accepted';
    task.batchId = batchId;
    applyTrunkMerge(workspace, state, task);
  } else {
    task.acceptance = null;
    task.status = 'pending-acceptance';
    task.batchId = null;
    batch.taskIds = batch.taskIds.filter((id) => id !== taskId);
  }
  closeBatchIfReady(state, batch, now);
  saveState(workspace, state);
  return batch;
}

/**
 * 一次给整批剩余任务同一个结果。面板按单个任务调用 finishTaskAcceptance。
 * @param {string} workspace
 * @param {string} id
 * @param {'accepted' | 'rejected'} result
 */
export function finishAcceptance(workspace, id, result) {
  const existing = loadState(workspace);
  requireAcceptingBatch(existing, id);
  for (const taskId of [...existing.batches[id].taskIds]) {
    finishTaskAcceptance(workspace, id, taskId, result);
  }
  return loadState(workspace).batches[id];
}

function requireAcceptingBatch(state, id) {
  const batch = state.batches[id];
  if (batch === undefined || batch.status !== 'accepting') throw new FlowError(`验收批次 ${id} 不在进行中`, 'status');
  return batch;
}

function closeBatchIfReady(state, batch, now) {
  const tasks = batch.taskIds.map((id) => state.tasks[id]).filter(Boolean);
  if (tasks.length > 0 && !tasks.every((task) => task.acceptance === 'accepted')) return;
  batch.finishedAt = now;
  batch.agentStatus = 'idle';
  noteAgent(state, 'accept', batch.id, 'idle');
  batch.status = tasks.length === 0 ? 'rejected' : batchDone(state, batch) ? 'accepted' : 'pending-merge';
  for (const name of Object.keys(batch.repos)) {
    const slot = state.acceptSlots[name];
    if (slot) slot.batchId = null;
  }
}

/** 手动把一条待合入任务再合进主干。失败时仍保持待合入，并写上原因。 */
export function mergePendingTask(workspace, taskId) {
  const state = loadState(workspace);
  const task = requireTask(state, taskId);
  if (task.status !== 'pending-merge') throw new FlowError(`任务 ${taskId} 不是待合入`, 'status');
  applyTrunkMerge(workspace, state, task);
  promoteBatch(state, task.batchId);
  saveState(workspace, state);
  return task;
}

/** 进程中断留下的占位没有对应批次时，把验收槽位放开。 */
export function settleStaleAcceptSlots(workspace) {
  const state = loadState(workspace);
  const busy = new Set();
  for (const batch of Object.values(state.batches ?? {})) {
    if (batch.status !== 'accepting') continue;
    for (const name of Object.keys(batch.repos ?? {})) busy.add(name);
  }
  let changed = false;
  for (const [name, slot] of Object.entries(state.acceptSlots ?? {})) {
    if (slot.batchId !== 'reserving' || busy.has(name)) continue;
    slot.batchId = null;
    changed = true;
  }
  if (changed) saveState(workspace, state);
  return state;
}

/** 主干变干净后，把仍待合入的任务再试一次。 */
export function settlePendingMerges(workspace) {
  const state = loadState(workspace);
  let changed = false;
  for (const task of Object.values(state.tasks)) {
    if (task.status !== 'pending-merge') continue;
    applyTrunkMerge(workspace, state, task);
    changed = true;
  }
  for (const batch of Object.values(state.batches)) {
    if (batch.status !== 'pending-merge') continue;
    if (batchDone(state, batch)) {
      batch.status = 'accepted';
      changed = true;
    }
  }
  if (changed) saveState(workspace, state);
  return state;
}

function promoteBatch(state, batchId) {
  if (!batchId) return;
  const batch = state.batches[batchId];
  if (batch?.status === 'pending-merge' && batchDone(state, batch)) batch.status = 'accepted';
}

function batchDone(state, batch) {
  return batch.taskIds.every((id) => state.tasks[id]?.status === 'merged');
}

function applyTrunkMerge(workspace, state, task) {
  const failures = mergeTaskIntoTrunk(task);
  task.updatedAt = new Date().toISOString();
  if (failures.length === 0) {
    task.status = 'merged';
    task.warnings = [];
    markHistory(state, task, 'merged');
    cascadeAcceptedDependencies(state, task);
    return;
  }
  task.status = 'pending-merge';
  task.warnings = failures;
}

/**
 * 一条任务合入主干后，它依赖的任务如果代码也已经进了主干，就一起算作验收通过。
 * 顺着依赖继续往上，已经在主干里的都收尾。
 */
function cascadeAcceptedDependencies(state, task) {
  const seen = new Set([task.id]);
  const queue = [...(task.dependsOn ?? [])];
  while (queue.length > 0) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const dep = state.tasks[id];
    if (dep === undefined) continue;
    if (dep.status === 'merged' || dep.status === 'accepted') {
      queue.push(...(dep.dependsOn ?? []));
      continue;
    }
    if (dep.status !== 'pending-acceptance' && dep.status !== 'pending-merge') continue;
    const batch = dep.batchId ? state.batches[dep.batchId] : undefined;
    if (batch?.status === 'accepting') continue;
    if (!taskInTrunk(dep)) continue;
    dep.status = 'merged';
    dep.acceptance = 'accepted';
    dep.warnings = [];
    dep.agentStatus = 'idle';
    dep.updatedAt = new Date().toISOString();
    markHistory(state, dep, 'merged');
    promoteBatch(state, dep.batchId);
    queue.push(...(dep.dependsOn ?? []));
  }
}

function taskInTrunk(task) {
  const repos = task.repos ?? [];
  if (repos.length === 0) return false;
  for (const repo of repos) {
    const slot = task.slots?.[repo.name];
    const tip = slot?.end ?? slot?.base;
    if (!tip) return false;
    if (!gitResult(repo.path, ['merge-base', '--is-ancestor', tip, 'HEAD']).ok) return false;
  }
  return true;
}

function mergeTaskIntoTrunk(task) {
  const failures = [];
  for (const repo of task.repos) {
    let described;
    try {
      described = describeRepo(repo.path, repo.path);
    } catch (error) {
      failures.push(`${repo.name} 无法读取主干`);
      continue;
    }
    if (described.dirty) {
      failures.push(`${repo.name} 主干不干净`);
      continue;
    }
    if (!described.branch) {
      failures.push(`${repo.name} 主干没有检出分支`);
      continue;
    }
    const branch = task.slots?.[repo.name]?.branch;
    if (!branch) {
      failures.push(`${repo.name} 没有任务分支`);
      continue;
    }
    if (gitResult(repo.path, ['merge-base', '--is-ancestor', branch, 'HEAD']).ok) continue;
    const merged = gitResult(repo.path, ['merge', '--no-edit', branch]);
    if (!merged.ok) {
      gitResult(repo.path, ['merge', '--abort']);
      failures.push(`${repo.name} 合入冲突`);
    }
  }
  return failures;
}

/** @param {string} workspace @param {string} sessionId @param {boolean} enabled */
export function setSessionEnabled(workspace, sessionId, enabled) {
  const state = loadState(workspace);
  state.sessions[sessionId] = { enabled: enabled === true };
  saveState(workspace, state);
  return state.sessions[sessionId];
}

/** @param {string} workspace @param {string} sessionId */
export function sessionEnabled(workspace, sessionId) {
  return loadState(workspace).sessions[sessionId]?.enabled === true;
}

/**
 * Describe the one subagent a lead may start. Does not spawn it.
 * @param {string} workspace
 * @param {string} sessionId
 * @param {{ kind: 'dev' | 'accept', id: string, settings?: object }} request
 */
export function planDispatch(workspace, sessionId, request) {
  if (!sessionEnabled(workspace, sessionId)) {
    return { action: 'skip', reason: '会话未启用工作流' };
  }
  const settings = resolveSettings(request.settings);
  const state = loadState(workspace);
  if (request.kind === 'dev') {
    const task = requireTask(state, request.id);
    if (task.status !== 'developing') throw new FlowError(`任务 ${task.id} 还不能派发给子代理`, 'status');
    if (task.agentStatus === 'running') throw new FlowError(`任务 ${task.id} 已有子代理`, 'busy');
    if (runningAgents(state) >= settings.agentLimit) throw new FlowError('子代理已达上限', 'capacity');
    task.agentStatus = 'running';
    task.updatedAt = new Date().toISOString();
    const agentId = noteAgent(state, 'dev', task.id, 'running');
    linkScheduleAgent(state, task.scheduleId, agentId);
    saveState(workspace, state);
    const slotPaths = Object.values(task.slots).map((slot) => slot.path);
    return {
      action: 'spawn',
      kind: 'dev',
      agentId,
      taskId: task.id,
      model: settings.devModel || null,
      cwd: slotPaths.length === 1 ? slotPaths[0] : workspace,
      slots: task.slots,
    };
  }
  const batch = state.batches[request.id];
  if (batch === undefined || batch.status !== 'accepting') throw new FlowError(`验收批次 ${request.id} 不在进行中`, 'status');
  if (batch.agentStatus === 'running') throw new FlowError(`验收批次 ${request.id} 已有子代理`, 'busy');
  if (runningAgents(state) >= settings.agentLimit) throw new FlowError('子代理已达上限', 'capacity');
  batch.agentStatus = 'running';
  const agentId = noteAgent(state, 'accept', batch.id, 'running');
  saveState(workspace, state);
  return {
    action: 'spawn',
    kind: 'accept',
    agentId,
    batchId: batch.id,
    model: settings.acceptModel || null,
    cwd: workspace,
    repos: batch.repos,
  };
}

function noteAgent(state, kind, taskId, status) {
  if (!Array.isArray(state.agents)) state.agents = [];
  let agent = state.agents.find((item) => item.kind === kind && (item.taskId === taskId || item.lastTaskId === taskId));
  if (agent === undefined) {
    agent = [...state.agents].reverse().find((item) => item.kind === kind && item.status !== 'running');
  }
  if (agent === undefined) {
    agent = { id: `agent-${state.agents.length + 1}`, kind, taskId: null, lastTaskId: null, status };
    state.agents.push(agent);
  }
  agent.status = status;
  agent.kind = kind;
  if (status === 'running') agent.taskId = taskId;
  else {
    agent.lastTaskId = taskId;
    agent.taskId = null;
  }
  return agent.id;
}

/** 子代理实际在槽位里工作时补记，不依赖主会话有没有调用 dispatch。 */
export function attachLiveAgent(workspace, taskId, sessionId) {
  if (!sessionId) return null;
  const state = loadState(workspace);
  const task = state.tasks[taskId];
  if (task === undefined || (task.status !== 'developing' && task.status !== 'failed')) return null;
  if (task.agentStatus === 'running' && task.agentSessionId === sessionId) return null;
  task.agentStatus = 'running';
  task.agentSessionId = sessionId;
  task.updatedAt = new Date().toISOString();
  const agentId = noteAgent(state, 'dev', taskId, 'running');
  const agent = state.agents.find((item) => item.id === agentId);
  if (agent) agent.sessionId = sessionId;
  linkScheduleAgent(state, task.scheduleId, agentId);
  saveState(workspace, state);
  return agentId;
}

/** 子代理会话结束后放开占用，任务仍停留在原状态。 */
export function releaseLiveAgent(workspace, sessionId) {
  if (!sessionId) return;
  const state = loadState(workspace);
  let changed = false;
  for (const task of Object.values(state.tasks)) {
    if (task.agentSessionId !== sessionId || task.agentStatus !== 'running') continue;
    task.agentStatus = 'idle';
    task.updatedAt = new Date().toISOString();
    noteAgent(state, 'dev', task.id, 'idle');
    if (task.scheduleId) refreshSchedule(state, task.scheduleId);
    changed = true;
  }
  if (changed) saveState(workspace, state);
}

function runningAgents(state) {
  const tasks = Object.values(state.tasks).filter((task) => task.agentStatus === 'running').length;
  const batches = Object.values(state.batches).filter((batch) => batch.agentStatus === 'running').length;
  return tasks + batches;
}

function baseTask(request, repos, dependsOn, status, now) {
  return {
    id: request.id,
    title: request.title,
    status,
    repos: repos.map((repo) => ({ name: repo.name, path: repo.path, defaultBranch: repo.defaultBranch })),
    dependsOn,
    slots: {},
    warnings: [],
    batchId: null,
    agentStatus: 'idle',
    scheduleId: request.scheduleId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function assertSchedule(state, id) {
  assertId(id);
  if (state.schedules?.[id] === undefined) throw new FlowError(`调度任务 ${id} 不存在`, 'missing-schedule');
}

function linkSchedule(state, scheduleId, taskId, now) {
  if (!scheduleId) return;
  const schedule = state.schedules[scheduleId];
  if (!schedule.taskIds.includes(taskId)) schedule.taskIds.push(taskId);
  schedule.updatedAt = now;
  refreshSchedule(state, scheduleId);
}

function linkScheduleAgent(state, scheduleId, agentId) {
  if (!scheduleId) return;
  const schedule = state.schedules?.[scheduleId];
  if (schedule === undefined) return;
  if (!schedule.agentIds.includes(agentId)) schedule.agentIds.push(agentId);
  schedule.updatedAt = new Date().toISOString();
  refreshSchedule(state, scheduleId);
}

export function refreshSchedules(workspace) {
  const state = loadState(workspace);
  let changed = false;
  for (const id of Object.keys(state.schedules ?? {})) {
    const before = state.schedules[id].status;
    refreshSchedule(state, id);
    if (state.schedules[id].status !== before) changed = true;
  }
  if (changed) saveState(workspace, state);
  return state;
}

function refreshSchedule(state, scheduleId) {
  const schedule = state.schedules?.[scheduleId];
  if (schedule === undefined) return;
  const tasks = schedule.taskIds.map((id) => state.tasks[id]).filter(Boolean);
  const stillScheduling = tasks.length === 0 || tasks.some((task) => task.status === 'waiting' || (task.status === 'developing' && task.agentStatus !== 'running'));
  schedule.status = stillScheduling ? 'scheduling' : 'dispatched';
}

function requireTask(state, id) {
  const task = state.tasks[id];
  if (task === undefined) throw new FlowError(`任务 ${id} 不存在`, 'missing');
  return task;
}

function resolveRepos(workspace, names) {
  const found = new Map(ensureTrunks(workspace).map((repo) => [repo.name, repo.path]));
  if (!Array.isArray(names) || names.length === 0) throw new FlowError('任务至少要指定一个仓库');
  return names.map((name) => {
    const repo = found.get(name);
    if (repo === undefined) throw new FlowError(`找不到仓库 ${name}`, 'missing-repo');
    return describeRepo(workspace, repo);
  });
}

/**
 * Git 工作树也有 `.git`，所以开发目录和验收目录不能参加主干扫描。
 * @param {string} workspace
 * @param {object} [settings]
 */
export function discoverRepos(workspace, settings) {
  const resolved = resolveSettings(settings ?? {});
  const blocked = new Set([
    path.resolve(workspace, resolved.devDir),
    path.resolve(workspace, resolved.acceptDir),
    path.resolve(workspace, '.dev-flow'),
  ]);
  const repos = [];
  function walk(dir) {
    const current = path.resolve(dir);
    if (blocked.has(current)) return;
    let entries = [];
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((entry) => entry.name === '.git')) {
      repos.push(current);
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === '.git' || entry.name === '.dev-flow' || entry.name === 'node_modules') continue;
      walk(path.join(current, entry.name));
    }
  }
  walk(workspace);
  return repos.sort();
}

/** 把主干清单写入 `.dev-flow`。已记录的路径保留，槽位目录里的检出不会补进来。 */
export function ensureTrunks(workspace, settings) {
  const resolved = resolveSettings(settings ?? {});
  const state = loadState(workspace);
  let changed = !Array.isArray(state.trunks);
  if (!Array.isArray(state.trunks)) state.trunks = [];
  const known = new Set(state.trunks.map((trunk) => path.resolve(trunk.path)));
  for (const repoPath of discoverRepos(workspace, resolved)) {
    if (known.has(repoPath)) continue;
    const repo = describeRepo(workspace, repoPath);
    state.trunks.push({ name: repo.name, path: repo.path, defaultBranch: repo.defaultBranch });
    known.add(repoPath);
    changed = true;
  }
  if (changed) saveState(workspace, state);
  return state.trunks.flatMap((trunk) => {
    try {
      return [describeRepo(workspace, trunk.path)];
    } catch {
      return [];
    }
  });
}

function describeRepo(workspace, repo) {
  const name = repoName(workspace, repo);
  const defaultBranch = detectDefaultBranch(repo);
  const head = gitResult(repo, ['rev-parse', 'HEAD']);
  const branch = gitResult(repo, ['branch', '--show-current']).stdout;
  const dirty = git(repo, ['status', '--porcelain']) !== '';
  return { name, path: repo, defaultBranch, head: head.ok ? head.stdout : null, branch, dirty };
}

function requireCommit(repo) {
  const start = gitResult(repo.path, ['rev-parse', 'HEAD']);
  if (!start.ok) throw new FlowError(`${repo.name || repo.path} 还没有提交，不能创建槽位`, 'empty');
  return start.stdout;
}

function detectDefaultBranch(repo) {
  const origin = gitResult(repo, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  if (origin.ok) return origin.stdout.replace(/^origin\//u, '');
  for (const candidate of ['main', 'master']) {
    if (gitResult(repo, ['rev-parse', '--verify', '--quiet', `refs/heads/${candidate}`]).ok) return candidate;
  }
  const current = gitResult(repo, ['branch', '--show-current']);
  if (current.ok && current.stdout !== '') return current.stdout;
  throw new FlowError(`无法确定 ${repo} 的默认分支`, 'branch');
}

function repoName(workspace, repo) {
  const relative = path.relative(workspace, repo);
  return relative.split(path.sep).join('-');
}

function claimDevSlot(workspace, state, settings, repo, taskId) {
  const records = state.devSlots[repo.name] ?? {};
  state.devSlots[repo.name] = records;
  const numbers = Object.keys(records).map((number) => Number(number)).filter((number) => number >= 1);
  const idle = numbers.filter((number) => records[pad(number)]?.taskId == null).sort((a, b) => a - b);
  const number = pad(idle[0] ?? Math.max(0, ...numbers) + 1);
  const slotPath = records[number]?.path ?? path.resolve(workspace, settings.devDir, number, `${repo.name}-${number}`);
  assertOutside(repo.path, slotPath);
  const branch = branchName(settings.taskBranch, taskId);
  const start = requireCommit(repo);
  const fresh = !(records[number]?.path === slotPath && existsSync(path.join(slotPath, '.git')));
  checkoutSlot(repo.path, slotPath, branch, start, !fresh);
  records[number] = records[number] ?? { path: slotPath, history: [] };
  records[number].taskId = taskId;
  records[number].path = slotPath;
  return { number, path: slotPath, branch, repoName: repo.name, repoPath: repo.path, fresh };
}

function claimAcceptSlot(workspace, state, settings, repo, branch) {
  const existing = state.acceptSlots[repo.name];
  const fromPath = existing?.path ? path.basename(existing.path) : '';
  const number = existing?.number ?? (/^\d{2}$/u.test(fromPath) ? fromPath : pad(1));
  const slotPath = existing?.path ?? path.resolve(workspace, settings.acceptDir, number, `${repo.name}-${number}`);
  assertOutside(repo.path, slotPath);
  const port = existing?.port ?? nextPort(state, settings.portBase);
  const fresh = existing === undefined;
  const start = requireCommit(repo);
  checkoutSlot(repo.path, slotPath, branch, start, !fresh && existsSync(path.join(slotPath, '.git')));
  state.acceptSlots[repo.name] = {
    number,
    path: slotPath,
    port,
    batchId: 'reserving',
    history: existing?.history ?? [],
  };
  return { number, path: slotPath, port, branch, repo: repo.name, repoPath: repo.path, fresh };
}

function mergeAcceptance(repo, slot, tasks, repoName) {
  for (const task of tasks) {
    const dev = task.slots[repoName];
    if (dev === undefined) continue;
    const ancestor = gitResult(slot.path, ['merge-base', '--is-ancestor', dev.end ?? dev.base, 'HEAD']);
    if (ancestor.ok) continue;
    const merged = gitResult(slot.path, ['merge', '--no-edit', dev.branch]);
    if (!merged.ok) {
      gitResult(slot.path, ['merge', '--abort']);
      throw new FlowError(`${repo.name} 并入 ${task.id} 冲突`, 'conflict');
    }
  }
}

function checkoutSlot(repo, slotPath, branch, start, reuse) {
  mkdirSync(path.dirname(slotPath), { recursive: true });
  if (reuse) {
    const result = gitResult(slotPath, ['checkout', '-f', '-B', branch, start]);
    if (!result.ok) throw new FlowError(result.stderr, 'worktree');
    return;
  }
  if (existsSync(slotPath)) throw new FlowError(`槽位目录已存在但未登记：${slotPath}`, 'worktree');
  const added = gitResult(repo, ['worktree', 'add', '-b', branch, slotPath, start]);
  if (!added.ok) throw new FlowError(added.stderr, 'worktree');
}

function mergeDependencies(state, repo, slot, dependsOn) {
  const merged = [];
  for (const depId of dependsOn) {
    const dep = state.tasks[depId];
    const depSlot = dep.slots[repo.name];
    if (depSlot === undefined) continue;
    const tip = depSlot.end ?? depSlot.base;
    const ancestor = gitResult(slot.path, ['merge-base', '--is-ancestor', tip, 'HEAD']);
    if (ancestor.ok) {
      merged.push({ repo: repo.name, branch: depSlot.branch, sha: tip });
      continue;
    }
    const result = gitResult(slot.path, ['merge', '--no-edit', depSlot.branch]);
    if (!result.ok) {
      gitResult(slot.path, ['merge', '--abort']);
      throw new FlowError(`${repo.name} 并入依赖 ${depId} 冲突`, 'conflict');
    }
    merged.push({ repo: repo.name, branch: depSlot.branch, sha: git(slot.path, ['rev-parse', 'HEAD']) });
  }
  return merged;
}

function releaseDevSlots(state, task, result) {
  const endedAt = task.updatedAt;
  for (const [repo, slot] of Object.entries(task.slots)) {
    const record = state.devSlots[repo]?.[slot.number];
    if (record === undefined) continue;
    record.history.push({
      taskId: task.id,
      title: task.title,
      repo,
      number: slot.number,
      path: slot.path,
      branch: slot.branch,
      base: slot.base,
      end: slot.end,
      startedAt: task.createdAt,
      endedAt,
      result,
      dependencies: slot.dependencies ?? [],
    });
    record.taskId = null;
  }
}

function markHistory(state, task, result) {
  for (const [repo, slot] of Object.entries(task.slots)) {
    const history = state.devSlots[repo]?.[slot.number]?.history ?? [];
    const entry = [...history].reverse().find((item) => item.taskId === task.id);
    if (entry) entry.result = result;
  }
}

function rollbackDev(state, id, created) {
  delete state.tasks[id];
  for (const slot of created.reverse()) {
    const record = state.devSlots[slot.repoName]?.[slot.number];
    if (record) record.taskId = null;
    if (slot.fresh) gitResult(slot.repoPath, ['worktree', 'remove', '--force', slot.path]);
    else gitResult(slot.path, ['checkout', '-f', '--detach']);
    gitResult(slot.repoPath, ['branch', '-D', slot.branch]);
  }
}

function rollbackAccept(state, created) {
  for (const slot of created.reverse()) {
    if (slot.fresh) {
      delete state.acceptSlots[slot.repo];
      gitResult(slot.repoPath, ['worktree', 'remove', '--force', slot.path]);
    } else if (state.acceptSlots[slot.repo]) {
      state.acceptSlots[slot.repo].batchId = null;
      gitResult(slot.path, ['checkout', '-f', '--detach']);
    }
    gitResult(slot.repoPath, ['branch', '-D', slot.branch]);
  }
}

function nextPort(state, base) {
  const used = new Set(Object.values(state.acceptSlots).map((slot) => slot.port));
  let port = base;
  while (used.has(port)) port += 1;
  return port;
}

function assertOutside(repo, slotPath) {
  const relative = path.relative(repo, slotPath);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new FlowError(`槽位必须在仓库工作树之外：${slotPath}`, 'path');
  }
}

function pad(number) {
  return String(number).padStart(2, '0');
}

/** Used by acceptance to know whether a directory is already a worktree. */
export function slotExists(slotPath) {
  return existsSync(slotPath) && existsSync(path.join(slotPath, '.git'));
}

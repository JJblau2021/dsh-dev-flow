import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';

import { git, gitResult } from './git.mjs';
import { assertId, branchName, FlowError, resolveSettings } from './settings.mjs';
import { loadState, saveState } from './state.mjs';

const READY = new Set(['pending-acceptance', 'accepted']);
/** 只有已经结束、不会再有子代理往里写代码的任务才允许删除。 */
const DELETABLE = new Set(['merged', 'abandoned', 'failed', 'rejected', 'pending-acceptance']);

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
 * 主会话开始一次调度时创建。开发任务和子代理都挂在它下面，可以带一个默认基线。
 * @param {string} workspace
 * @param {{ id: string, title?: string, sessionId?: string, base?: string }} request
 */
export function startSchedule(workspace, request) {
  const settings = resolveSettings(request.settings);
  const state = loadState(workspace);
  if (state.schedules === undefined) state.schedules = {};
  const id = request.id;
  assertId(id);
  if (state.schedules[id] !== undefined) throw new FlowError(`调度任务 ${id} 已存在`, 'exists');
  const now = new Date().toISOString();
  const warnings = [];
  const requestedGroup = typeof request.baseGroup === 'string' && request.baseGroup !== '' ? request.baseGroup : null;
  const base = typeof request.base === 'string' && request.base !== '' ? request.base : null;
  let group = null;
  if (requestedGroup !== null) {
    group = state.baseGroups?.[requestedGroup];
    if (group === undefined) throw new FlowError(`基线组 ${requestedGroup} 不存在`, 'missing-base-group');
  } else if (base !== null) {
    group = groupForLabel(state, base) ?? createBaseGroup(state, base);
    let matched = 0;
    for (const repo of ensureTrunks(workspace, settings)) {
      if (!branchKnown(repo, base)) continue;
      matched += 1;
      try {
        ensureBaseMember(workspace, settings, state, group, repo, base);
      } catch (error) {
        warnings.push(`${repo.name}：${error.message}`);
      }
    }
    if (matched === 0) warnings.push(`没有任何仓库有基线分支 ${base}`);
  }
  state.schedules[id] = {
    id,
    title: request.title || id,
    status: 'scheduling',
    base: group === null ? null : groupLabelOf(group),
    baseGroup: group === null ? null : group.number,
    sessionId: request.sessionId ?? null,
    taskIds: [],
    agentIds: [],
    warnings,
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
  const schedule = request.scheduleId ? state.schedules[request.scheduleId] : undefined;
  const repo = repos[0];
  if (!gitResult(repo.path, ['rev-parse', '--verify', '--quiet', 'HEAD']).ok) {
    throw new FlowError(`${repo.name || repo.path} 还没有提交，不能创建槽位`, 'empty');
  }
  const requestedGroup = typeof request.baseGroup === 'string' && request.baseGroup !== '' ? request.baseGroup : null;
  const requestedBase = typeof request.base === 'string' && request.base !== '' ? request.base : null;
  const inherited = schedule?.baseGroup ? state.baseGroups?.[schedule.baseGroup] : undefined;
  let group;
  let target;
  if (requestedGroup !== null) {
    group = state.baseGroups?.[requestedGroup];
    if (group === undefined) throw new FlowError(`基线组 ${requestedGroup} 不存在`, 'missing-base-group');
    target = requestedBase ?? group.repos?.[repo.name]?.branch ?? groupLabelOf(group);
  } else if (requestedBase !== null) {
    group = groupForRepoBranch(state, repo.name, requestedBase);
    target = requestedBase;
  } else if (inherited !== undefined) {
    group = inherited;
    target = group.repos?.[repo.name]?.branch ?? groupLabelOf(group);
  } else {
    target = repo.defaultBranch;
    group = groupForRepoBranch(state, repo.name, target);
  }
  assertBranch(repo, target);
  resolveBaseCommit(repo, target);
  for (const dep of dependsOn) {
    const depBase = state.tasks[dep].base ?? Object.values(state.tasks[dep].slots ?? {})[0]?.target;
    if (typeof depBase === 'string' && depBase !== '' && depBase !== target) {
      throw new FlowError(`依赖 ${dep} 基于 ${depBase}，与本任务的基线 ${target} 不同`, 'base-mismatch');
    }
  }
  const dirtyWarning = baseLocationDirty(state, repo, target) ? `${repo.name} 基线 ${target} 工作区不干净` : null;
  if (blocked.length > 0 || runningAgents(state) >= settings.agentLimit) {
    const task = baseTask(request, repos, dependsOn, 'waiting', now, target, group.number);
    task.wait = blocked.length > 0 ? { kind: 'dependency', tasks: blocked } : { kind: 'capacity' };
    task.warnings = dirtyWarning === null ? [] : [dirtyWarning];
    state.tasks[id] = task;
    linkSchedule(state, request.scheduleId, id, now);
    saveState(workspace, state);
    return { task, warnings: task.warnings };
  }

  const created = [];
  const warnings = [];
  try {
    const slots = {};
    for (const item of repos) {
      const located = ensureBaseMember(workspace, settings, state, group, item, target);
      const location = describeRepo(workspace, located.member.path);
      if (location.dirty) warnings.push(`${item.name} 基线 ${target} 工作区不干净`);
      const slot = claimDevSlot(workspace, state, settings, item, id, target);
      created.push(slot);
      const merged = mergeDependencies(state, item, slot, dependsOn);
      slots[item.name] = {
        number: slot.number,
        path: slot.path,
        branch: slot.branch,
        base: git(slot.path, ['rev-parse', 'HEAD']),
        end: null,
        target,
        baseGroup: group.number,
        dependencies: merged,
      };
    }
    state.tasks[id] = {
      ...baseTask(request, repos, dependsOn, 'developing', now, target, group.number),
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
 * 批量删除已经结束的开发任务，并删掉它们占用的 `df-task/<id>` 分支。
 * 先把所有 id 校验完再动手；任何一个不合法都不会删掉半批。
 * 分支删不掉时只记 warning，任务记录和槽位引用仍然清理。
 * @param {string} workspace
 * @param {string[]} ids
 * @returns {{ removed: string[], warnings: string[] }}
 */
export function deleteDevTasks(workspace, ids) {
  const state = loadState(workspace);
  const list = [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id)))];
  if (list.length === 0) throw new FlowError('没有要删除的任务', 'empty');
  const deleting = new Set(list);
  const tasks = [];
  for (const id of list) {
    const task = state.tasks[id];
    if (task === undefined) throw new FlowError(`任务 ${id} 不存在`, 'missing');
    assertDeletableTask(state, task, deleting);
    tasks.push(task);
  }
  const warnings = [];
  for (const task of tasks) {
    for (const [repoName, slot] of Object.entries(task.slots ?? {})) {
      removeTaskBranch(task, repoName, slot, warnings);
    }
    for (const records of Object.values(state.devSlots ?? {})) {
      for (const record of Object.values(records ?? {})) {
        if (record.taskId === task.id) record.taskId = null;
      }
    }
    for (const agent of state.agents ?? []) {
      if (agent.taskId === task.id) agent.taskId = null;
      if (agent.lastTaskId === task.id) agent.lastTaskId = null;
    }
    for (const batch of Object.values(state.batches ?? {})) {
      if (Array.isArray(batch.taskIds)) batch.taskIds = batch.taskIds.filter((item) => item !== task.id);
    }
    delete state.tasks[task.id];
  }
  for (const schedule of Object.values(state.schedules ?? {})) {
    if (!Array.isArray(schedule.taskIds)) schedule.taskIds = [];
    else schedule.taskIds = schedule.taskIds.filter((item) => !deleting.has(item));
    refreshSchedule(state, schedule.id);
  }
  saveState(workspace, state);
  return { removed: list, warnings };
}

/** 删除前的完整校验；deleting 是本次一起删的集合，集合内部的依赖互相放行。 */
function assertDeletableTask(state, task, deleting) {
  if (task.agentStatus === 'running') {
    throw new FlowError(`任务 ${task.id} 还有子代理在运行，不能删除`, 'status');
  }
  if (task.status === 'pending-acceptance' && task.batchId) {
    const batch = state.batches?.[task.batchId];
    if (batch !== undefined && (batch.status === 'accepting' || batch.status === 'pending-merge')) {
      throw new FlowError(`任务 ${task.id} 在验收批次 ${batch.id} 里（${batch.status}），不能删除`, 'status');
    }
  }
  if (!DELETABLE.has(task.status)) {
    throw new FlowError(`任务 ${task.id} 是 ${task.status}，只有已经结束的任务可以删除`, 'status');
  }
  const dependents = Object.values(state.tasks)
    .filter((other) => other.id !== task.id && !deleting.has(other.id) && (other.dependsOn ?? []).includes(task.id))
    .map((other) => other.id);
  if (dependents.length > 0) {
    throw new FlowError(`任务 ${task.id} 还被 ${dependents.join('、')} 依赖，不能删除`, 'depends');
  }
}

/** 槽位还检在任务分支上就先 detach；分支已经不存在视为成功。 */
function removeTaskBranch(task, repoName, slot, warnings) {
  const branch = slot?.branch;
  if (typeof branch !== 'string' || branch === '') return;
  if (typeof slot.path === 'string' && slotExists(slot.path)) {
    const current = gitResult(slot.path, ['branch', '--show-current']);
    if (current.ok && current.stdout === branch) {
      const detached = gitResult(slot.path, ['checkout', '-f', '--detach']);
      if (!detached.ok) warnings.push(`${repoName} 槽位 ${slot.path} 无法脱离 ${branch}：${detached.stderr || '未知错误'}`);
    }
  }
  const repo = (task.repos ?? []).find((item) => item.name === repoName);
  if (repo === undefined || typeof repo.path !== 'string' || repo.path === '') {
    warnings.push(`${repoName} 找不到仓库路径，分支 ${branch} 未删除`);
    return;
  }
  const deleted = gitResult(repo.path, ['branch', '-D', branch]);
  if (deleted.ok) return;
  // 分支本来就不存在时 `git branch -D` 也会失败；这里把它当成已经清理干净。
  if (!gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).ok) return;
  warnings.push(`${repoName} 分支 ${branch} 删除失败：${deleted.stderr || '未知错误'}`);
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
  const targets = new Map();
  for (const task of tasks) {
    for (const [name, slot] of Object.entries(task.slots ?? {})) {
      const target = slot.target || task.base;
      if (typeof target !== 'string' || target === '') continue;
      const seen = targets.get(name);
      if (seen !== undefined && seen !== target) {
        throw new FlowError(`${name} 里的任务基线不一致：${seen} 和 ${target}，请拆成两批验收`, 'base-mismatch');
      }
      targets.set(name, target);
    }
  }
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
      const target = targets.get(name) ?? repo.defaultBranch;
      const located = locateBaseMember(state, name, target);
      if (located === undefined) throw new FlowError(`${name} 的基线组里没有 ${target}`, 'base-missing');
      ensureBaseMember(workspace, settings, state, located.group, repo, target);
      const start = resolveBaseCommit(repo, target);
      const slot = claimAcceptSlot(workspace, state, settings, repo, branch, start);
      const ordered = tasks.filter((task) => task.repos.some((item) => item.name === name));
      mergeAcceptance(repo, slot, ordered, name);
      repos[name] = { path: slot.path, branch: slot.branch, port: slot.port, base: target };
      created.push(slot);
    }
    const now = new Date().toISOString();
    state.batches[request.id] = {
      id: request.id,
      status: 'accepting',
      taskIds: tasks.map((task) => task.id),
      bases: Object.fromEntries(targets),
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
 * 全部剩余任务都通过，并且都已合入各自基线后，验收任务才标成通过。
 * @param {string} workspace
 * @param {string} batchId
 * @param {string} taskId
 * @param {'accepted' | 'rejected'} result
 */
export function finishTaskAcceptance(workspace, batchId, taskId, result, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const state = loadState(workspace);
  const batch = requireAcceptingBatch(state, batchId);
  if (!batch.taskIds.includes(taskId)) throw new FlowError(`任务 ${taskId} 不在验收批次 ${batchId} 里`, 'missing');
  const task = requireTask(state, taskId);
  const now = new Date().toISOString();
  task.updatedAt = now;
  if (result === 'accepted') {
    task.acceptance = 'accepted';
    task.batchId = batchId;
    applyBaseMerge(workspace, settings, state, task);
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
export function finishAcceptance(workspace, id, result, settingsOverride) {
  const existing = loadState(workspace);
  requireAcceptingBatch(existing, id);
  for (const taskId of [...existing.batches[id].taskIds]) {
    finishTaskAcceptance(workspace, id, taskId, result, settingsOverride);
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

/** 手动把一条待合入任务再合进基线。失败时仍保持待合入，并写上原因。 */
export function mergePendingTask(workspace, taskId, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const state = loadState(workspace);
  const task = requireTask(state, taskId);
  if (task.status !== 'pending-merge') throw new FlowError(`任务 ${taskId} 不是待合入`, 'status');
  applyBaseMerge(workspace, settings, state, task);
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

/** 基线变干净后，把仍待合入的任务再试一次。 */
export function settlePendingMerges(workspace, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const state = loadState(workspace);
  let changed = false;
  for (const task of Object.values(state.tasks)) {
    if (task.status !== 'pending-merge') continue;
    applyBaseMerge(workspace, settings, state, task);
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

function applyBaseMerge(workspace, settings, state, task) {
  const failures = mergeTaskIntoBase(workspace, settings, state, task);
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
 * 一条任务合入基线后，它依赖的任务如果代码也已经进了同一条基线，就一起算作验收通过。
 * 顺着依赖继续往上，已经在基线里的都收尾。
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
    if (!taskInBase(dep)) continue;
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

function taskInBase(task) {
  const repos = task.repos ?? [];
  if (repos.length === 0) return false;
  for (const repo of repos) {
    const slot = task.slots?.[repo.name];
    const tip = slot?.end ?? slot?.base;
    if (!tip) return false;
    const target = slot?.target || task.base || repo.defaultBranch;
    if (!gitResult(repo.path, ['merge-base', '--is-ancestor', tip, `refs/heads/${target}`]).ok) return false;
  }
  return true;
}

function mergeTaskIntoBase(workspace, settings, state, task) {
  const failures = [];
  for (const repo of task.repos) {
    const slot = task.slots?.[repo.name];
    const branch = slot?.branch;
    if (!branch) {
      failures.push(`${repo.name} 没有任务分支`);
      continue;
    }
    const target = slot?.target || task.base || repo.defaultBranch;
    const group = slot?.baseGroup ? state.baseGroups?.[slot.baseGroup] : undefined;
    const located = group !== undefined && group.repos?.[repo.name]?.branch === target
      ? { group, member: group.repos[repo.name] }
      : locateBaseMember(state, repo.name, target);
    if (located === undefined) {
      failures.push(`${repo.name} 的基线组里没有 ${target}`);
      continue;
    }
    let secured;
    try {
      secured = ensureBaseMember(workspace, settings, state, located.group, repo, target);
    } catch (error) {
      failures.push(`${repo.name} 基线 ${target} 不可用：${error.message}`);
      continue;
    }
    const location = { path: secured.member.path };
    const described = describeRepo(workspace, location.path);
    if (described.branch !== target) {
      failures.push(`${repo.name} 基线 ${target} 没有检出`);
      continue;
    }
    if (described.dirty) {
      failures.push(`${repo.name} 基线 ${target} 工作区不干净`);
      continue;
    }
    if (gitResult(location.path, ['merge-base', '--is-ancestor', branch, 'HEAD']).ok) continue;
    const merged = gitResult(location.path, ['merge', '--no-edit', branch]);
    if (!merged.ok) {
      gitResult(location.path, ['merge', '--abort']);
      failures.push(`${repo.name} 合入 ${target} 冲突`);
    }
  }
  return failures;
}

/**
 * 给基线组补一个仓库的基线槽位；不给组号时按分支找组，没有就新建一组。
 * @param {string} workspace
 * @param {string} repoName
 * @param {string} branch
 * @param {string|null} [groupNumber]
 * @param {object} [settingsOverride]
 */
export function addBase(workspace, repoName, branch, groupNumber, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const state = loadState(workspace);
  const repo = resolveRepos(workspace, [repoName])[0];
  assertBranch(repo, branch);
  resolveBaseCommit(repo, branch);
  let group;
  if (typeof groupNumber === 'string' && groupNumber !== '') {
    group = state.baseGroups?.[groupNumber];
    if (group === undefined) throw new FlowError(`基线组 ${groupNumber} 不存在`, 'missing-base-group');
  } else {
    group = groupForRepoBranch(state, repo.name, branch);
  }
  const located = ensureBaseMember(workspace, settings, state, group, repo, branch);
  group.updatedAt = new Date().toISOString();
  saveState(workspace, state);
  return {
    group: group.number,
    label: groupLabelOf(group),
    repo: repo.name,
    branch,
    kind: located.member.kind,
    path: located.member.path,
  };
}

function busyBaseTasks(state, number) {
  return Object.values(state.tasks ?? {}).filter((task) => {
    if (task.status === 'merged' || task.status === 'abandoned') return false;
    if (task.baseGroup === number) return true;
    return Object.values(task.slots ?? {}).some((slot) => slot.baseGroup === number);
  });
}

/** 放开一个基线成员的槽位：只有确实是它占着的 worktree 才删。 */
function releaseBaseMember(repo, member) {
  if (repo === undefined || member === undefined || member.kind !== 'slot') return;
  if (samePath(worktreeBranches(repo.path).get(member.branch), member.path)) {
    gitResult(repo.path, ['worktree', 'remove', '--force', member.path]);
  }
}

/**
 * 新建或整组保存基线组：members 是最终要保留的「项目 → 分支」集合。
 * 编辑时整组替换成员；组里还有未结束任务时拒绝。失败会尽量回滚。
 * @param {string} workspace
 * @param {{ number?: string|null, label?: string, members?: { repo: string, branch: string }[] }} request
 * @param {object} [settingsOverride]
 */
export function saveBaseGroup(workspace, request, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const state = loadState(workspace);
  const number = typeof request.number === 'string' && request.number !== '' ? request.number : null;
  const requested = Array.isArray(request.members) ? request.members : [];
  const members = [];
  const seen = new Set();
  for (const item of requested) {
    const repo = String(item?.repo ?? '').trim();
    const branch = String(item?.branch ?? '').trim();
    if (repo === '' || branch === '') throw new FlowError('基线的项目和分支不能为空', 'invalid');
    if (seen.has(repo)) throw new FlowError(`项目 ${repo} 选了两条分支`, 'duplicate');
    seen.add(repo);
    members.push({ repo, branch });
  }
  if (members.length === 0) throw new FlowError('至少选择一个项目', 'empty');
  const label = typeof request.label === 'string' && request.label.trim() !== '' ? request.label.trim() : members[0].branch;
  let group;
  let created = false;
  if (number !== null) {
    group = state.baseGroups?.[number];
    if (group === undefined) throw new FlowError(`基线组 ${number} 不存在`, 'missing-base-group');
    const busy = busyBaseTasks(state, number);
    if (busy.length > 0) throw new FlowError(`基线组 ${number} 还有 ${busy.length} 个未结束任务，不能编辑`, 'busy');
  } else {
    group = createBaseGroup(state, label);
    created = true;
  }
  const previous = JSON.parse(JSON.stringify(group.repos ?? {}));
  const previousLabel = group.label;
  const repos = new Map();
  const repoOf = (name) => {
    if (!repos.has(name)) repos.set(name, resolveRepos(workspace, [name])[0]);
    return repos.get(name);
  };
  try {
    for (const member of members) {
      if (!branchKnown(repoOf(member.repo), member.branch)) {
        throw new FlowError(`${member.repo} 没有分支 ${member.branch}`, 'base-missing');
      }
    }
    for (const [repoName, old] of Object.entries(group.repos ?? {})) {
      const wanted = members.find((member) => member.repo === repoName);
      if (wanted !== undefined && wanted.branch === old.branch) continue;
      releaseBaseMember(repoOf(repoName), old);
      delete group.repos[repoName];
    }
    for (const member of members) {
      ensureBaseMember(workspace, settings, state, group, repoOf(member.repo), member.branch);
    }
    group.label = label;
    group.updatedAt = new Date().toISOString();
    saveState(workspace, state);
    return { group: group.number, label: group.label, members: members.length };
  } catch (error) {
    for (const [repoName, member] of Object.entries(group.repos ?? {})) {
      const old = previous[repoName];
      if (old !== undefined && old.branch === member.branch) continue;
      try {
        releaseBaseMember(repoOf(repoName), member);
      } catch {
        /* 回滚时清理失败不掩盖原始错误。 */
      }
    }
    group.repos = previous;
    group.label = previousLabel;
    if (created) delete state.baseGroups[group.number];
    if (!created) {
      for (const [repoName, member] of Object.entries(previous)) {
        try {
          ensureBaseMember(workspace, settings, state, group, repoOf(repoName), member.branch);
        } catch {
          group.repos[repoName] = member;
        }
      }
    }
    saveState(workspace, state);
    throw new FlowError(`${error.message}（改动已回滚）`, error.code ?? 'invalid');
  }
}

/**
 * 删掉基线组里某个仓库的基线槽位；还有任务基于这个组时拒绝，空组自动删掉。
 * @param {string} workspace
 * @param {string} groupNumber
 * @param {string} repoName
 * @param {object} [settingsOverride]
 */
export function removeBase(workspace, groupNumber, repoName, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const state = loadState(workspace);
  const group = state.baseGroups?.[groupNumber];
  if (group === undefined) throw new FlowError(`基线组 ${groupNumber} 不存在`, 'missing-base-group');
  const repo = resolveRepos(workspace, [repoName])[0];
  const member = group.repos?.[repo.name];
  if (member === undefined) throw new FlowError(`基线组 ${group.number} 里没有 ${repo.name}`, 'missing');
  const busy = Object.values(state.tasks ?? {}).some((task) => {
    if (task.status === 'merged' || task.status === 'abandoned') return false;
    return Object.values(task.slots ?? {}).some((slot) => slot.baseGroup === group.number && slot.target === member.branch);
  });
  if (busy) throw new FlowError(`基线组 ${group.number} 还有任务在用，不能删除`, 'busy');
  if (member.kind === 'slot' && samePath(worktreeBranches(repo.path).get(member.branch), member.path)) {
    const removed = gitResult(repo.path, ['worktree', 'remove', '--force', member.path]);
    if (!removed.ok) throw new FlowError(removed.stderr || `无法删除基线槽位 ${member.path}`, 'worktree');
  }
  delete group.repos[repo.name];
  if (Object.keys(group.repos).length === 0) delete state.baseGroups[group.number];
  saveState(workspace, state);
  return { removed: `${groupNumber}/${repo.name}`, path: member.path };
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

function baseTask(request, repos, dependsOn, status, now, base, baseGroup) {
  return {
    id: request.id,
    title: request.title,
    status,
    base: base ?? null,
    baseGroup: baseGroup ?? null,
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
 * Git 工作树也有 `.git`，所以开发、验收和基线目录不能参加仓库扫描。
 * @param {string} workspace
 * @param {object} [settings]
 */
export function discoverRepos(workspace, settings) {
  const resolved = resolveSettings(settings ?? {});
  const blocked = new Set([
    path.resolve(workspace, resolved.devDir),
    path.resolve(workspace, resolved.acceptDir),
    path.resolve(workspace, resolved.baseDir),
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

/** 把仓库检出清单写入 `.dev-flow`。已记录的路径保留，槽位目录里的检出不会补进来。 */
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

function assertBranch(repo, branch) {
  if (typeof branch !== 'string' || branch.trim() === '') {
    throw new FlowError('基线分支不能为空', 'base-missing');
  }
  if (!gitResult(repo.path, ['check-ref-format', '--branch', branch]).ok) {
    throw new FlowError(`${branch} 不是合法的分支名`, 'base-missing');
  }
}

function branchKnown(repo, branch) {
  return gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).ok
    || gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`]).ok;
}

/** 基线的起点提交：本地分支优先，其次 origin 上的同名分支。 */
function resolveBaseCommit(repo, branch) {
  const local = gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]);
  if (local.ok) return local.stdout;
  const remote = gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`]);
  if (remote.ok) return remote.stdout;
  throw new FlowError(`${repo.name} 没有基线分支 ${branch}`, 'base-missing');
}

/** 只有远端有这条分支时，建一条本地跟踪分支，合并才有本地分支可用。 */
function ensureLocalBranch(repo, branch) {
  if (gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).ok) return;
  const remote = gitResult(repo.path, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`]);
  if (!remote.ok) throw new FlowError(`${repo.name} 没有基线分支 ${branch}`, 'base-missing');
  const created = gitResult(repo.path, ['branch', '--track', branch, `origin/${branch}`]);
  if (!created.ok) throw new FlowError(created.stderr || `无法建立本地分支 ${branch}`, 'worktree');
}

/** 每条分支被哪个检出占着：分支名 → 路径。 */
export function worktreeBranches(repoPath) {
  const listed = gitResult(repoPath, ['worktree', 'list', '--porcelain']);
  const found = new Map();
  if (!listed.ok) return found;
  let current = null;
  for (const line of listed.stdout.split('\n')) {
    if (line.startsWith('worktree ')) current = line.slice('worktree '.length);
    else if (line.startsWith('branch refs/heads/') && current !== null) {
      found.set(line.slice('branch refs/heads/'.length), current);
      current = null;
    } else if (line === '') current = null;
  }
  return found;
}

/** 比较两个检出路径；macOS 的 /var 和 /private/var 是同一处。 */
export function samePath(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const canonical = (value) => {
    try {
      return realpathSync(value);
    } catch {
      return path.resolve(value);
    }
  };
  return canonical(left) === canonical(right);
}

function groupLabelOf(group) {
  return typeof group.label === 'string' && group.label !== '' ? group.label : group.number;
}

function groupForLabel(state, label) {
  return Object.values(state.baseGroups ?? {}).find((group) => group.label === label);
}

function findGroupByMember(state, repoName, branch) {
  return Object.values(state.baseGroups ?? {}).find((group) => group.repos?.[repoName]?.branch === branch);
}

function nextGroupNumber(state) {
  const numbers = Object.keys(state.baseGroups ?? {})
    .map((key) => Number(key))
    .filter((number) => Number.isInteger(number) && number >= 1);
  return String(Math.max(0, ...numbers) + 1).padStart(2, '0');
}

/** 新建一组基线：一个编号，下面按仓库各放一个基线槽位。 */
function createBaseGroup(state, label) {
  state.baseGroups = state.baseGroups ?? {};
  const number = nextGroupNumber(state);
  state.baseGroups[number] = {
    number,
    label,
    repos: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return state.baseGroups[number];
}

function groupForRepoBranch(state, repoName, branch) {
  const byMember = findGroupByMember(state, repoName, branch);
  if (byMember !== undefined) return byMember;
  const byLabel = groupForLabel(state, branch);
  if (byLabel !== undefined && byLabel.repos?.[repoName] === undefined) return byLabel;
  return createBaseGroup(state, branch);
}

/**
 * 在一组基线里给某个仓库分一条基线槽位：根目录检出正好在这条分支时直接用它，否则在
 * `<baseDir>/<编号>/<仓库-编号>` 建一个常驻检出。已经分过且分支不同时报错。
 * @returns {{ group: object, member: { branch: string, path: string, kind: 'root' | 'slot' } }}
 */
function ensureBaseMember(workspace, settings, state, group, repo, branch) {
  assertBranch(repo, branch);
  resolveBaseCommit(repo, branch);
  group.repos = group.repos ?? {};
  const existing = group.repos[repo.name];
  if (existing !== undefined && existing.branch !== branch) {
    throw new FlowError(`基线组 ${group.number} 里 ${repo.name} 已经是 ${existing.branch}`, 'base-mismatch');
  }
  const current = gitResult(repo.path, ['branch', '--show-current']).stdout;
  if (current === branch) {
    const member = existing ?? { branch };
    member.branch = branch;
    member.path = repo.path;
    member.kind = 'root';
    group.repos[repo.name] = member;
    return { group, member };
  }
  if (existing !== undefined && typeof existing.path === 'string' && existsSync(existing.path)
    && samePath(worktreeBranches(repo.path).get(branch), existing.path)) {
    existing.kind = 'slot';
    return { group, member: existing };
  }
  const holder = worktreeBranches(repo.path).get(branch);
  if (holder !== undefined) throw new FlowError(`${repo.name} 的基线 ${branch} 已在 ${holder} 检出`, 'base-busy');
  ensureLocalBranch(repo, branch);
  const expected = existing?.path && !existsSync(existing.path)
    ? existing.path
    : path.resolve(workspace, settings.baseDir, group.number, slotDirectory('base', repo.name, group.number));
  if (existsSync(expected)) throw new FlowError(`基线目录已存在但未登记：${expected}`, 'worktree');
  mkdirSync(path.dirname(expected), { recursive: true });
  const added = gitResult(repo.path, ['worktree', 'add', expected, branch]);
  if (!added.ok) throw new FlowError(added.stderr || `无法建立基线槽位 ${branch}`, 'worktree');
  const member = existing ?? { branch };
  member.branch = branch;
  member.path = expected;
  member.kind = 'slot';
  group.repos[repo.name] = member;
  return { group, member };
}

/** 找仓库 + 分支所在的基线组成员；没有就返回 undefined。 */
function locateBaseMember(state, repoName, branch) {
  for (const group of Object.values(state.baseGroups ?? {})) {
    const member = group.repos?.[repoName];
    if (member?.branch === branch) return { group, member };
  }
  return undefined;
}

function baseLocationDirty(state, repo, branch) {
  const located = locateBaseMember(state, repo.name, branch);
  if (located === undefined) {
    return gitResult(repo.path, ['branch', '--show-current']).stdout === branch
      && git(repo.path, ['status', '--porcelain']) !== '';
  }
  const target = located.member.path;
  return typeof target === 'string' ? gitResult(target, ['status', '--porcelain']).stdout !== '' : false;
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
  // 工作区根本身就是仓库时，相对路径是空串；用目录名，别让项目名变成空。
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`)) {
    return path.basename(path.resolve(repo));
  }
  return relative.split(path.sep).join('-');
}

/** 槽位目录名带上类别，避免开发/验收/基线槽位编号相同后在 worktree 列表里同名。 */
function slotDirectory(kind, repoName, number) {
  return `${repoName}-${kind}-${number}`;
}

function claimDevSlot(workspace, state, settings, repo, taskId, target) {
  const records = state.devSlots[repo.name] ?? {};
  state.devSlots[repo.name] = records;
  const numbers = Object.keys(records).map((number) => Number(number)).filter((number) => number >= 1);
  const idle = numbers.filter((number) => records[pad(number)]?.taskId == null).sort((a, b) => a - b);
  const number = pad(idle[0] ?? Math.max(0, ...numbers) + 1);
  const slotPath = records[number]?.path ?? path.resolve(workspace, settings.devDir, number, slotDirectory('task', repo.name, number));
  assertOutside(repo.path, slotPath);
  const branch = branchName(settings.taskBranch, taskId);
  const start = resolveBaseCommit(repo, target);
  const fresh = !(records[number]?.path === slotPath && existsSync(path.join(slotPath, '.git')));
  checkoutSlot(repo.path, slotPath, branch, start, !fresh);
  records[number] = records[number] ?? { path: slotPath, history: [] };
  records[number].taskId = taskId;
  records[number].path = slotPath;
  return { number, path: slotPath, branch, target, repoName: repo.name, repoPath: repo.path, fresh };
}

function claimAcceptSlot(workspace, state, settings, repo, branch, start) {
  const existing = state.acceptSlots[repo.name];
  const fromPath = existing?.path ? path.basename(existing.path) : '';
  const number = existing?.number ?? (/^\d{2}$/u.test(fromPath) ? fromPath : pad(1));
  const slotPath = existing?.path ?? path.resolve(workspace, settings.acceptDir, number, slotDirectory('check', repo.name, number));
  assertOutside(repo.path, slotPath);
  const port = existing?.port ?? nextPort(state, settings.portBase);
  const fresh = existing === undefined;
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
      target: slot.target ?? task.base ?? null,
      baseGroup: slot.baseGroup ?? task.baseGroup ?? null,
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

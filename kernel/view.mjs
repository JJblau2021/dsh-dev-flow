import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { join } from 'node:path';

import { discoverRepos, samePath, scan, worktreeBranches } from './flow.mjs';
import { gitResult } from './git.mjs';
import { resolveSettings } from './settings.mjs';
import { hasState, loadState } from './state.mjs';

const ACTIVE = new Set(['waiting', 'developing', 'paused', 'failed']);
const DONE = new Set(['merged', 'abandoned', 'stopped']);
/** 和 kernel/flow.mjs 的删除范围保持一致；视图只按单条任务判断。 */
const DELETABLE = new Set(['merged', 'abandoned', 'failed', 'rejected', 'pending-acceptance', 'stopped']);

/**
 * Read-only panel model. Counts stay at zero until `.dev-flow/` exists.
 * @param {string} workspace
 * @param {string} sessionId
 */
export function snapshot(workspace, sessionId, settingsOverride) {
  const settings = resolveSettings(settingsOverride);
  const initialized = hasState(workspace);
  if (!initialized) {
    return {
      initialized: false,
      enabled: false,
      workspace,
      counts: {
        projects: 0,
        activeAgents: 0,
        agentLimit: settings.agentLimit,
        activeTasks: 0,
        activeSlots: 0,
        pending: 0,
        devSlots: { used: 0, total: 0 },
        acceptSlots: { used: 0, total: 0 },
        dirtyBases: 0,
        baseSlots: { active: 0, dirty: 0, total: 0 },
        devTasks: { developing: 0, pending: 0, total: 0 },
      },
      projects: [],
      bases: [],
      tasks: [],
      repos: [],
      agents: [],
      schedules: [],
    };
  }
  const state = loadState(workspace);
  let repos = [];
  try {
    repos = scan(workspace, settings).repos;
  } catch {
    repos = discoverRepos(workspace, settings).map((item) => ({ name: item, path: item, dirty: false, defaultBranch: '' }));
  }
  const devRecords = Object.values(state.devSlots).flatMap((slots) => Object.values(slots));
  const acceptRecords = Object.values(state.acceptSlots);
  const accepting = Object.values(state.batches).filter((batch) => batch.status === 'accepting');
  const pending = Object.values(state.tasks).filter((task) => task.status === 'pending-acceptance');
  const allTasks = Object.values(state.tasks);
  const activeTasks = allTasks.filter((task) => ACTIVE.has(task.status)).length + accepting.length;
  const devUsed = devRecords.filter((slot) => slot.taskId != null).length;
  const acceptUsed = acceptRecords.filter((slot) => slot.batchId != null && slot.batchId !== '').length;
  const { groups: baseGroups, members: bases } = baseGroupView(state, repos);
  return {
    initialized: true,
    enabled: state.sessions[sessionId]?.enabled === true,
    workspace,
    counts: {
      projects: repos.length,
      activeAgents: (state.agents ?? []).filter((agent) => agent.status === 'running').length,
      agentLimit: settings.agentLimit,
      activeTasks,
      activeSlots: devUsed + acceptUsed,
      pending: pending.length,
      devSlots: { used: devUsed, total: devRecords.length },
      acceptSlots: { used: acceptUsed, total: acceptRecords.length },
      dirtyBases: bases.filter((base) => base.dirty).length,
      baseSlots: baseCounts(bases),
      devTasks: devCounts(allTasks),
    },
    projects: repos.map((repo) => {
      const projectBases = bases.filter((base) => base.repo === repo.name);
      const projectTasks = allTasks.filter((task) => (task.repos ?? []).some((item) => item.name === repo.name));
      return {
        name: repo.name,
        path: repo.path,
        description: repoIntro(repo.path),
        defaultBranch: repo.defaultBranch,
        branch: repo.branch || repo.defaultBranch,
        dirty: repo.dirty,
        bases: projectBases.length,
        branches: availableBranches(repo, settings),
        stats: {
          activeAgents: activeAgentsOn(state, repo.name),
          baseSlots: baseCounts(projectBases),
          devTasks: devCounts(projectTasks),
        },
      };
    }),
    bases,
    baseGroups,
    tasks: [
      ...Object.values(state.tasks).map((task) => ({
        id: task.id,
        title: task.title,
        kind: 'dev',
        status: task.status,
        agentStatus: task.agentStatus ?? 'idle',
        batchId: task.batchId,
        base: task.base ?? Object.values(task.slots ?? {})[0]?.target ?? null,
        baseGroup: task.baseGroup ?? Object.values(task.slots ?? {})[0]?.baseGroup ?? null,
        repos: task.repos.map((repo) => repo.name),
        slots: task.slots,
        warnings: task.warnings ?? [],
        usage: task.usage ?? null,
        acceptance: task.acceptance ?? null,
        createdAt: task.createdAt ?? null,
        pausedAt: task.pausedAt ?? null,
        stoppedAt: task.stoppedAt ?? null,
        dependsOn: (task.dependsOn ?? []).map((depId) => dependencyView(state, task, depId)),
        selectable: task.status === 'pending-acceptance' && task.batchId == null,
        deletable: deletableTask(state, task),
      })),
      ...Object.values(state.batches).map((batch) => ({
        id: batch.id,
        title: `批次 ${batch.id}`,
        kind: 'accept',
        status: batch.status === 'accepting' ? 'accepting' : batch.status,
        batchId: batch.id,
        taskIds: batch.taskIds ?? [],
        repos: Object.keys(batch.repos ?? {}),
        bases: batch.bases ?? {},
        slots: batch.repos,
        usage: batch.usage ?? null,
        createdAt: batch.createdAt ?? null,
        selectable: false,
        deletable: false,
      })),
    ],
    repos: repos.map((repo) => ({
      name: repo.name,
      dirty: repo.dirty,
      branch: repo.branch || repo.defaultBranch,
      defaultBranch: repo.defaultBranch,
      devSlots: Object.entries(state.devSlots[repo.name] ?? {}).map(([number, slot]) => ({
        number,
        path: slot.path,
        taskId: slot.taskId,
        branch: slot.taskId ? state.tasks[slot.taskId]?.slots?.[repo.name]?.branch ?? null : null,
        base: slot.taskId ? state.tasks[slot.taskId]?.slots?.[repo.name]?.target ?? state.tasks[slot.taskId]?.base ?? null : null,
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

/**
 * 指标用的基线槽位统计。活跃指仍有未结束任务的基线成员。
 * @param {{ tasks: number, dirty: boolean }[]} bases
 */
function baseCounts(bases) {
  return {
    active: bases.filter((base) => base.tasks > 0).length,
    dirty: bases.filter((base) => base.dirty).length,
    total: bases.length,
  };
}

/**
 * 指标用的开发任务统计。开发中沿用内核的 ACTIVE 集合，总数含所有开发任务。
 * @param {{ status: string }[]} tasks
 */
function devCounts(tasks) {
  return {
    developing: tasks.filter((task) => ACTIVE.has(task.status)).length,
    pending: tasks.filter((task) => task.status === 'pending-acceptance').length,
    total: tasks.length,
  };
}

/** 一个运行中的代理关联的仓库名：开发代理看任务，验收代理看批次。 */
function agentRepos(state, agent) {
  if (agent.kind === 'accept') {
    return Object.keys(state.batches?.[agent.taskId]?.repos ?? {});
  }
  return (state.tasks?.[agent.taskId]?.repos ?? []).map((repo) => repo.name);
}

function activeAgentsOn(state, project) {
  return (state.agents ?? []).filter(
    (agent) => agent.status === 'running' && agentRepos(state, agent).includes(project),
  ).length;
}

const INTRO_FILES = ['README.md', 'README.markdown', 'README', 'readme.md'];
const INTRO_LIMIT = 120;

/**
 * 项目介绍：优先用 package.json 的 description，否则取 README 的第一段正文。
 * README 可能很大，只读开头一段；读不到时返回空串，由面板显示缺省文案。
 * @param {string} repoPath
 */
function repoIntro(repoPath) {
  try {
    const pkg = JSON.parse(readFileSync(join(repoPath, 'package.json'), 'utf8'));
    if (typeof pkg.description === 'string' && pkg.description.trim() !== '') {
      return clipText(pkg.description.trim());
    }
  } catch {
    // 没有 package.json 或内容不是 JSON，继续看 README。
  }
  for (const name of INTRO_FILES) {
    const text = readHead(join(repoPath, name));
    if (text === '') continue;
    const line = firstProseLine(text);
    if (line !== '') return clipText(line);
  }
  return '';
}

/** 只读文件开头，避免为了一个介绍把整篇 README 读进来。 */
function readHead(file) {
  if (!existsSync(file)) return '';
  let fd;
  try {
    fd = openSync(file, 'r');
    const buffer = Buffer.alloc(16 * 1024);
    const length = readSync(fd, buffer, 0, buffer.length, 0);
    return buffer.subarray(0, length).toString('utf8');
  } catch {
    return '';
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** 跳过标题、徽章、代码块、HTML 和表格，取第一行能当介绍的正文。 */
function firstProseLine(text) {
  let heading = '';
  let fenced = false;
  for (const raw of text.split(/\r?\n/u)) {
    const line = raw.trim();
    if (line.startsWith('```') || line.startsWith('~~~')) {
      fenced = !fenced;
      continue;
    }
    if (fenced || line === '') continue;
    if (line.startsWith('#')) {
      if (heading === '') heading = cleanMarkdown(line.replace(/^#+\s*/u, ''));
      continue;
    }
    if (
      line.startsWith('<')
      || line.startsWith('|')
      || /^[-*_]{3,}$/u.test(line)
      || line.startsWith('![')
      || /^\[!\[/u.test(line)
    ) continue;
    const clean = cleanMarkdown(line.replace(/^[-*+]\s+/u, '').replace(/^>\s*/u, ''));
    if (clean !== '') return clean;
  }
  return heading;
}

function cleanMarkdown(line) {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/<[^>]*>/gu, '')
    .replace(/[`*_~]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function clipText(text) {
  const chars = [...text];
  return chars.length <= INTRO_LIMIT ? text : `${chars.slice(0, INTRO_LIMIT - 1).join('')}…`;
}

/**
 * 单条任务是否可删。依赖方还在时不可删；批量删除由内核在勾选集合内互相放行。
 * @param {ReturnType<typeof loadState>} state
 * @param {{ id: string, status: string, agentStatus?: string, batchId?: string | null, dependsOn?: string[] }} task
 */
function deletableTask(state, task) {
  if (!DELETABLE.has(task.status)) return false;
  if (task.agentStatus === 'running') return false;
  if (task.status === 'pending-acceptance' && task.batchId) {
    const batch = state.batches?.[task.batchId];
    if (batch !== undefined && (batch.status === 'accepting' || batch.status === 'pending-merge')) return false;
  }
  return !Object.values(state.tasks ?? {}).some(
    (other) => other.id !== task.id && (other.dependsOn ?? []).includes(task.id),
  );
}

/**
 * 基线组视图：每个编号一组，组里按仓库列成员。成员位置：根目录检出、基线槽位、被其它检出占用、槽位缺失、未建立。
 * 没有基线组时返回空列表，面板显示缺省状态。
 */
function baseGroupView(state, repos) {
  const repoMap = new Map(repos.map((repo) => [repo.name, repo]));
  const cache = new Map();
  const refsOf = (repo) => {
    if (!cache.has(repo.name)) {
      const local = gitResult(repo.path, ['for-each-ref', '--format=%(refname:short)%09%(objectname)', 'refs/heads']);
      const heads = new Map(local.ok
        ? local.stdout.split('\n').filter((line) => line !== '').map((line) => {
          const [name, sha] = line.split('\t');
          return [name, sha ?? null];
        })
        : []);
      const remoteListed = gitResult(repo.path, ['for-each-ref', '--format=%(refname:short)%09%(objectname)', 'refs/remotes/origin']);
      const remotes = new Map();
      if (remoteListed.ok) {
        for (const line of remoteListed.stdout.split('\n')) {
          if (line === '') continue;
          const [name, sha] = line.split('\t');
          if (!name.startsWith('origin/') || name === 'origin/HEAD') continue;
          remotes.set(name.slice('origin/'.length), sha ?? null);
        }
      }
      cache.set(repo.name, { heads, remotes });
    }
    return cache.get(repo.name);
  };
  const groups = [];
  for (const group of Object.values(state.baseGroups ?? {}).sort((left, right) => String(left.number).localeCompare(String(right.number)))) {
    const members = [];
    for (const [repoName, member] of Object.entries(group.repos ?? {})) {
      const repo = repoMap.get(repoName);
      if (repo === undefined) continue;
      const { heads, remotes } = refsOf(repo);
      const branch = member.branch;
      const sha = heads.get(branch) ?? remotes.get(branch) ?? null;
      const holder = worktreeBranches(repo.path).get(branch);
      const current = repo.branch === branch && samePath(member.path, repo.path);
      const location = current
        ? 'root'
        : typeof member.path === 'string' && existsSync(member.path) && samePath(holder, member.path)
          ? 'slot'
          : holder !== undefined
            ? 'busy'
            : member.path
              ? 'missing'
              : 'none';
      const locationPath = location === 'root' ? repo.path : location === 'slot' ? member.path : null;
      members.push({
        id: `${group.number}:${repoName}`,
        group: group.number,
        label: group.label ?? '',
        repo: repoName,
        branch,
        head: sha,
        shortHead: typeof sha === 'string' ? sha.slice(0, 7) : null,
        current,
        default: branch === repo.defaultBranch,
        location,
        path: member.path ?? null,
        dirty: locationPath === null ? false : gitResult(locationPath, ['status', '--porcelain']).stdout !== '',
        tasks: tasksOnBase(state, repoName, branch),
      });
    }
    groups.push({ number: group.number, label: group.label ?? '', repos: members });
  }
  return { groups, members: groups.flatMap((group) => group.repos) };
}

/** 可以作为基线的分支：本地分支 + 只在 origin 上存在的分支，去掉任务/验收分支。 */
function availableBranches(repo, settings) {
  const owned = [settings.taskBranch, settings.acceptBranch]
    .map((format) => format.split('xxx')[0])
    .filter((prefix) => prefix !== '');
  const isOwned = (branch) => owned.some((prefix) => branch.startsWith(prefix));
  const names = new Set();
  const local = gitResult(repo.path, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']);
  if (local.ok) {
    for (const name of local.stdout.split('\n')) {
      if (name !== '' && !isOwned(name)) names.add(name);
    }
  }
  const remote = gitResult(repo.path, ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']);
  if (remote.ok) {
    for (const name of remote.stdout.split('\n')) {
      if (!name.startsWith('origin/') || name === 'origin/HEAD') continue;
      const branch = name.slice('origin/'.length);
      if (branch !== '' && !isOwned(branch)) names.add(branch);
    }
  }
  return [...names].sort();
}

function tasksOnBase(state, repo, branch) {
  return Object.values(state.tasks ?? {}).filter((task) => {
    if (DONE.has(task.status)) return false;
    // 先确认任务确实属于这个仓库，再比分支；同名分支不能把别的仓库的任务算进来。
    const involved = (task.repos ?? []).some((item) => item.name === repo) || task.slots?.[repo] !== undefined;
    if (!involved) return false;
    const target = task.slots?.[repo]?.target ?? task.base;
    return target === branch;
  }).length;
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
    base: schedule.base ?? null,
    baseGroup: schedule.baseGroup ?? null,
    warnings: schedule.warnings ?? [],
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
        target: slot.target ?? task.base ?? null,
        baseGroup: slot.baseGroup ?? task.baseGroup ?? null,
      })),
      usage: task.usage ?? null,
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

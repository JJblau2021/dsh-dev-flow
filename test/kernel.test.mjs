import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  abandonDevTask,
  attachLiveAgent,
  deleteAcceptances,
  deleteDevTasks,
  releaseLiveAgent,
  completeDevTask,
  createDevTask,
  failDevTask,
  startSchedule,
  finishAcceptance,
  finishTaskAcceptance,
  planDispatch,
  scan,
  sessionEnabled,
  setSessionEnabled,
  startAcceptance,
} from '../kernel/flow.mjs';
import { FlowError } from '../kernel/settings.mjs';
import { loadState } from '../kernel/state.mjs';

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function commit(repo, name, content) {
  writeFileSync(path.join(repo, name), content);
  git(repo, ['add', name]);
  git(repo, ['commit', '-m', name]);
}

function makeRepo(root, name) {
  const repo = path.join(root, name);
  mkdirSync(repo);
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.email', 'dev@example.com']);
  git(repo, ['config', 'user.name', 'dev']);
  commit(repo, 'README.md', 'base\n');
  return repo;
}

function workspace() {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-'));
  makeRepo(root, 'kit');
  makeRepo(root, 'glose');
  mkdirSync(path.join(root, 'kit', 'nested'));
  git(path.join(root, 'kit', 'nested'), ['init', '-b', 'main']);
  return root;
}

function head(repo) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
}

function branch(repo) {
  return execFileSync('git', ['branch', '--show-current'], { cwd: repo, encoding: 'utf8' }).trim();
}

function hasBranch(repo, name) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `refs/heads/${name}`], { cwd: repo, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function devSlotTaskIds(state) {
  return Object.values(state.devSlots).flatMap((records) => Object.values(records)).map((record) => record.taskId);
}

test('scan lists sibling repos and ignores repositories nested inside them', () => {
  const root = workspace();
  const report = scan(root);
  assert.deepEqual(report.repos.map((repo) => repo.name), ['glose', 'kit']);
  assert.equal(report.repos.every((repo) => repo.defaultBranch === 'main'), true);
  assert.equal(report.repos.find((repo) => repo.name === 'glose').dirty, false);
  assert.equal(report.settings.taskBranch, 'df-task/xxx');
  const slot = path.join(root, 'task', 'kit', '01');
  mkdirSync(slot, { recursive: true });
  writeFileSync(path.join(slot, '.git'), 'gitdir: /nowhere\n');
  const again = scan(root);
  assert.deepEqual(again.repos.map((repo) => repo.name), ['glose', 'kit']);
  assert.deepEqual(loadState(root).trunks.map((trunk) => trunk.name).sort(), ['glose', 'kit']);
  rmSync(root, { recursive: true, force: true });
});

test('two tasks on one repo get two slots and leave the trunk untouched', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  writeFileSync(path.join(kit, 'dirty.txt'), 'local\n');
  const before = head(kit);
  const first = createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  const second = createDevTask(root, { id: 'pay', title: '支付', repos: ['kit'] });
  assert.equal(first.task.slots.kit.number, '01');
  assert.equal(second.task.slots.kit.number, '02');
  assert.equal(first.warnings[0], 'kit 基线 main 工作区不干净');
  assert.equal(head(kit), before);
  assert.equal(branch(kit), 'main');
  assert.equal(branch(first.task.slots.kit.path), 'df-task/login');
  rmSync(root, { recursive: true, force: true });
});

test('completion releases the slot, failure keeps it, and abandon records history', () => {
  const root = workspace();
  createDevTask(root, { id: 'copy', title: '文案', repos: ['glose'] });
  const slot = loadState(root).tasks.copy.slots.glose.path;
  writeFileSync(path.join(slot, 'note.txt'), 'wip\n');
  assert.throws(() => completeDevTask(root, 'copy'), (error) => error.code === 'dirty');
  git(slot, ['add', 'note.txt']);
  git(slot, ['commit', '-m', 'note']);
  const done = completeDevTask(root, 'copy');
  assert.equal(done.status, 'pending-acceptance');
  assert.equal(loadState(root).devSlots.glose['01'].taskId, null);
  assert.equal(loadState(root).devSlots.glose['01'].history[0].result, 'pending-acceptance');

  createDevTask(root, { id: 'retry', title: '重试', repos: ['glose'] });
  assert.equal(loadState(root).tasks.retry.slots.glose.number, '01');
  failDevTask(root, 'retry');
  assert.equal(loadState(root).devSlots.glose['01'].taskId, 'retry');
  abandonDevTask(root, 'retry');
  const history = loadState(root).devSlots.glose['01'].history;
  assert.equal(history.at(-1).result, 'abandoned');
  assert.equal(history[0].taskId, 'copy');
  rmSync(root, { recursive: true, force: true });
});

test('a new task merges a finished dependency and rolls back when two dependencies conflict', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  createDevTask(root, { id: 'alpha', title: '甲', repos: ['kit'] });
  const alpha = loadState(root).tasks.alpha.slots.kit.path;
  writeFileSync(path.join(alpha, 'README.md'), 'A\n');
  git(alpha, ['add', 'README.md']);
  git(alpha, ['commit', '-m', 'A']);
  completeDevTask(root, 'alpha');

  assert.throws(() => createDevTask(root, { id: 'later', title: '稍后', repos: ['kit'], dependsOn: ['missing'] }), (error) => error.code === 'missing-dep');

  createDevTask(root, { id: 'beta', title: '乙', repos: ['kit'], dependsOn: ['alpha'] });
  const beta = loadState(root).tasks.beta.slots.kit.path;
  assert.equal(execFileSync('git', ['show', 'HEAD:README.md'], { cwd: beta, encoding: 'utf8' }), 'A\n');
  assert.equal(loadState(root).tasks.beta.slots.kit.number, '01');
  completeDevTask(root, 'beta');

  createDevTask(root, { id: 'left', title: '左', repos: ['kit'] });
  const left = loadState(root).tasks.left.slots.kit.path;
  writeFileSync(path.join(left, 'README.md'), 'L\n');
  git(left, ['add', 'README.md']);
  git(left, ['commit', '-m', 'L']);
  completeDevTask(root, 'left');
  createDevTask(root, { id: 'right', title: '右', repos: ['kit'] });
  const right = loadState(root).tasks.right.slots.kit.path;
  writeFileSync(path.join(right, 'README.md'), 'R\n');
  git(right, ['add', 'README.md']);
  git(right, ['commit', '-m', 'R']);
  completeDevTask(root, 'right');

  assert.throws(
    () => createDevTask(root, { id: 'both', title: '两边', repos: ['kit'], dependsOn: ['left', 'right'] }),
    (error) => error.code === 'conflict',
  );
  assert.equal(loadState(root).tasks.both, undefined);
  assert.equal(branch(kit), 'main');
  rmSync(root, { recursive: true, force: true });
});

test('acceptance uses one slot and port per repo and rejects a second batch', () => {
  const root = workspace();
  for (const [id, repo, file] of [['login', 'kit', 'kit.txt'], ['copy', 'glose', 'glose.txt']]) {
    createDevTask(root, { id, title: id, repos: [repo] });
    const slot = loadState(root).tasks[id].slots[repo].path;
    writeFileSync(path.join(slot, file), `${id}\n`);
    git(slot, ['add', file]);
    git(slot, ['commit', '-m', id]);
    completeDevTask(root, id);
  }
  const batch = startAcceptance(root, { id: 'batch-1', taskIds: ['login', 'copy'] });
  assert.equal(batch.repos.kit.port, 4100);
  assert.equal(batch.repos.glose.port, 4101);
  assert.equal(branch(batch.repos.kit.path), 'df-check/batch-1');
  assert.equal(batch.repos.kit.path.endsWith(`${path.sep}01${path.sep}kit-check-01`), true);
  assert.equal(loadState(root).devSlots.kit['01'].path.endsWith(`${path.sep}01${path.sep}kit-task-01`), true);
  assert.throws(() => startAcceptance(root, { id: 'batch-2', taskIds: ['login'] }), (error) => error.code === 'busy');
  finishAcceptance(root, 'batch-1', 'rejected');
  assert.equal(loadState(root).tasks.login.status, 'pending-acceptance');
  assert.equal(loadState(root).acceptSlots.kit.batchId, null);
  assert.equal(loadState(root).acceptSlots.kit.port, 4100);
  const again = startAcceptance(root, { id: 'batch-3', taskIds: ['login', 'copy'] });
  writeFileSync(path.join(root, 'kit', '.gitignore'), 'nested\n');
  git(path.join(root, 'kit'), ['add', '.gitignore']);
  git(path.join(root, 'kit'), ['commit', '-m', 'ignore nested']);
  finishAcceptance(root, 'batch-3', 'accepted');
  assert.equal(loadState(root).tasks.login.status, 'merged');
  assert.equal(loadState(root).batches['batch-3'].status, 'accepted');
  assert.equal(loadState(root).tasks.login.batchId, 'batch-3');
  assert.equal(again.repos.kit.port, 4100);
  rmSync(root, { recursive: true, force: true });
});

test('a schedule task records the tasks, slots, and agent it creates', () => {
  const root = workspace();
  setSessionEnabled(root, 'session-a', true);
  startSchedule(root, { id: 'sched-login', title: '安排登录', sessionId: 'session-a' });
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], scheduleId: 'sched-login' });
  const plan = planDispatch(root, 'session-a', { kind: 'dev', id: 'login' });
  const state = loadState(root);
  assert.equal(state.tasks.login.scheduleId, 'sched-login');
  assert.deepEqual(state.schedules['sched-login'].taskIds, ['login']);
  assert.deepEqual(state.schedules['sched-login'].agentIds, [plan.agentId]);
  assert.equal(state.schedules['sched-login'].status, 'dispatched');
  assert.equal(state.tasks.login.slots.kit.number, '01');
  rmSync(root, { recursive: true, force: true });
});

test('an acceptance batch passes only after every development task passes', () => {
  const root = workspace();
  for (const [id, repo, file] of [['login', 'kit', 'kit.txt'], ['copy', 'glose', 'glose.txt']]) {
    createDevTask(root, { id, title: id, repos: [repo] });
    const slot = loadState(root).tasks[id].slots[repo].path;
    writeFileSync(path.join(slot, file), `${id}\n`);
    git(slot, ['add', file]);
    git(slot, ['commit', '-m', id]);
    completeDevTask(root, id);
  }
  startAcceptance(root, { id: 'batch-1', taskIds: ['login', 'copy'] });
  writeFileSync(path.join(root, 'kit', '.gitignore'), 'nested\n');
  git(path.join(root, 'kit'), ['add', '.gitignore']);
  git(path.join(root, 'kit'), ['commit', '-m', 'ignore nested']);
  finishTaskAcceptance(root, 'batch-1', 'login', 'accepted');
  assert.equal(loadState(root).batches['batch-1'].status, 'accepting');
  assert.equal(loadState(root).tasks.login.acceptance, 'accepted');
  assert.notEqual(loadState(root).acceptSlots.kit.batchId, null);
  finishTaskAcceptance(root, 'batch-1', 'copy', 'accepted');
  assert.equal(loadState(root).batches['batch-1'].status, 'accepted');
  assert.equal(loadState(root).tasks.copy.status, 'merged');
  assert.equal(loadState(root).acceptSlots.kit.batchId, null);
  rmSync(root, { recursive: true, force: true });
});

test('passing acceptance also accepts the dependencies already in the trunk', () => {
  const root = workspace();
  const ids = ['base', 'middle', 'top'];
  for (const [index, id] of ids.entries()) {
    createDevTask(root, { id, title: id, repos: ['kit'], dependsOn: index === 0 ? [] : [ids[index - 1]] });
    const slot = loadState(root).tasks[id].slots.kit.path;
    writeFileSync(path.join(slot, `${id}.txt`), `${id}\n`);
    git(slot, ['add', `${id}.txt`]);
    git(slot, ['commit', '-m', id]);
    completeDevTask(root, id);
  }
  writeFileSync(path.join(root, 'kit', '.gitignore'), 'nested\n');
  git(path.join(root, 'kit'), ['add', '.gitignore']);
  git(path.join(root, 'kit'), ['commit', '-m', 'ignore nested']);
  startAcceptance(root, { id: 'batch-top', taskIds: ['top'] });
  finishTaskAcceptance(root, 'batch-top', 'top', 'accepted');
  const state = loadState(root);
  assert.equal(state.tasks.top.status, 'merged');
  assert.equal(state.tasks.middle.status, 'merged');
  assert.equal(state.tasks.middle.acceptance, 'accepted');
  assert.equal(state.tasks.base.status, 'merged');
  assert.equal(state.tasks.base.acceptance, 'accepted');
  rmSync(root, { recursive: true, force: true });
});

test('a failed acceptance creation frees the accept slot', () => {
  const root = workspace();
  for (const [id, text] of [['left', 'left\n'], ['right', 'right\n']]) {
    createDevTask(root, { id, title: id, repos: ['kit'] });
    const slot = loadState(root).tasks[id].slots.kit.path;
    writeFileSync(path.join(slot, 'conflict.txt'), text);
    git(slot, ['add', 'conflict.txt']);
    git(slot, ['commit', '-m', id]);
    completeDevTask(root, id);
  }
  assert.throws(
    () => startAcceptance(root, { id: 'batch-clash', taskIds: ['left', 'right'] }),
    (error) => error.code === 'conflict',
  );
  const state = loadState(root);
  assert.equal(state.batches['batch-clash'], undefined);
  assert.equal(state.acceptSlots.kit?.batchId ?? null, null);
  assert.equal(state.tasks.left.status, 'pending-acceptance');
  assert.equal(state.tasks.right.status, 'pending-acceptance');
  rmSync(root, { recursive: true, force: true });
});

test('deleting an acceptance task removes its acceptance branch', () => {
  const root = workspace();
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  const slot = loadState(root).tasks.login.slots.kit.path;
  writeFileSync(path.join(slot, 'kit.txt'), 'login\n');
  git(slot, ['add', 'kit.txt']);
  git(slot, ['commit', '-m', 'login']);
  completeDevTask(root, 'login');
  startAcceptance(root, { id: 'batch-cut', taskIds: ['login'] });
  finishAcceptance(root, 'batch-cut', 'rejected');
  const kit = path.join(root, 'kit');
  assert.equal(execFileSync('git', ['rev-parse', '--verify', 'df-check/batch-cut'], { cwd: kit, encoding: 'utf8' }).trim().length > 0, true);
  deleteAcceptances(root, ['batch-cut']);
  assert.equal(loadState(root).batches['batch-cut'], undefined);
  assert.equal(loadState(root).acceptSlots.kit.batchId, null);
  assert.equal(loadState(root).tasks.login.status, 'pending-acceptance');
  assert.throws(() => execFileSync('git', ['rev-parse', '--verify', 'df-check/batch-cut'], { cwd: kit, stdio: 'ignore' }));
  rmSync(root, { recursive: true, force: true });
});

test('a live subagent is recorded even when dispatch was skipped', () => {
  const root = workspace();
  setSessionEnabled(root, 'session-a', true);
  startSchedule(root, { id: 'sched-card', title: '发卡', sessionId: 'session-a' });
  createDevTask(root, { id: 'card', title: '卡片', repos: ['kit'], scheduleId: 'sched-card' });
  assert.equal(loadState(root).tasks.card.agentStatus, 'idle');
  attachLiveAgent(root, 'card', 'child-1');
  const running = loadState(root);
  assert.equal(running.tasks.card.agentStatus, 'running');
  assert.equal(running.agents.some((agent) => agent.status === 'running' && agent.taskId === 'card'), true);
  assert.equal(running.schedules['sched-card'].status, 'dispatched');
  releaseLiveAgent(root, 'child-1');
  const idle = loadState(root);
  assert.equal(idle.tasks.card.agentStatus, 'idle');
  assert.equal(idle.tasks.card.status, 'developing');
  assert.equal(idle.agents.some((agent) => agent.status === 'running'), false);
  rmSync(root, { recursive: true, force: true });
});

test('a task cannot span more than one service', () => {
  const root = workspace();
  assert.throws(
    () => createDevTask(root, { id: 'both', title: '两边', repos: ['kit', 'glose'] }),
    (error) => error.code === 'scope',
  );
  rmSync(root, { recursive: true, force: true });
});

test('dispatch stays closed until the session switch is on', () => {
  const root = workspace();
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  assert.equal(sessionEnabled(root, 'session-a'), false);
  assert.equal(planDispatch(root, 'session-a', { kind: 'dev', id: 'login' }).action, 'skip');
  setSessionEnabled(root, 'session-a', true);
  const plan = planDispatch(root, 'session-a', { kind: 'dev', id: 'login', settings: { devModel: 'dev-model' } });
  assert.equal(plan.action, 'spawn');
  assert.equal(plan.model, 'dev-model');
  assert.equal(plan.cwd, loadState(root).tasks.login.slots.kit.path);
  assert.throws(() => planDispatch(root, 'session-a', { kind: 'dev', id: 'login' }), (error) => error.code === 'busy');
  rmSync(root, { recursive: true, force: true });
});

test('a task branch starts from the requested baseline, not the current checkout', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-'));
  const kit = makeRepo(root, 'kit');
  git(kit, ['checkout', '-b', 'release/1.0']);
  commit(kit, 'release.txt', 'on release\n');
  const releaseHead = head(kit);
  git(kit, ['checkout', 'main']);
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], base: 'release/1.0' });
  const task = loadState(root).tasks.login;
  assert.equal(task.base, 'release/1.0');
  assert.equal(task.slots.kit.target, 'release/1.0');
  assert.equal(head(task.slots.kit.path), releaseHead);
  assert.equal(branch(kit), 'main');
  rmSync(root, { recursive: true, force: true });
});

test('a repo with no commits does not break scanning or tasks in other repos', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-'));
  makeRepo(root, 'kit');
  const blank = path.join(root, 'blank');
  mkdirSync(blank);
  git(blank, ['init', '-b', 'main']);
  const listed = scan(root);
  assert.equal(listed.repos.some((repo) => repo.name === 'blank' && repo.head === null), true);
  const created = createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  assert.equal(created.task.status, 'developing');
  assert.throws(() => createDevTask(root, { id: 'empty', title: '空', repos: ['blank'] }), (error) => error.code === 'empty');
  rmSync(root, { recursive: true, force: true });
});

test('deleting finished tasks removes records, branches, slots, schedules, and batch refs', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  setSessionEnabled(root, 'session-a', true);
  startSchedule(root, { id: 'sched-clean', title: '清理', sessionId: 'session-a' });

  createDevTask(root, { id: 'pending', title: '待验收', repos: ['kit'], scheduleId: 'sched-clean' });
  const pendingSlot = loadState(root).tasks.pending.slots.kit.path;
  writeFileSync(path.join(pendingSlot, 'pending.txt'), 'pending\n');
  git(pendingSlot, ['add', 'pending.txt']);
  git(pendingSlot, ['commit', '-m', 'pending']);
  completeDevTask(root, 'pending');

  createDevTask(root, { id: 'broken', title: '失败', repos: ['kit'], scheduleId: 'sched-clean' });
  failDevTask(root, 'broken');

  createDevTask(root, { id: 'gone', title: '放弃', repos: ['kit'], scheduleId: 'sched-clean' });
  failDevTask(root, 'gone');
  abandonDevTask(root, 'gone');

  createDevTask(root, { id: 'done', title: '完成', repos: ['kit'], scheduleId: 'sched-clean' });
  const doneSlot = loadState(root).tasks.done.slots.kit.path;
  writeFileSync(path.join(doneSlot, 'done.txt'), 'done\n');
  git(doneSlot, ['add', 'done.txt']);
  git(doneSlot, ['commit', '-m', 'done']);
  completeDevTask(root, 'done');
  writeFileSync(path.join(kit, '.gitignore'), 'nested\n');
  git(kit, ['add', '.gitignore']);
  git(kit, ['commit', '-m', 'ignore nested']);
  startAcceptance(root, { id: 'batch-done', taskIds: ['done'] });
  finishAcceptance(root, 'batch-done', 'accepted');
  assert.equal(loadState(root).tasks.done.status, 'merged');

  const ids = ['pending', 'broken', 'gone', 'done'];
  for (const id of ids) assert.equal(hasBranch(kit, `df-task/${id}`), true);
  assert.deepEqual(loadState(root).schedules['sched-clean'].taskIds.sort(), [...ids].sort());

  const result = deleteDevTasks(root, ids);
  assert.deepEqual(result.removed, ids);
  assert.deepEqual(result.warnings, []);

  const state = loadState(root);
  for (const id of ids) {
    assert.equal(state.tasks[id], undefined);
    assert.equal(hasBranch(kit, `df-task/${id}`), false);
    assert.equal(devSlotTaskIds(state).includes(id), false);
    assert.equal(state.agents.some((agent) => agent.taskId === id || agent.lastTaskId === id), false);
  }
  assert.deepEqual(state.schedules['sched-clean'].taskIds, []);
  assert.equal(state.schedules['sched-clean'].status, 'scheduling');
  assert.notEqual(state.batches['batch-done'], undefined);
  assert.deepEqual(state.batches['batch-done'].taskIds, []);
  // 只删任务分支；验收分支交给验收删除功能处理。
  assert.equal(hasBranch(kit, 'df-check/batch-done'), true);
  rmSync(root, { recursive: true, force: true });
});

test('a task depended on by another task is refused, and a whole batch can release the dependency', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  createDevTask(root, { id: 'base', title: '基础', repos: ['kit'] });
  const baseSlot = loadState(root).tasks.base.slots.kit.path;
  writeFileSync(path.join(baseSlot, 'base.txt'), 'base\n');
  git(baseSlot, ['add', 'base.txt']);
  git(baseSlot, ['commit', '-m', 'base']);
  completeDevTask(root, 'base');

  createDevTask(root, { id: 'child', title: '子', repos: ['kit'], dependsOn: ['base'] });
  const childSlot = loadState(root).tasks.child.slots.kit.path;
  writeFileSync(path.join(childSlot, 'child.txt'), 'child\n');
  git(childSlot, ['add', 'child.txt']);
  git(childSlot, ['commit', '-m', 'child']);
  completeDevTask(root, 'child');

  const before = loadState(root);
  assert.throws(
    () => deleteDevTasks(root, ['base']),
    (error) => error instanceof FlowError && error.code === 'depends' && error.message.includes('child'),
  );
  assert.deepEqual(loadState(root), before);
  assert.equal(hasBranch(kit, 'df-task/base'), true);

  const result = deleteDevTasks(root, ['base', 'child']);
  assert.deepEqual(result.removed, ['base', 'child']);
  assert.deepEqual(result.warnings, []);
  const state = loadState(root);
  assert.equal(state.tasks.base, undefined);
  assert.equal(state.tasks.child, undefined);
  assert.equal(hasBranch(kit, 'df-task/base'), false);
  assert.equal(hasBranch(kit, 'df-task/child'), false);
  rmSync(root, { recursive: true, force: true });
});

test('a batch with a developing or running task is refused as a whole', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  createDevTask(root, { id: 'done', title: '完成', repos: ['kit'] });
  const doneSlot = loadState(root).tasks.done.slots.kit.path;
  writeFileSync(path.join(doneSlot, 'done.txt'), 'done\n');
  git(doneSlot, ['add', 'done.txt']);
  git(doneSlot, ['commit', '-m', 'done']);
  completeDevTask(root, 'done');
  createDevTask(root, { id: 'live', title: '开发中', repos: ['kit'] });

  assert.throws(
    () => deleteDevTasks(root, ['done', 'live']),
    (error) => error instanceof FlowError && error.code === 'status',
  );
  let state = loadState(root);
  assert.notEqual(state.tasks.done, undefined);
  assert.notEqual(state.tasks.live, undefined);
  assert.equal(hasBranch(kit, 'df-task/done'), true);

  setSessionEnabled(root, 'session-a', true);
  planDispatch(root, 'session-a', { kind: 'dev', id: 'live' });
  assert.equal(loadState(root).tasks.live.agentStatus, 'running');
  assert.throws(
    () => deleteDevTasks(root, ['done', 'live']),
    (error) => error instanceof FlowError && error.code === 'status' && /子代理/u.test(error.message),
  );
  state = loadState(root);
  assert.notEqual(state.tasks.done, undefined);
  assert.notEqual(state.tasks.live, undefined);
  assert.equal(hasBranch(kit, 'df-task/done'), true);
  rmSync(root, { recursive: true, force: true });
});

test('deleting a task detaches its slot before the branch goes away', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  createDevTask(root, { id: 'broken', title: '失败', repos: ['kit'] });
  failDevTask(root, 'broken');
  const slot = loadState(root).tasks.broken.slots.kit.path;
  assert.equal(branch(slot), 'df-task/broken');
  assert.equal(loadState(root).devSlots.kit['01'].taskId, 'broken');

  const result = deleteDevTasks(root, ['broken']);
  assert.deepEqual(result.removed, ['broken']);
  assert.deepEqual(result.warnings, []);
  assert.equal(branch(slot), '');
  assert.equal(hasBranch(kit, 'df-task/broken'), false);
  assert.equal(loadState(root).devSlots.kit['01'].taskId, null);
  rmSync(root, { recursive: true, force: true });
});

test('a branch held by another worktree is reported as a deletion warning', () => {
  const root = workspace();
  const kit = path.join(root, 'kit');
  createDevTask(root, { id: 'busy', title: '占用', repos: ['kit'] });
  failDevTask(root, 'busy');
  const slot = loadState(root).tasks.busy.slots.kit.path;
  git(slot, ['checkout', '-f', '--detach']);
  const holder = path.join(root, 'holder');
  git(kit, ['worktree', 'add', holder, 'df-task/busy']);

  const result = deleteDevTasks(root, ['busy']);
  assert.deepEqual(result.removed, ['busy']);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /df-task\/busy/u);
  assert.equal(loadState(root).tasks.busy, undefined);
  assert.equal(hasBranch(kit, 'df-task/busy'), true);
  rmSync(root, { recursive: true, force: true });
});

test('a task in an accepting batch cannot be deleted until the batch closes', () => {
  const root = workspace();
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  const slot = loadState(root).tasks.login.slots.kit.path;
  writeFileSync(path.join(slot, 'login.txt'), 'login\n');
  git(slot, ['add', 'login.txt']);
  git(slot, ['commit', '-m', 'login']);
  completeDevTask(root, 'login');
  startAcceptance(root, { id: 'batch-live', taskIds: ['login'] });

  assert.throws(
    () => deleteDevTasks(root, ['login']),
    (error) => error instanceof FlowError && error.code === 'status',
  );
  assert.notEqual(loadState(root).tasks.login, undefined);
  assert.equal(hasBranch(path.join(root, 'kit'), 'df-task/login'), true);

  finishAcceptance(root, 'batch-live', 'rejected');
  const result = deleteDevTasks(root, ['login']);
  assert.deepEqual(result.removed, ['login']);
  assert.equal(hasBranch(path.join(root, 'kit'), 'df-task/login'), false);
  rmSync(root, { recursive: true, force: true });
});

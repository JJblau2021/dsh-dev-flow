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
  assert.equal(first.warnings[0], 'kit 主干不干净');
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
  assert.equal(batch.repos.kit.path.endsWith(`${path.sep}01${path.sep}kit-01`), true);
  assert.equal(loadState(root).devSlots.kit['01'].path.endsWith(`${path.sep}01${path.sep}kit-01`), true);
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

test('a task branch starts from the trunk checkout, not the detected default branch', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-'));
  const kit = makeRepo(root, 'kit');
  git(kit, ['checkout', '-b', 'trunk-line']);
  commit(kit, 'trunk.txt', 'on trunk\n');
  const trunkHead = head(kit);
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  const slot = loadState(root).tasks.login.slots.kit.path;
  assert.equal(head(slot), trunkHead);
  assert.notEqual(trunkHead, execFileSync('git', ['rev-parse', 'main'], { cwd: kit, encoding: 'utf8' }).trim());
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

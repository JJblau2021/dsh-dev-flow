import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { completeDevTask, createDevTask, failDevTask } from '../kernel/flow.mjs';
import { handle } from '../kernel/service.mjs';
import { FlowError } from '../kernel/settings.mjs';

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function makeRepo(root, name) {
  const repo = path.join(root, name);
  mkdirSync(repo);
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.email', 'dev@example.com']);
  git(repo, ['config', 'user.name', 'dev']);
  writeFileSync(path.join(repo, 'README.md'), 'base\n');
  git(repo, ['add', 'README.md']);
  git(repo, ['commit', '-m', 'base']);
  return repo;
}

test('an uninitialized workspace reports zero counts until init', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-view-'));
  makeRepo(root, 'kit');
  const view = handle(root, 'session-a', 'snapshot');
  assert.equal(view.initialized, false);
  assert.equal(view.counts.projects, 0);
  const ready = handle(root, 'session-a', 'init');
  assert.equal(ready.initialized, true);
  assert.deepEqual(ready.projects.map((project) => project.name), ['kit']);
  rmSync(root, { recursive: true, force: true });
});

test('the session switch is per session and acceptance keeps dev slot numbers', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-view-'));
  makeRepo(root, 'kit');
  makeRepo(root, 'glose');
  for (const [id, repo] of [['login', 'kit'], ['copy', 'glose']]) {
    createDevTask(root, { id, title: id, repos: [repo] });
    const slot = handle(root, 'session-a', 'snapshot').tasks.find((task) => task.id === id).slots[repo].path;
    writeFileSync(path.join(slot, `${id}.txt`), 'ok\n');
    git(slot, ['add', `${id}.txt`]);
    git(slot, ['commit', '-m', id]);
    completeDevTask(root, id);
  }
  const numbers = {
    login: handle(root, 'session-a', 'snapshot').tasks.find((task) => task.id === 'login').slots.kit.number,
    copy: handle(root, 'session-b', 'snapshot').tasks.find((task) => task.id === 'copy').slots.glose.number,
  };
  assert.equal(handle(root, 'session-a', 'snapshot').enabled, false);
  assert.throws(() => handle(root, 'session-a', 'accept-start', { id: 'batch-1', taskIds: ['login', 'copy'] }), (error) => error.code === 'disabled');
  handle(root, 'session-a', 'session-set', { enabled: true });
  assert.equal(handle(root, 'session-b', 'snapshot').enabled, false);
  const started = handle(root, 'session-a', 'accept-start', { id: 'batch-1', taskIds: ['login', 'copy'] });
  assert.equal(started.batch.status, 'accepting');
  const after = handle(root, 'session-a', 'snapshot');
  assert.equal(after.tasks.find((task) => task.id === 'login').slots.kit.number, numbers.login);
  assert.equal(after.tasks.find((task) => task.id === 'copy').slots.glose.number, numbers.copy);
  assert.equal(after.tasks.find((task) => task.id === 'login').batchId, 'batch-1');
  assert.equal(after.counts.pending, 2);
  assert.equal(after.counts.activeAgents, 0);
  const finished = handle(root, 'session-a', 'accept-finish', { id: 'batch-1', result: 'accepted' });
  assert.equal(finished.tasks.find((task) => task.id === 'login').status, 'merged');
  assert.equal(finished.repos.every((repo) => repo.acceptSlot.batchId == null), true);
  rmSync(root, { recursive: true, force: true });
});

test('plugin settings reject a branch format without xxx and keep the file out of the workspace', () => {
  const home = mkdtempSync(path.join(tmpdir(), 'dev-flow-settings-'));
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-workspace-'));
  assert.throws(() => handle(root, 'session-a', 'settings-set', { settings: { taskBranch: 'plain' } }, home), (error) => error instanceof FlowError);
  const saved = handle(root, 'session-a', 'settings-set', { settings: { taskBranch: 'team/xxx', acceptBranch: 'review/xxx' } }, home);
  assert.equal(saved.taskBranch, 'team/xxx');
  const model = { provider: 'deepseek', model: 'deepseek-v4.1-flash', reasoningEffort: 'high' };
  const withModel = handle(root, 'session-a', 'settings-set', { settings: { devModel: model } }, home);
  assert.deepEqual(withModel.devModel, model);
  assert.deepEqual(handle(root, 'session-a', 'settings-get', {}, home).devModel, model);
  assert.equal(handle(root, 'session-a', 'snapshot').initialized, false);
  rmSync(home, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});

test('the panel marks deletable tasks and task-delete cleans the task branch', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-view-'));
  const kit = makeRepo(root, 'kit');
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  const slot = handle(root, 'session-a', 'snapshot').tasks.find((task) => task.id === 'login').slots.kit.path;
  writeFileSync(path.join(slot, 'login.txt'), 'login\n');
  git(slot, ['add', 'login.txt']);
  git(slot, ['commit', '-m', 'login']);
  completeDevTask(root, 'login');

  const ready = handle(root, 'session-a', 'snapshot');
  assert.equal(ready.tasks.find((task) => task.id === 'login').deletable, true);

  handle(root, 'session-a', 'session-set', { enabled: true });
  handle(root, 'session-a', 'accept-start', { id: 'batch-1', taskIds: ['login'] });
  const accepting = handle(root, 'session-a', 'snapshot');
  assert.equal(accepting.tasks.find((task) => task.id === 'login').deletable, false);
  assert.equal(accepting.tasks.find((task) => task.kind === 'accept').deletable, false);
  assert.throws(
    () => handle(root, 'session-a', 'task-delete', { ids: ['login'] }),
    (error) => error.code === 'status',
  );
  assert.equal(handle(root, 'session-a', 'snapshot').tasks.some((task) => task.id === 'login'), true);

  handle(root, 'session-a', 'accept-finish', { id: 'batch-1', result: 'rejected' });
  const deleted = handle(root, 'session-a', 'task-delete', { ids: ['login'] });
  assert.deepEqual(deleted.deleted, ['login']);
  assert.deepEqual(deleted.deleteWarnings, []);
  assert.equal(deleted.snapshot.tasks.some((task) => task.id === 'login'), false);
  assert.throws(() => execFileSync('git', ['rev-parse', '--verify', 'refs/heads/df-task/login'], { cwd: kit, stdio: 'ignore' }));
  assert.throws(() => handle(root, 'session-a', 'task-delete', { ids: [] }), /没有要删除的任务/u);
  rmSync(root, { recursive: true, force: true });
});

test('task-delete surfaces branch cleanup warnings without keeping the task record', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-view-'));
  const kit = makeRepo(root, 'kit');
  createDevTask(root, { id: 'busy', title: '占用', repos: ['kit'] });
  const slot = handle(root, 'session-a', 'snapshot').tasks.find((task) => task.id === 'busy').slots.kit.path;
  failDevTask(root, 'busy');
  git(slot, ['checkout', '-f', '--detach']);
  const holder = path.join(root, 'holder');
  git(kit, ['worktree', 'add', holder, 'df-task/busy']);
  const result = handle(root, 'session-a', 'task-delete', { ids: ['busy'] });
  assert.deepEqual(result.deleted, ['busy']);
  assert.equal(result.deleteWarnings.length, 1);
  assert.match(result.deleteWarnings[0], /df-task\/busy/u);
  assert.equal(result.snapshot.tasks.some((task) => task.id === 'busy'), false);
  rmSync(root, { recursive: true, force: true });
});

test('task-pause and task-stop expose interrupt metadata and update the panel view', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-view-'));
  makeRepo(root, 'kit');
  createDevTask(root, { id: 'pausable', title: '可暂停', repos: ['kit'], sessionId: 'session-a' });

  const paused = handle(root, 'session-a', 'task-pause', { taskId: 'pausable' });
  assert.equal(paused.task.status, 'paused');
  assert.equal(paused.parentSessionId, 'session-a');
  assert.equal(paused.agentSessionId, null);
  assert.equal(paused.slotPaths.length, 1);
  assert.equal(paused.snapshot.counts.activeTasks, 1);
  assert.equal(paused.snapshot.tasks.find((task) => task.id === 'pausable').status, 'paused');

  const resumed = handle(root, 'session-a', 'task-resume', { taskId: 'pausable' });
  assert.equal(resumed.tasks.find((task) => task.id === 'pausable').status, 'developing');

  const stopped = handle(root, 'session-a', 'task-stop', { taskId: 'pausable' });
  assert.equal(stopped.task.status, 'stopped');
  assert.equal(stopped.snapshot.counts.activeTasks, 0);
  assert.equal(stopped.snapshot.tasks.find((task) => task.id === 'pausable').deletable, true);
  assert.equal(stopped.snapshot.bases.length, 1);
  assert.equal(stopped.snapshot.bases[0].tasks, 0);
  rmSync(root, { recursive: true, force: true });
});

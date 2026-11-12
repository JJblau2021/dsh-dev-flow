import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { completeDevTask, createDevTask } from '../kernel/flow.mjs';
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
  assert.deepEqual(ready.projects, ['kit']);
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
  assert.equal(handle(root, 'session-a', 'snapshot').initialized, false);
  rmSync(home, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});

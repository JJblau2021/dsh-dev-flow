import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  abandonDevTask,
  completeDevTask,
  createDevTask,
  failDevTask,
  finishAcceptance,
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
  assert.equal(batch.repos.kit.path.endsWith(`${path.sep}kit${path.sep}01`), true);
  assert.equal(loadState(root).devSlots.kit['01'].path.endsWith(`${path.sep}kit${path.sep}01`), true);
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

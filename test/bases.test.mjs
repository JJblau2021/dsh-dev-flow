import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  addBase,
  completeDevTask,
  createDevTask,
  finishAcceptance,
  removeBase,
  saveBaseGroup,
  scan,
  startAcceptance,
  startSchedule,
} from '../kernel/flow.mjs';
import { snapshot } from '../kernel/view.mjs';
import { loadState, statePath } from '../kernel/state.mjs';

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function output(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function head(cwd) {
  return output(cwd, ['rev-parse', 'HEAD']);
}

function branch(cwd) {
  return output(cwd, ['branch', '--show-current']);
}

function commit(repo, name, content) {
  writeFileSync(path.join(repo, name), content);
  git(repo, ['add', name]);
  git(repo, ['commit', '-m', name]);
  return head(repo);
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
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-base-'));
  return { root, kit: makeRepo(root, 'kit') };
}

test('a task on another baseline works in a base slot and merges back only there', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'release/1.0']);
  const releaseHead = commit(kit, 'release.txt', 'release\n');
  git(kit, ['checkout', 'main']);
  const mainHead = head(kit);

  const created = createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], base: 'release/1.0' });
  assert.equal(created.task.base, 'release/1.0');
  assert.equal(created.task.slots.kit.target, 'release/1.0');
  assert.equal(head(created.task.slots.kit.path), releaseHead);
  const state = JSON.parse(readFileSync(statePath(root), 'utf8'));
  const group = state.baseGroups['01'];
  assert.equal(group.label, 'release/1.0');
  assert.equal(group.repos.kit.branch, 'release/1.0');
  assert.equal(branch(group.repos.kit.path), 'release/1.0');
  assert.equal(branch(kit), 'main');

  commit(created.task.slots.kit.path, 'login.txt', 'login\n');
  completeDevTask(root, 'login');
  startAcceptance(root, { id: 'batch-1', taskIds: ['login'] });
  finishAcceptance(root, 'batch-1', 'accepted');

  assert.notEqual(output(kit, ['rev-parse', 'release/1.0']), mainHead);
  assert.equal(head(kit), mainHead);
  assert.equal(branch(kit), 'main');
  assert.equal(execFileSync('git', ['show', 'release/1.0:login.txt'], { cwd: kit, encoding: 'utf8' }), 'login\n');
  assert.throws(() => execFileSync('git', ['show', 'main:login.txt'], { cwd: kit, stdio: 'ignore' }));

  const bases = snapshot(root, 'session-a').bases;
  const release = bases.find((item) => item.repo === 'kit' && item.branch === 'release/1.0');
  assert.equal(release.location, 'slot');
  assert.equal(release.current, false);
  assert.equal(bases.find((item) => item.repo === 'kit' && item.branch === 'main'), undefined);
  rmSync(root, { recursive: true, force: true });
});

test('two baselines develop and merge independently', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'release/1.0']);
  commit(kit, 'release.txt', 'release\n');
  git(kit, ['checkout', 'main']);
  const mainHead = head(kit);

  for (const [id, base, file] of [['login', 'release/1.0', 'login.txt'], ['pay', 'main', 'pay.txt']]) {
    const created = createDevTask(root, { id, title: id, repos: ['kit'], base });
    commit(created.task.slots.kit.path, file, `${id}\n`);
    completeDevTask(root, id);
    startAcceptance(root, { id: `batch-${id}`, taskIds: [id] });
    finishAcceptance(root, `batch-${id}`, 'accepted');
  }

  assert.equal(execFileSync('git', ['show', 'release/1.0:login.txt'], { cwd: kit, encoding: 'utf8' }), 'login\n');
  assert.throws(() => execFileSync('git', ['show', 'main:login.txt'], { cwd: kit, stdio: 'ignore' }));
  assert.equal(execFileSync('git', ['show', 'main:pay.txt'], { cwd: kit, encoding: 'utf8' }), 'pay\n');
  assert.throws(() => execFileSync('git', ['show', 'release/1.0:pay.txt'], { cwd: kit, stdio: 'ignore' }));
  assert.equal(head(kit), output(kit, ['rev-parse', 'main']));
  rmSync(root, { recursive: true, force: true });
});

test('one acceptance batch cannot mix baselines on the same repo', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'release/1.0']);
  commit(kit, 'release.txt', 'release\n');
  git(kit, ['checkout', 'main']);
  for (const [id, base] of [['login', 'release/1.0'], ['pay', 'main']]) {
    const created = createDevTask(root, { id, title: id, repos: ['kit'], base });
    commit(created.task.slots.kit.path, `${id}.txt`, `${id}\n`);
    completeDevTask(root, id);
  }
  assert.throws(
    () => startAcceptance(root, { id: 'batch-1', taskIds: ['login', 'pay'] }),
    (error) => error.code === 'base-mismatch',
  );
  rmSync(root, { recursive: true, force: true });
});

test('a dependency must share the baseline', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'release/1.0']);
  commit(kit, 'release.txt', 'release\n');
  git(kit, ['checkout', 'main']);
  const created = createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], base: 'release/1.0' });
  commit(created.task.slots.kit.path, 'login.txt', 'login\n');
  completeDevTask(root, 'login');
  assert.throws(
    () => createDevTask(root, { id: 'pay', title: '支付', repos: ['kit'], base: 'main', dependsOn: ['login'] }),
    (error) => error.code === 'base-mismatch',
  );
  rmSync(root, { recursive: true, force: true });
});

test('the schedule default baseline is inherited by its tasks', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'release/1.0']);
  commit(kit, 'release.txt', 'release\n');
  git(kit, ['checkout', 'main']);
  startSchedule(root, { id: 'round-1', title: '第一轮', base: 'release/1.0' });
  const created = createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], scheduleId: 'round-1' });
  assert.equal(created.task.base, 'release/1.0');
  const schedule = snapshot(root, 'session-a').schedules.find((item) => item.id === 'round-1');
  assert.equal(schedule.base, 'release/1.0');
  rmSync(root, { recursive: true, force: true });
});

test('a base slot cannot be removed while a task still uses it', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'release/1.0']);
  commit(kit, 'release.txt', 'release\n');
  git(kit, ['checkout', 'main']);
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], base: 'release/1.0' });
  const number = Object.keys(loadState(root).baseGroups)[0];
  assert.throws(() => removeBase(root, number, 'kit'), (error) => error.code === 'busy');
  rmSync(root, { recursive: true, force: true });
});

test('an old state file gains baselines on load', () => {
  const { root } = workspace();
  mkdirSync(path.join(root, '.dev-flow'), { recursive: true });
  writeFileSync(statePath(root), JSON.stringify({
    version: 1,
    tasks: {
      login: {
        id: 'login',
        title: '登录',
        status: 'pending-acceptance',
        repos: [{ name: 'kit', path: path.join(root, 'kit'), defaultBranch: 'main' }],
        slots: { kit: { number: '01', path: path.join(root, 'task', '01', 'kit-01'), branch: 'df-task/login', base: 'abc', end: 'def' } },
      },
    },
    devSlots: {}, acceptSlots: {}, batches: {}, sessions: {}, agents: [], schedules: {}, trunks: [],
  }));
  const before = JSON.parse(readFileSync(statePath(root), 'utf8'));
  assert.equal(before.version, 1);
  const view = snapshot(root, 'session-a');
  assert.equal(view.tasks.find((task) => task.id === 'login').base, 'main');
  const after = JSON.parse(readFileSync(statePath(root), 'utf8'));
  assert.equal(after.version, 3);
  assert.equal(after.tasks.login.slots.kit.target, 'main');
  assert.equal(after.tasks.login.slots.kit.baseGroup, '01');
  assert.equal(after.baseGroups['01'].label, 'main');
  rmSync(root, { recursive: true, force: true });
});


test('a workspace that is itself the repository keeps a project name', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-root-repo-'));
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.email', 'dev@example.com']);
  git(root, ['config', 'user.name', 'dev']);
  writeFileSync(path.join(root, 'README.md'), 'base\n');
  git(root, ['add', 'README.md']);
  git(root, ['commit', '-m', 'base']);
  const listed = scan(root);
  assert.equal(listed.repos.length, 1);
  assert.equal(listed.repos[0].name, path.basename(root));
  const view = snapshot(root, 'session-a');
  assert.equal(view.projects[0].name, path.basename(root));
  rmSync(root, { recursive: true, force: true });
});

test('a workspace without base slots shows the empty baseline state', () => {
  const { root } = workspace();
  scan(root);
  const view = snapshot(root, 'session-a');
  assert.deepEqual(view.bases, []);
  assert.equal(view.projects[0].bases, 0);
});

test('only registered baselines and the in-use root branch are listed', () => {
  const { root, kit } = workspace();
  git(kit, ['branch', 'feature/x']);
  assert.deepEqual(snapshot(root, 'session-a').bases, []);
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'] });
  const view = snapshot(root, 'session-a');
  const main = view.bases.find((item) => item.branch === 'main');
  assert.equal(main.location, 'root');
  assert.equal(main.tasks, 1);
  assert.equal(view.bases.some((item) => item.branch === 'feature/x'), false);
  rmSync(root, { recursive: true, force: true });
});

test('registering a schedule baseline allocates the base slot at the same time', () => {
  const { root, kit } = workspace();
  git(kit, ['branch', 'feat/chatV1']);
  const schedule = startSchedule(root, { id: 'chatv1', title: 'chat', base: 'feat/chatV1' });
  assert.deepEqual(schedule.warnings, []);
  const state = loadState(root);
  const group = state.baseGroups['01'];
  const record = group.repos.kit;
  assert.equal(group.label, 'feat/chatV1');
  assert.equal(record.branch, 'feat/chatV1');
  assert.equal(record.path, path.join(root, 'base', '01', 'kit-base-01'));
  assert.equal(branch(record.path), 'feat/chatV1');
  assert.equal(branch(kit), 'main');
  const row = snapshot(root, 'session-a').bases.find((item) => item.branch === 'feat/chatV1');
  assert.equal(row.location, 'slot');
  assert.equal(row.shortHead, output(kit, ['rev-parse', '--short=7', 'feat/chatV1']));
  rmSync(root, { recursive: true, force: true });
});

test('a baseline already checked out at the root does not get a slot', () => {
  const { root, kit } = workspace();
  git(kit, ['checkout', '-b', 'feat/chatV1']);
  const schedule = startSchedule(root, { id: 'chatv1', title: 'chat', base: 'feat/chatV1' });
  assert.deepEqual(schedule.warnings, []);
  const group = loadState(root).baseGroups['01'];
  assert.equal(group.repos.kit.kind, 'root');
  assert.equal(group.repos.kit.path, kit);
  const row = snapshot(root, 'session-a').bases.find((item) => item.branch === 'feat/chatV1');
  assert.equal(row.location, 'root');
  rmSync(root, { recursive: true, force: true });
});

test('base-add backfills a baseline slot for an existing schedule', () => {
  const { root, kit } = workspace();
  git(kit, ['branch', 'feat/chatV1']);
  startSchedule(root, { id: 'chatv1', title: 'chat' });
  assert.deepEqual(loadState(root).baseGroups, {});
  const added = addBase(root, 'kit', 'feat/chatV1');
  assert.equal(added.kind, 'slot');
  assert.equal(added.group, '01');
  assert.equal(added.branch, 'feat/chatV1');
  assert.equal(branch(added.path), 'feat/chatV1');
  const row = snapshot(root, 'session-a').bases.find((item) => item.branch === 'feat/chatV1');
  assert.equal(row.location, 'slot');
  rmSync(root, { recursive: true, force: true });
});

test('one baseline group holds a member for every project that has the branch', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-base-group-'));
  for (const name of ['kit', 'glose']) {
    const repo = makeRepo(root, name);
    git(repo, ['branch', 'feat/chatV1']);
  }
  const schedule = startSchedule(root, { id: 'chatv1', title: 'chat', base: 'feat/chatV1' });
  assert.equal(schedule.baseGroup, '01');
  const group = loadState(root).baseGroups['01'];
  assert.deepEqual(Object.keys(group.repos).sort(), ['glose', 'kit']);
  assert.equal(group.repos.kit.path, path.join(root, 'base', '01', 'kit-base-01'));
  assert.equal(group.repos.glose.path, path.join(root, 'base', '01', 'glose-base-01'));
  const members = snapshot(root, 'session-a').baseGroups[0].repos;
  assert.deepEqual(members.map((member) => `${member.group}:${member.repo}:${member.branch}`), ['01:glose:feat/chatV1', '01:kit:feat/chatV1']);
  rmSync(root, { recursive: true, force: true });
});

test('the panel can create a baseline group with chosen projects and branches', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-save-'));
  const kit = makeRepo(root, 'kit');
  const glose = makeRepo(root, 'glose');
  for (const repo of [kit, glose]) {
    git(repo, ['checkout', '-b', 'feat/chatV1']);
    git(repo, ['checkout', 'main']);
  }
  const saved = saveBaseGroup(root, {
    label: 'chatV1',
    members: [{ repo: 'kit', branch: 'feat/chatV1' }, { repo: 'glose', branch: 'feat/chatV1' }],
  });
  assert.equal(saved.group, '01');
  assert.equal(saved.members, 2);
  const group = loadState(root).baseGroups['01'];
  assert.equal(group.repos.kit.path, path.join(root, 'base', '01', 'kit-base-01'));
  assert.equal(group.repos.glose.path, path.join(root, 'base', '01', 'glose-base-01'));
  assert.deepEqual(snapshot(root, 'session-a').baseGroups[0].repos.map((member) => member.repo).sort(), ['glose', 'kit']);
  rmSync(root, { recursive: true, force: true });
});

test('editing a baseline group replaces members, removes old slots, and can switch a branch', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-edit-'));
  const kit = makeRepo(root, 'kit');
  const glose = makeRepo(root, 'glose');
  git(kit, ['branch', 'feat/a']);
  git(kit, ['checkout', 'feat/a']);
  git(kit, ['checkout', 'main']);
  git(glose, ['branch', 'feat/b']);
  saveBaseGroup(root, { members: [{ repo: 'kit', branch: 'feat/a' }, { repo: 'glose', branch: 'feat/b' }] });
  const oldKit = loadState(root).baseGroups['01'].repos.kit.path;
  const saved = saveBaseGroup(root, { number: '01', label: 'reworked', members: [{ repo: 'kit', branch: 'feat/a' }] });
  assert.equal(saved.group, '01');
  const group = loadState(root).baseGroups['01'];
  assert.equal(group.label, 'reworked');
  assert.deepEqual(Object.keys(group.repos), ['kit']);
  assert.equal(execFileSync('git', ['worktree', 'list'], { cwd: kit, encoding: 'utf8' }).includes('glose'), false);
  // 换成根目录当前分支：不再需要槽位。
  saveBaseGroup(root, { number: '01', members: [{ repo: 'kit', branch: 'main' }] });
  const switched = loadState(root).baseGroups['01'];
  assert.equal(switched.repos.kit.kind, 'root');
  assert.equal(switched.repos.kit.path, kit);
  assert.equal(existsSync(oldKit), false);
  rmSync(root, { recursive: true, force: true });
});

test('editing a group in use is refused with the task count', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-busy-group-'));
  const kit = makeRepo(root, 'kit');
  git(kit, ['branch', 'feat/a']);
  saveBaseGroup(root, { members: [{ repo: 'kit', branch: 'feat/a' }] });
  createDevTask(root, { id: 'login', title: '登录', repos: ['kit'], baseGroup: '01' });
  assert.throws(
    () => saveBaseGroup(root, { number: '01', members: [{ repo: 'kit', branch: 'main' }] }),
    (error) => error.code === 'busy' && /还有 1 个未结束任务/.test(error.message),
  );
  rmSync(root, { recursive: true, force: true });
});

test('a bad branch or duplicate project is refused and leaves no new group', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-bad-group-'));
  makeRepo(root, 'kit');
  assert.throws(
    () => saveBaseGroup(root, { members: [{ repo: 'kit', branch: 'no-such-branch' }] }),
    (error) => error.code === 'base-missing',
  );
  assert.deepEqual(loadState(root).baseGroups, {});
  assert.throws(
    () => saveBaseGroup(root, { members: [{ repo: 'kit', branch: 'main' }, { repo: 'kit', branch: 'main' }] }),
    (error) => error.code === 'duplicate',
  );
  assert.throws(() => saveBaseGroup(root, { members: [] }), (error) => error.code === 'empty');
  rmSync(root, { recursive: true, force: true });
});

test('task counts are scoped to the project, not just the branch name', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-count-'));
  const kit = makeRepo(root, 'kit');
  const glose = makeRepo(root, 'glose');
  for (const repo of [kit, glose]) {
    git(repo, ['branch', 'feat/shared']);
  }
  saveBaseGroup(root, {
    members: [{ repo: 'kit', branch: 'feat/shared' }, { repo: 'glose', branch: 'feat/shared' }],
  });
  createDevTask(root, { id: 'be', title: '后端', repos: ['kit'], baseGroup: '01' });
  let group = snapshot(root, 'session-a').baseGroups[0];
  assert.equal(group.repos.find((member) => member.repo === 'kit').tasks, 1);
  assert.equal(group.repos.find((member) => member.repo === 'glose').tasks, 0);
  createDevTask(root, { id: 'fe', title: '前端', repos: ['glose'], baseGroup: '01' });
  group = snapshot(root, 'session-a').baseGroups[0];
  assert.equal(group.repos.find((member) => member.repo === 'kit').tasks, 1);
  assert.equal(group.repos.find((member) => member.repo === 'glose').tasks, 1);
  rmSync(root, { recursive: true, force: true });
});

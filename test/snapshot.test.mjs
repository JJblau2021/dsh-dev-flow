import assert from 'node:assert/strict';
import test from 'node:test';

import * as esbuild from 'esbuild';

// snapshot.ts 只依赖类型，打成 ESM 就能直接验证旧宿主快照的兼容处理。
const built = await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['src/client/snapshot.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const { normalizeSnapshot } = await import(`data:text/javascript,${encodeURIComponent(built.outputFiles[0].text)}`);

test('an old snapshot with project names as strings keeps the project rows readable', () => {
  const snapshot = normalizeSnapshot({
    initialized: true,
    enabled: true,
    counts: { projects: 2, dirtyTrunks: 1 },
    projects: ['kit', 'glose'],
    tasks: [],
    repos: [],
    agents: [],
  });
  const emptyStats = { activeAgents: 0, baseSlots: { active: 0, dirty: 0, total: 0 }, devTasks: { developing: 0, pending: 0, total: 0 } };
  assert.deepEqual(snapshot.projects, [
    { name: 'kit', dirty: false, stats: emptyStats },
    { name: 'glose', dirty: false, stats: emptyStats },
  ]);
  assert.deepEqual(snapshot.bases, []);
  assert.equal(snapshot.counts.dirtyBases, 1);
});

test('a current snapshot passes through unchanged', () => {
  const snapshot = normalizeSnapshot({
    initialized: true,
    enabled: true,
    counts: { projects: 1, dirtyBases: 0 },
    projects: [{ name: 'kit', dirty: false, branch: 'main' }],
    bases: [{ id: 'kit@main', repo: 'kit', branch: 'main', current: true, default: true, location: 'root', dirty: false, tasks: 0 }],
    tasks: [],
    repos: [],
    agents: [],
  });
  assert.equal(snapshot.projects[0].name, 'kit');
  assert.equal(snapshot.bases.length, 1);
  assert.equal(snapshot.counts.dirtyBases, 0);
});

test('a missing snapshot stays empty', () => {
  assert.equal(normalizeSnapshot(undefined), null);
  assert.equal(normalizeSnapshot('nope'), null);
});

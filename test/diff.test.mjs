import assert from 'node:assert/strict';
import test from 'node:test';

import * as esbuild from 'esbuild';

// diff.ts 只依赖类型，直接打成 ESM 就能在 Node 里验证地址编解码和 hunk 兜底。
const built = await esbuild.build({
  absWorkingDir: new URL('..', import.meta.url).pathname,
  entryPoints: ['src/client/diff.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const diff = await import(`data:text/javascript,${encodeURIComponent(built.outputFiles[0].text)}`);

test('a diff address round-trips the task and its tab title', () => {
  const target = { taskId: 'batch-ui-fixes', title: '登录改造' };
  const address = diff.diffAddress(target);
  assert.equal(address, 'dsh-resource://dev-flow-diff/batch-ui-fixes/%E7%99%BB%E5%BD%95%E6%94%B9%E9%80%A0');
  assert.deepEqual(diff.parseDiffAddress(address), target);
  assert.equal(diff.diffTitle(address), '登录改造');
});

test('an address from another type or a malformed one names no diff', () => {
  assert.equal(diff.parseDiffAddress(undefined), undefined);
  assert.equal(diff.parseDiffAddress('dsh-resource://file/session/s1/notes.md'), undefined);
  assert.equal(diff.parseDiffAddress('dsh-resource://dev-flow-diff/only-one-part'), undefined);
  assert.equal(diff.parseDiffAddress('dsh-resource://dev-flow-diff/t/kit/src%2Fa.ts'), undefined);
  assert.equal(diff.parseDiffAddress('dsh-resource://dev-flow-diff/t/%E0%A4%A'), undefined);
  assert.equal(diff.diffTitle('dsh-resource://file/x'), '');
});

test('a navigation names the file to show, once', () => {
  assert.equal(diff.navigatedIndex({ index: 2 }), 2);
  assert.equal(diff.navigatedIndex({ index: 0 }), 0);
  assert.equal(diff.navigatedIndex({ index: -1 }), undefined);
  assert.equal(diff.navigatedIndex({ index: 1.5 }), undefined);
  assert.equal(diff.navigatedIndex(undefined), undefined);
  assert.equal(diff.navigatedIndex({}), undefined);
});

test('a whole file is addressed with the absolute file grammar', () => {
  assert.equal(diff.absoluteFileAddress('/Users/me/repo/src/a b.ts'), 'dsh-resource://file/absolute/Users/me/repo/src/a%20b.ts');
  assert.equal(diff.absoluteFileAddress('C:/work/x.ts'), 'dsh-resource://file/absolute/C:/work/x.ts');
});

test('hunks are rebuilt from the patch when the host sends none', () => {
  const lines = Array.from({ length: 19 }, (_, index) => `+line ${index + 1}`).join('\n');
  const patch = [
    'diff --git a/src/new.ts b/src/new.ts',
    'new file mode 100644',
    'index 0000000..0d36880',
    '--- /dev/null',
    '+++ b/src/new.ts',
    '@@ -0,0 +1,19 @@',
    lines,
  ].join('\n');
  const file = { repo: 'kit', path: 'src/new.ts', added: 19, deleted: 0, binary: false, patch };
  assert.equal(diff.hunksFromPatch(patch).length, 1);
  assert.equal(diff.hunksFromPatch(patch)[0].lines.length, 19);
  const state = diff.diffStateOf(file);
  assert.equal(state.kind, 'text');
  assert.equal(state.before, false);
  assert.equal(state.after, true);
  assert.equal(state.hunks.length, 1);
});

test('hunks sent by the host win over the patch fallback', () => {
  const hunks = [{ oldStart: 1, oldLines: 1, newStart: 1, newLines: 1, lines: ['-a', '+b'] }];
  const file = { repo: 'kit', path: 'src/a.ts', added: 1, deleted: 1, binary: false, patch: 'not a patch', hunks };
  assert.equal(diff.diffStateOf(file).hunks, hunks);
});

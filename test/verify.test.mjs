import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { saveState } from '../kernel/state.mjs';
import { verificationNotes } from '../kernel/verify.mjs';

test('acceptance starts a subagent only when the workspace has verification notes', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-verify-'));
  const repo = path.join(root, 'kit');
  mkdirSync(repo);
  saveState(root, {
    version: 1,
    tasks: { login: { id: 'login', repos: [{ name: 'kit', path: repo }] } },
    devSlots: {},
    acceptSlots: {},
    batches: {},
    sessions: {},
    agents: [],
    schedules: {},
    trunks: [],
  });
  const batch = { taskIds: ['login'] };
  assert.deepEqual(verificationNotes(root, batch), []);
  writeFileSync(path.join(repo, 'VERIFY.md'), '打开首页，确认没有 Hello world。\n');
  const notes = verificationNotes(root, batch);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].file, path.join(repo, 'VERIFY.md'));
  rmSync(root, { recursive: true, force: true });
});

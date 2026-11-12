import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { setSessionEnabled } from '../kernel/flow.mjs';
import { apply, inject, leadGate, name, resolveWorkspace } from '../index.js';

test('registers the dev-flow skill with the installed CLI path', async () => {
  assert.equal(name, 'dev-flow');
  assert.deepEqual(inject, ['skills']);
  const providers = [];
  apply({
    skills: {
      registerProvider(create) {
        providers.push(create());
      },
    },
  });
  const provider = providers[0];
  const [candidate] = await provider.list();
  assert.equal(candidate.name, 'dev-flow');
  const skill = await provider.get(candidate);
  assert.match(skill.content, /cli\.mjs/);
  assert.equal(skill.content.includes('{{DEV_FLOW_CLI}}'), false);
  assert.equal(path.isAbsolute(skill.content.match(/'([^']*cli\.mjs)'/u)[1]), true);
});

test('the lead gate applies only to an enabled root session', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-gate-'));
  const session = { id: 'session-a', header: { cwd: root } };
  assert.equal(leadGate(session, root), '');
  setSessionEnabled(root, 'session-a', true);
  assert.match(leadGate(session, root), /禁止编辑文件/);
  assert.equal(leadGate({ id: 'child', header: { parentSession: 'session-a' } }, root), '');
  assert.equal(leadGate(session, `${root}/task/kit/01`), '');
  rmSync(root, { recursive: true, force: true });
});

test('reads the workspace from an agent session, not the agent itself', () => {
  const agent = { session: { id: 'session-a', header: { cwd: '/work/plugins' } } };
  const rpc = {
    agents: { get: () => agent },
    workingDirectory: {
      get(session) {
        if (session.header === undefined) throw new Error('not a session');
        return '/work/plugins/current';
      },
    },
  };
  assert.equal(resolveWorkspace(rpc, 'session-a'), '/work/plugins/current');
  assert.equal(resolveWorkspace({ agents: { get: () => agent } }, 'session-a'), '/work/plugins');
});

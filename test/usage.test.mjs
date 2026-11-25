import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { saveState } from '../kernel/state.mjs';
import { findUsageTarget, inferActiveTask, recordUsage } from '../kernel/usage.mjs';

test('usage replaces the same step and sums later steps onto the owning task', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'dev-flow-usage-'));
  saveState(root, {
    version: 1,
    tasks: {
      login: { id: 'login', slots: { kit: { path: path.join(root, 'task', 'kit', '01') } }, scheduleId: 'sched-1' },
    },
    devSlots: {},
    acceptSlots: {},
    batches: { 'batch-1': { id: 'batch-1', repos: {}, childSessionId: 'child-1' } },
    sessions: {},
    agents: [],
    schedules: { 'sched-1': { id: 'sched-1', sessionId: 'lead-1', status: 'scheduling', updatedAt: '2', taskIds: ['login'], agentIds: [] } },
    trunks: [],
  });
  const state = {
    tasks: { login: { id: 'login', slots: { kit: { path: path.join(root, 'task', 'kit', '01') } } } },
    batches: { 'batch-1': { id: 'batch-1', repos: { kit: { path: path.join(root, 'check', 'kit', '01') } }, childSessionId: 'child-1' } },
    schedules: { 'sched-1': { id: 'sched-1', sessionId: 'lead-1', status: 'scheduling', updatedAt: '2' } },
  };
  assert.deepEqual(findUsageTarget(state, { cwd: path.join(root, 'task', 'kit', '01') }), { taskId: 'login' });
  assert.deepEqual(findUsageTarget(state, { id: 'child-1', cwd: path.join(root, 'check', 'kit', '01') }), { batchId: 'batch-1' });
  assert.deepEqual(findUsageTarget(state, { id: 'lead-1', cwd: root }), { scheduleId: 'sched-1' });
  state.tasks.login.agentSessionId = 'agent-session';
  assert.deepEqual(findUsageTarget(state, { id: 'agent-session', cwd: root }), { taskId: 'login' });

  recordUsage(root, { taskId: 'login', stepKey: 'child:1:1', usage: { inputTokens: 10, outputTokens: 4, totalTokens: 14 } });
  const replaced = recordUsage(root, { taskId: 'login', stepKey: 'child:1:1', usage: { inputTokens: 12, outputTokens: 5, cacheReadTokens: 3, totalTokens: 20 } });
  const summed = recordUsage(root, { taskId: 'login', stepKey: 'child:1:2', usage: { inputTokens: 8, outputTokens: 2, totalTokens: 10 } });
  assert.equal(replaced.totalTokens, 20);
  assert.equal(summed.totalTokens, 30);
  assert.equal(summed.cacheReadTokens, 3);
  rmSync(root, { recursive: true, force: true });
});

test('a lone running task owns its dev subagent usage', () => {
  const state = {
    tasks: {
      login: { id: 'login', agentStatus: 'running', scheduleId: 'sched-1' },
      profile: { id: 'profile', agentStatus: 'running', scheduleId: 'sched-1' },
    },
    schedules: { 'sched-1': { id: 'sched-1', sessionId: 'lead-1' } },
  };
  assert.deepEqual(inferActiveTask({ ...state, tasks: { login: state.tasks.login } }, { parentSession: 'lead-1' }), { taskId: 'login' });
  assert.equal(inferActiveTask(state, { parentSession: 'lead-1' }), null);
  assert.equal(inferActiveTask({ ...state, tasks: { login: state.tasks.login } }, { parentSession: 'lead-2' }), null);
  assert.equal(inferActiveTask({ ...state, tasks: { login: { ...state.tasks.login, agentSessionId: 'agent-1' } } }, { parentSession: 'lead-1' }), null);
  assert.equal(inferActiveTask({ ...state, tasks: { login: state.tasks.login }, batches: { 'batch-1': { id: 'batch-1', agentStatus: 'running' } } }, { parentSession: 'lead-1' }), null);
});

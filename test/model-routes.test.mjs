import assert from 'node:assert/strict';
import test from 'node:test';

import { acceptanceAgentOptions, launchAcceptance, listSubagentRoutes, subagentRoutesOf } from '../index.js';

const policy = {
  type: 'subagent/model-selection-policy',
  data: { allowedModels: [{ provider: 'deepseek-account', model: 'deepseek-flash' }] },
};

test('session policy routes win over the parent route', () => {
  const session = {
    snapshotEvents: () => [policy],
    requestHeader: () => ({ config: { provider: 'work', model: 'grok-4.7' } }),
  };
  assert.deepEqual(subagentRoutesOf(session), [
    { provider: 'deepseek-account', model: 'deepseek-flash' },
  ]);
});

test('sessions without a policy fall back to the parent route', () => {
  const session = {
    snapshotEvents: () => [],
    requestHeader: () => ({ config: { provider: 'work', model: 'grok-4.7' } }),
  };
  assert.deepEqual(subagentRoutesOf(session), [{ provider: 'work', model: 'grok-4.7' }]);
});

test('acceptance keeps the configured route when it is allowed', async () => {
  const rpc = { sessions: { get: () => ({ snapshotEvents: () => [policy] }) } };
  assert.deepEqual(
    await acceptanceAgentOptions(rpc, 's-1', {
      provider: 'deepseek-account',
      model: 'deepseek-flash',
      reasoningEffort: 'high',
    }),
    { provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'high' },
  );
});

test('acceptance rejects a route the current session does not allow', async () => {
  const rpc = { sessions: { get: () => ({ snapshotEvents: () => [policy] }) } };
  await assert.rejects(
    acceptanceAgentOptions(rpc, 's-1', { provider: 'work', model: 'grok-4.7' }),
    /不在当前会话允许的子代理路由里.*deepseek-account\/deepseek-flash/,
  );
});

test('acceptance follows the parent when no model is configured', async () => {
  const rpc = { sessions: { get: () => ({ snapshotEvents: () => [policy] }) } };
  assert.equal(await acceptanceAgentOptions(rpc, 's-1', null), undefined);
});

test('the settings catalog lists models from the latest top-level session', async () => {
  const session = {
    header: { id: 's-main', createdAt: '2026-11-25T00:00:00Z', delegationDepth: 0 },
    snapshotEvents: () => [policy],
  };
  const rpc = {
    sessions: { list: () => [session] },
    llm: {
      listProviders: async () => [{ id: 'deepseek-account', name: 'DeepSeek' }],
      resolveModelInfo: async (provider, model) => ({
        id: model,
        provider,
        name: 'DeepSeek Flash',
        reasoning: { efforts: [{ id: 'high', name: 'High' }], defaultEffort: 'high' },
      }),
    },
  };
  const catalog = await listSubagentRoutes(rpc);
  assert.equal(catalog.sessionId, 's-main');
  assert.equal(catalog.source, 'session');
  assert.deepEqual(catalog.providers[0].models[0].efforts, [{ id: 'high', name: 'High' }]);
});

test('acceptance activation carries the configured agentOptions', async () => {
  let spec;
  const rpc = {
    agents: { get: () => ({ session: {} }) },
    sessions: { get: () => ({ snapshotEvents: () => [policy] }) },
    subagents: {
      startActivation: async (next) => {
        spec = next;
        return { childId: 'c-1', name: 'accept-1', result: new Promise(() => {}) };
      },
    },
  };
  await launchAcceptance(
    rpc,
    's-1',
    '/ws',
    { id: 'b-1', repos: { kit: { path: '/tmp/kit', port: 4100 } } },
    [{ file: 'notes.md', text: 'check it' }],
    { acceptModel: { provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'high' } },
  );
  assert.deepEqual(spec.agentOptions, {
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    reasoningEffort: 'high',
  });
});

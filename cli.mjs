#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  abandonDevTask,
  completeDevTask,
  createDevTask,
  failDevTask,
  finishAcceptance,
  planDispatch,
  scan,
  setSessionEnabled,
  startAcceptance,
} from './kernel/flow.mjs';
import { loadPluginSettings } from './kernel/plugin-settings.mjs';
import { loadState } from './kernel/state.mjs';

const { values } = parseArgs({
  options: {
    workspace: { type: 'string' },
    id: { type: 'string' },
    title: { type: 'string' },
    repos: { type: 'string' },
    depends: { type: 'string' },
    tasks: { type: 'string' },
    session: { type: 'string' },
    enabled: { type: 'string' },
    kind: { type: 'string' },
  },
  allowPositionals: true,
});

const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const workspace = path.resolve(values.workspace ?? process.cwd());
const settings = loadPluginSettings();

function list(value) {
  return value === undefined || value === '' ? [] : value.split(',').filter(Boolean);
}

const commands = {
  scan: () => scan(workspace),
  status: () => loadState(workspace),
  'task-create': () => createDevTask(workspace, {
    id: values.id,
    title: values.title ?? values.id,
    repos: list(values.repos),
    dependsOn: list(values.depends),
    settings,
  }),
  'task-complete': () => completeDevTask(workspace, values.id),
  'task-fail': () => failDevTask(workspace, values.id),
  'task-abandon': () => abandonDevTask(workspace, values.id),
  'accept-start': () => startAcceptance(workspace, { id: values.id, taskIds: list(values.tasks), settings }),
  'accept-pass': () => finishAcceptance(workspace, values.id, 'accepted'),
  'accept-fail': () => finishAcceptance(workspace, values.id, 'rejected'),
  'session-set': () => setSessionEnabled(workspace, values.session, values.enabled === 'true'),
  dispatch: () => planDispatch(workspace, values.session, { kind: values.kind, id: values.id, settings }),
};

try {
  const run = commands[command];
  if (run === undefined) throw new Error(`未知命令 ${command ?? ''}`);
  process.stdout.write(`${JSON.stringify(run(), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import path from 'node:path';
import { parseArgs } from 'node:util';

import {
  abandonDevTask,
  addBase,
  completeDevTask,
  createDevTask,
  editBase,
  deleteDevTasks,
  failDevTask,
  finishAcceptance,
  pauseDevTask,
  planDispatch,
  removeBase,
  resumeDevTask,
  scan,
  setSessionEnabled,
  startAcceptance,
  startSchedule,
  stopDevTask,
} from './kernel/flow.mjs';
import { snapshot } from './kernel/view.mjs';
import { loadPluginSettings } from './kernel/plugin-settings.mjs';
import { loadState } from './kernel/state.mjs';

const { values } = parseArgs({
  options: {
    workspace: { type: 'string' },
    id: { type: 'string' },
    ids: { type: 'string' },
    title: { type: 'string' },
    repos: { type: 'string' },
    depends: { type: 'string' },
    tasks: { type: 'string' },
    session: { type: 'string' },
    enabled: { type: 'string' },
    kind: { type: 'string' },
    schedule: { type: 'string' },
    base: { type: 'string' },
    group: { type: 'string' },
    repo: { type: 'string' },
    branch: { type: 'string' },
    label: { type: 'string' },
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
  'schedule-start': () => startSchedule(workspace, {
    id: values.id,
    title: values.title ?? values.id,
    sessionId: values.session,
    base: values.base,
    baseGroup: values.group,
    settings,
  }),
  'task-create': () => createDevTask(workspace, {
    id: values.id,
    title: values.title ?? values.id,
    repos: list(values.repos),
    dependsOn: list(values.depends),
    scheduleId: values.schedule,
    sessionId: values.session,
    base: values.base,
    baseGroup: values.group,
    settings,
  }),
  'task-complete': () => completeDevTask(workspace, values.id),
  'task-fail': () => failDevTask(workspace, values.id),
  'task-pause': () => pauseDevTask(workspace, values.id),
  'task-resume': () => resumeDevTask(workspace, values.id),
  'task-stop': () => stopDevTask(workspace, values.id),
  'task-abandon': () => abandonDevTask(workspace, values.id),
  'task-delete': () => deleteDevTasks(workspace, list(values.ids ?? values.id)),
  'accept-start': () => startAcceptance(workspace, { id: values.id, taskIds: list(values.tasks), settings }),
  'accept-pass': () => finishAcceptance(workspace, values.id, 'accepted', settings),
  'accept-fail': () => finishAcceptance(workspace, values.id, 'rejected', settings),
  'base-list': () => snapshot(workspace, values.session ?? '', settings).baseGroups,
  'base-add': () => addBase(workspace, values.repo, values.branch, values.group, settings),
  'base-edit': () => editBase(workspace, values.group, values.repo, values.branch, values.label, settings),
  'base-remove': () => removeBase(workspace, values.group, values.repo, settings),
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

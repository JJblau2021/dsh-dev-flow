import { loadState, saveState } from './state.mjs';

function count(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

/** Keep a provider usage sample, or reject a report that cannot be added. */
export function normalizeUsage(usage) {
  const inputTokens = count(usage?.inputTokens);
  const outputTokens = count(usage?.outputTokens);
  if (inputTokens === null || outputTokens === null) return null;
  const cacheReadTokens = count(usage.cacheReadTokens) ?? 0;
  const cacheWriteTokens = count(usage.cacheWriteTokens) ?? 0;
  const totalTokens = count(usage.totalTokens) ?? inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;
  return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, totalTokens };
}

function sumUsage(steps) {
  const totals = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 0 };
  for (const step of Object.values(steps)) {
    totals.inputTokens += step.inputTokens;
    totals.outputTokens += step.outputTokens;
    totals.cacheReadTokens += step.cacheReadTokens;
    totals.cacheWriteTokens += step.cacheWriteTokens;
    totals.totalTokens += step.totalTokens;
  }
  return totals;
}

/**
 * Attribute one model step to a task, acceptance batch, or schedule task.
 * A later report for the same step replaces the earlier one.
 * @param {string} workspace
 * @param {{ taskId?: string, batchId?: string, scheduleId?: string, stepKey: string, usage: object }} record
 */
export function recordUsage(workspace, record) {
  const sample = normalizeUsage(record.usage);
  if (sample === null || !record.stepKey) return null;
  const state = loadState(workspace);
  const target = record.taskId
    ? state.tasks[record.taskId]
    : record.batchId
      ? state.batches[record.batchId]
      : state.schedules?.[record.scheduleId];
  if (target === undefined) return null;
  target.usageSteps = { ...(target.usageSteps ?? {}), [record.stepKey]: sample };
  target.usage = sumUsage(target.usageSteps);
  target.updatedAt = new Date().toISOString();
  saveState(workspace, state);
  return target.usage;
}

/** Remember the acceptance subagent so its later usage lands on the batch. */
export function bindChildSession(workspace, batchId, sessionId) {
  const state = loadState(workspace);
  const batch = state.batches[batchId];
  if (batch === undefined || !sessionId) return null;
  batch.childSessionId = sessionId;
  saveState(workspace, state);
  return batch;
}

/**
 * Decide which record owns a session's model usage.
 * A slot cwd belongs to that task. The lead session belongs to its schedule task.
 * @param {ReturnType<import('./state.mjs').loadState>} state
 * @param {{ id?: string, cwd?: string, parentSession?: string }} session
 */
export function findUsageTarget(state, session) {
  const cwd = session.cwd ?? '';
  if (session.id) {
    for (const task of Object.values(state.tasks)) {
      if (task.agentSessionId === session.id) return { taskId: task.id };
    }
  }
  if (cwd !== '') {
    for (const task of Object.values(state.tasks)) {
      const hit = Object.values(task.slots ?? {}).some((slot) => slot.path === cwd);
      if (hit) return { taskId: task.id };
    }
    for (const batch of Object.values(state.batches)) {
      const hit = Object.values(batch.repos ?? {}).some((slot) => slot.path === cwd);
      if (hit) return { batchId: batch.id };
    }
  }
  if (session.id) {
    const batch = Object.values(state.batches).find((item) => item.childSessionId === session.id);
    if (batch) return { batchId: batch.id };
  }
  if (session.parentSession || !session.id) return null;
  const owned = Object.values(state.schedules ?? {}).filter((item) => item.sessionId === session.id);
  if (owned.length === 0) return null;
  owned.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  const active = owned.find((item) => item.status === 'scheduling') ?? owned[0];
  return { scheduleId: active.id };
}

/**
 * A dev subagent runs with the workspace directory as its session cwd, so its
 * model usage cannot be matched by slot path. When exactly one task under the
 * parent lead is waiting for its first event, that task owns the session.
 */
export function inferActiveTask(state, session) {
  const parent = session?.parentSession;
  if (!parent) return null;
  // An acceptance subagent whose id is not bound yet must not fall through to
  // a running development task.
  const unbound = Object.values(state.batches ?? {}).some((batch) => batch.agentStatus === 'running' && !batch.childSessionId);
  if (unbound) return null;
  const running = Object.values(state.tasks).filter((task) => task.agentStatus === 'running' && !task.agentSessionId);
  if (running.length !== 1) return null;
  const task = running[0];
  const schedule = task.scheduleId ? state.schedules?.[task.scheduleId] : undefined;
  if (schedule !== undefined && schedule.sessionId !== parent) return null;
  return { taskId: task.id };
}

import { deleteAcceptances, finishAcceptance, finishTaskAcceptance, mergePendingTask, refreshSchedules, saveBaseGroup, sessionEnabled, setSessionEnabled, settlePendingMerges, settleStaleAcceptSlots, startAcceptance } from './flow.mjs';
import { diffTask } from './diff.mjs';
import { loadPluginSettings, savePluginSettings } from './plugin-settings.mjs';
import { hasState, initializeWorkspace } from './state.mjs';
import { snapshot } from './view.mjs';

/**
 * Operations the session switch, sidebar, and plugin detail page share.
 * @param {string} workspace
 * @param {string} sessionId
 * @param {string} endpoint
 * @param {Record<string, unknown>} [payload]
 * @param {string} [settingsHome]
 */
export function handle(workspace, sessionId, endpoint, payload = {}, settingsHome) {
  if (endpoint === 'snapshot') {
    if (hasState(workspace)) {
      settlePendingMerges(workspace, loadPluginSettings(settingsHome));
      refreshSchedules(workspace);
      settleStaleAcceptSlots(workspace);
    }
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'init') {
    initializeWorkspace(workspace);
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'session-set') {
    setSessionEnabled(workspace, sessionId, payload.enabled === true);
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'settings-get') return loadPluginSettings(settingsHome);
  if (endpoint === 'settings-set') return savePluginSettings(payload.settings ?? payload, settingsHome);
  if (endpoint === 'accept-start') {
    if (!sessionEnabled(workspace, sessionId)) {
      const error = new Error('会话未启用工作流');
      error.code = 'disabled';
      throw error;
    }
    const settings = loadPluginSettings(settingsHome);
    const batch = startAcceptance(workspace, {
      id: String(payload.id ?? ''),
      taskIds: Array.isArray(payload.taskIds) ? payload.taskIds.map(String) : [],
      settings,
    });
    return { batch, snapshot: snapshot(workspace, sessionId, loadPluginSettings(settingsHome)) };
  }
  if (endpoint === 'task-diff') {
    return diffTask(workspace, String(payload.taskId ?? ''));
  }
  if (endpoint === 'base-save') {
    const members = Array.isArray(payload.members)
      ? payload.members.map((item) => ({ repo: String(item?.repo ?? ''), branch: String(item?.branch ?? '') }))
      : [];
    saveBaseGroup(workspace, {
      number: typeof payload.number === 'string' ? payload.number : null,
      label: typeof payload.label === 'string' ? payload.label : '',
      members,
    }, loadPluginSettings(settingsHome));
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'accept-delete') {
    const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    deleteAcceptances(workspace, ids);
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'task-merge') {
    mergePendingTask(workspace, String(payload.taskId ?? ''), loadPluginSettings(settingsHome));
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'accept-task') {
    const result = payload.result === 'rejected' ? 'rejected' : payload.result;
    if (result !== 'accepted' && result !== 'rejected') {
      const error = new Error('验收结果只能是通过或不通过');
      error.code = 'status';
      throw error;
    }
    finishTaskAcceptance(workspace, String(payload.id ?? ''), String(payload.taskId ?? ''), result, loadPluginSettings(settingsHome));
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  if (endpoint === 'accept-finish') {
    const result = payload.result === 'rejected' ? 'rejected' : payload.result;
    if (result !== 'accepted' && result !== 'rejected') {
      const error = new Error('验收结果只能是通过或不通过');
      error.code = 'status';
      throw error;
    }
    finishAcceptance(workspace, String(payload.id ?? ''), result, loadPluginSettings(settingsHome));
    return snapshot(workspace, sessionId, loadPluginSettings(settingsHome));
  }
  throw new Error(`未知接口 ${endpoint}`);
}

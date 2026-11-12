/** Defaults used until the plugin detail page saves its own config. */
export const DEFAULT_SETTINGS = Object.freeze({
  devModel: '',
  acceptModel: '',
  devDir: 'task',
  acceptDir: 'check',
  taskBranch: 'df-task/xxx',
  acceptBranch: 'df-check/xxx',
  agentLimit: 3,
  portBase: 4100,
});

export class FlowError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor(message, code = 'invalid') {
    super(message);
    this.name = 'FlowError';
    this.code = code;
  }
}

/**
 * @param {Partial<typeof DEFAULT_SETTINGS>} [override]
 */
export function resolveSettings(override = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...clean(override) };
  assertBranchFormat(settings.taskBranch, '任务分支格式');
  assertBranchFormat(settings.acceptBranch, '验收分支格式');
  if (branchName(settings.taskBranch, 'same') === branchName(settings.acceptBranch, 'same')) {
    throw new FlowError('任务分支和验收分支不能配成同一个名字');
  }
  if (!Number.isInteger(settings.agentLimit) || settings.agentLimit < 1) {
    throw new FlowError('子代理上限必须是正整数');
  }
  if (!Number.isInteger(settings.portBase) || settings.portBase < 1 || settings.portBase > 65535) {
    throw new FlowError('端口起点无效');
  }
  return settings;
}

function clean(override) {
  const next = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (override[key] !== undefined && override[key] !== '') next[key] = override[key];
  }
  return next;
}

function assertBranchFormat(format, label) {
  if (typeof format !== 'string' || !format.includes('xxx') || format.trim() === 'xxx') {
    throw new FlowError(`${label}必须包含一个 xxx`);
  }
  if (format.includes('..') || format.startsWith('/') || format.endsWith('/')) {
    throw new FlowError(`${label}不是合法的分支格式`);
  }
}

/** @param {string} format @param {string} id */
export function branchName(format, id) {
  assertId(id);
  return format.replaceAll('xxx', id);
}

/** @param {string} id */
export function assertId(id) {
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) {
    throw new FlowError(`标识必须是小写短横线形式：${id}`);
  }
}

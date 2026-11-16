import { execFileSync } from 'node:child_process';

import { loadState } from './state.mjs';

const LIMIT = 400_000;

function git(cwd, args) {
  try {
    return { ok: true, out: execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }) };
  } catch (error) {
    return { ok: false, out: typeof error?.stdout === 'string' ? error.stdout : '' };
  }
}

/**
 * 一条开发任务在它的槽位里改了哪些文件、各自增删多少行。
 * @param {string} workspace
 * @param {string} taskId
 */
export function diffTask(workspace, taskId) {
  const state = loadState(workspace);
  const task = state.tasks?.[taskId];
  if (task === undefined) return { files: [], repos: [] };
  const files = [];
  const repos = [];
  for (const [name, slot] of Object.entries(task.slots ?? {})) {
    if (!slot.path) continue;
    const head = git(slot.path, ['rev-parse', 'HEAD']);
    const end = slot.end ?? (head.ok ? head.out.trim() : null);
    const base = slot.base ?? null;
    if (!base || !end) continue;
    const numstat = git(slot.path, ['diff', '--numstat', base, end]);
    if (!numstat.ok) continue;
    repos.push(name);
    for (const line of numstat.out.split('\n')) {
      if (line.trim() === '') continue;
      const [added, deleted, ...rest] = line.split('\t');
      const file = rest.join('\t');
      if (file === '') continue;
      const patch = git(slot.path, ['diff', base, end, '--', file]);
      const text = patch.ok ? patch.out : '';
      files.push({
        repo: name,
        path: file,
        added: added === '-' ? 0 : Number(added),
        deleted: deleted === '-' ? 0 : Number(deleted),
        binary: added === '-' || deleted === '-',
        patch: text.length > LIMIT ? `${text.slice(0, LIMIT)}\n…（diff 过长，已截断）` : text,
      });
    }
  }
  return { files, repos };
}

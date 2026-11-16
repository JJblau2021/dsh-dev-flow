import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { loadState } from './state.mjs';

const NAMES = ['验收.md', 'VERIFY.md'];

/**
 * 工作区或涉及仓库里的验收说明。没有可读内容时返回空数组。
 * @param {string} workspace
 * @param {{ taskIds?: string[] }} [batch]
 */
export function verificationNotes(workspace, batch = {}) {
  const state = loadState(workspace);
  const files = [
    path.join(workspace, '验收.md'),
    path.join(workspace, 'VERIFY.md'),
    path.join(workspace, '.dev-flow', '验收.md'),
  ];
  for (const taskId of batch.taskIds ?? []) {
    for (const repo of state.tasks[taskId]?.repos ?? []) {
      if (!repo.path) continue;
      for (const name of NAMES) files.push(path.join(repo.path, name));
    }
  }
  const seen = new Set();
  const notes = [];
  for (const file of files) {
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    let text = '';
    try {
      text = readFileSync(file, 'utf8').trim();
    } catch {
      continue;
    }
    if (text === '') continue;
    notes.push({ file, text });
  }
  return notes;
}

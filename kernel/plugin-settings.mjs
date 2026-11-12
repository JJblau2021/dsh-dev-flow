import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveSettings } from './settings.mjs';

/** Plugin settings live with the DSH profile, not in a workspace `.dev-flow/`. */
export function settingsFile(home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')) {
  return path.join(home, 'dev-flow', 'settings.json');
}

/** @param {string} [home] */
export function loadPluginSettings(home) {
  try {
    return resolveSettings(JSON.parse(readFileSync(settingsFile(home), 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return resolveSettings();
    if (error.name === 'FlowError') throw error;
    return resolveSettings();
  }
}

/**
 * @param {object} draft
 * @param {string} [home]
 */
export function savePluginSettings(draft, home) {
  const settings = resolveSettings(draft);
  const file = settingsFile(home);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
  return settings;
}

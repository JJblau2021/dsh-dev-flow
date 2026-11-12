import { execFileSync } from 'node:child_process';

/** Run git and return trimmed stdout. Throws with stderr attached. */
export function git(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString?.() ?? '';
    const failure = new Error(stderr.trim() || error.message);
    failure.status = error.status;
    throw failure;
  }
}

/** Run git and keep a non-zero exit instead of throwing. */
export function gitResult(cwd, args) {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString?.().trim() ?? '',
      stderr: error.stderr?.toString?.().trim() ?? error.message,
      status: error.status ?? 1,
    };
  }
}

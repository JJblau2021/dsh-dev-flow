import type { Translate } from '../types'
import type { Tone } from './parts'

/** 任务 / 调度状态的统一编码：颜色只表达类别，词永远在右边。 */
const TONES: Record<string, Tone> = {
  developing: 'run',
  running: 'run',
  accepting: 'run',
  scheduling: 'run',
  dispatched: 'ok',
  /* 待验收是「等你处理」，还没通过：用警告色提示需要人介入 */
  'pending-acceptance': 'warn',
  accepted: 'ok',
  merged: 'ok',
  'pending-merge': 'warn',
  busy: 'warn',
  failed: 'err',
  rejected: 'err',
  waiting: 'idle',
  paused: 'idle',
  stopped: 'idle',
  idle: 'idle',
  'awaiting-agent': 'idle',
  abandoned: 'idle',
  review: 'idle',
}

export function toneOf(status: string): Tone {
  return TONES[status] ?? 'idle'
}

export function statusText(t: Translate, status: string): string {
  const key = `status.${status}`
  const text = t(key)
  return text === key ? status : text
}

/** 概览「未完成」的固定排序：失败 → 待验收 → 待合入 → 开发中 → 等待 → 其余。 */
const ORDER: Record<string, number> = {
  failed: 0,
  'pending-acceptance': 1,
  'pending-merge': 2,
  developing: 3,
  waiting: 4,
  paused: 5,
}

/** 已经结束、不该出现在「未完成」里的状态。 */
const CLOSED = new Set(['accepted', 'merged', 'abandoned', 'stopped'])

export function isOpenTask(status: string): boolean {
  return !CLOSED.has(status)
}

export function openTaskOrder(status: string): number {
  return ORDER[status] ?? 9
}

#!/usr/bin/env node
/**
 * 写一份可反复生成的演示数据到 <workspace>/.dev-flow/state.json。
 * 只用于本地看 UI，不参与任何流程；已有 state.json 会先备份成 state.json.bak。
 *
 *   node scripts/seed-mock.mjs [workspace]
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const workspace = path.resolve(process.argv[2] ?? process.cwd())
const git = (...args) => {
  try {
    return execFileSync('git', ['-C', workspace, ...args], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const isRepo = existsSync(path.join(workspace, '.git'))
const repoName = path.basename(workspace)
const defaultBranch = git('rev-parse', '--abbrev-ref', 'HEAD') || 'main'
const headBranch = defaultBranch
const now = Date.now()
const at = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString()

const usage = (total) => ({
  inputTokens: Math.round(total * 0.68),
  outputTokens: Math.round(total * 0.32),
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  totalTokens: total,
})

const repoEntry = { name: repoName, path: workspace, defaultBranch }
const devDir = path.join(workspace, '.dev-flow', 'dev')
const acceptDir = path.join(workspace, '.dev-flow', 'accept')
const baseDir = path.join(workspace, '.dev-flow', 'base')

const slot = (number, branch, taskId, target, port = null) => ({
  number,
  path: path.join(devDir, `${repoName}-${number}`),
  taskId,
  branch,
  target,
  end: null,
  baseGroup: target === 'hotfix/pay' ? '02' : '01',
  dependencies: [],
  port,
})

const tasks = {
  't-login': {
    id: 't-login',
    title: '登录态接口',
    status: 'developing',
    agentStatus: 'running',
    base: headBranch,
    baseGroup: '01',
    repos: [repoEntry],
    dependsOn: [],
    slots: { [repoName]: slot('01', 'df-task/login-state-api', 't-login', headBranch) },
    warnings: [],
    batchId: null,
    scheduleId: 's-main',
    sessionId: 'mock',
    usage: usage(61_400),
    createdAt: at(38),
    updatedAt: at(1),
  },
  't-panel': {
    id: 't-panel',
    title: '面板三段重构',
    status: 'developing',
    agentStatus: 'running',
    base: headBranch,
    baseGroup: '01',
    repos: [repoEntry],
    dependsOn: [],
    slots: { [repoName]: slot('03', 'df-task/panel-sections', 't-panel', headBranch) },
    warnings: [],
    batchId: null,
    scheduleId: 's-main',
    sessionId: 'mock',
    usage: usage(61_400),
    createdAt: at(26),
    updatedAt: at(2),
  },
  't-pay': {
    id: 't-pay',
    title: '支付回调重试',
    status: 'failed',
    agentStatus: 'idle',
    base: 'hotfix/pay',
    baseGroup: '02',
    repos: [repoEntry],
    dependsOn: [],
    slots: { [repoName]: slot('02', 'df-task/pay-callback', 't-pay', 'hotfix/pay') },
    warnings: ['槽位已释放，分支保留'],
    batchId: null,
    scheduleId: null,
    sessionId: 'mock',
    usage: usage(33_100),
    createdAt: at(96),
    updatedAt: at(41),
  },
  't-merge': {
    id: 't-merge',
    title: '基线合并策略',
    status: 'waiting',
    agentStatus: 'idle',
    base: headBranch,
    baseGroup: '01',
    repos: [repoEntry],
    dependsOn: ['t-login'],
    slots: {},
    wait: { kind: 'dependency', tasks: ['t-login'] },
    warnings: [],
    batchId: null,
    scheduleId: 's-main',
    sessionId: 'mock',
    usage: null,
    createdAt: at(20),
    updatedAt: at(20),
  },
  't-slot': {
    id: 't-slot',
    title: '槽位清理',
    status: 'waiting',
    agentStatus: 'idle',
    base: headBranch,
    baseGroup: '01',
    repos: [repoEntry],
    dependsOn: ['t-panel'],
    slots: {},
    wait: { kind: 'dependency', tasks: ['t-panel'] },
    warnings: [],
    batchId: null,
    scheduleId: null,
    sessionId: 'mock',
    usage: null,
    createdAt: at(9),
    updatedAt: at(9),
  },
  't-clean-a': {
    id: 't-clean-a',
    title: '修复断网重试场景下支付回调的幂等性丢失',
    status: 'pending-acceptance',
    agentStatus: 'idle',
    base: headBranch,
    baseGroup: '01',
    repos: [repoEntry],
    dependsOn: [],
    slots: { [repoName]: slot('01', 'df-task/idempotent-retry', 't-clean-a', headBranch) },
    warnings: [],
    batchId: 'b-1',
    scheduleId: null,
    sessionId: 'mock',
    usage: usage(42_900),
    createdAt: at(140),
    updatedAt: at(12),
  },
  't-clean-b': {
    id: 't-clean-b',
    title: '收紧建群结果校验',
    status: 'pending-acceptance',
    agentStatus: 'idle',
    base: headBranch,
    baseGroup: '01',
    repos: [repoEntry],
    dependsOn: [],
    slots: { [repoName]: slot('02', 'df-task/group-verify', 't-clean-b', headBranch) },
    warnings: [],
    batchId: 'b-1',
    scheduleId: null,
    sessionId: 'mock',
    usage: usage(28_700),
    createdAt: at(150),
    updatedAt: at(18),
  },
}

const state = {
  version: 3,
  tasks,
  devSlots: {
    [repoName]: {
      '01': { number: '01', path: slot('01', '', null, '').path, taskId: 't-login', branch: 'df-task/login-state-api' },
      '02': { number: '02', path: slot('02', '', null, '').path, taskId: null, branch: null },
      '03': { number: '03', path: slot('03', '', null, '').path, taskId: 't-panel', branch: 'df-task/panel-sections' },
    },
  },
  acceptSlots: {
    [repoName]: {
      number: '01',
      path: path.join(acceptDir, `${repoName}-01`),
      port: 4101,
      batchId: 'b-1',
    },
  },
  batches: {
    'b-1': {
      id: 'b-1',
      status: 'accepting',
      taskIds: ['t-clean-a', 't-clean-b'],
      repos: {
        [repoName]: { number: '01', path: path.join(acceptDir, `${repoName}-01`), port: 4101 },
      },
      bases: { [repoName]: headBranch },
      usage: usage(12_300),
      createdAt: at(11),
      updatedAt: at(11),
    },
  },
  sessions: { mock: { enabled: true } },
  agents: [
    { id: 'a-1', kind: 'dev', taskId: 't-login', status: 'running', createdAt: at(37) },
    { id: 'a-2', kind: 'dev', taskId: 't-panel', status: 'running', createdAt: at(25) },
    { id: 'a-3', kind: 'accept', taskId: 'b-1', status: 'idle', createdAt: at(11) },
  ],
  schedules: {
    's-main': {
      id: 's-main',
      title: '01 · 主基线',
      status: 'dispatched',
      base: headBranch,
      baseGroup: '01',
      sessionId: 'mock',
      taskIds: ['t-login', 't-panel'],
      agentIds: ['a-1', 'a-2'],
      warnings: [],
      createdAt: at(40),
      updatedAt: at(2),
    },
    's-hotfix': {
      id: 's-hotfix',
      title: '02 · 线上热修',
      status: 'scheduling',
      base: 'hotfix/pay',
      baseGroup: '02',
      sessionId: 'mock',
      taskIds: ['t-pay'],
      agentIds: [],
      warnings: [],
      createdAt: at(30),
      updatedAt: at(3),
    },
  },
  trunks: { [repoName]: { branch: headBranch, path: workspace } },
  baseGroups: {
    '01': {
      number: '01',
      label: '主线',
      repos: { [repoName]: { branch: headBranch, path: workspace, kind: 'root' } },
    },
    '02': {
      number: '02',
      label: '线上热修',
      repos: { [repoName]: { branch: 'hotfix/pay', path: path.join(baseDir, '02', repoName), kind: 'slot' } },
    },
  },
}

const target = path.join(workspace, '.dev-flow', 'state.json')
mkdirSync(path.dirname(target), { recursive: true })
if (existsSync(target)) copyFileSync(target, `${target}.bak`)
writeFileSync(target, `${JSON.stringify(state, null, 2)}\n`)
console.log(`已写入 ${target}`)
console.log(`仓库 ${repoName}（${isRepo ? 'git' : '非 git'}，默认分支 ${defaultBranch}）`)
console.log(`任务 ${Object.keys(tasks).length} / 调度 ${Object.keys(state.schedules).length} / 批次 ${Object.keys(state.batches).length}`)
if (isRepo) {
  const dirty = git('status', '--porcelain')
  if (dirty !== '') console.log('提示：工作区有未提交改动，面板会显示「不干净」')
  const branches = git('for-each-ref', '--format=%(refname:short)', 'refs/heads').split('\n').filter(Boolean)
  if (!branches.includes('hotfix/pay')) {
    console.log('提示：仓库里没有 hotfix/pay 分支，「线上热修」组会显示为槽位缺失（这是刻意的异常样例）')
  }
}
// 让 lint 安静：未使用的目录常量在部分分支里只做占位。
void readdirSync

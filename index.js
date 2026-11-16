import { existsSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { attachLiveAgent, finishAcceptance, planDispatch, releaseLiveAgent, sessionEnabled } from './kernel/flow.mjs';
import { handle } from './kernel/service.mjs';
import { flushStateWrites, loadState, setStateWriter, statePath } from './kernel/state.mjs';
import { bindChildSession, findUsageTarget, normalizeUsage, recordUsage } from './kernel/usage.mjs';
import { verificationNotes } from './kernel/verify.mjs';

export const name = 'dev-flow';
export const inject = ['skills'];

const PROVIDER_NAME = 'dsh-dev-flow';
const SKILL_NAME = 'dev-flow';
const CHANNEL = '/dev-flow';

function pluginRoot() {
  return resolve(fileURLToPath(new URL('.', import.meta.url)));
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function readSkill(root) {
  const locator = join(root, SKILL_NAME, 'SKILL.md');
  const raw = readFileSync(locator, 'utf8');
  const fence = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u.exec(raw);
  if (fence === null) throw new Error(`dev-flow: ${locator} 缺少 frontmatter`);
  const description = /^description:\s*(.*)$/mu.exec(fence[1])?.[1]?.trim();
  if (description === undefined || description === '') throw new Error('dev-flow: 技能缺少 description');
  return { locator, description, body: fence[2] };
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  if (typeof ctx?.skills?.registerProvider !== 'function') {
    throw new Error('dev-flow: 技能注册服务不可用');
  }
  const root = pluginRoot();
  const skillRoot = join(root, 'skills');
  const skill = readSkill(skillRoot);
  const cli = join(root, 'cli.mjs');
  statSync(cli);
  const provider = {
    name: PROVIDER_NAME,
    list() {
      return Promise.resolve([{
        provider: PROVIDER_NAME,
        name: SKILL_NAME,
        description: skill.description,
        source: 'bundled',
        rank: 600,
        invocation: { modelInvocable: true, userInvocable: true },
        resourceBase: { kind: 'directory', path: join(skillRoot, SKILL_NAME) },
      }]);
    },
    async get(candidate, options) {
      if (candidate?.name !== SKILL_NAME) throw new Error(`dev-flow: 未知技能 ${candidate?.name}`);
      const raw = await readFile(skill.locator, { encoding: 'utf8', signal: options?.signal });
      const body = raw.replace(/^---[\s\S]*?---\r?\n/u, '');
      return {
        provider: PROVIDER_NAME,
        name: SKILL_NAME,
        description: skill.description,
        source: 'bundled',
        invocation: { modelInvocable: true, userInvocable: true },
        content: body.replaceAll('{{DEV_FLOW_CLI}}', shellQuote(cli)),
      };
    },
  };
  ctx.skills.registerProvider(() => provider);
  if (typeof ctx.on === 'function') {
    ctx.on('session/event', observeUsage);
    ctx.on('session/disposed', (session) => {
      try {
        const cwd = session?.header?.cwd;
        const workspace = workspaceOf(cwd);
        if (workspace === null) return;
        releaseLiveAgent(workspace, session?.header?.id ?? session?.id);
      } catch {
        /* 会话结束时记不上占用，不影响会话关闭。 */
      }
    });
  }
  if (typeof ctx.inject !== 'function') return;

  ctx.inject(['systemPrompt', 'workingDirectory'], (scope) => {
    scope.systemPrompt.context({
      name: 'dev-flow:lead',
      order: 40,
      interpolate: false,
      text: (context) => leadContext(scope, context, cli),
    });
  });

  ctx.inject(['sandboxPolicy'], (scoped) => {
    sandboxPolicy = scoped.sandboxPolicy;
  });
  ctx.inject(['connection', 'webServer', 'agents', 'sessions', 'workingDirectory', 'fs', 'subprocess', 'subagents'], (rpc) => {
    setStateWriter((file, body) => writeWorkspaceFile(rpc, file, body));
    const route = rpc.webServer.register({
      kind: 'prefix',
      path: CHANNEL,
      handler: async (req, res) => {
        const admission = rpc.connection.admit(req);
        if (admission.rejection !== undefined) {
          reject(res, admission.rejection, admission.rejection === 401 ? 'unauthorized' : 'forbidden');
          return;
        }
        if (req.method !== 'POST') {
          reject(res, 405, 'method not allowed');
          return;
        }
        const pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname;
        const endpoint = pathname.slice(CHANNEL.length + 1);
        let body;
        try {
          body = JSON.parse(await readBody(req));
        } catch (error) {
          reject(res, 400, error instanceof Error ? error.message : 'invalid json');
          return;
        }
        if (body === null || typeof body !== 'object' || body.type !== 'client-request' || body.method !== endpoint) {
          reject(res, 400, 'invalid client request');
          return;
        }
        try {
          const payload = body.payload ?? {};
          const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : '';
          const workspace = withState(resolveWorkspace(rpc, sessionId) ?? (typeof payload.workspace === 'string' ? payload.workspace : ''));
          if (workspace === '' && endpoint !== 'settings-get' && endpoint !== 'settings-set') {
            const value = endpoint === 'snapshot'
              ? { initialized: false, enabled: false, problem: '找不到工作区', counts: emptyCounts(), projects: [], trunks: [], tasks: [], repos: [], agents: [] }
              : null;
            if (value === null) throw new Error('找不到工作区');
            res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
            res.end(JSON.stringify({ type: 'server-response', rpcId: body.rpcId, result: { ok: true, value } }));
            return;
          }
          activeWrite.workspace = workspace;
          activeWrite.session = asSession(rpc.agents?.get?.(sessionId))
            ?? asSession(rpc.sessions?.get?.(sessionId))
            ?? { id: sessionId, header: { cwd: workspace } };
          const value = handle(workspace, sessionId, endpoint, payload);
          await flushStateWrites();
          if (endpoint === 'accept-start') {
            try {
              const notes = verificationNotes(workspace, value.batch);
              value.notes = notes.map((note) => note.file);
              if (notes.length === 0) {
                value.child = null;
              } else {
                value.child = await launchAcceptance(rpc, sessionId, workspace, value.batch, notes);
                if (value.child?.id) bindChildSession(workspace, value.batch.id, value.child.id);
                planDispatch(workspace, sessionId, { kind: 'accept', id: value.batch.id });
                await flushStateWrites();
              }
            } catch (error) {
              try {
                finishAcceptance(workspace, value.batch.id, 'rejected');
                await flushStateWrites();
              } catch {
                /* 回滚失败时仍把启动子代理的错误返回给面板。 */
              }
              throw error;
            }
          }
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
          res.end(JSON.stringify({ type: 'server-response', rpcId: body.rpcId, result: { ok: true, value } }));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
          res.end(JSON.stringify({
            type: 'server-response',
            rpcId: body.rpcId,
            result: { ok: false, error: { code: error.code || 'dev-flow', message, details: {} } },
          }));
        }
      },
    });
    rpc.effect(() => route, 'dev-flow: route');
  });
}

const activeWrite = { workspace: '', session: undefined };
const acceptanceSignals = new Set();

async function launchAcceptance(rpc, sessionId, workspace, batch, notes) {
  const parent = rpc.agents?.get?.(sessionId);
  if (parent?.session === undefined) throw new Error('找不到主会话，无法拉起验收子代理');
  if (typeof rpc.subagents?.startActivation !== 'function') throw new Error('子代理服务不可用');
  const lines = Object.entries(batch.repos).map(([name, slot]) => `${name}：目录 ${slot.path}，端口 ${slot.port}`);
  const only = Object.values(batch.repos);
  const cwd = only.length === 1 ? only[0].path : workspace;
  const controller = new AbortController();
  acceptanceSignals.add(controller);
  const name = acceptanceName(batch.id);
  const guide = notes.map((note) => `文件 ${note.file}\n${note.text.slice(0, 8000)}`).join('\n\n');
  const started = await rpc.subagents.startActivation({
    provider: 'spawn',
    label: `验收 ${batch.id}`,
    ...(name === undefined ? {} : { name }),
    signal: controller.signal,
    delivery: 'parent',
    request: {
      cwd,
      parent,
      maxDepth: 1,
      prompt: [{
        type: 'text',
        text: [
          '你是验收子代理。不要改任务代码，不要合并，不要推送。',
          '不要在本会话启动开发服务或任何需要一直运行的进程。子代理结束后这些进程会被回收。',
          '如果验收说明要求启动服务，不要自己启动。在回复里通知父会话启动，写清验收槽位目录、端口和说明里的启动命令，然后结束。',
          '说明没有要求启动服务时，只按说明检查。',
          ...lines,
          '',
          guide,
        ].join('\n'),
      }],
    },
  });
  started.result.finally(() => acceptanceSignals.delete(controller));
  return { id: started.childId, name: started.name };
}

function workspaceOf(cwd) {
  let dir = typeof cwd === 'string' ? cwd : '';
  while (dir !== '' && dir !== dirname(dir)) {
    if (existsSync(statePath(dir))) return dir;
    dir = dirname(dir);
  }
  return null;
}

function usageOf(event) {
  if (event?.type !== 'assistant/message' && event?.type !== 'assistant/attempt') return null;
  const direct = normalizeUsage(event.data?.usage);
  if (direct) return direct;
  const stream = event.data?.stream;
  if (!Array.isArray(stream)) return null;
  for (let index = stream.length - 1; index >= 0; index -= 1) {
    const sample = normalizeUsage(stream[index]?.usage);
    if (sample && (stream[index]?.type === 'usage' || stream[index]?.usage)) return sample;
  }
  return null;
}

function observeUsage(session, event) {
  try {
    const cwd = session?.header?.cwd;
    const workspace = workspaceOf(cwd);
    if (workspace === null) return;
    const sessionId = session?.header?.id ?? session?.id;
    const state = loadState(workspace);
    const target = findUsageTarget(state, {
      id: sessionId,
      cwd,
      parentSession: session?.header?.parentSession,
    });
    if (target?.taskId && session?.header?.parentSession) attachLiveAgent(workspace, target.taskId, sessionId);
    const usage = usageOf(event);
    if (usage === null || target === null) return;
    const turn = event.data?.turn ?? 0;
    const step = event.data?.step ?? 0;
    recordUsage(workspace, {
      ...target,
      stepKey: `${session?.header?.id ?? session?.id ?? 'session'}:${turn}:${step}`,
      usage,
    });
  } catch {
    /* 用量没记上时，任务本身继续。 */
  }
}

function acceptanceName(id) {
  const raw = `check-${String(id).replace(/^batch-/u, '')}`.toLowerCase().replace(/[^a-z0-9-]/gu, '');
  const name = raw.replace(/^[^a-z]+/u, '').slice(0, 32).replace(/-$/u, '');
  return name === '' || name === 'lead' ? undefined : name;
}
let sandboxPolicy;

async function writeWorkspaceFile(rpc, file, body) {
  const errors = [];
  if (typeof rpc.fs?.resolve === 'function' && typeof rpc.fs?.writeText === 'function') {
    try {
      const target = await rpc.fs.resolve(file, { cwd: activeWrite.workspace });
      const resolved = sandboxPolicy?.resolve?.({ session: activeWrite.session }) ?? {};
      await rpc.fs.writeText(target, body, undefined, undefined, {
        ...resolved,
        mode: 'workspace-write',
        workspaceRoot: activeWrite.workspace,
      });
      return;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (typeof rpc.subprocess?.spawn === 'function') {
    try {
      await spawnWrite(rpc.subprocess, file, body);
      return;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join('；') || '无法写入工作区');
}

async function spawnWrite(subprocess, file, body) {
  const directory = file.slice(0, file.lastIndexOf('/'));
  const parent = directory.slice(0, directory.lastIndexOf('/')) || '/';
  const mkdirBin = await resolveBin(subprocess, 'mkdir');
  const shellBin = await resolveBin(subprocess, 'sh');
  await spawnWait(subprocess, [mkdirBin, '-p', directory], parent);
  await spawnWait(subprocess, [shellBin, '-c', 'cat > "$1"', 'sh', file], parent, body);
}

async function resolveBin(subprocess, name) {
  if (typeof subprocess.resolveExecutable === 'function') {
    try {
      return await subprocess.resolveExecutable(name);
    } catch {
      /* 下面用常见绝对路径。 */
    }
  }
  return name === 'mkdir' ? '/bin/mkdir' : '/bin/sh';
}

function spawnWait(subprocess, argv, cwd, stdin) {
  const handle = subprocess.spawn({
    argv,
    cwd,
    stdio: {
      stdin: stdin === undefined ? 'ignore' : { data: stdin },
      stdout: { maxBytes: 1024 },
      stderr: { maxBytes: 4096 },
    },
    graceMs: 2000,
  });
  return handle.done.then((outcome) => {
    if (outcome.exitCode === 0) return;
    const stderr = handle.collected?.stderr?.readFrom(0)?.text ?? '';
    throw new Error(stderr.trim() || `无法执行 ${argv[0]}`);
  });
}

function emptyCounts() {
  return { projects: 0, activeAgents: 0, agentLimit: 3, activeTasks: 0, activeSlots: 0, pending: 0, devSlots: { used: 0, total: 0 }, acceptSlots: { used: 0, total: 0 }, dirtyTrunks: 0 };
}

/**
 * 开关打开时，只约束根会话。子代理的工作目录在 task/ 或 check/ 下，仍要自己改代码。
 * @param {{ header?: { cwd?: string, parentSession?: string }, id?: string }} session
 * @param {string} cwd
 */
export function leadGate(session, cwd) {
  if (!session?.id || !cwd) return '';
  if (session.header?.parentSession) return '';
  const normalized = cwd.endsWith('/') ? cwd.slice(0, -1) : cwd;
  if (/\/task\/[^/]+\/\d{2}$/u.test(normalized) || /\/check\/[^/]+$/u.test(normalized)) return '';
  if (!sessionEnabled(normalized, session.id)) return '';
  return [
    '本会话已启用 dev-flow 工作流。你是主会话，不是实现者。',
    '用户要求改代码、修复、实现或重构时，禁止编辑文件，禁止在主会话里完成实现。',
    '先用 skill 工具加载 dev-flow，再分配开发槽位，并用 subagent 把实现交给子代理。',
    '拆分任务时，每个任务只涉及一个服务。没有依赖关系的任务要并行派发，直到子代理上限，不要等前一个结束。',
    '子代理的 cwd 必须是 dispatch 返回的目录。能派发的都派完后，在主会话说明创建的任务、依赖并入和槽位，再结束本轮。',
    '只读的解释、查看状态可以留在主会话。',
    '验收子代理通知需要启动服务时，在本会话启动并保持运行。不要让子代理启动，也不要再开一个子代理去启动。',
  ].join('\n');
}

function leadContext(scope, context, cli) {
  const session = context?.agent?.session;
  if (!session) return '';
  let cwd = '';
  try {
    const value = scope.workingDirectory?.get?.(session);
    if (typeof value === 'string') cwd = value;
  } catch {
    cwd = '';
  }
  if (cwd === '') cwd = typeof session.header?.cwd === 'string' ? session.header.cwd : '';
  const text = leadGate(session, cwd);
  return text === '' ? '' : `${text}\n调度命令：${cli}`;
}

/** Agent 和 Session 都能进来；工作目录服务只接受 Session。 */
function withState(dir) {
  if (typeof dir !== 'string' || dir === '') return dir;
  if (existsSync(statePath(dir))) return dir;
  let current = dir;
  while (current !== dirname(current)) {
    current = dirname(current);
    if (existsSync(statePath(current))) return current;
  }
  return dir;
}

export function resolveWorkspace(rpc, sessionId) {
  const session = asSession(rpc?.agents?.get?.(sessionId)) ?? asSession(rpc?.sessions?.get?.(sessionId));
  if (session === undefined) return null;
  try {
    const value = rpc.workingDirectory?.get?.(session);
    if (typeof value === 'string' && value !== '') return value;
  } catch {
    /* 目录服务不可用时用会话头里的原始路径。 */
  }
  const cwd = session.header?.cwd;
  return typeof cwd === 'string' && cwd !== '' ? cwd : null;
}

function asSession(value) {
  if (value?.header && typeof value.id === 'string') return value;
  if (value?.session?.header && typeof value.session.id === 'string') return value.session;
  return undefined;
}

function reject(res, status, message) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify({ message }));
}

function readBody(req) {
  return new Promise((done, fail) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => done(Buffer.concat(chunks).toString('utf8') || '{}'));
    req.on('error', fail);
  });
}

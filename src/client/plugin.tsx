import { DIFF_KIND, DIFF_PATTERN, DIFF_TYPE_ID, diffAddress, diffTitle } from './diff'
import { DiffTab } from './diff-tab'
import { en, NAMESPACE, zh } from './locale'
import { ensureSheet } from './sheet'
import { Panel, SettingsForm, Title, WorkflowSwitch } from './pages'
import type { Call, ClientContext, Translate } from './types'
import { loadUi, type UiKit } from './ui'

const TYPE_ID = '@jjblau2021/dsh-dev-flow'
const CHANNEL = '/dev-flow'
const PACKAGE_NAME = '@jjblau2021/dsh-dev-flow'

function workspaceOf(ctx: ClientContext, sessionId: string) {
  if (sessionId === '') return ''
  const sessions = ctx.sessions ?? ctx.get?.('sessions')
  try {
    const cwd = sessions?.list?.getSnapshot?.()?.byId?.[sessionId]?.cwd
    return typeof cwd === 'string' ? cwd : ''
  } catch {
    return ''
  }
}

function definition(t: Translate) {
  return {
    id: TYPE_ID,
    kind: 'dev-flow',
    priority: 'extension',
    title: () => t('tab.title'),
    guide: [{
      id: 'open',
      order: 46,
      title: () => t('tab.title'),
      description: () => t('tab.description'),
    }],
  }
}

function diffDefinition(t: Translate) {
  return {
    id: DIFF_TYPE_ID,
    kind: DIFF_KIND,
    priority: 'extension',
    patterns: [DIFF_PATTERN],
    title: (address: string) => diffTitle(address) || t('tab.diff'),
  }
}

export function apply(ctx: ClientContext) {
  ensureSheet()
  const ui: UiKit = loadUi()
  const disposeLocale = ctx.locale.register(NAMESPACE, { zh, en })
  ctx.effect(() => disposeLocale, 'dev-flow: locale')
  const t = ctx.locale.bind(NAMESPACE)
  ctx.effect(() => ctx.sidebarRightTabs.register(definition(t)), 'dev-flow: type')

  const call: Call = async (endpoint, payload, signal) => {
    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId : ''
    const workspace = workspaceOf(ctx, sessionId)
    const envelope = await ctx.connection.rpc.call(CHANNEL, endpoint, {
      ...(payload ?? {}),
      ...(workspace === '' ? {} : { workspace }),
    }, signal)
    if (!envelope?.ok) throw new Error(envelope?.error?.message || 'dev-flow 请求失败')
    return envelope.value as Awaited<ReturnType<Call>>
  }

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: TYPE_ID,
    locale: NAMESPACE,
    inject: (sessionId: unknown) => ({
      ...(typeof sessionId === 'string' ? { sessionId } : {}),
      call,
      ui,
      openDiff: (taskId: string, title: string, index: number) => ctx.sidebarRight.openResource(diffAddress({ taskId, title }), { params: { index } }),
    }),
  }, Panel)), 'dev-flow: body')

  ctx.effect(() => ctx.sidebarRightTabs.register(diffDefinition(t)), 'dev-flow: diff type')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: DIFF_TYPE_ID,
    locale: NAMESPACE,
    inject: (sessionId: unknown) => ({ ...(typeof sessionId === 'string' ? { sessionId } : {}), call, t, ui }),
  }, DiffTab)), 'dev-flow: diff body')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab.title',
    key: TYPE_ID,
    locale: NAMESPACE,
  }, Title)), 'dev-flow: title')

  ctx.effect(() => ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
    name: 'conversation.input.overlay',
    id: 'dev-flow-switch',
    order: 10,
    locale: NAMESPACE,
    inject: (sessionId: unknown) => ({ ...(typeof sessionId === 'string' ? { sessionId } : {}), call, ui }),
  }, WorkflowSwitch)), 'dev-flow: switch')

  ctx.effect(() => ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config',
    key: PACKAGE_NAME,
    locale: NAMESPACE,
    inject: () => ({ call, ui }),
  }, SettingsForm)), 'dev-flow: settings')
}

/** 一次任务的 diff 页地址与渲染状态：面板里的悬停预览和独立的 diff 页共用。 */
import type { TaskDiffFile, Translate } from './types'

/** diff 页面类型在 Sidebar 里的实现标识，也是它 body 注册用的 key。 */
export const DIFF_TYPE_ID = '@jjblau2021/dsh-dev-flow/diff'
/** diff 页面类型的 kind。 */
export const DIFF_KIND = 'devFlowDiff'
/** diff 页面认领的资源地址前缀：一条任务一个地址，页内切换文件。 */
export const DIFF_SCHEME = 'dsh-resource://dev-flow-diff/'
/** 注册到 Sidebar 的地址匹配规则，`:` 让它按整条地址匹配。 */
export const DIFF_PATTERN = 'dsh-resource://dev-flow-diff/**'

/** 一个 diff 页指向的任务：id 是身份，title 是标签文字（打开时捕获）。 */
export interface DiffTarget {
  taskId: string
  title: string
}

/** 打开一次 diff 页时携带的导航参数：这次要显示第几个文件。 */
export interface DiffParams {
  index?: number
}

/**
 * 由任务拼出资源地址；标题也放进地址，标签在打开时就有名字，刷新后仍能还原。
 * @param target - 任务 id 与标题。
 * @returns `dsh-resource://dev-flow-diff/<taskId>/<title>`。
 */
export function diffAddress(target: DiffTarget): string {
  const title = target.title === '' ? target.taskId : target.title
  return DIFF_SCHEME + [target.taskId, title].map((part) => encodeURIComponent(part)).join('/')
}

/**
 * 从 tab 记录里的地址还原出任务。
 * @param address - 打开时的资源地址，或记录的 contentId。
 * @returns 还原出的目标；地址不合法时返回 undefined。
 */
export function parseDiffAddress(address: string | undefined): DiffTarget | undefined {
  if (address === undefined || !address.startsWith(DIFF_SCHEME)) return undefined
  const parts = address.slice(DIFF_SCHEME.length).split('/')
  if (parts.length !== 2) return undefined
  try {
    const [taskId, title] = parts.map((part) => decodeURIComponent(part))
    if (taskId === '') return undefined
    return { taskId, title: title === '' ? taskId : title }
  } catch {
    return undefined
  }
}

/**
 * tab 标签显示的任务标题。
 * @param address - 打开时的资源地址。
 * @returns 标题，无法还原时为空串。
 */
export function diffTitle(address: string): string {
  return parseDiffAddress(address)?.title ?? ''
}

/**
 * 从导航参数里取要显示的文件下标。
 * @param params - tab 最近一次导航带的参数。
 * @returns 合法的非负整数下标，否则 undefined。
 */
export function navigatedIndex(params: unknown): number | undefined {
  const index = (params as DiffParams | undefined)?.index
  return typeof index === 'number' && Number.isSafeInteger(index) && index >= 0 ? index : undefined
}

/**
 * 按 DSH 的 `dsh-resource://file/absolute/…` 语法拼一个绝对路径文件地址。
 * @param path - 绝对路径。
 * @returns 可直接交给 `tab.actions.openResource` 的地址。
 */
export function absoluteFileAddress(path: string): string {
  const normalized = path.replace(/\\/gu, '/')
  const unc = normalized.startsWith('//')
  const absolute = normalized.replace(/^\/+/, '')
  const encoded = absolute.split('/').map((segment) => encodeURIComponent(segment).replace(/%3A/giu, ':')).join('/')
  return `dsh-resource://file/absolute/${unc ? '/' : ''}${encoded}`
}

/**
 * 比较结果的说明文案：优先用语言包，缺 key 时回落到内置中文。
 * @param t - 命名空间翻译函数。
 * @returns 交给 FileDiff 的取词函数。
 */
export function diffLabelsOf(t: Translate) {
  const fallback: Record<string, string> = {
    'diff.loading': '加载中',
    'diff.missing': '文件已不存在',
    'diff.error': '读取失败',
    'presented.retry': '重试',
    'diff.binary': '二进制文件',
    'diff.oversized': '文件过大',
    'diff.coarse': '大纲模式',
    'diff.truncated': '只显示前 {count} 行',
  }
  return (key: string, params?: Record<string, string>) => {
    const localized = t(key)
    const text = localized === key || localized === '' ? (fallback[key] ?? key) : localized
    return params ? text.replace(/\{(\w+)\}/gu, (whole, name: string) => params[name] ?? whole) : text
  }
}

/** 从 patch 文本切出 hunk；服务端没带 hunks（旧版内核）时用它兜底。 */
export function hunksFromPatch(patch: string): NonNullable<TaskDiffFile['hunks']> {
  const hunks: NonNullable<TaskDiffFile['hunks']> = []
  let current: NonNullable<TaskDiffFile['hunks']>[number] | null = null
  for (const line of patch.split('\n')) {
    const head = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/u.exec(line)
    if (head !== null) {
      current = { oldStart: Number(head[1]), oldLines: Number(head[2] ?? 1), newStart: Number(head[3]), newLines: Number(head[4] ?? 1), lines: [] }
      hunks.push(current)
      continue
    }
    if (current === null) continue
    if (line.startsWith('\\')) continue
    if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) { current = null; continue }
    if (line === '') continue
    current.lines.push(line)
  }
  return hunks
}

/**
 * 把一个文件的改动翻译成 FileDiff 的状态。
 * @param file - 服务端返回的文件改动。
 * @returns 交给 FileDiff 的比较状态。
 */
export function diffStateOf(file: TaskDiffFile) {
  if (file.binary) return { kind: 'binary' as const, path: file.path, display: file.path }
  return {
    kind: 'text' as const,
    path: file.path,
    display: file.path,
    before: !/^--- \/dev\/null$/mu.test(file.patch),
    after: !/^\+\+\+ \/dev\/null$/mu.test(file.patch),
    hunks: file.hunks?.length ? file.hunks : hunksFromPatch(file.patch),
    coarse: false,
  }
}

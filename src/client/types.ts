export type Translate = (key: string) => string

export type Call = (
  endpoint: string,
  payload?: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<Snapshot | Settings | ModelCatalog | undefined>

/** 基线槽位的一组数字：有未结束任务 / 检出脏 / 全部成员。 */
export interface BaseSlotCounts {
  active: number
  dirty: number
  total: number
}

/** 开发任务的一组数字：开发中 / 待验收 / 全部开发任务。 */
export interface DevTaskCounts {
  developing: number
  pending: number
  total: number
}

/** 项目维度下和总览卡片一致的统计。 */
export interface ProjectStats {
  activeAgents: number
  baseSlots: BaseSlotCounts
  devTasks: DevTaskCounts
}

export interface Counts {
  projects: number
  activeAgents: number
  agentLimit: number
  activeTasks: number
  activeSlots: number
  pending: number
  dirtyBases: number
  devSlots?: { used: number, total: number }
  acceptSlots?: { used: number, total: number }
  baseSlots?: BaseSlotCounts
  devTasks?: DevTaskCounts
}

export interface ProjectRow {
  name: string
  path?: string
  description?: string
  dirty: boolean
  branch?: string
  defaultBranch?: string
  bases?: number
  branches?: string[]
  stats?: ProjectStats
}

/** 一条基线分支：合并位置、当前检出、脏状态和在用的任务数。 */
export interface BaseRow {
  id: string
  group?: string
  label?: string
  repo: string
  branch: string
  head?: string | null
  shortHead?: string | null
  current: boolean
  default: boolean
  /** root：根目录检出；slot：基线槽位；busy：被其它检出占用；missing：登记了但目录不在；none：还没有槽位。 */
  location: 'root' | 'slot' | 'busy' | 'missing' | 'none'
  path?: string | null
  dirty: boolean
  tasks: number
}

/** 一组基线：一个编号，下面按仓库各一个成员。 */
export interface BaseGroupRow {
  number: string
  label: string
  repos: BaseRow[]
}

export interface TaskDiffFile {
  repo: string
  path: string
  added: number
  deleted: number
  binary: boolean
  patch: string
  hunks?: { oldStart: number, oldLines: number, newStart: number, newLines: number, lines: string[] }[]
}

export interface TaskDiff {
  files: TaskDiffFile[]
  repos: string[]
}

export interface TaskRow {
  id: string
  title: string
  kind: 'dev' | 'accept'
  status: string
  agentStatus?: string
  batchId?: string | null
  taskIds?: string[]
  base?: string | null
  baseGroup?: string | null
  bases?: Record<string, string>
  repos: string[]
  slots?: Record<string, { number?: string, path?: string, branch?: string | null, target?: string | null, port?: number }>
  warnings?: string[]
  usage?: TokenUsage | null
  acceptance?: 'accepted' | null
  pausedAt?: string | null
  stoppedAt?: string | null
  createdAt?: string | null
  dependsOn?: { id: string, title: string, status: string, merged: boolean, branch?: string | null }[]
  selectable?: boolean
  deletable?: boolean
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
}

export interface DevSlot {
  number: string
  taskId?: string | null
  branch?: string | null
  base?: string | null
}

export interface AcceptSlot {
  number?: string
  batchId?: string | null
  port?: number
}

export interface RepoRow {
  name: string
  dirty: boolean
  branch?: string
  defaultBranch?: string
  devSlots: DevSlot[]
  acceptSlot: AcceptSlot | null
}

export interface AgentRow {
  id: string
  status: string
  kind?: string
  taskId?: string | null
  lastTaskId?: string | null
}

export interface ScheduleSlot {
  repo: string
  number?: string
  branch?: string | null
  taskId: string
}

export interface ScheduleTask {
  id: string
  title: string
  status: string
  createdAt?: string | null
  agentStatus?: string
  dependsOn: { id: string, title: string, status: string, merged: boolean, branch?: string | null }[]
  slots: { repo: string, number?: string, branch?: string | null, target?: string | null, baseGroup?: string | null }[]
  usage?: TokenUsage | null
}

export interface ScheduleRow {
  id: string
  title: string
  base?: string | null
  baseGroup?: string | null
  warnings?: string[]
  status: string
  taskIds: string[]
  agentIds: string[]
  usage?: TokenUsage | null
  createdAt?: string | null
  slots: ScheduleSlot[]
  tasks?: ScheduleTask[]
}

export interface Snapshot {
  initialized?: boolean
  workspace?: string
  enabled?: boolean
  problem?: string
  counts: Counts
  projects: ProjectRow[]
  bases: BaseRow[]
  baseGroups: BaseGroupRow[]
  tasks: TaskRow[]
  repos: RepoRow[]
  agents: AgentRow[]
  schedules?: ScheduleRow[]
}

/** 和 Composer 的模型选择一致：provider + model + 可选的推理等级。 */
export interface ModelChoice {
  provider: string
  model: string
  reasoningEffort?: string | null
}

export interface ModelCatalogModel {
  id: string
  name: string
  description?: string
  efforts?: { id: string, name: string, description?: string }[]
  defaultEffort?: string | null
}

export interface ModelCatalog {
  providers: { id: string, name: string, models: ModelCatalogModel[] }[]
}

export interface Settings {
  devModel?: ModelChoice | string | null
  acceptModel?: ModelChoice | string | null
  devDir?: string
  acceptDir?: string
  baseDir?: string
  taskBranch?: string
  acceptBranch?: string
}

/** 一个 tab 最近一次被导航到的位置；恢复的 tab 没有 params，但地址即 contentId。 */
export interface TabNavigation {
  address: string
  params?: unknown
  revision: number
}

/** Sidebar tab 的实时信息，由宿主以 useTabInfo 钩子交给 tab body。 */
export interface TabInfo {
  tab: {
    id: string
    kind: string
    contentId: string
    title?: string
    navigation?: TabNavigation
    /** tab 自身的动作：在 Sidebar 里打开另一个资源、关闭自己。 */
    actions?: {
      openResource?: (address: string, options?: Record<string, unknown>) => void
      close?: () => void
    }
    /** tab 生命周期信号：tab 关闭时中止，用来清掉按 tab 存的状态。 */
    signal?: AbortSignal
  }
}

/** Sidebar 的导航服务：按资源地址打开或揭示一个 tab。 */
export interface SidebarRightService {
  openResource: (address: string, options?: { params?: unknown, revealIfOpened?: boolean }) => void
}

export interface ClientContext {
  sessions?: { list?: { getSnapshot?: () => { byId?: Record<string, { cwd?: string }> } } }
  get?: (name: string) => ClientContext['sessions']
  locale: {
    register: (namespace: string, packs: { zh: Record<string, string>, en: Record<string, string> }) => () => void
    bind: (namespace: string) => Translate
  }
  effect: (dispose: () => void, label: string) => void
  sidebarRightTabs: { register: (definition: unknown) => () => void }
  sidebarRight: SidebarRightService
  connection: {
    rpc: {
      call: (channel: string, endpoint: string, payload: unknown, signal?: AbortSignal) => Promise<{ ok?: boolean, value?: unknown, error?: { message?: string } }>
    }
  }
  slots: {
    inject: (name: string, register: () => () => void) => () => void
    register: (options: Record<string, unknown>, component: unknown) => () => void
  }
}

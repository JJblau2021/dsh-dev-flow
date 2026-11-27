/**
 * 子面板布局的本地持久化：顺序、高度比例、折叠状态。
 * 只在浏览器里可用；读写失败一律静默回退到默认布局。
 */

export interface PaneLayout {
  /** 分区 key，按渲染顺序排列。 */
  order: string[]
  /** 每个分区的高度占可用高度的比例（只记展开的分区）。 */
  sizes: Record<string, number>
  /** 每个分区的折叠状态。 */
  collapsed: Record<string, boolean>
}

const PREFIX = 'dev-flow:panels:'

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

export function readPaneLayout(group: string): PaneLayout | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(PREFIX + group)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PaneLayout> | null
    if (!value || !Array.isArray(value.order)) return null
    return {
      order: value.order.filter((key): key is string => typeof key === 'string'),
      sizes: value.sizes ?? {},
      collapsed: value.collapsed ?? {},
    }
  } catch {
    return null
  }
}

export function writePaneLayout(group: string, layout: PaneLayout): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(PREFIX + group, JSON.stringify(layout))
  } catch {
    // 配额满或被禁用：忽略，界面照常工作
  }
}

import type React from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import css from './ui.module.css'

/* ── 状态灯 + 状态词 ───────────────────────────────────────────────── */

export type Tone = 'ok' | 'warn' | 'err' | 'idle' | 'run'

const LAMP_CLASS: Record<Tone, string> = {
  ok: css.lampOk,
  warn: css.lampWarn,
  err: css.lampErr,
  idle: css.lampIdle,
  run: css.lampRun,
}

export function Status({ tone, label }: { tone: Tone, label: string }) {
  return (
    <span className={css.status}>
      <i className={`${css.lamp} ${LAMP_CLASS[tone]}`} aria-hidden="true" />
      {label}
    </span>
  )
}

export function Lamp({ tone }: { tone: Tone }) {
  return <i className={`${css.lamp} ${LAMP_CLASS[tone]}`} aria-hidden="true" />
}

/* ── 列表项 ───────────────────────────────────────────────────────── */

export function Item({
  icon, title, suffix, trail, sub, onClick, selected, titleAttr, dataId,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  suffix?: React.ReactNode
  trail?: React.ReactNode
  sub?: boolean
  onClick?: () => void
  selected?: boolean
  titleAttr?: string
  /** 供上层做事件代理，避免依赖每行的 React onClick。 */
  dataId?: string
}) {
  const className = [css.item, sub ? css.itemSub : '', selected ? css.itemOn : ''].filter(Boolean).join(' ')
  const body = (
    <>
      {icon === undefined ? null : <span className={css.icon}>{icon}</span>}
      <span className={css.name}>
        <span className={css.nameText} title={titleAttr}>{title}</span>
        {suffix === undefined ? null : <span className={css.suffix}>{suffix}</span>}
      </span>
      {trail === undefined ? null : <span className={css.trail}>{trail}</span>}
    </>
  )
  const dataAttr = dataId === undefined ? {} : { 'data-task-id': dataId }
  if (!onClick) return <div className={className} {...dataAttr}>{body}</div>
  return (
    <div
      className={className}
      {...dataAttr}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      {body}
    </div>
  )
}

/** 一组「标签 + 数字」对，例如「待验收 1　合入 1」。 */
export function Pairs({ items }: { items: { label: string, value: number, tone?: 'err' }[] }) {
  const shown = items.filter((item) => item.value > 0)
  if (shown.length === 0) return null
  return (
    <>
      {shown.map((item) => (
        <span key={item.label} className={css.pair}>
          <span className={css.pairLabel}>{item.label}</span>
          <span
            className={css.pairValue}
            style={item.tone === 'err' ? { color: 'var(--dsw-alias-state-error-primary)' } : undefined}
          >
            {item.value}
          </span>
        </span>
      ))}
    </>
  )
}

/* ── 子面板分组：可折叠、可拖高度 ───────────────────────────────────── */

export interface PaneDef {
  key: string
  title: React.ReactNode
  count?: number
  content: React.ReactNode
  /** 首次布局时折叠。 */
  collapsed?: boolean
  actions?: React.ReactNode
}

const HEAD = 24
const MIN_BODY = 40

export function SplitGroup({ panes, footer, expandKey, expandSignal }: {
  panes: PaneDef[]
  footer?: React.ReactNode
  /** 需要强制展开的分区 key；配 expandSignal 递增触发。 */
  expandKey?: string
  expandSignal?: number
}) {
  const [sizes, setSizes] = useState<number[]>([])
  const [layoutTick, setLayoutTick] = useState(0)
  const [collapsed, setCollapsed] = useState<boolean[]>(() => panes.map((pane) => pane.collapsed === true))
  const [order, setOrder] = useState<number[]>(() => panes.map((_, index) => index))
  const bodies = useRef<(HTMLDivElement | null)[]>([])

  // 分区数量变化（比如选中任务后多出「详情」）时，补齐折叠/高度状态，新分区默认展开。
  useEffect(() => {
    setCollapsed((prev) => (prev.length === panes.length
      ? prev
      : panes.map((pane, index) => prev[index] ?? pane.collapsed === true)))
    setSizes((prev) => (prev.length === panes.length ? prev : []))
    setLayoutTick((value) => value + 1)
  }, [panes.length])

  const panels = useRef<(HTMLElement | null)[]>([])
  const expanded = useRef<Record<number, number>>({})
  const avail = useRef(0)
  const [, setResizing] = useState(-1)
  const keys = panes.map((pane) => pane.key).join('|')
  const orderRef = useRef(order)
  const sizesRef = useRef(sizes)
  const collapsedRef = useRef(collapsed)
  orderRef.current = order
  sizesRef.current = sizes
  collapsedRef.current = collapsed

  useLayoutEffect(() => {
    const host = panels.current[order[0]]?.parentElement
    if (!host) return
    // 等一帧再量：字体与图标就位后 scrollHeight 才稳定，避免首帧算出偏小的高度
    const frame = requestAnimationFrame(() => {
      avail.current = host.clientHeight
      const content = panes.map((_, index) => {
        if (collapsed[index]) return HEAD
        const inner = bodies.current[index]?.scrollHeight ?? 0
        const raw = HEAD + inner
        return Math.max(HEAD + 20, raw > HEAD + 76 ? Math.ceil(raw / 38) * 38 : raw)
      })
      const total = content.reduce((sum, value) => sum + value, 0)
      const openOrder = order.filter((index) => collapsed[index] !== true)
      const tailIndex = openOrder[openOrder.length - 1]
      if (total <= avail.current) {
        // 装得下：每块按内容量高，剩余高度明确给最后一个展开分区，别依赖 flex-grow 去猜。
        const next = content.slice()
        for (let index = 0; index < next.length; index += 1) {
          if (collapsed[index] === true) next[index] = HEAD
        }
        const open = next.reduce((sum, value, index) => (collapsed[index] ? sum : sum + value), 0)
        if (tailIndex !== undefined && collapsed[tailIndex] !== true) {
          next[tailIndex] += Math.max(0, avail.current - open)
        }
        setSizes(next)
        return
      }
      let remain = avail.current
      const next = content.slice()
      for (let k = 0; k < order.length; k += 1) {
        const index = order[k]
        if (index === tailIndex) next[index] = Math.max(HEAD + 20, remain)
        else if (collapsed[index] === true) next[index] = HEAD
        else next[index] = Math.max(HEAD + MIN_BODY, Math.floor((avail.current * content[index]) / total / 38) * 38)
        remain -= next[index]
      }
      // 兜底：夹完之后若仍然超出可用高度，从最高的分区往下削，保证整组不会把外层撑出滚动条。
      let excess = next.reduce((sum, value) => sum + value, 0) - avail.current
      while (excess > 0.5) {
        let widest = -1
        let room = 0
        for (let k = 0; k < next.length; k += 1) {
          const spare = next[k] - (HEAD + (collapsed[k] ? 0 : 20))
          if (spare > room) { room = spare; widest = k }
        }
        if (widest < 0 || room <= 0) break
        const cut = Math.min(room, excess)
        next[widest] -= cut
        excess -= cut
      }
      setSizes(next)
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, layoutTick])

  const floorOf = (index: number) => HEAD + (collapsed[index] ? 0 : MIN_BODY)

  /**
   * 折叠/展开时，被点的这一块自己的顶边不动：
   * 收起压到 24px 并把空间留白；展开先吃留白，再向下面借，最后才向上面借。
   */
  const toggle = (index: number) => {
    const closing = collapsed[index] !== true
    setSizes((prev) => {
      if (prev.length !== panes.length) return prev
      const next = [...prev]
      if (closing) {
        expanded.current[index] = prev[index]
        next[index] = HEAD
        return next
      }
      let need = (expanded.current[index] ?? HEAD + 140) - HEAD
      next[index] = HEAD
      const spare = Math.max(0, avail.current - prev.reduce((sum, value) => sum + value, 0))
      const fromSpare = Math.min(need, spare)
      next[index] += fromSpare
      need -= fromSpare
      const position = order.indexOf(index)
      for (const at of [position + 1, position - 1]) {
        if (need <= 0) break
        const neighbour = order[at]
        if (neighbour === undefined) continue
        const take = Math.min(need, Math.max(0, next[neighbour] - floorOf(neighbour)))
        next[neighbour] -= take
        next[index] += take
        need -= take
      }
      return next
    })
    setCollapsed((prev) => prev.map((value, at) => (at === index ? !value : value)))
  }

  // 外部要求展开某块（点任务打开详情）：只有它当前是收起时才动，已经展开就什么都不做。
  useEffect(() => {
    if (expandSignal === undefined || expandSignal === 0 || expandKey === undefined) return
    const index = panes.findIndex((pane) => pane.key === expandKey)
    if (index < 0 || collapsed[index] !== true) return
    toggle(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandSignal, expandKey])

  const floorOfRef = (index: number) => HEAD + (collapsedRef.current[index] ? 0 : MIN_BODY)

  const beginResize = (top: number, bottom: number, event: React.PointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    const snapshot = [...sizesRef.current]
    if (snapshot.length !== panes.length) return
    const startY = event.clientY
    setResizing(top)
    const onMove = (moveEvent: PointerEvent) => {
      const total = snapshot[top] + snapshot[bottom]
      const delta = moveEvent.clientY - startY
      const size = Math.min(Math.max(snapshot[top] + delta, floorOfRef(top)), total - floorOfRef(bottom))
      setSizes((prev) => {
        const next = [...prev]
        next[top] = size
        next[bottom] = total - size
        return next
      })
    }
    const onUp = () => {
      setResizing(-1)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const beginMove = (index: number, event: React.PointerEvent) => {
    if (event.button !== 0) return
    const button = event.currentTarget as HTMLElement
    const startY = event.clientY
    let moved = false
    const onMove = (moveEvent: PointerEvent) => {
      if (!moved && Math.abs(moveEvent.clientY - startY) < 4) return
      moved = true
      const host = panels.current[index]?.parentElement
      if (!host) return
      const offset = moveEvent.clientY - host.getBoundingClientRect().top
      const currentOrder = orderRef.current
      let acc = 0
      let target = 0
      for (let k = 0; k < currentOrder.length; k += 1) {
        const at = currentOrder[k]
        const size = collapsedRef.current[at] ? HEAD : (sizesRef.current[at] ?? 0)
        if (offset > acc + size / 2) target = k + 1
        acc += size
      }
      setOrder((prev) => {
        const position = prev.indexOf(index)
        let to = target
        if (to > position) to -= 1
        if (to === position) return prev
        const next = [...prev]
        next.splice(position, 1)
        next.splice(to, 0, index)
        return next
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      // 没移动就是一次点击：折叠/展开；随后主动失焦，避免留下宿主的焦点描边
      if (!moved) {
        toggle(index)
        button.blur()
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const openList = order.filter((index) => collapsed[index] !== true)
  // 顺序固定：收起只改变高度，不改变分区在列表里的位置。
  const view = order
  return (
    <div className={css.group}>
      {view.map((index, position) => {
        const pane = panes[index]
        const isCollapsed = collapsed[index] === true
        const size = sizes[index]
        const style: React.CSSProperties = size === undefined
          ? { flex: '1 1 0' }
          : {
            flexBasis: isCollapsed ? HEAD : size,
            // 展开块吃掉剩余高度；收起块固定 24px。
            flexGrow: !isCollapsed && index === openList[openList.length - 1] ? 1 : 0,
            flexShrink: isCollapsed ? 0 : 1,
          }
        return (
          <section
            key={pane.key}
            className={`${css.panel} ${isCollapsed ? css.panelCollapsed : css.panelOpen}`}
            style={style}
            ref={(node) => { panels.current[index] = node }}
          >
            {position > 0 && !isCollapsed && collapsed[view[position - 1]] !== true && (
              <div
                className={css.grip}
                role="separator"
                aria-orientation="horizontal"
                title="拖动调整高度"
                onPointerDown={(event) => beginResize(view[position - 1], index, event)}
              />
            )}
            <button
              type="button"
              className={css.panelHead}
              aria-expanded={!isCollapsed}
              onPointerDown={(event) => beginMove(index, event)}
            >
              <span className={css.panelTitle}>{pane.title}</span>
              {pane.count === undefined ? null : <span className={css.panelCount}>{pane.count}</span>}
              <span className={css.panelTail}>
                {pane.actions}
                <span className={css.panelChev}>{Chevron()}</span>
              </span>
            </button>
            <div className={css.panelBody} ref={(node) => { bodies.current[index] = node }}>
              {pane.content}
            </div>
          </section>
        )
      })}
      {footer}
    </div>
  )
}

/** 错误边界：页面里任何一处抛错都只在本面板内显示一行提示，不白屏。 */
export class Boundary extends React.Component<{ children?: React.ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  render() {
    if (this.state.message !== null) {
      return (
        <div className={css.empty}>
          <p className={css.emptyText}>{this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

/** 缺省占位：一个细线图标 + 一句说明，整体居中。 */
export function Empty({ icon, text }: { icon?: React.ReactNode, text: React.ReactNode }) {
  return (
    <div className={css.empty}>
      <span className={css.emptyIcon}>{icon ?? IconTray()}</span>
      <span>{text}</span>
    </div>
  )
}

/* ── 细线图标（16 viewBox / 1px / 圆头） ─────────────────────────── */

function Svg({ children, size = 16, viewBox = '0 0 16 16', strokeWidth = 1 }: {
  children: React.ReactNode
  size?: number
  viewBox?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** 可点的展开/收起热区：24×24，悬停有底色，图标在热区里居中。 */
export function Disclosure({ open, onToggle, label }: { open: boolean, onToggle: () => void, label: string }) {
  return (
    <button
      type="button"
      className={css.disclosure}
      aria-label={label}
      aria-expanded={open}
      title={label}
      onClick={(event) => { event.stopPropagation(); onToggle() }}
      onPointerDown={(event) => { event.stopPropagation() }}
    >
      <span className={open ? css.disclosureOpen : css.disclosureClosed}>{Chevron()}</span>
    </button>
  )
}

/** 展开/收起箭头：Lucide `chevron-right`，默认向右，展开时转 90° 朝下。 */
export function Chevron() {
  return <Svg size={14} viewBox="0 0 24 24" strokeWidth={1.5}><path d="m9 18 6-6-6-6" /></Svg>
}

/**
 * 开发任务：Lucide `file-code`。
 * 这三枚 Lucide 图标都用 24 viewBox、stroke-width 1.5、18px 渲染（实际线宽约 1.13px）。
 */
export function IconDevTask() {
  return (
    <Svg size={18} viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 12.5 8 15l2 2.5" />
      <path d="m14 12.5 2 2.5-2 2.5" />
    </Svg>
  )
}

/** 验收任务：Lucide `search-code`（放大镜 + 镜片里的尖括号）。 */
export function IconAcceptTask() {
  return (
    <Svg size={18} viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="m13 13.5 2-2.5-2-2.5" />
      <path d="m21 21-4.3-4.3" />
      <path d="M9 8.5 7 11l2 2.5" />
      <circle cx="11" cy="11" r="8" />
    </Svg>
  )
}

/** 仓库 / 项目：Lucide `folder-code`（文件夹 + 尖括号）。 */
export function IconRepo() {
  return (
    <Svg size={18} viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M10 10.5 8 13l2 2.5" />
      <path d="m14 10.5 2 2.5-2 2.5" />
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
    </Svg>
  )
}

/** 子代理：Lucide `bot`。 */
export function IconAgent() {
  return (
    <Svg size={18} viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M12 8V4H8" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
      <path d="M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2" />
    </Svg>
  )
}

export function IconChat() {
  return (
    <Svg>
      <path d="M3.6 5.2a1.6 1.6 0 0 1 1.6-1.6h5.6a1.6 1.6 0 0 1 1.6 1.6v3.2a1.6 1.6 0 0 1-1.6 1.6H7l-2.6 2v-2H5.2a1.6 1.6 0 0 1-1.6-1.6Z" />
    </Svg>
  )
}

/** 空态用的托盘：两层弧 + 一条底边。 */
export function IconTray() {
  return (
    <Svg size={28}>
      <path d="M3.2 9.2h2.6l1.2 2h4l1.2-2h2.6" />
      <path d="M3.2 9.2 5 4.9A1.4 1.4 0 0 1 6.3 4h5.4a1.4 1.4 0 0 1 1.3.9l1.8 4.3v4.2a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4Z" />
    </Svg>
  )
}

/** 刷新：Lucide `refresh-cw`。 */
export function IconRefresh() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </Svg>
  )
}

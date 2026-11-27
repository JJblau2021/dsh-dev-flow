import * as React from 'react'
import type { UiKit } from '../ui'
import { cloneElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { readPaneLayout, writePaneLayout } from './store'
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

/* 气泡已经开着时，移到下一行立刻换气泡，不再重新等 600ms */
let cardHiddenAt = 0
let activeClose: (() => void) | null = null
const CARD_DELAY = 600
const CARD_WIDTH = 280
const CARD_GRACE = 240

export function Item({
  icon, title, suffix, trail, sub, onClick, selected, titleAttr, dataId, card,
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
  /** 悬停气泡内容（标题/分支/状态/槽位/用量）。 */
  card?: React.ReactNode
}) {
  const className = [css.item, sub ? css.itemSub : '', selected ? css.itemOn : ''].filter(Boolean).join(' ')
  const scrollRef = useRef<HTMLSpanElement>(null)
  const scrollTimer = useRef<number | null>(null)
  /* 标题 + 分支是一个整体：平时整体溢出省略，悬停时整段平移到末尾，两侧用渐变遮罩淡出 */
  const startScroll = () => {
    const element = scrollRef.current
    if (element === null) return
    const max = element.scrollWidth - element.clientWidth
    if (max <= 2) return
    const seconds = Math.min(8, Math.max(1.4, max / 48))
    element.style.setProperty('--scroll-duration', `${seconds}s`)
    element.style.setProperty('--scroll-shift', `-${max}px`)
    element.dataset.scroll = 'on'
    if (scrollTimer.current !== null) window.clearTimeout(scrollTimer.current)
    // 滚到底后撤掉右缘遮罩：右侧已经没有未读内容了
    scrollTimer.current = window.setTimeout(() => {
      if (scrollRef.current !== null) scrollRef.current.dataset.scroll = 'done'
    }, seconds * 1000 + 40)
  }
  const resetScroll = () => {
    const element = scrollRef.current
    if (scrollTimer.current !== null) { window.clearTimeout(scrollTimer.current); scrollTimer.current = null }
    if (element === null) return
    element.dataset.scroll = 'off'
    element.style.setProperty('--scroll-shift', '0px')
  }
  const body = (
    <>
      {icon === undefined ? null : <span className={css.icon}>{icon}</span>}
      <span className={css.name} ref={scrollRef} title={titleAttr}>
        <span className={css.nameRun}>
          {title}
          {suffix === undefined ? null : <span className={css.suffix}>{suffix}</span>}
        </span>
      </span>
      {trail === undefined ? null : <span className={css.trail}>{trail}</span>}
    </>
  )
  const dataAttr = dataId === undefined ? {} : { 'data-task-id': dataId }
  const rowRef = useRef<HTMLDivElement>(null)
  const cardTimer = useRef<number | null>(null)
  const [cardAt, setCardAt] = useState<{ left: number, top: number } | null>(null)
  const showCard = () => {
    if (card === undefined) return
    if (cardTimer.current !== null) window.clearTimeout(cardTimer.current)
    const warm = activeClose !== null || Date.now() - cardHiddenAt < CARD_GRACE
    cardTimer.current = window.setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect()
      if (rect === undefined) return
      /* 同一个时刻只留一颗气泡：换行时把上一行那颗关掉 */
      if (activeClose !== null && activeClose !== hideCard) activeClose()
      /* 气泡放在任务行的左边，行内有空间就贴着行，否则退回右侧 */
      const gap = 10
      const left = rect.left - CARD_WIDTH - gap
      setCardAt({
        left: left >= 8 ? left : rect.right + gap,
        top: Math.max(8, Math.min(rect.top - 4, window.innerHeight - 240)),
      })
      activeClose = hideCard
    }, warm ? 0 : CARD_DELAY)
  }
  const hideTimer = useRef<number | null>(null)
  const cancelHide = () => {
    if (hideTimer.current !== null) { window.clearTimeout(hideTimer.current); hideTimer.current = null }
  }
  const hideCard = () => {
    cancelHide()
    if (cardTimer.current !== null) { window.clearTimeout(cardTimer.current); cardTimer.current = null }
    cardHiddenAt = Date.now()
    if (activeClose === hideCard) activeClose = null
    setCardAt(null)
  }
  /* 行与气泡之间有 10px 间隙：离开行先给 200ms 宽限，移进气泡就取消 */
  const scheduleHide = () => {
    cancelHide()
    hideTimer.current = window.setTimeout(hideCard, 200)
  }
  const cardNode = card !== undefined && cardAt !== null
    ? (
      <div
        className={css.hoverCard}
        style={{ left: cardAt.left, top: cardAt.top, width: CARD_WIDTH }}
        onClick={(event) => { event.stopPropagation() }}
        onPointerEnter={cancelHide}
        onPointerLeave={scheduleHide}
      >
        {card}
      </div>
    )
    : null
  const scrollProps = {
    onPointerEnter: () => { startScroll(); showCard() },
    onPointerLeave: () => { resetScroll(); scheduleHide() },
    onFocus: startScroll,
    onBlur: resetScroll,
  }
  if (!onClick) return <div className={className} ref={rowRef} {...dataAttr} {...scrollProps}>{body}{cardNode}</div>
  return (
    <div
      className={className}
      ref={rowRef}
      {...dataAttr}
      {...scrollProps}
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
      {cardNode}
    </div>
  )
}

/** 带气泡的图标按钮：面板里所有 iconButton 都走这里，保证 26px 盒、气泡延迟与无障碍一致。 */
export function IconAction({
  ui, label, icon, onClick, disabled, tone, size = 26,
}: {
  ui?: UiKit
  label: string
  icon: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  tone?: 'primary' | 'danger'
  size?: 26
}) {
  const className = [
    css.iconButton,
    tone === 'primary' ? css.iconPrimary : '',
    tone === 'danger' ? css.iconDanger : '',
  ].filter(Boolean).join(' ')
  return (
    <Tip ui={ui} label={label}>
      <button
        type="button"
        className={className}
        style={{ width: size, height: size }}
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
      >
        {icon}
      </button>
    </Tip>
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
  const panels = useRef<(HTMLElement | null)[]>([])
  const expanded = useRef<Record<number, number>>({})
  const avail = useRef(0)
  const [, setResizing] = useState(-1)
  const keys = panes.map((pane) => pane.key).join('|')
  const groupKey = `group:${keys}`
  const orderRef = useRef(order)
  const sizesRef = useRef(sizes)
  const collapsedRef = useRef(collapsed)
  orderRef.current = order
  sizesRef.current = sizes
  collapsedRef.current = collapsed

  // 分区数量变化（比如选中任务后多出「详情」）时，补齐折叠/高度状态，新分区默认展开。
  useEffect(() => {
    setCollapsed((prev) => (prev.length === panes.length
      ? prev
      : panes.map((pane, index) => prev[index] ?? pane.collapsed === true)))
    setSizes((prev) => (prev.length === panes.length ? prev : []))
    setLayoutTick((value) => value + 1)
  }, [panes.length])

  // 恢复上次的顺序 / 高度比例 / 折叠状态；只恢复一次，之后以用户操作为准。
  const restored = useRef<string | null>(null)
  const pendingSizes = useRef<Record<string, number> | null>(null)
  useEffect(() => {
    if (restored.current === groupKey) return
    restored.current = groupKey
    const saved = readPaneLayout(groupKey)
    if (!saved) return
    const byKey = new Map(panes.map((pane, index) => [pane.key, index]))
    const nextOrder: number[] = []
    for (const key of saved.order) {
      const index = byKey.get(key)
      if (index !== undefined && !nextOrder.includes(index)) nextOrder.push(index)
    }
    for (let index = 0; index < panes.length; index += 1) {
      if (!nextOrder.includes(index)) nextOrder.push(index)
    }
    setOrder(nextOrder)
    setCollapsed(panes.map((pane) => saved.collapsed[pane.key] ?? pane.collapsed === true))
    pendingSizes.current = saved.sizes
    setLayoutTick((value) => value + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey])

  const persist = () => {
    const layout = {
      order: orderRef.current.map((index) => panes[index].key),
      sizes: {} as Record<string, number>,
      collapsed: {} as Record<string, boolean>,
    }
    const total = avail.current
    panes.forEach((pane, index) => {
      const shut = collapsedRef.current[index] === true
      layout.collapsed[pane.key] = shut
      if (!shut && total > 0 && sizesRef.current[index]) {
        layout.sizes[pane.key] = Math.round((sizesRef.current[index] / total) * 1000) / 1000
      }
    })
    writePaneLayout(groupKey, layout)
  }


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
      // 有持久化比例就按比例铺，并夹到可用高度内；否则按内容量。
      const saved = pendingSizes.current
      if (saved) {
        pendingSizes.current = null
        const next = panes.map((pane, index) => {
          if (collapsed[index]) return HEAD
          const ratio = saved[pane.key]
          if (typeof ratio !== 'number' || ratio <= 0) return content[index]
          return Math.max(HEAD + 20, Math.round(ratio * avail.current))
        })
        let excess = next.reduce((sum, value) => sum + value, 0) - avail.current
        while (excess > 0.5) {
          let widest = -1
          let room = 0
          for (let index = 0; index < next.length; index += 1) {
            const spare = next[index] - (HEAD + 20)
            if (!collapsed[index] && spare > room) { room = spare; widest = index }
          }
          if (widest < 0 || room <= 0) break
          const cut = Math.min(room, excess)
          next[widest] -= cut
          excess -= cut
        }
        setSizes(next)
        return
      }
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
    requestAnimationFrame(persist)
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
      requestAnimationFrame(persist)
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
      } else {
        requestAnimationFrame(persist)
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

/**
 * 提醒条：详情里的警告之类「不是字段、但必须看见」的信息。
 * 浅底 + 0.5px 描边 + 左侧状态色图标，每条一行。
 */
export function Alert({ items, tone = 'warn' }: { items: string[], tone?: 'warn' | 'err' }) {
  if (items.length === 0) return null
  const color = tone === 'err'
    ? 'var(--dsw-alias-state-error-primary)'
    : 'var(--dsw-alias-state-warn-primary)'
  return (
    <div className={css.alert} role="status" style={{ color }}>
      <span className={css.alertIcon}>{IconWarning()}</span>
      <span className={css.alertBody}>
        {items.map((item, index) => (
          <span key={`${index}:${item}`} className={css.alertLine}>{item}</span>
        ))}
      </span>
    </div>
  )
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

/** 勾选：Lucide `check`。 */
export function IconCheck({ size = 16 }: { size?: number }) {
  return <Svg size={size} viewBox="0 0 24 24" strokeWidth={1.5}><path d="M20 6 9 17l-5-5" /></Svg>
}

/** 发起验收：Lucide `badge-check`。 */
export function IconBadgeCheck() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m16 9-5.5 5.5L8 12" />
    </Svg>
  )
}

/** 删除：Lucide `trash-2`。 */
export function IconTrash() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  )
}

/** 图标键的气泡：宿主用 `<Tooltip label side="bottom">` 包按钮，这里保持一致。 */
export function Tip({ ui, label, children }: {
  ui?: UiKit
  label: string
  children: React.ReactElement
}) {
  if (ui?.Tooltip === undefined) return cloneElement(children, { title: label })
  const Component = ui.Tooltip
  return <Component label={label} side="bottom" delayMs={400}>{children}</Component>
}

/** 暂停：Lucide `circle-pause`。 */
export function IconPause() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M10 15V9" />
      <path d="M14 15V9" />
    </Svg>
  )
}

/** 继续：Lucide `circle-play`。 */
export function IconPlay() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4Z" />
    </Svg>
  )
}

/** 停止：Lucide `square`。 */
export function IconStop() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </Svg>
  )
}

/** 禁用删除：Lucide `trash-off`。 */
export function IconTrashOff() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M10 11v6" />
      <path d="M14 17v-3" />
      <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-1.576.768" />
      <path d="M19 6v7.344" />
      <path d="m2 2 20 20" />
      <path d="M21 6h-9.344" />
      <path d="M3 6h3" />
      <path d="M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
    </Svg>
  )
}

/** 通过：Lucide `circle-check`。 */
export function IconCircleCheck() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16 9-5.5 5.5L8 12" />
    </Svg>
  )
}

/** 不通过：Lucide `circle-x`。 */
export function IconCircleX() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </Svg>
  )
}

/** 取消选择：Lucide `x`。 */
export function IconCancel() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  )
}

/** 全选：Lucide `list-checks`。 */
export function IconSelectAll() {
  return (
    <Svg viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </Svg>
  )
}

/** 警告：Lucide `triangle-alert`。 */
export function IconWarning() {
  return (
    <Svg size={16} viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  )
}

/** 调度：Lucide `list-checks`（队列 + 已派发）。 */
/** 调度：Lucide `layers-2`。 */
export function IconSchedule() {
  return (
    <Svg size={18} viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z" />
      <path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845" />
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

import type React from 'react'

export interface UiKit {
  DiffBlock?: React.ComponentType<{ diffs: { path: string, oldText: string, newText: string }[], labels: Record<string, unknown>, maxLines?: number }>
  Switch?: React.ComponentType<{ checked?: boolean, label?: string, onChange?: (next: boolean) => void }>
  SegmentedTabs?: React.ComponentType<{
    size?: 'sm' | 'md'
    label?: string
    items: { value: string, label: string, id: string, panelId: string }[]
    value: string
    onChange: (value: string) => void
  }>
  Button?: React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string, size?: 'sm' | 'md' }>
  Pill?: React.ComponentType<{ active?: boolean, onClick?: () => void, children?: React.ReactNode }>
  Tag?: React.ComponentType<{ tone?: string, children?: React.ReactNode, className?: string }>
  StateDot?: React.ComponentType<{ state: string }>
  /** diff 页的文件选择菜单。 */
  Menu?: React.ComponentType<{
    className?: string
    open?: boolean
    autoFocus?: boolean
    portal?: boolean
    align?: 'start' | 'end'
    dense?: boolean
    onClose?: () => void
    anchor?: React.ReactNode
    items: { id: string, label: React.ReactNode }[]
    selectedId?: string
    onSelect?: (id: string) => void
  }>
  /** 路径显示：目录淡化、文件名正常。 */
  PathLabel?: React.ComponentType<{ path: string, className?: string, title?: string }>
  Tooltip?: React.ComponentType<{ label: string, side?: 'top' | 'bottom', delayMs?: number, children?: React.ReactNode }>
  IconChevronDownOutlineRegular?: React.ComponentType<{ size?: number, className?: string }>
  IconCompareSplitOutlineRegular?: React.ComponentType<{ size?: number, className?: string }>
  IconWrapFillRegular?: React.ComponentType<{ size?: number, className?: string }>
  IconNowrapFillRegular?: React.ComponentType<{ size?: number, className?: string }>
  IconInspectOutlineRegular?: React.ComponentType<{ size?: number, className?: string }>
}

declare function require(id: string): unknown

export function loadUi(): UiKit {
  try {
    return (require('@deepseek-ai/dsh-client-ui-primitives') as UiKit | undefined) ?? {}
  } catch {
    return {}
  }
}

export function Dot({ ui, state }: { ui: UiKit, state: string }) {
  return ui.StateDot ? <ui.StateDot state={state} /> : <span data-state={state} />
}

export function ActionButton({
  ui, children, onClick, disabled, title, variant = 'outline', size = 'sm', type = 'button', className, ariaLabel,
}: {
  ui: UiKit
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  title?: string
  variant?: string
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  className?: string
  ariaLabel?: string
}) {
  if (ui.Button) {
    return <ui.Button type={type} className={className} variant={variant} size={size} disabled={disabled} title={title} aria-label={ariaLabel} onClick={onClick}>{children}</ui.Button>
  }
  return <button type={type} className={className} disabled={disabled} title={title} aria-label={ariaLabel} onClick={onClick}>{children}</button>
}

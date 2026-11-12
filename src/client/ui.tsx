import type React from 'react'

export interface UiKit {
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
  ui, children, onClick, disabled, title, variant = 'outline', size = 'sm', type = 'button', className,
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
}) {
  if (ui.Button) {
    return <ui.Button type={type} className={className} variant={variant} size={size} disabled={disabled} title={title} onClick={onClick}>{children}</ui.Button>
  }
  return <button type={type} className={className} disabled={disabled} title={title} onClick={onClick}>{children}</button>
}

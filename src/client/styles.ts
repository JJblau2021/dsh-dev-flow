import type React from 'react'

export const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  color: 'var(--dsw-alias-fg-primary, inherit)',
}

export const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
}

export const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
}

export const cardStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid var(--dsw-alias-border-subtle, transparent)',
  borderRadius: 'var(--dsh-radius-md, 8px)',
}

export const mutedStyle: React.CSSProperties = {
  color: 'var(--dsw-alias-fg-secondary, inherit)',
  fontSize: 12,
}

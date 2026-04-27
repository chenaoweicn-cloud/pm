import type { ReactNode } from 'react'
import { S } from '@/design/tokens'

export function GroupCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: S.cardBg,
        borderRadius: S.cardRadius,
        border: S.cardBorder,
        overflow: 'hidden',
        boxShadow: S.cardShadow,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

interface HeaderProps {
  color?: string
  title: string
  type?: string
  count?: number | string | null
  right?: ReactNode
}

export function GroupHeader({ color, title, type, count, right }: HeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: S.groupHeaderPad,
      }}
    >
      {color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: S.fg }}>{title}</span>
      {type && (
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 3,
            background: S.chipBg,
            color: S.fgMuted,
          }}
        >
          {type}
        </span>
      )}
      <div style={{ flex: 1 }} />
      {right ?? (count != null && <span style={{ fontSize: 10, color: S.fgMuted }}>{count}</span>)}
    </div>
  )
}

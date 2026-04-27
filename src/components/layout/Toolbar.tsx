import type { ReactNode } from 'react'
import { S } from '@/design/tokens'

interface Props {
  title: string
  count?: number | null
  openSearch: () => void
  right?: ReactNode
}

export function Toolbar({ title, count, openSearch, right }: Props) {
  return (
    <div
      style={{
        height: S.toolbarHeight,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 22px',
        borderBottom: S.hairline,
        background: S.toolbarBg,
      }}
    >
      <div style={{ fontSize: S.titleSize, fontWeight: S.titleWeight, color: S.fg }}>{title}</div>
      {count != null && (
        <div
          style={{
            fontSize: 11,
            color: S.fgMuted,
            padding: '2px 7px',
            borderRadius: 4,
            background: S.chipBg,
          }}
        >
          {count} 项
        </div>
      )}
      <div style={{ flex: 1 }} />
      {right}
      <div
        onClick={openSearch}
        style={{
          height: 26,
          padding: '0 10px',
          borderRadius: S.inputRadius,
          background: S.chipBg,
          border: S.chipBorder,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: S.fgMuted,
          cursor: 'default',
        }}
      >
        <span>搜索…</span>
        <span
          style={{
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 3,
            background: S.kbdBg,
            fontFamily: 'SF Mono, monospace',
          }}
        >
          ⌘K
        </span>
      </div>
    </div>
  )
}

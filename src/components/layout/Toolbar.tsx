import type { ReactNode } from 'react'
import { S } from '@/design/tokens'

interface Props {
  title: string
  count?: number | null
  openSearch: () => void
  openAiInbox: () => void
  right?: ReactNode
}

export function Toolbar({ title, count, openSearch, openAiInbox, right }: Props) {
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
      <button
        type="button"
        onClick={openAiInbox}
        style={{
          height: 26,
          padding: '0 10px',
          borderRadius: S.inputRadius,
          background: S.accentSoft,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: S.accent,
          cursor: 'pointer',
          fontFamily: S.font,
        }}
      >
        <span>AI Inbox</span>
        <span
          style={{
            fontSize: 10,
            padding: '1px 5px',
            borderRadius: 3,
            background: 'rgba(201,98,45,0.12)',
            fontFamily: 'SF Mono, monospace',
          }}
        >
          ⌘⇧I
        </span>
      </button>
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

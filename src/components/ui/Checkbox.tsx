import { S } from '@/design/tokens'
import type { TaskStatus } from '@/lib/types'

interface Props {
  status: TaskStatus
  color: string
  onClick?: () => void
}

const BASE = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const

export function Checkbox({ status, color, onClick }: Props) {
  const cursor = onClick ? 'pointer' : 'default'
  if (status === 'done') {
    return (
      <div onClick={onClick} style={{ ...BASE, background: color, border: `1px solid ${color}`, cursor }}>
        <svg width="8" height="8" viewBox="0 0 9 9">
          <path
            d="M1.5 4.5l2 2 4-4.5"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    )
  }
  if (status === 'in_progress') {
    return (
      <div onClick={onClick} style={{ ...BASE, border: `1.5px solid ${color}`, cursor }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      </div>
    )
  }
  return <div onClick={onClick} style={{ ...BASE, border: `1.5px solid ${S.checkboxBorder}`, cursor }} />
}

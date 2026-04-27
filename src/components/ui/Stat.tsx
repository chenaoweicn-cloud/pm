import { S } from '@/design/tokens'

type Tone = 'accent' | 'warn' | undefined

interface Props {
  label: string
  value: number | string
  tone?: Tone
}

const TONES = {
  accent: { c: S.accent, bg: S.accentSoft },
  warn: { c: S.warn, bg: S.warnSoft },
} as const

export function Stat({ label, value, tone }: Props) {
  const t = tone ? TONES[tone] : undefined
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 7,
        background: t ? t.bg : S.chipBg,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: t ? t.c : S.fg,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: t ? t.c : S.fgMuted,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  )
}

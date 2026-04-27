import { useState } from 'react'
import { S } from '@/design/tokens'
import { Stat } from '@/components/ui/Stat'
import { Row } from '@/components/ui/Row'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { TODAY, formatDate, relDate } from '@/lib/date'
import { TASKS, projectById } from '@/lib/mockData'
import type { Task } from '@/lib/types'

type Range = 'week' | 'month' | 'quarter' | 'custom'

const SEG: { key: Range; label: string }[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季' },
  { key: 'custom', label: '自定义' },
]

export function HistoryView() {
  const [range, setRange] = useState<Range>('week')
  // V1 displays the prototype's hardcoded current week; real impl will compute from `range`.
  const ws = '2026-04-20'
  const we = '2026-04-26'

  const completed = TASKS.filter(
    t => t.status === 'done' && t.completedAt && t.completedAt >= ws && t.completedAt <= we,
  ).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const inflight = TASKS.filter(t => t.status === 'in_progress')

  const byDate: Record<string, Task[]> = {}
  for (const t of completed) {
    const k = t.completedAt!
    ;(byDate[k] ??= []).push(t)
  }
  const byProj: Record<number, Task[]> = {}
  for (const t of inflight) {
    ;(byProj[t.projectId] ??= []).push(t)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: S.contentPad }}>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: S.fgMuted,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          4月20日 — 4月26日 · 第 17 周
        </div>
        <div
          style={{
            fontSize: S.heroSize,
            fontWeight: S.heroWeight,
            color: S.fg,
            marginTop: 4,
            letterSpacing: -0.3,
          }}
        >
          历史回顾
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <Stat label="完成" value={completed.length} />
          <Stat label="进行中" value={inflight.length} tone="accent" />
          <Stat label="涉及项目" value={Object.keys(byProj).length} />
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: 'inline-flex',
              gap: 2,
              padding: 2,
              background: S.chipBg,
              borderRadius: 7,
            }}
          >
            {SEG.map(s => {
              const sel = range === s.key
              return (
                <div
                  key={s.key}
                  onClick={() => setRange(s.key)}
                  style={{
                    padding: '3px 11px',
                    fontSize: 12,
                    borderRadius: 5,
                    background: sel ? '#fff' : 'transparent',
                    color: sel ? S.fg : S.fgMuted,
                    fontWeight: sel ? 600 : 500,
                    boxShadow: sel ? '0 0.5px 0 rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : 'none',
                    cursor: 'default',
                  }}
                >
                  {s.label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 14 }}>
        <GroupCard>
          <GroupHeader title="已完成 · 时间线" count={completed.length} />
          {Object.keys(byDate)
            .sort((a, b) => b.localeCompare(a))
            .map(date => (
              <div key={date}>
                <div
                  style={{
                    padding: '6px 18px',
                    fontSize: 11,
                    color: S.fgMuted,
                    background: S.chipBg,
                    borderTop: S.hairline,
                    display: 'flex',
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  <span>{formatDate(date)}</span>
                  <span style={{ fontWeight: 500 }}>
                    · {date === TODAY ? '今天' : relDate(date)}
                  </span>
                  <span style={{ marginLeft: 'auto', fontWeight: 500 }}>
                    {byDate[date].length} 项
                  </span>
                </div>
                {byDate[date].map(t => (
                  <Row key={t.id} task={t} showDate={false} />
                ))}
              </div>
            ))}
        </GroupCard>

        <div>
          {Object.entries(byProj).map(([pid, list]) => {
            const p = projectById(parseInt(pid, 10))
            if (!p) return null
            return (
              <GroupCard key={pid}>
                <GroupHeader color={p.color} title={p.name} type={p.type} count={list.length} />
                {list.map(t => (
                  <Row key={t.id} task={t} />
                ))}
              </GroupCard>
            )
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '12px 16px',
          background: S.accentSoft,
          borderRadius: S.cardRadius,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 13,
          color: S.fg,
        }}
      >
        <span style={{ fontSize: 14 }}>✎</span>
        <span style={{ flex: 1 }}>把上面的内容整理成周报？</span>
        <span
          style={{
            padding: '4px 10px',
            background: '#fff',
            borderRadius: 5,
            fontSize: 12,
            color: S.fg,
            fontWeight: 500,
            border: S.hairline,
          }}
        >
          复制为 Markdown
        </span>
      </div>
    </div>
  )
}

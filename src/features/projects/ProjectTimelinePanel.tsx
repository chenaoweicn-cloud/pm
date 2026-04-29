import { S } from '@/design/tokens'
import { Checkbox } from '@/components/ui/Checkbox'
import { GroupCard } from '@/components/ui/GroupCard'
import { todayIso, relDate } from '@/lib/date'
import type { Project, Task } from '@/lib/types'

interface Props {
  project: Project
  tasks: Task[]
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const

export function ProjectTimelinePanel({ project, tasks }: Props) {
  const today = todayIso()
  const dated = tasks.filter(t => t.dueDate || t.startDate)
  const allDates = dated.flatMap(t => [t.startDate, t.dueDate].filter(Boolean) as string[])
  const minDate = allDates.length > 0 ? allDates.reduce((a, b) => (a < b ? a : b)) : today
  const maxDate = allDates.length > 0 ? allDates.reduce((a, b) => (a > b ? a : b)) : today
  const startD = new Date(minDate < today ? minDate : today)
  startD.setDate(startD.getDate() - 3)
  const endD = new Date(maxDate > today ? maxDate : today)
  endD.setDate(endD.getDate() + 7)
  const start = startD.toISOString().slice(0, 10)
  const end = endD.toISOString().slice(0, 10)
  const days: string[] = []
  const cursor = new Date(start)
  const stop = new Date(end)
  while (cursor <= stop) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  const colW = 36
  const nameW = 220

  return (
    <GroupCard>
      <div style={{ display: 'flex', borderBottom: S.hairline }}>
        <div
          style={{
            width: nameW,
            padding: '10px 14px',
            fontSize: 10,
            color: S.fgMuted,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          任务
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {days.map(day => {
            const dt = new Date(day)
            const we = dt.getDay() === 0 || dt.getDay() === 6
            const td = day === today
            return (
              <div
                key={day}
                style={{
                  width: colW,
                  flexShrink: 0,
                  padding: '8px 0',
                  textAlign: 'center',
                  fontSize: 9.5,
                  color: td ? S.accent : S.fgMuted,
                  background: td ? S.accentSoft : we ? S.chipBg : 'transparent',
                  fontWeight: td ? 700 : 500,
                }}
              >
                <div style={{ fontSize: 9 }}>{WEEKDAYS[dt.getDay()]}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{dt.getDate()}</div>
              </div>
            )
          })}
        </div>
      </div>

      {dated.slice(0, 8).map((t, i) => {
        const sIdx = days.indexOf(t.startDate ?? t.dueDate ?? '')
        const eIdx = days.indexOf(t.dueDate ?? t.startDate ?? '')
        const left = Math.max(0, sIdx) * colW
        const w = Math.max(1, eIdx - sIdx + 1) * colW - 4
        const done = t.status === 'done'
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              height: 36,
              borderTop: i === 0 ? 'none' : S.hairline,
            }}
          >
            <div
              style={{
                width: nameW,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: done ? S.fgMuted : S.fg,
                textDecoration: done ? 'line-through' : 'none',
              }}
            >
              <Checkbox status={t.status} color={project.color ?? '#6C6C6C'} />
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.name}
              </span>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              {days.map((day, di) => {
                const dt = new Date(day)
                const we = dt.getDay() === 0 || dt.getDay() === 6
                const td = day === today
                if (!we && !td) return null
                return (
                  <div
                    key={day}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: di * colW,
                      width: colW,
                      background: td ? S.accentSoft : S.chipBg,
                      opacity: 0.5,
                    }}
                  />
                )
              })}
              {sIdx >= 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: left + 2,
                    top: 9,
                    height: 18,
                    width: w,
                    background: done ? `${project.color}30` : project.color,
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    color: done ? project.color : '#fff',
                  }}
                >
                  {relDate(t.dueDate ?? undefined)}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </GroupCard>
  )
}

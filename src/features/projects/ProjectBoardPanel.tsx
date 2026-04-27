import { S } from '@/design/tokens'
import { Checkbox } from '@/components/ui/Checkbox'
import { GroupHeader } from '@/components/ui/GroupCard'
import { relDate } from '@/lib/date'
import type { Project, Task, TaskStatus } from '@/lib/types'

interface Props {
  project: Project
  tasks: Task[]
}

const COLS: { key: TaskStatus; name: string }[] = [
  { key: 'not_started', name: '待开始' },
  { key: 'in_progress', name: '进行中' },
  { key: 'done', name: '已完成' },
]

export function ProjectBoardPanel({ project, tasks }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {COLS.map(c => {
        const list = tasks.filter(t => t.status === c.key)
        return (
          <div
            key={c.key}
            style={{
              background: S.cardBg,
              borderRadius: S.cardRadius,
              border: S.cardBorder,
              boxShadow: S.cardShadow,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 320,
            }}
          >
            <GroupHeader title={c.name} count={list.length} />
            <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map(t => (
                <div
                  key={t.id}
                  style={{
                    padding: '9px 11px',
                    borderRadius: 8,
                    background: S.bg,
                    border: S.hairline,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <Checkbox status={t.status} color={project.color} />
                    {t.priority === 'high' && (
                      <span style={{ width: 3, height: 11, borderRadius: 1.5, background: S.warn }} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: c.key === 'done' ? S.fgMuted : S.fg,
                      textDecoration: c.key === 'done' ? 'line-through' : 'none',
                      lineHeight: 1.4,
                      fontWeight: 500,
                    }}
                  >
                    {t.name}
                  </div>
                  {(t.dueDate || (t.tags && t.tags[0])) && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 6,
                        fontSize: 10,
                        color: S.fgMuted,
                      }}
                    >
                      {t.dueDate && (
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: S.chipBg,
                          }}
                        >
                          {relDate(t.dueDate)}
                        </span>
                      )}
                      {t.tags?.[0] && <span>#{t.tags[0]}</span>}
                    </div>
                  )}
                </div>
              ))}
              {list.length === 0 && (
                <div
                  style={{
                    padding: 14,
                    fontSize: 11,
                    color: S.fgMuted,
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  —
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

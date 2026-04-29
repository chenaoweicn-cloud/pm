import { S } from '@/design/tokens'
import { Stat } from '@/components/ui/Stat'
import { Row } from '@/components/ui/Row'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { TODAY } from '@/lib/date'
import { projectById, todayTasks } from '@/lib/mockData'
import type { Task } from '@/lib/types'

export function TodayView() {
  const ts = todayTasks()
  const byProject = new Map<number, Task[]>()
  for (const t of ts) {
    const list = byProject.get(t.projectId) ?? []
    list.push(t)
    byProject.set(t.projectId, list)
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
          周四 · 4月23日
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
          今日待办
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Stat label="待处理" value={ts.length} />
          <Stat
            label="进行中"
            value={ts.filter(t => t.status === 'in_progress').length}
            tone="accent"
          />
          <Stat
            label="今日到期"
            value={ts.filter(t => t.dueDate === TODAY).length}
            tone="warn"
          />
        </div>
      </div>

      {[...byProject.entries()].map(([pid, list]) => {
        const p = projectById(pid)
        if (!p) return null
        return (
          <GroupCard key={pid}>
            <GroupHeader color={p.color} title={p.name} type={p.type ?? undefined} count={list.length} />
            {list.map(t => (
              <Row key={t.id} task={t} />
            ))}
          </GroupCard>
        )
      })}
    </div>
  )
}

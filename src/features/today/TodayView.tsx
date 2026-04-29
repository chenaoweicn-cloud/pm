import { S } from '@/design/tokens'
import { Stat } from '@/components/ui/Stat'
import { Row } from '@/components/ui/Row'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { todayIso, formatDate } from '@/lib/date'
import { useActiveProjects } from '@/features/projects/queries'
import { useTodayTasks } from '@/features/tasks/queries'
import type { Task } from '@/lib/types'

export function TodayView() {
  const today = todayIso()
  const { data: ts = [] } = useTodayTasks(today)
  const { data: projects = [] } = useActiveProjects()

  const byProject = new Map<number, Task[]>()
  for (const t of ts) {
    const list = byProject.get(t.projectId) ?? []
    list.push(t)
    byProject.set(t.projectId, list)
  }

  const now = new Date()
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dayLabel = `${days[now.getDay()]} · ${formatDate(today)}`

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
          {dayLabel}
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
            value={ts.filter(t => t.dueDate === today).length}
            tone="warn"
          />
        </div>
      </div>

      {[...byProject.entries()].map(([pid, list]) => {
        const p = projects.find(x => x.id === pid)
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

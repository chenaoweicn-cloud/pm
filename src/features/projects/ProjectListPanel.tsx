import { S } from '@/design/tokens'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { Row } from '@/components/ui/Row'
import type { Task, TaskGroup } from '@/lib/types'

interface Props {
  groups: TaskGroup[]
  tasks: Task[]
}

export function ProjectListPanel({ groups, tasks }: Props) {
  const grouped = groups.length
    ? groups.map(g => ({ name: g.name, items: tasks.filter(t => t.groupId === g.id) }))
    : [{ name: '全部任务', items: tasks }]

  if (groups.length) {
    const ungrouped = tasks.filter(t => t.groupId == null)
    if (ungrouped.length) grouped.push({ name: '其他', items: ungrouped })
  }

  return (
    <>
      {grouped.map((g, i) => (
        <GroupCard key={i}>
          <GroupHeader
            title={g.name}
            count={`${g.items.filter(t => t.status === 'done').length} / ${g.items.length}`}
          />
          {g.items.length === 0 ? (
            <div style={{ padding: '10px 18px', fontSize: 12, color: S.fgMuted, fontStyle: 'italic' }}>
              暂无任务
            </div>
          ) : (
            g.items.map(t => <Row key={t.id} task={t} />)
          )}
        </GroupCard>
      ))}
    </>
  )
}

import { S } from '@/design/tokens'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { Row } from '@/components/ui/Row'
import { TASKS } from '@/lib/mockData'

export function CrossView() {
  const ts = TASKS.filter(t => t.status !== 'done').sort((a, b) =>
    (a.dueDate ?? 'z').localeCompare(b.dueDate ?? 'z'),
  )

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
          跨项目
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
          所有进行中
        </div>
      </div>
      <GroupCard>
        <GroupHeader title="按到期时间" count={ts.length} />
        {ts.map(t => (
          <Row key={t.id} task={t} />
        ))}
      </GroupCard>
    </div>
  )
}

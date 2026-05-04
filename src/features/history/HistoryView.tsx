import { useMemo, useState } from 'react'
import { S } from '@/design/tokens'
import { Stat } from '@/components/ui/Stat'
import { Row } from '@/components/ui/Row'
import { GroupCard, GroupHeader } from '@/components/ui/GroupCard'
import { todayIso, formatDate, relDate, isoDate, thisWeekRange, thisMonthRange } from '@/lib/date'
import { projectColorFor } from '@/lib/projectColor'
import { useActiveProjects, useArchivedProjects } from '@/features/projects/queries'
import { useCompletedInRange, useInProgressTasks } from '@/features/tasks/queries'
import { useFirstTagNamesForTasks } from '@/features/tasks/tagQueries'
import type { Task } from '@/lib/types'
import { TaskForm } from '@/features/tasks/TaskForm'

type Range = 'week' | 'month' | 'custom'

const SEG: { key: Range; label: string }[] = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义' },
]

type DateRange = {
  start: string
  endInclusive: string
  endExclusive: string
}

function nextDate(iso: string): string {
  const date = new Date(iso)
  date.setDate(date.getDate() + 1)
  return isoDate(date)
}

function getDefaultCustomRange(): { start: string; endInclusive: string } {
  const { start, endExclusive } = thisWeekRange()
  return {
    start,
    endInclusive: isoDate(new Date(+new Date(endExclusive) - 86400000)),
  }
}

function getRangeDates(
  range: Exclude<Range, 'custom'>,
): DateRange {
  if (range === 'month') {
    const { start, endExclusive } = thisMonthRange()
    return {
      start,
      endInclusive: isoDate(new Date(+new Date(endExclusive) - 86400000)),
      endExclusive,
    }
  }

  const { start, endExclusive } = thisWeekRange()
  return {
    start,
    endInclusive: isoDate(new Date(+new Date(endExclusive) - 86400000)),
    endExclusive,
  }
}

function normalizeRange(customRange: { start: string; endInclusive: string }): DateRange {
  const endInclusive = customRange.endInclusive >= customRange.start
    ? customRange.endInclusive
    : customRange.start

  return {
    start: customRange.start,
    endInclusive,
    endExclusive: nextDate(endInclusive),
  }
}

function completedDay(value: string | null): string {
  return value?.slice(0, 10) ?? ''
}

export function HistoryView() {
  const [range, setRange] = useState<Range>('week')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [customRange, setCustomRange] = useState(getDefaultCustomRange)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const { start, endInclusive, endExclusive } = useMemo(() => {
    if (range === 'custom') return normalizeRange(customRange)
    return getRangeDates(range)
  }, [customRange, range])

  const { data: completedTasks = [] } = useCompletedInRange(start, endExclusive, includeArchived)
  const { data: inflightTasks = [] } = useInProgressTasks(includeArchived)
  const { data: activeProjects = [] } = useActiveProjects()
  const { data: archivedProjects = [] } = useArchivedProjects()
  const projects = includeArchived ? [...activeProjects, ...archivedProjects] : activeProjects

  const completed = [...completedTasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const inflight = inflightTasks
  const { data: tagNames = {} } = useFirstTagNamesForTasks([...completed, ...inflight].map(task => task.id))

  const byDate: Record<string, Task[]> = {}
  for (const t of completed) {
    const k = completedDay(t.completedAt)
    if (!k) continue
    ;(byDate[k] ??= []).push(t)
  }
  const byProj: Record<number, Task[]> = {}
  for (const t of inflight) {
    ;(byProj[t.projectId] ??= []).push(t)
  }

  const rangeLabel = `${formatDate(start)} — ${formatDate(endInclusive)}`

  const filterControlStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: S.fgMuted,
  }

  const dateInputStyle: React.CSSProperties = {
    border: S.hairline,
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 12,
    fontFamily: S.font,
    background: '#fff',
    color: S.fg,
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
          {rangeLabel}
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
        <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={filterControlStyle}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => setIncludeArchived(e.target.checked)}
            />
            包含归档项目
          </label>
          {range === 'custom' && (
            <>
              <label style={filterControlStyle}>
                开始
                <input
                  type="date"
                  value={customRange.start}
                  onChange={e => setCustomRange(current => ({ ...current, start: e.target.value }))}
                  style={dateInputStyle}
                />
              </label>
              <label style={filterControlStyle}>
                结束
                <input
                  type="date"
                  value={customRange.endInclusive}
                  min={customRange.start}
                  onChange={e => setCustomRange(current => ({ ...current, endInclusive: e.target.value }))}
                  style={dateInputStyle}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
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
                    · {date === todayIso() ? '今天' : relDate(date)}
                  </span>
                  <span style={{ marginLeft: 'auto', fontWeight: 500 }}>
                    {byDate[date].length} 项
                  </span>
                </div>
                {byDate[date].map(t => (
                  <Row
                    key={t.id}
                    task={t}
                    showDate={false}
                    showProject
                    projectName={projects.find(project => project.id === t.projectId)?.name}
                    projectColor={projectColorFor(projects.find(project => project.id === t.projectId))}
                    tagName={tagNames[t.id]}
                    onEdit={setEditingTask}
                  />
                ))}
              </div>
            ))}
        </GroupCard>

        <div>
          {Object.entries(byProj).map(([pid, list]) => {
            const p = projects.find(x => x.id === parseInt(pid, 10))
            if (!p) return null
            return (
              <GroupCard key={pid}>
                <GroupHeader color={projectColorFor(p)} title={p.name} type={p.type ?? undefined} count={list.length} />
                {list.map(t => (
                  <Row
                    key={t.id}
                    task={t}
                    showProject
                    projectName={p.name}
                    projectColor={projectColorFor(p)}
                    tagName={tagNames[t.id]}
                    onEdit={setEditingTask}
                  />
                ))}
              </GroupCard>
            )
          })}
        </div>
      </div>
      {editingTask && (
        <TaskForm
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

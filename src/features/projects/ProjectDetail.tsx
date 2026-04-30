import { useState } from 'react'
import { S } from '@/design/tokens'
import { Stat } from '@/components/ui/Stat'
import type { Task } from '@/lib/types'
import { useProject } from '@/features/projects/queries'
import { useTasksForProject } from '@/features/tasks/queries'
import { TaskForm } from '@/features/tasks/TaskForm'
import { ProjectListPanel } from './ProjectListPanel'
import { ProjectBoardPanel } from './ProjectBoardPanel'
import { ProjectTimelinePanel } from './ProjectTimelinePanel'
import { ProjectForm } from './ProjectForm'

type Mode = 'list' | 'board' | 'timeline'

const MODES: { key: Mode; label: string }[] = [
  { key: 'list', label: '列表' },
  { key: 'board', label: '看板' },
  { key: 'timeline', label: '时间轴' },
]

interface Props {
  projectId: number
}

export function ProjectDetail({ projectId }: Props) {
  const [mode, setMode] = useState<Mode>('list')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState(false)
  const { data: p } = useProject(projectId)
  const { data: tasks = [] } = useTasksForProject(projectId)

  if (!p) return null

  const segmented = (
    <div
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        background: S.chipBg,
        borderRadius: 7,
      }}
    >
      {MODES.map(m => {
        const sel = mode === m.key
        return (
          <div
            key={m.key}
            onClick={() => setMode(m.key)}
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
            {m.label}
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: S.contentPad, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color ?? '#6C6C6C' }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: S.fgMuted,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {p.type}
          </span>
        </div>
        <div
          style={{
            fontSize: S.heroSize,
            fontWeight: S.heroWeight,
            color: S.fg,
            letterSpacing: -0.3,
          }}
        >
          {p.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Stat label="任务" value={tasks.length} />
          <Stat
            label="进行中"
            value={tasks.filter(t => t.status === 'in_progress').length}
            tone="accent"
          />
          <Stat label="完成" value={tasks.filter(t => t.status === 'done').length} />
          {p.dueCount != null && p.dueCount > 0 && (
            <Stat label="即将到期" value={p.dueCount} tone="warn" />
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setEditingProject(true)}
            style={{
              background: 'transparent',
              border: S.hairline,
              borderRadius: S.inputRadius,
              padding: '4px 10px',
              fontSize: 12,
              color: S.fgMuted,
              cursor: 'pointer',
              fontFamily: S.font,
            }}
          >
            编辑项目
          </button>
          {segmented}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 36px 36px' }}>
        {mode === 'list' && <ProjectListPanel tasks={tasks} onEditTask={setEditingTask} />}
        {mode === 'board' && <ProjectBoardPanel project={p} tasks={tasks} onEditTask={setEditingTask} />}
        {mode === 'timeline' && <ProjectTimelinePanel project={p} tasks={tasks} onEditTask={setEditingTask} />}
      </div>
      {editingTask && (
        <TaskForm
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      {editingProject && (
        <ProjectForm
          initialProject={p}
          onClose={() => setEditingProject(false)}
        />
      )}
    </div>
  )
}

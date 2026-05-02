import { useState } from 'react'
import { S } from '@/design/tokens'
import { Stat } from '@/components/ui/Stat'
import { Row } from '@/components/ui/Row'
import { GroupCard } from '@/components/ui/GroupCard'
import { todayIso, formatDate } from '@/lib/date'
import { useActiveProjects } from '@/features/projects/queries'
import { useTodayTasks } from '@/features/tasks/queries'
import { useFirstTagNamesForTasks } from '@/features/tasks/tagQueries'
import type { Task } from '@/lib/types'
import { TaskForm } from '@/features/tasks/TaskForm'

export function TodayView() {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const today = todayIso()
  const { data: ts = [] } = useTodayTasks(today)
  const { data: projects = [] } = useActiveProjects()
  const { data: tagNames = {} } = useFirstTagNamesForTasks(ts.map(task => task.id))

  const projectSections = projects
    .map(project => ({
      project,
      tasks: ts.filter(task => task.projectId === project.id),
    }))
    .filter(section => section.tasks.length > 0)

  const orphanTasks = ts.filter(task => !projects.some(project => project.id === task.projectId))

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

      {projectSections.map(({ project, tasks }) => (
          <GroupCard key={project.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 18px 10px',
                borderBottom: S.hairline,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: project.color ?? '#6C6C6C',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: S.fg,
                  letterSpacing: -0.1,
                }}
              >
                {project.name}
              </span>
              {project.type && (
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: S.chipBg,
                    color: S.fgMuted,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {project.type}
                </span>
              )}
              <div style={{ flex: 1 }} />
              <span
                style={{
                  fontSize: 12,
                  color: S.fgMuted,
                  fontWeight: 600,
                }}
              >
                {tasks.length}
              </span>
            </div>
            {tasks.map(t => (
              <Row
                key={t.id}
                task={t}
                projectColor={project.color ?? '#6C6C6C'}
                tagName={tagNames[t.id]}
                onEdit={setEditingTask}
              />
            ))}
          </GroupCard>
      ))}
      {orphanTasks.length > 0 && (
        <GroupCard>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 18px 10px',
              borderBottom: S.hairline,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#BDB7AD',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: S.fg,
              }}
            >
              未归类项目
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 12,
                color: S.fgMuted,
                fontWeight: 600,
              }}
            >
              {orphanTasks.length}
            </span>
          </div>
          {orphanTasks.map(task => (
            <Row key={task.id} task={task} tagName={tagNames[task.id]} onEdit={setEditingTask} />
          ))}
        </GroupCard>
      )}
      {editingTask && (
        <TaskForm
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

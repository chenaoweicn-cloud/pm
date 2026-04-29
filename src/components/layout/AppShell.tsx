import { useEffect, useState } from 'react'
import { S } from '@/design/tokens'
import { useProject } from '@/features/projects/queries'
import { useAllActiveTasks, useTodayTasks } from '@/features/tasks/queries'
import { todayIso } from '@/lib/date'
import { TodayView } from '@/features/today/TodayView'
import { CrossView } from '@/features/tasks/CrossView'
import { HistoryView } from '@/features/history/HistoryView'
import { ProjectDetail } from '@/features/projects/ProjectDetail'
import { GlobalSearch } from '@/features/search/GlobalSearch'
import { TaskForm } from '@/features/tasks/TaskForm'
import { ProjectForm } from '@/features/projects/ProjectForm'
import { TrashView } from '@/features/trash/TrashView'
import { Sidebar } from './Sidebar'
import { Toolbar } from './Toolbar'

export type ViewKey = 'today' | 'cross' | 'history' | 'project' | 'trash'

export function AppShell() {
  const [view, setViewRaw] = useState<ViewKey>('today')
  const [projectId, setProjectId] = useState<number>(1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [taskFormProjectId, setTaskFormProjectId] = useState<number | null>(null)
  const [projectFormOpen, setProjectFormOpen] = useState(false)

  const today = todayIso()
  const { data: allTasks = [] } = useAllActiveTasks()
  const { data: todayTasksList = [] } = useTodayTasks(today)
  const { data: currentProject } = useProject(view === 'project' ? projectId : null)

  const setView = (v: ViewKey, pid?: number) => {
    setViewRaw(v)
    if (pid != null) setProjectId(pid)
    setTaskFormProjectId(v === 'project' ? (pid ?? projectId) : null)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setTaskFormOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  let body: React.ReactNode = null
  let title = ''
  let count: number | null = null

  if (view === 'today') {
    body = <TodayView />
    title = '今日待办'
    count = todayTasksList.length
  } else if (view === 'cross') {
    body = <CrossView />
    title = '跨项目任务'
    count = allTasks.filter(t => t.status !== 'done').length
  } else if (view === 'history') {
    body = <HistoryView />
    title = '历史回顾'
    count = null
  } else if (view === 'trash') {
    body = <TrashView />
    title = '回收站'
    count = null
  } else {
    body = <ProjectDetail projectId={projectId} />
    title = currentProject?.name ?? ''
    count = currentProject?.taskCount ?? null
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: S.font,
        background: S.bg,
        color: S.fg,
        position: 'relative',
      }}
    >
      <Sidebar
        view={view}
        projectId={projectId}
        setView={setView}
        openSearch={() => setSearchOpen(true)}
        openProjectForm={() => setProjectFormOpen(true)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Toolbar title={title} count={count} openSearch={() => setSearchOpen(true)} />
        {body}
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {taskFormOpen && <TaskForm projectId={taskFormProjectId} onClose={() => setTaskFormOpen(false)} />}
      {projectFormOpen && <ProjectForm onClose={() => setProjectFormOpen(false)} />}
    </div>
  )
}

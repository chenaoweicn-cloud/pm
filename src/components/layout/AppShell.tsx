import { useEffect, useState } from 'react'
import { S } from '@/design/tokens'
import { TASKS, projectById, todayTasks } from '@/lib/mockData'
import { TodayView } from '@/features/today/TodayView'
import { CrossView } from '@/features/tasks/CrossView'
import { HistoryView } from '@/features/history/HistoryView'
import { ProjectDetail } from '@/features/projects/ProjectDetail'
import { GlobalSearch } from '@/features/search/GlobalSearch'
import { Sidebar } from './Sidebar'
import { Toolbar } from './Toolbar'

export type ViewKey = 'today' | 'cross' | 'history' | 'project'

export function AppShell() {
  const [view, setViewRaw] = useState<ViewKey>('today')
  const [projectId, setProjectId] = useState<number>(1)
  const [searchOpen, setSearchOpen] = useState(false)

  const setView = (v: ViewKey, pid?: number) => {
    setViewRaw(v)
    if (pid != null) setProjectId(pid)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
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
    count = todayTasks().length
  } else if (view === 'cross') {
    body = <CrossView />
    title = '跨项目任务'
    count = TASKS.filter(t => t.status !== 'done').length
  } else if (view === 'history') {
    body = <HistoryView />
    title = '历史回顾'
    count = null
  } else {
    const p = projectById(projectId)
    body = <ProjectDetail projectId={projectId} />
    title = p?.name ?? ''
    count = p?.taskCount ?? null
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
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Toolbar title={title} count={count} openSearch={() => setSearchOpen(true)} />
        {body}
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  )
}

# Task 32: TodayView

**Files:**
- Create: `src/features/today/TodayView.tsx`

- [ ] **Step 1: 实现（按项目分组）**

  ```tsx
  // src/features/today/TodayView.tsx
  import { Link } from 'react-router-dom'
  import { useTodayTasks, useSetTaskStatus } from '@/features/tasks/queries'
  import { useActiveProjects } from '@/features/projects/queries'
  import { todayIso } from '@/lib/date'

  export function TodayView() {
      const today = todayIso()
      const tasks = useTodayTasks(today)
      const projects = useActiveProjects()
      const setStatus = useSetTaskStatus()

      const groups = new Map<number, typeof tasks.data>()
      tasks.data?.forEach(t => {
          const arr = groups.get(t.projectId) ?? []
          arr.push(t); groups.set(t.projectId, arr)
      })

      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">今日（{today}）</h1>
              {[...groups.entries()].map(([pid, ts]) => {
                  const p = projects.data?.find(x => x.id === pid)
                  return (
                      <section key={pid}>
                          <h2 className="font-medium mb-2">
                              <Link to={`/projects/${pid}`} className="underline">{p?.name ?? `项目 #${pid}`}</Link>
                          </h2>
                          <ul className="space-y-1 ml-4">
                              {ts?.map(t => (
                                  <li key={t.id} className="flex gap-2">
                                      <input type="checkbox" checked={t.status === 'done'}
                                          onChange={e => setStatus.mutate({ id: t.id, status: e.target.checked ? 'done' : 'in_progress' })} />
                                      <span className={t.status === 'done' ? 'line-through text-slate-400' : ''}>{t.name}</span>
                                      {t.dueDate && <span className="text-xs text-slate-500">{t.dueDate}</span>}
                                  </li>
                              ))}
                          </ul>
                      </section>
                  )
              })}
              {tasks.data?.length === 0 && <p className="text-slate-500">今天没有待办。</p>}
          </div>
      )
  }
  ```

- [ ] **Step 2: 验证、Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 今日待办视图（按项目分组）"
  ```


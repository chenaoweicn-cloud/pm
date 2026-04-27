# Task 33: HistoryView

**Files:**
- Create: `src/features/history/HistoryView.tsx`

- [ ] **Step 1: 实现**

  ```tsx
  // src/features/history/HistoryView.tsx
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { useCompletedInRange, useInProgressTasks } from '@/features/tasks/queries'
  import { useActiveProjects } from '@/features/projects/queries'
  import { thisWeekRange, thisMonthRange } from '@/lib/date'

  export function HistoryView() {
      const [range, setRange] = useState(thisWeekRange())
      const [includeArchived, setIncludeArchived] = useState(false)
      const completed = useCompletedInRange(range.start, range.endExclusive, includeArchived)
      const inProgress = useInProgressTasks(includeArchived)
      const projects = useActiveProjects()
      const projectName = (pid: number) => projects.data?.find(p => p.id === pid)?.name ?? `#${pid}`

      const grouped = (tasks: typeof completed.data) => {
          const m = new Map<number, typeof completed.data>()
          tasks?.forEach(t => {
              const arr = m.get(t.projectId) ?? []
              arr.push(t); m.set(t.projectId, arr)
          })
          return m
      }

      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">历史回顾</h1>
              <div className="flex items-center gap-2">
                  <Button onClick={() => setRange(thisWeekRange())}>本周</Button>
                  <Button onClick={() => setRange(thisMonthRange())}>本月</Button>
                  <Input type="date" value={range.start} onChange={e => setRange(r => ({ ...r, start: e.target.value }))} />
                  <span>~</span>
                  <Input type="date" value={range.endExclusive} onChange={e => setRange(r => ({ ...r, endExclusive: e.target.value }))} />
                  <label className="ml-auto flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} />
                      包含归档
                  </label>
              </div>

              <section>
                  <h2 className="font-medium">已完成（{range.start} ~ {range.endExclusive}）</h2>
                  {[...grouped(completed.data).entries()].map(([pid, ts]) => (
                      <div key={pid} className="mt-2">
                          <div className="font-medium">{projectName(pid)}</div>
                          <ul className="ml-4">{ts?.map(t => <li key={t.id}>✓ {t.name}</li>)}</ul>
                      </div>
                  ))}
              </section>

              <section>
                  <h2 className="font-medium">进行中</h2>
                  {[...grouped(inProgress.data).entries()].map(([pid, ts]) => (
                      <div key={pid} className="mt-2">
                          <div className="font-medium">{projectName(pid)}</div>
                          <ul className="ml-4">{ts?.map(t => <li key={t.id}>· {t.name}</li>)}</ul>
                      </div>
                  ))}
              </section>
          </div>
      )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 历史回顾视图（本周/本月/自定义）"
  ```


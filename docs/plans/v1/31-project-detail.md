# Task 31: ProjectDetail + 视图切换占位

**Files:**
- Create: `src/features/projects/ProjectDetail.tsx`、`src/features/tasks/TaskList.tsx`、`src/features/tasks/TaskKanban.tsx`、`src/features/tasks/TaskGantt.tsx`、`src/features/tasks/TaskForm.tsx`

- [ ] **Step 1: TaskForm**（与 ProjectForm 同结构，字段参考 spec §5.3；略——逐字段 `<Input>` 即可，submit 调 `useCreateTask/useUpdateTask`）

- [ ] **Step 2: TaskList（项目内）**

  ```tsx
  // src/features/tasks/TaskList.tsx
  import { useTasksForProject, useSetTaskStatus, useSoftDeleteTask } from './queries'
  import { Button } from '@/components/ui/button'
  import type { Task, TaskStatus } from '@/lib/types'

  export function TaskList({ projectId }: { projectId: number }) {
      const q = useTasksForProject(projectId)
      const setStatus = useSetTaskStatus()
      const del = useSoftDeleteTask()
      if (q.isLoading) return <div>Loading...</div>
      return (
          <ul className="space-y-1">
              {q.data?.map((t: Task) => (
                  <li key={t.id} className="flex items-center gap-2 border-b py-1">
                      <select value={t.status} onChange={e => setStatus.mutate({ id: t.id, status: e.target.value as TaskStatus })}>
                          <option value="not_started">未开始</option>
                          <option value="in_progress">进行中</option>
                          <option value="done">已完成</option>
                      </select>
                      <span className={t.status === 'done' ? 'line-through text-slate-400' : ''}>{t.name}</span>
                      {t.dueDate && <span className="text-xs text-slate-500">{t.dueDate}</span>}
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(t.id)}>删</Button>
                  </li>
              ))}
          </ul>
      )
  }
  ```

- [ ] **Step 3: TaskKanban（项目内看板）**

  ```tsx
  // src/features/tasks/TaskKanban.tsx
  import { useTasksForProject, useSetTaskStatus } from './queries'
  import type { TaskStatus } from '@/lib/types'

  const cols: { key: TaskStatus; label: string }[] = [
      { key: 'not_started', label: '未开始' },
      { key: 'in_progress', label: '进行中' },
      { key: 'done', label: '已完成' },
  ]

  export function TaskKanban({ projectId }: { projectId: number }) {
      const q = useTasksForProject(projectId)
      const setStatus = useSetTaskStatus()
      return (
          <div className="grid grid-cols-3 gap-4">
              {cols.map(c => (
                  <div key={c.key} className="border rounded p-2 min-h-[200px]">
                      <h3 className="font-medium mb-2">{c.label}</h3>
                      {q.data?.filter(t => t.status === c.key).map(t => (
                          <div key={t.id} className="bg-white border rounded p-2 mb-2">
                              <div>{t.name}</div>
                              <div className="flex gap-1 mt-1">
                                  {cols.filter(x => x.key !== c.key).map(x => (
                                      <button key={x.key} className="text-xs underline"
                                          onClick={() => setStatus.mutate({ id: t.id, status: x.key })}>
                                          → {x.label}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      )
  }
  ```

- [ ] **Step 4: TaskGantt（占位 — 最简时间轴表格）**

  ```tsx
  // src/features/tasks/TaskGantt.tsx
  import { useTasksForProject } from './queries'

  export function TaskGantt({ projectId }: { projectId: number }) {
      const q = useTasksForProject(projectId)
      const withDates = q.data?.filter(t => t.startDate && t.dueDate) ?? []
      return (
          <div className="space-y-1">
              <p className="text-sm text-slate-500">甘特图（占位版）— 只展示有 startDate+dueDate 的任务</p>
              <table className="w-full text-sm">
                  <thead><tr><th className="text-left">任务</th><th>开始</th><th>截止</th><th>跨度</th></tr></thead>
                  <tbody>
                      {withDates.map(t => {
                          const days = Math.ceil((+new Date(t.dueDate!) - +new Date(t.startDate!)) / 86400000) + 1
                          return <tr key={t.id} className="border-t">
                              <td>{t.name}</td><td>{t.startDate}</td><td>{t.dueDate}</td><td>{days} 天</td>
                          </tr>
                      })}
                  </tbody>
              </table>
          </div>
      )
  }
  ```

- [ ] **Step 5: ProjectDetail — Tab 切换**

  ```tsx
  // src/features/projects/ProjectDetail.tsx
  import { useParams } from 'react-router-dom'
  import { useState } from 'react'
  import { useProject, useArchiveProject, useUnarchiveProject, useSoftDeleteProject } from './queries'
  import { Button } from '@/components/ui/button'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { TaskList } from '@/features/tasks/TaskList'
  import { TaskKanban } from '@/features/tasks/TaskKanban'
  import { TaskGantt } from '@/features/tasks/TaskGantt'
  import { TaskForm } from '@/features/tasks/TaskForm'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

  export function ProjectDetail() {
      const { id } = useParams()
      const pid = Number(id)
      const p = useProject(pid)
      const archive = useArchiveProject()
      const unarchive = useUnarchiveProject()
      const del = useSoftDeleteProject()
      const [openTask, setOpenTask] = useState(false)
      if (!p.data) return <div>Loading...</div>
      return (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{p.data.name}</h1>
                  {p.data.status === 'archived' && <span className="text-sm text-slate-500">已归档</span>}
                  <div className="ml-auto flex gap-2">
                      {p.data.status === 'active'
                          ? <Button variant="outline" onClick={() => archive.mutate(pid)}>归档</Button>
                          : <Button variant="outline" onClick={() => unarchive.mutate(pid)}>重启</Button>}
                      <Button variant="destructive" onClick={() => del.mutate(pid)}>删除</Button>
                      <Dialog open={openTask} onOpenChange={setOpenTask}>
                          <DialogTrigger asChild><Button>+ 任务</Button></DialogTrigger>
                          <DialogContent>
                              <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
                              <TaskForm projectId={pid} onDone={() => setOpenTask(false)} />
                          </DialogContent>
                      </Dialog>
                  </div>
              </div>

              <Tabs defaultValue="list">
                  <TabsList>
                      <TabsTrigger value="list">列表</TabsTrigger>
                      <TabsTrigger value="kanban">看板</TabsTrigger>
                      <TabsTrigger value="gantt">甘特图</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list"><TaskList projectId={pid} /></TabsContent>
                  <TabsContent value="kanban"><TaskKanban projectId={pid} /></TabsContent>
                  <TabsContent value="gantt"><TaskGantt projectId={pid} /></TabsContent>
              </Tabs>
          </div>
      )
  }
  ```

- [ ] **Step 6: `pnpm tauri dev` 手动验证**：建项目 → 进详情 → 建任务 → 切三种视图

- [ ] **Step 7: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 项目详情 + 任务三视图（占位版）"
  ```


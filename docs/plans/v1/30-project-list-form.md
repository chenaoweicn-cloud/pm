# Task 30: ProjectList + ProjectForm

**Files:**
- Create: `src/features/projects/ProjectList.tsx`、`src/features/projects/ProjectForm.tsx`

- [ ] **Step 1: ProjectForm**

  ```tsx
  // src/features/projects/ProjectForm.tsx
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { useCreateProject, useUpdateProject } from './queries'
  import type { Project } from '@/lib/types'

  export function ProjectForm({ initial, onDone }: { initial?: Project; onDone?: () => void }) {
      const [name, setName] = useState(initial?.name ?? '')
      const [type, setType] = useState(initial?.type ?? '')
      const [startDate, setStartDate] = useState(initial?.startDate ?? '')
      const [endDate, setEndDate] = useState(initial?.endDate ?? '')
      const create = useCreateProject()
      const update = useUpdateProject()

      async function submit(e: React.FormEvent) {
          e.preventDefault()
          const args = { name, type: type || null, startDate: startDate || null, endDate: endDate || null }
          if (initial) await update.mutateAsync({ id: initial.id, ...args })
          else await create.mutateAsync(args)
          onDone?.()
      }
      return (
          <form onSubmit={submit} className="space-y-3">
              <div><Label>名称 *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div><Label>类型</Label><Input value={type} onChange={e => setType(e.target.value)} placeholder="如：售前 / 实施 / 运维" /></div>
              <div><Label>开始</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><Label>结束</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              <Button type="submit" disabled={!name || create.isPending || update.isPending}>
                  {initial ? '保存' : '新建'}
              </Button>
          </form>
      )
  }
  ```

- [ ] **Step 2: ProjectList**

  ```tsx
  // src/features/projects/ProjectList.tsx
  import { useState } from 'react'
  import { Link } from 'react-router-dom'
  import { Button } from '@/components/ui/button'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
  import { useActiveProjects, useArchivedProjects } from './queries'
  import { ProjectForm } from './ProjectForm'

  export function ProjectList() {
      const [open, setOpen] = useState(false)
      const [showArchived, setShowArchived] = useState(false)
      const active = useActiveProjects()
      const archived = useArchivedProjects()

      return (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">项目</h1>
                  <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild><Button>新建项目</Button></DialogTrigger>
                      <DialogContent>
                          <DialogHeader><DialogTitle>新建项目</DialogTitle></DialogHeader>
                          <ProjectForm onDone={() => setOpen(false)} />
                      </DialogContent>
                  </Dialog>
                  <Button variant="outline" onClick={() => setShowArchived(v => !v)}>
                      {showArchived ? '隐藏归档' : '显示归档'}
                  </Button>
              </div>

              <section>
                  <h2 className="text-lg font-medium mb-2">活跃项目（{active.data?.length ?? 0}）</h2>
                  <ul className="space-y-1">
                      {active.data?.map(p => (
                          <li key={p.id}>
                              <Link to={`/projects/${p.id}`} className="underline">{p.name}</Link>
                              {p.type && <span className="ml-2 text-sm text-slate-500">[{p.type}]</span>}
                          </li>
                      ))}
                  </ul>
              </section>

              {showArchived && (
                  <section>
                      <h2 className="text-lg font-medium mb-2">归档项目（{archived.data?.length ?? 0}）</h2>
                      <ul className="space-y-1">
                          {archived.data?.map(p => (
                              <li key={p.id}>
                                  <Link to={`/projects/${p.id}`} className="underline text-slate-500">{p.name}</Link>
                              </li>
                          ))}
                      </ul>
                  </section>
              )}
          </div>
      )
  }
  ```

- [ ] **Step 3: `pnpm tauri dev`，验证：能新建项目、能看到列表、能切显/隐归档**

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 项目列表 + 新建/编辑表单（占位版）"
  ```


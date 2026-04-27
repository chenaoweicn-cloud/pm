# Task 35: TrashView

**Files:**
- Create: `src/features/trash/TrashView.tsx`

- [ ] **Step 1: 实现**

  ```tsx
  // src/features/trash/TrashView.tsx
  import { useTrash, useRestoreProject, useRestoreTask, usePurgeProject, usePurgeTask } from './queries'
  import { Button } from '@/components/ui/button'

  export function TrashView() {
      const t = useTrash()
      const rp = useRestoreProject(), rt = useRestoreTask()
      const pp = usePurgeProject(), pt = usePurgeTask()
      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">回收站</h1>
              <section>
                  <h2 className="font-medium">项目</h2>
                  {t.data?.projects.map(p =>
                      <div key={p.id} className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-xs text-slate-500">{p.deletedAt}</span>
                          <Button size="sm" variant="outline" onClick={() => rp.mutate(p.id)}>恢复</Button>
                          <Button size="sm" variant="destructive" onClick={() => confirm('彻底删除？') && pp.mutate(p.id)}>彻底删除</Button>
                      </div>)}
              </section>
              <section>
                  <h2 className="font-medium">任务</h2>
                  {t.data?.tasks.map(x =>
                      <div key={x.id} className="flex items-center gap-2">
                          <span>{x.name}</span>
                          <span className="text-xs text-slate-500">{x.deletedAt}</span>
                          <Button size="sm" variant="outline" onClick={() => rt.mutate(x.id)}>恢复</Button>
                          <Button size="sm" variant="destructive" onClick={() => confirm('彻底删除？') && pt.mutate(x.id)}>彻底删除</Button>
                      </div>)}
              </section>
          </div>
      )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 回收站视图（恢复/彻底删除）"
  ```


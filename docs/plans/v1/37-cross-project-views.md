# Task 37: 跨项目 List + Kanban

**Files:**
- Create: `src/features/tasks/CrossProjectList.tsx`、`src/features/tasks/CrossProjectKanban.tsx`
- Modify: `src/App.tsx`（加入 /all 路由）

- [ ] **Step 1: CrossProjectList**

  ```tsx
  // src/features/tasks/CrossProjectList.tsx
  import { useAllActiveTasks } from './queries'
  import { useActiveProjects } from '@/features/projects/queries'

  export function CrossProjectList() {
      const tasks = useAllActiveTasks()
      const projects = useActiveProjects()
      const name = (pid: number) => projects.data?.find(p => p.id === pid)?.name ?? `#${pid}`
      return (
          <div>
              <h1 className="text-2xl font-semibold mb-4">所有任务</h1>
              <table className="w-full text-sm">
                  <thead><tr><th>任务</th><th>项目</th><th>状态</th><th>截止</th></tr></thead>
                  <tbody>{tasks.data?.map(t => (
                      <tr key={t.id} className="border-t">
                          <td>{t.name}</td><td>{name(t.projectId)}</td><td>{t.status}</td><td>{t.dueDate ?? ''}</td>
                      </tr>
                  ))}</tbody>
              </table>
          </div>
      )
  }
  ```

- [ ] **Step 2: CrossProjectKanban — 与项目内看板结构相同，但需在卡片上显示项目名**

  用 `useAllActiveTasks + useActiveProjects`，三列按 status 过滤，卡片显示 `{project.name} · {task.name}`。

- [ ] **Step 3: 在路由加入 `/all/list` 和 `/all/kanban`，在导航栏加入入口**

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 跨项目 List + Kanban 视图"
  ```


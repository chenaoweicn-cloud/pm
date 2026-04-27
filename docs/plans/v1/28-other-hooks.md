# Task 28: 其他 Query hooks（搜索、回收站、标签、附件、项目关联、分组）

**Files:**
- Create: `src/features/search/queries.ts`、`src/features/trash/queries.ts`
- Create: `src/features/projects/relationQueries.ts`、`src/features/tasks/tagQueries.ts`、`src/features/tasks/attachmentQueries.ts`、`src/features/tasks/groupQueries.ts`

- [ ] **Step 1: 搜索**

  ```typescript
  // src/features/search/queries.ts
  import { useQuery } from '@tanstack/react-query'
  import * as api from '@/lib/api'

  export const useSearch = (query: string) =>
    useQuery({
      queryKey: ['search', query],
      queryFn: () => api.searchAll(query),
      enabled: query.trim().length > 0,
    })
  ```

- [ ] **Step 2: 回收站**

  ```typescript
  // src/features/trash/queries.ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import * as api from '@/lib/api'

  export const useTrash = () => useQuery({ queryKey: ['trash'], queryFn: api.listTrash })

  export function useRestoreProject() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.restoreProject, onSuccess: () => qc.invalidateQueries() })
  }
  export function useRestoreTask() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.restoreTask, onSuccess: () => qc.invalidateQueries() })
  }
  export function usePurgeProject() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.purgeProject, onSuccess: () => qc.invalidateQueries() })
  }
  export function usePurgeTask() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.purgeTask, onSuccess: () => qc.invalidateQueries() })
  }
  ```

- [ ] **Step 3: 关联/标签/附件/分组** — 模式相同，逐个包装 `api.ts` 里对应函数。参考 Step 1-2 的写法，每个文件 ~30 行。

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 搜索/回收站/标签/附件/分组/关联 Query hooks"
  ```


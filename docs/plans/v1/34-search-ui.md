# Task 34: GlobalSearch（Cmd+K）

**Files:**
- Create: `src/features/search/GlobalSearch.tsx`
- Modify: `src/App.tsx`（全局快捷键）

- [ ] **Step 1: GlobalSearch 页面版**

  ```tsx
  // src/features/search/GlobalSearch.tsx
  import { useState } from 'react'
  import { Link } from 'react-router-dom'
  import { Input } from '@/components/ui/input'
  import { useSearch } from './queries'

  export function GlobalSearch() {
      const [q, setQ] = useState('')
      const r = useSearch(q)
      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">搜索</h1>
              <Input autoFocus placeholder="搜项目 / 任务名 / 任务描述…" value={q} onChange={e => setQ(e.target.value)} />
              {q && (
                  <div className="space-y-3">
                      <section>
                          <h2 className="font-medium">项目（{r.data?.projects.length ?? 0}）</h2>
                          <ul>{r.data?.projects.map(p =>
                              <li key={p.id}><Link to={`/projects/${p.id}`} className="underline">{p.name}</Link></li>)}</ul>
                      </section>
                      <section>
                          <h2 className="font-medium">任务（{r.data?.tasks.length ?? 0}）</h2>
                          <ul>{r.data?.tasks.map(t =>
                              <li key={t.id}><Link to={`/projects/${t.projectId}`} className="underline">{t.name}</Link></li>)}</ul>
                      </section>
                  </div>
              )}
          </div>
      )
  }
  ```

- [ ] **Step 2: Cmd+K 快捷键导航到 /search**

  在 `src/App.tsx` 内加一个 `useEffect`：

  ```tsx
  import { useEffect } from 'react'
  import { useNavigate, Routes, Route } from 'react-router-dom'
  // ...
  export default function App() {
      const navigate = useNavigate()
      useEffect(() => {
          const fn = (e: KeyboardEvent) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                  e.preventDefault(); navigate('/search')
              }
          }
          window.addEventListener('keydown', fn)
          return () => window.removeEventListener('keydown', fn)
      }, [navigate])
      return <Routes>...</Routes>
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 全局搜索页 + Cmd+K 快捷键"
  ```


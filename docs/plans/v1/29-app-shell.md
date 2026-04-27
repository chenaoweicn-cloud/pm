# Task 29: 占位外壳 + 路由

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: AppShell — 最简左导航**

  ```tsx
  // src/components/layout/AppShell.tsx
  import { NavLink, Outlet } from 'react-router-dom'

  const navItems = [
    { to: '/', label: '今日' },
    { to: '/projects', label: '项目' },
    { to: '/history', label: '历史回顾' },
    { to: '/search', label: '搜索' },
    { to: '/trash', label: '回收站' },
    { to: '/settings', label: '设置' },
  ]

  export function AppShell() {
    return (
      <div className="flex h-screen">
        <nav className="w-48 border-r p-2 space-y-1">
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) =>
              `block px-3 py-2 rounded ${isActive ? 'bg-slate-200' : 'hover:bg-slate-100'}`
            }>{n.label}</NavLink>
          ))}
        </nav>
        <main className="flex-1 overflow-auto p-6"><Outlet /></main>
      </div>
    )
  }
  ```

- [ ] **Step 2: 路由**

  ```tsx
  // src/App.tsx
  import { Routes, Route } from 'react-router-dom'
  import { AppShell } from '@/components/layout/AppShell'
  import { TodayView } from '@/features/today/TodayView'
  import { ProjectList } from '@/features/projects/ProjectList'
  import { ProjectDetail } from '@/features/projects/ProjectDetail'
  import { HistoryView } from '@/features/history/HistoryView'
  import { GlobalSearch } from '@/features/search/GlobalSearch'
  import { TrashView } from '@/features/trash/TrashView'
  import { SettingsView } from '@/features/settings/SettingsView'

  export default function App() {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayView />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="trash" element={<TrashView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    )
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 占位外壳 + 路由（布局临时，待设计稿替换）"
  ```


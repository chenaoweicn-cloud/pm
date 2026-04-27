# Task 25: TanStack Query 配置 + 日期工具

**Files:**
- Create: `src/lib/queryClient.ts`、扩展 `src/lib/date.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: QueryClient 配置**

  ```typescript
  // src/lib/queryClient.ts
  import { QueryClient } from '@tanstack/react-query'
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5_000, refetchOnWindowFocus: false },
    },
  })
  ```

- [ ] **Step 2: 扩展日期工具**

  追加到 `src/lib/date.ts`：

  ```typescript
  export function todayIso(): string { return isoDate(new Date()) }

  export function thisWeekRange(): { start: string; endExclusive: string } {
    const now = new Date()
    const day = now.getDay() || 7  // 周日=7，做到周一开始
    const start = new Date(now); start.setDate(now.getDate() - day + 1); start.setHours(0,0,0,0)
    const end = new Date(start); end.setDate(start.getDate() + 7)
    return { start: isoDate(start), endExclusive: isoDate(end) }
  }

  export function thisMonthRange(): { start: string; endExclusive: string } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start: isoDate(start), endExclusive: isoDate(end) }
  }
  ```

- [ ] **Step 3: 在 `src/main.tsx` 挂载 Provider**

  ```tsx
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import { QueryClientProvider } from '@tanstack/react-query'
  import { BrowserRouter } from 'react-router-dom'
  import App from './App'
  import { queryClient } from './lib/queryClient'
  import './index.css'

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  )
  ```

- [ ] **Step 4: 添加日期工具的单测**

  ```typescript
  // 在 src/lib/date.test.ts 追加
  import { thisWeekRange, thisMonthRange, todayIso } from './date'

  describe('week/month range', () => {
    it('week range starts on Monday', () => {
      const r = thisWeekRange()
      expect(r.start <= r.endExclusive).toBe(true)
      expect(new Date(r.start).getDay()).toBe(1)
    })
    it('month range starts on 1st', () => {
      const r = thisMonthRange()
      expect(r.start.endsWith('-01')).toBe(true)
    })
    it('todayIso returns YYYY-MM-DD', () => {
      expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
  ```

- [ ] **Step 5: 运行测试**

  ```bash
  pnpm test:run
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): QueryClient + 日期工具（区间/today）"
  ```


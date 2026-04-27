# Task 5: 配置 Vitest 测试环境

**Files:**
- Create: `vitest.config.ts`、`src/test/setup.ts`
- Modify: `package.json`（添加 test 脚本）
- Create: `src/lib/date.ts` 和 `src/lib/date.test.ts`（作为首个 smoke test）

- [ ] **Step 1: 创建 `vitest.config.ts`**

  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'node:path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  })
  ```

- [ ] **Step 2: 创建 `src/test/setup.ts`**

  ```typescript
  import '@testing-library/jest-dom/vitest'
  ```

- [ ] **Step 3: 在 `package.json` 的 scripts 中加入**

  ```json
  "test": "vitest",
  "test:run": "vitest run"
  ```

- [ ] **Step 4: 写一个最简 smoke test**

  创建 `src/lib/date.ts`：

  ```typescript
  export function isoDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  ```

  创建 `src/lib/date.test.ts`：

  ```typescript
  import { describe, it, expect } from 'vitest'
  import { isoDate } from './date'

  describe('isoDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(isoDate(new Date(2026, 3, 23))).toBe('2026-04-23')
    })
  })
  ```

- [ ] **Step 5: 运行测试**

  ```bash
  pnpm test:run
  ```

  Expected: 1 test passed。

- [ ] **Step 6: Commit**

  ```bash
  git add -A
  git commit -m "chore: 配置 Vitest 测试环境 + smoke test"
  ```


# Task 3: 配置 Tailwind CSS

**Files:**
- Create: `tailwind.config.ts`、`postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: 初始化 Tailwind**

  ```bash
  cd ~/Desktop/pm
  npx tailwindcss init -p --ts
  ```

- [ ] **Step 2: 配置 `tailwind.config.ts`**

  ```typescript
  import type { Config } from 'tailwindcss'

  export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: { extend: {} },
    plugins: [],
  } satisfies Config
  ```

- [ ] **Step 3: 覆写 `src/index.css`**

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  }

  html, body, #root {
    height: 100%;
  }
  ```

- [ ] **Step 4: 验证 Tailwind 生效**

  在 `src/App.tsx` 中把默认 class 改一个 Tailwind 类（如 `class="text-red-500"`），运行 `pnpm tauri dev` 确认样式生效，然后还原。

- [ ] **Step 5: Commit**

  ```bash
  git add -A
  git commit -m "chore: 配置 Tailwind CSS"
  ```


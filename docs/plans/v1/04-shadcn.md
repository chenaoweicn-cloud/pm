# Task 4: 集成 shadcn/ui 基础组件

**Files:**
- Create: `components.json`
- Create: `src/components/ui/` 下若干组件文件
- Modify: `tailwind.config.ts`、`src/index.css`、`src/lib/utils.ts`（或 `cn.ts`）

- [ ] **Step 1: 初始化 shadcn/ui**

  ```bash
  cd ~/Desktop/pm
  pnpm dlx shadcn@latest init
  ```

  交互选择：
  - Style: default
  - Base color: slate
  - CSS variables: yes
  - 其他默认

- [ ] **Step 2: 安装常用组件**

  ```bash
  pnpm dlx shadcn@latest add button input label textarea dialog select checkbox badge card dropdown-menu separator scroll-area tabs toast sonner
  ```

- [ ] **Step 3: 验证 Button 渲染**

  在 `src/App.tsx` 中临时引入并渲染 `<Button>`，确认无编译错误、界面正常显示。

- [ ] **Step 4: Commit**

  ```bash
  git add -A
  git commit -m "chore: 集成 shadcn/ui 组件库"
  ```


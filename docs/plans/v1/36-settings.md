# Task 36: SettingsView + ExportDialog

**Files:**
- Create: `src/features/settings/SettingsView.tsx`、`src/features/export/ExportDialog.tsx`

- [ ] **Step 1: SettingsView — 备份 + 导出入口**

  ```tsx
  // src/features/settings/SettingsView.tsx
  import { useEffect, useState } from 'react'
  import { Button } from '@/components/ui/button'
  import * as api from '@/lib/api'
  import { save } from '@tauri-apps/plugin-dialog'
  import { thisMonthRange } from '@/lib/date'

  export function SettingsView() {
      const [backupDir, setBackupDir] = useState('')
      const [msg, setMsg] = useState('')
      useEffect(() => { api.getDefaultBackupDir().then(setBackupDir) }, [])

      async function onBackup() {
          const p = await api.backupNow()
          setMsg(`已备份到 ${p}`)
      }
      async function onExportJson() {
          const path = await save({ defaultPath: 'pm-export.json', filters: [{ name: 'JSON', extensions: ['json'] }] })
          if (!path) return
          await api.exportJson({ outputPath: path })
          setMsg(`已导出 JSON 到 ${path}`)
      }
      async function onExportMd() {
          const path = await save({ defaultPath: 'pm-this-month.md', filters: [{ name: 'Markdown', extensions: ['md'] }] })
          if (!path) return
          const { start, endExclusive } = thisMonthRange()
          await api.exportMarkdown({ outputPath: path, start, endExclusive })
          setMsg(`已导出本月 Markdown 到 ${path}`)
      }

      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">设置</h1>
              <section>
                  <h2 className="font-medium mb-2">备份</h2>
                  <p className="text-sm text-slate-500">默认目录：{backupDir}</p>
                  <Button onClick={onBackup}>立即备份</Button>
              </section>
              <section>
                  <h2 className="font-medium mb-2">导出</h2>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={onExportJson}>导出全部 JSON</Button>
                      <Button variant="outline" onClick={onExportMd}>导出本月 Markdown</Button>
                  </div>
              </section>
              {msg && <p className="text-sm text-green-700">{msg}</p>}
          </div>
      )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 设置页（备份 + 导出入口）"
  ```


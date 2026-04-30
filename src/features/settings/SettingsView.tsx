import { useEffect, useState } from 'react'
import { S } from '@/design/tokens'
import * as api from '@/lib/api'
import { thisMonthRange } from '@/lib/date'

const sectionLabel: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: S.fgMuted,
  letterSpacing: 0.6,
  textTransform: 'uppercase' as const,
  paddingLeft: 0,
  marginBottom: 8,
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: S.fgMuted,
  marginBottom: 4,
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  border: S.hairline,
  borderRadius: S.inputRadius,
  padding: '7px 10px',
  fontSize: 13,
  width: '100%',
  fontFamily: S.font,
  background: S.bg,
  color: S.fg,
  outline: 'none',
  minWidth: 0,
}

const DEFAULT_JSON_PATH = '~/Documents/pm-export.json'
const DEFAULT_MD_PATH = '~/Documents/pm-this-month.md'

function deriveExportBaseDir(backupDir: string) {
  if (!backupDir) return null
  const normalized = backupDir.replace(/\/+$/, '')
  if (normalized.endsWith('/pm-backups')) {
    return normalized.slice(0, -'/pm-backups'.length)
  }
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash > 0 ? normalized.slice(0, lastSlash) : null
}

export function SettingsView() {
  const [backupDir, setBackupDir] = useState<string>('')
  const [jsonPath, setJsonPath] = useState(DEFAULT_JSON_PATH)
  const [mdPath, setMdPath] = useState(DEFAULT_MD_PATH)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api
      .getDefaultBackupDir()
      .then((dir) => {
        setBackupDir(dir)
        const exportBaseDir = deriveExportBaseDir(dir)
        if (!exportBaseDir) return
        setJsonPath((current) =>
          current === DEFAULT_JSON_PATH ? `${exportBaseDir}/pm-export.json` : current,
        )
        setMdPath((current) =>
          current === DEFAULT_MD_PATH ? `${exportBaseDir}/pm-this-month.md` : current,
        )
      })
      .catch(() => setBackupDir('（获取失败）'))
  }, [])

  async function handleBackup() {
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const result = await api.backupNow()
      setMsg('已备份到 ' + result)
    } catch (e) {
      console.error(e)
      setErr('备份失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportJson() {
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const result = await api.exportJson({ outputPath: jsonPath })
      setMsg('已导出到 ' + result)
    } catch (e) {
      console.error(e)
      setErr('导出失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportMarkdown() {
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const { start, endExclusive } = thisMonthRange()
      const result = await api.exportMarkdown({ outputPath: mdPath, start, endExclusive })
      setMsg('已导出到 ' + result)
    } catch (e) {
      console.error(e)
      setErr('导出失败')
    } finally {
      setLoading(false)
    }
  }

  const btnStyle: React.CSSProperties = {
    background: S.accent,
    color: '#fff',
    border: 'none',
    borderRadius: S.inputRadius,
    padding: '8px 20px',
    fontSize: 13,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    fontFamily: S.font,
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: S.contentPad }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
      <div style={{ fontSize: S.heroSize, fontWeight: S.heroWeight, marginBottom: 24 }}>
        设置
      </div>

      {/* 备份区块 */}
      <div style={{ marginBottom: 32 }}>
        <div style={sectionLabel}>数据备份</div>
        <div style={{ fontSize: 12, color: S.fgMuted, marginBottom: 12 }}>
          默认目录：{backupDir || '加载中…'}
        </div>
        <button disabled={loading} onClick={handleBackup} style={btnStyle}>
          立即备份
        </button>
      </div>

      {/* 导出区块 */}
      <div style={{ marginBottom: 32 }}>
        <div style={sectionLabel}>数据导出</div>

        {/* 导出 JSON */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="json-path" style={labelStyle}>输出路径</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              id="json-path"
              style={inputStyle}
              value={jsonPath}
              onChange={e => setJsonPath(e.target.value)}
            />
            <button disabled={loading} onClick={handleExportJson} style={btnStyle}>
              导出 JSON
            </button>
          </div>
        </div>

        {/* 导出本月 Markdown */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="md-path" style={labelStyle}>输出路径</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              id="md-path"
              style={inputStyle}
              value={mdPath}
              onChange={e => setMdPath(e.target.value)}
            />
            <button disabled={loading} onClick={handleExportMarkdown} style={btnStyle}>
              导出本月 Markdown
            </button>
          </div>
        </div>
      </div>

      {/* 反馈提示 */}
      {msg && (
        <div style={{ color: S.success, fontSize: 12 }}>{msg}</div>
      )}
      {err && (
        <div style={{ color: S.warn, fontSize: 12 }}>{err}</div>
      )}
      </div>
    </div>
  )
}

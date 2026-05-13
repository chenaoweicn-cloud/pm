import { useEffect, useState } from 'react'
import { S } from '@/design/tokens'
import * as api from '@/lib/api'
import { thisMonthRange } from '@/lib/date'
import { AiModelSettings } from '@/features/ai/AiModelSettings'

export type SettingsSection = 'ai' | 'backup' | 'export' | 'paths'

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

interface Props {
  section: SettingsSection
}

export function SettingsView({ section }: Props) {
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

  let body: React.ReactNode = null

  if (section === 'ai') {
    body = <AiModelSettings />
  } else if (section === 'backup') {
    body = (
      <section>
        <div style={{ fontSize: 18, fontWeight: 700, color: S.fg, marginBottom: 4 }}>
          数据备份
        </div>
        <div style={{ fontSize: 12, color: S.fgMuted, lineHeight: 1.6, marginBottom: 18 }}>
          手动创建一份当前数据库备份，默认备份目录由桌面应用自动管理。
        </div>
        <div style={sectionLabel}>默认目录</div>
        <div
          style={{
            border: S.hairline,
            borderRadius: 8,
            background: '#FFFEFC',
            padding: '11px 12px',
            fontSize: 13,
            color: S.fg,
            marginBottom: 14,
            wordBreak: 'break-all',
          }}
        >
          {backupDir || '加载中…'}
        </div>
        <button disabled={loading} onClick={handleBackup} style={btnStyle}>
          立即备份
        </button>
      </section>
    )
  } else if (section === 'export') {
    body = (
      <section>
        <div style={{ fontSize: 18, fontWeight: 700, color: S.fg, marginBottom: 4 }}>
          数据导出
        </div>
        <div style={{ fontSize: 12, color: S.fgMuted, lineHeight: 1.6, marginBottom: 18 }}>
          将当前数据导出为 JSON 或本月 Markdown。输出路径可在“输出路径”中调整。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ExportAction
            title="完整 JSON"
            path={jsonPath}
            buttonLabel="导出 JSON"
            loading={loading}
            onClick={handleExportJson}
          />
          <ExportAction
            title="本月 Markdown"
            path={mdPath}
            buttonLabel="导出本月 Markdown"
            loading={loading}
            onClick={handleExportMarkdown}
          />
        </div>
      </section>
    )
  } else {
    body = (
      <section>
        <div style={{ fontSize: 18, fontWeight: 700, color: S.fg, marginBottom: 4 }}>
          输出路径
        </div>
        <div style={{ fontSize: 12, color: S.fgMuted, lineHeight: 1.6, marginBottom: 18 }}>
          设置导出文件的默认保存位置。路径会在当前应用会话中用于后续导出。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="json-path" style={labelStyle}>JSON 输出路径</label>
            <input
              id="json-path"
              style={inputStyle}
              value={jsonPath}
              onChange={e => setJsonPath(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="md-path" style={labelStyle}>Markdown 输出路径</label>
            <input
              id="md-path"
              style={inputStyle}
              value={mdPath}
              onChange={e => setMdPath(e.target.value)}
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: S.contentPad }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        <div style={{ fontSize: S.heroSize, fontWeight: S.heroWeight, marginBottom: 24 }}>
          设置
        </div>
        <div
          style={{
            background: S.cardBg,
            border: S.cardBorder,
            borderRadius: 12,
            boxShadow: S.cardShadow,
            padding: '22px 24px',
          }}
        >
          {body}
        </div>
        {msg && (
          <div style={{ color: S.success, fontSize: 12, marginTop: 14 }}>{msg}</div>
        )}
        {err && (
          <div style={{ color: S.warn, fontSize: 12, marginTop: 14 }}>{err}</div>
        )}
      </div>
    </div>
  )
}

function ExportAction({
  title,
  path,
  buttonLabel,
  loading,
  onClick,
}: {
  title: string
  path: string
  buttonLabel: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <div
      style={{
        border: S.hairline,
        borderRadius: 9,
        background: '#FFFEFC',
        padding: 14,
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: S.fg }}>{title}</div>
        <div style={{ fontSize: 12, color: S.fgMuted, marginTop: 5, wordBreak: 'break-all' }}>
          {path}
        </div>
      </div>
      <button
        disabled={loading}
        onClick={onClick}
        style={{
          background: S.accent,
          color: '#fff',
          border: 'none',
          borderRadius: S.inputRadius,
          padding: '8px 14px',
          fontSize: 13,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: S.font,
          flexShrink: 0,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

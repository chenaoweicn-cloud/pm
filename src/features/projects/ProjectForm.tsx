import { useEffect, useRef, useState } from 'react'
import { S } from '@/design/tokens'
import { useCreateProject } from './queries'

interface Props {
  onClose: () => void
}

export function ProjectForm({ onClose }: Props) {
  const createProject = useCreateProject()

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (createProject.isPending) return
    if (!name.trim()) return

    createProject.mutate(
      {
        name: name.trim(),
        type: type.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      { onSuccess: () => onClose() },
    )
  }

  const inputStyle: React.CSSProperties = {
    border: S.hairline,
    borderRadius: S.inputRadius,
    padding: '7px 10px',
    fontSize: 13,
    fontFamily: S.font,
    background: S.bg,
    color: S.fg,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: S.fgMuted,
    marginBottom: 4,
    display: 'block',
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: S.cardBg,
          borderRadius: S.cardRadius,
          border: S.cardBorder,
          padding: '28px 32px',
          width: 480,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: S.fg, marginBottom: 4 }}>
          新建项目
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 项目名称 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>项目名称 *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入项目名称…"
              required
              style={inputStyle}
            />
          </div>

          {/* 类型 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>类型</label>
            <input
              type="text"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="如：售前 / 实施 / 运维"
              style={inputStyle}
            />
          </div>

          {/* 开始日期 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 结束日期 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                color: S.fgMuted,
                border: S.hairline,
                borderRadius: S.inputRadius,
                padding: '8px 16px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: S.font,
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              style={{
                background: S.accent,
                color: '#fff',
                border: 'none',
                borderRadius: S.inputRadius,
                padding: '8px 20px',
                fontSize: 13,
                cursor: createProject.isPending ? 'not-allowed' : 'pointer',
                fontFamily: S.font,
                opacity: createProject.isPending ? 0.7 : 1,
              }}
            >
              {createProject.isPending ? '创建中…' : '创建项目'}
            </button>
          </div>
          {createProject.isError && (
            <p style={{ fontSize: 12, color: S.warn, marginTop: 4 }}>
              创建失败，请重试
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

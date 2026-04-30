import { useEffect, useId, useRef, useState } from 'react'
import { S } from '@/design/tokens'
import type { Project } from '@/lib/types'
import { useCreateProject, useUpdateProject } from './queries'

interface Props {
  initialProject?: Project | null
  onClose: () => void
}

export function ProjectForm({ initialProject, onClose }: Props) {
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const isEditing = initialProject != null

  const [name, setName] = useState(initialProject?.name ?? '')
  const [type, setType] = useState(initialProject?.type ?? '')
  const [startDate, setStartDate] = useState(initialProject?.startDate ?? '')
  const [endDate, setEndDate] = useState(initialProject?.endDate ?? '')
  const fieldPrefix = useId()

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
    if (createProject.isPending || updateProject.isPending) return
    if (!name.trim()) return

    const payload = {
      name: name.trim(),
      type: type.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
    }

    if (isEditing && initialProject) {
      updateProject.mutate({ id: initialProject.id, ...payload }, { onSuccess: () => onClose() })
    } else {
      createProject.mutate(payload, { onSuccess: () => onClose() })
    }
  }

  const isPending = createProject.isPending || updateProject.isPending
  const isError = createProject.isError || updateProject.isError

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
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldPrefix}-title`}
        style={{
          background: S.cardBg,
          borderRadius: S.cardRadius,
          border: S.cardBorder,
          padding: '28px 32px',
          width: 480,
          maxWidth: '90vw',
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          id={`${fieldPrefix}-title`}
          style={{ fontSize: 16, fontWeight: 600, color: S.fg, marginBottom: 4 }}
        >
          {isEditing ? '编辑项目' : '新建项目'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 项目名称 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-name`} style={labelStyle}>项目名称 *</label>
            <input
              id={`${fieldPrefix}-name`}
              name="projectName"
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入项目名称…"
              required
              aria-label="项目名称"
              style={inputStyle}
            />
          </div>

          {/* 类型 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-type`} style={labelStyle}>类型</label>
            <input
              id={`${fieldPrefix}-type`}
              name="projectType"
              type="text"
              value={type}
              onChange={e => setType(e.target.value)}
              placeholder="如：售前 / 实施 / 运维"
              aria-label="项目类型"
              style={inputStyle}
            />
          </div>

          {/* 开始日期 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-start-date`} style={labelStyle}>开始日期</label>
            <input
              id={`${fieldPrefix}-start-date`}
              name="projectStartDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              aria-label="项目开始日期"
              style={inputStyle}
            />
          </div>

          {/* 结束日期 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-end-date`} style={labelStyle}>结束日期</label>
            <input
              id={`${fieldPrefix}-end-date`}
              name="projectEndDate"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              aria-label="项目结束日期"
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
              disabled={isPending}
              style={{
                background: S.accent,
                color: '#fff',
                border: 'none',
                borderRadius: S.inputRadius,
                padding: '8px 20px',
                fontSize: 13,
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: S.font,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? (isEditing ? '保存中…' : '创建中…') : (isEditing ? '保存修改' : '创建项目')}
            </button>
          </div>
          {isError && (
            <p style={{ fontSize: 12, color: S.warn, marginTop: 4 }}>
              {isEditing ? '保存失败，请重试' : '创建失败，请重试'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

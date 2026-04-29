import { useEffect, useRef, useState } from 'react'
import { S } from '@/design/tokens'
import type { Priority, TaskInputDto } from '@/lib/types'
import { useActiveProjects } from '@/features/projects/queries'
import { useCreateTask } from '@/features/tasks/queries'

interface Props {
  projectId?: number | null
  onClose: () => void
}

export function TaskForm({ projectId, onClose }: Props) {
  const { data: projects = [] } = useActiveProjects()
  const createTask = useCreateTask()

  const defaultProjectId = projectId ?? (projects[0]?.id ?? 0)
  const [name, setName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<number>(defaultProjectId)
  const [priority, setPriority] = useState<Priority | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  // Only pre-select project on first initialization; never overwrite user's choice on refetch
  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current) return
    if (projectId != null) {
      setSelectedProjectId(projectId)
      initializedRef.current = true
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id)
      initializedRef.current = true
    }
  }, [projectId, projects])

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
    if (createTask.isPending) return
    if (!name.trim() || selectedProjectId === 0) return

    const input: TaskInputDto = {
      projectId: selectedProjectId,
      name: name.trim(),
      priority: priority !== '' ? priority : null,
      dueDate: dueDate || null,
      description: description.trim() || null,
    }

    createTask.mutate(input, { onSuccess: () => onClose() })
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
          新建任务
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 任务名 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>任务名称 *</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入任务名称…"
              required
              style={inputStyle}
            />
          </div>

          {/* 所属项目 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>所属项目 *</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
              required
              style={inputStyle}
            >
              {projects.length === 0 && (
                <option value={0} disabled>暂无项目</option>
              )}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 优先级 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>优先级</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority | '')}
              style={inputStyle}
            >
              <option value="">无</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          {/* 截止日期 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 描述 */}
          <div style={fieldStyle}>
            <label style={labelStyle}>描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="添加任务描述…"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 72,
              }}
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
              disabled={createTask.isPending}
              style={{
                background: S.accent,
                color: '#fff',
                border: 'none',
                borderRadius: S.inputRadius,
                padding: '8px 20px',
                fontSize: 13,
                cursor: createTask.isPending ? 'not-allowed' : 'pointer',
                fontFamily: S.font,
                opacity: createTask.isPending ? 0.7 : 1,
              }}
            >
              {createTask.isPending ? '创建中…' : '创建任务'}
            </button>
          </div>
          {createTask.isError && (
            <p style={{ fontSize: 12, color: S.warn, marginTop: 4 }}>
              创建失败，请重试
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

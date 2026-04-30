import { useEffect, useId, useRef, useState } from 'react'
import { S } from '@/design/tokens'
import type { Priority, Task, TaskInputDto } from '@/lib/types'
import { useActiveProjects } from '@/features/projects/queries'
import { useCreateTask, useTasksForProject, useUpdateTask } from '@/features/tasks/queries'
import { useAttachTag, useDetachTag, useTags, useTagsForTask, useUpsertTag } from '@/features/tasks/tagQueries'

interface Props {
  projectId?: number | null
  initialTask?: Task | null
  onClose: () => void
}

export function TaskForm({ projectId, initialTask, onClose }: Props) {
  const { data: projects = [] } = useActiveProjects()
  const { data: availableTags = [] } = useTags()
  const { data: currentTags = [] } = useTagsForTask(initialTask?.id ?? null)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const attachTag = useAttachTag()
  const detachTag = useDetachTag()
  const upsertTag = useUpsertTag()
  const isEditing = initialTask != null

  const defaultProjectId = initialTask?.projectId ?? projectId ?? (projects[0]?.id ?? 0)
  const [name, setName] = useState(initialTask?.name ?? '')
  const [selectedProjectId, setSelectedProjectId] = useState<number>(defaultProjectId)
  const { data: projectTasks = [] } = useTasksForProject(selectedProjectId || null)
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<number | ''>(initialTask?.parentTaskId ?? '')
  const [priority, setPriority] = useState<Priority | ''>(initialTask?.priority ?? '')
  const [startDate, setStartDate] = useState(initialTask?.startDate ?? '')
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? '')
  const [description, setDescription] = useState(initialTask?.description ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [newTagName, setNewTagName] = useState('')
  const fieldPrefix = useId()

  // Only pre-select project on first initialization; never overwrite user's choice on refetch
  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current) return
    if (initialTask != null) {
      setSelectedProjectId(initialTask.projectId)
      initializedRef.current = true
    } else if (projectId != null) {
      setSelectedProjectId(projectId)
      initializedRef.current = true
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id)
      initializedRef.current = true
    }
  }, [initialTask, projectId, projects])

  useEffect(() => {
    setSelectedTagIds(currentTags.map(tag => tag.id))
  }, [currentTags])

  useEffect(() => {
    if (selectedParentTaskId === '') return
    if (projectTasks.some(task => task.id === selectedParentTaskId && task.parentTaskId == null)) return
    setSelectedParentTaskId('')
  }, [projectTasks, selectedParentTaskId])

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

  const syncTags = async (taskId: number) => {
    const existingIds = currentTags.map(tag => tag.id)
    const toAttach = selectedTagIds.filter(id => !existingIds.includes(id))
    const toDetach = existingIds.filter(id => !selectedTagIds.includes(id))

    await Promise.all(toAttach.map(tagId => attachTag.mutateAsync({ taskId, tagId })))
    await Promise.all(toDetach.map(tagId => detachTag.mutateAsync({ taskId, tagId })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (createTask.isPending || updateTask.isPending) return
    if (!name.trim() || selectedProjectId === 0) return

    const input: TaskInputDto = {
      projectId: selectedProjectId,
      name: name.trim(),
      groupId: initialTask?.groupId ?? null,
      parentTaskId: selectedParentTaskId === '' ? null : selectedParentTaskId,
      priority: priority !== '' ? priority : null,
      startDate: startDate || null,
      dueDate: dueDate || null,
      estimateHours: initialTask?.estimateHours ?? null,
      description: description.trim() || null,
    }

    try {
      if (isEditing && initialTask) {
        await updateTask.mutateAsync({ id: initialTask.id, input })
        await syncTags(initialTask.id)
      } else {
        const created = await createTask.mutateAsync(input)
        if (selectedTagIds.length > 0) {
          await Promise.all(selectedTagIds.map(tagId => attachTag.mutateAsync({ taskId: created.id, tagId })))
        }
      }
      onClose()
    } catch {
      // Mutation states drive the inline error UI.
    }
  }

  const isPending =
    createTask.isPending ||
    updateTask.isPending ||
    attachTag.isPending ||
    detachTag.isPending ||
    upsertTag.isPending
  const isError =
    createTask.isError ||
    updateTask.isError ||
    attachTag.isError ||
    detachTag.isError ||
    upsertTag.isError

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

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(ids =>
      ids.includes(tagId) ? ids.filter(id => id !== tagId) : [...ids, tagId],
    )
  }

  const parentOptions = projectTasks.filter(task =>
    task.parentTaskId == null && task.id !== initialTask?.id,
  )

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    try {
      const created = await upsertTag.mutateAsync(name)
      setSelectedTagIds(ids => (ids.includes(created.id) ? ids : [...ids, created.id]))
      setNewTagName('')
    } catch {
      // Mutation state drives the inline error UI.
    }
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
          {isEditing ? '编辑任务' : '新建任务'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 任务名 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-name`} style={labelStyle}>任务名称 *</label>
            <input
              id={`${fieldPrefix}-name`}
              name="taskName"
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入任务名称…"
              required
              aria-label="任务名称"
              style={inputStyle}
            />
          </div>

          {/* 所属项目 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-project`} style={labelStyle}>所属项目 *</label>
            <select
              id={`${fieldPrefix}-project`}
              name="taskProject"
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(Number(e.target.value))
                setSelectedParentTaskId('')
              }}
              required
              aria-label="所属项目"
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

          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-parent-task`} style={labelStyle}>父任务</label>
            <select
              id={`${fieldPrefix}-parent-task`}
              name="parentTask"
              value={selectedParentTaskId}
              onChange={e => setSelectedParentTaskId(e.target.value ? Number(e.target.value) : '')}
              aria-label="父任务"
              style={inputStyle}
            >
              <option value="">无</option>
              {parentOptions.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          {/* 优先级 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-priority`} style={labelStyle}>优先级</label>
            <select
              id={`${fieldPrefix}-priority`}
              name="taskPriority"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority | '')}
              aria-label="任务优先级"
              style={inputStyle}
            >
              <option value="">无</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label htmlFor={`${fieldPrefix}-start-date`} style={labelStyle}>开始日期</label>
              <input
                id={`${fieldPrefix}-start-date`}
                name="taskStartDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                aria-label="任务开始日期"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label htmlFor={`${fieldPrefix}-due-date`} style={labelStyle}>截止日期</label>
              <input
                id={`${fieldPrefix}-due-date`}
                name="taskDueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                aria-label="任务截止日期"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 描述 */}
          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-description`} style={labelStyle}>描述</label>
            <textarea
              id={`${fieldPrefix}-description`}
              name="taskDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="添加任务描述…"
              aria-label="任务描述"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 72,
              }}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor={`${fieldPrefix}-new-tag`} style={labelStyle}>标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availableTags.length === 0 && (
                <span style={{ fontSize: 12, color: S.fgMuted, fontStyle: 'italic' }}>
                  还没有标签，下面可以新建
                </span>
              )}
              {availableTags.map(tag => {
                const active = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    style={{
                      border: active ? 'none' : S.hairline,
                      background: active ? S.accentSoft : 'transparent',
                      color: active ? S.accent : S.fgMuted,
                      borderRadius: 999,
                      padding: '5px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: S.font,
                    }}
                  >
                    #{tag.name}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <input
                id={`${fieldPrefix}-new-tag`}
                name="newTagName"
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleCreateTag()
                  }
                }}
                placeholder="新建标签，如 urgent"
                aria-label="新建标签"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => void handleCreateTag()}
                disabled={upsertTag.isPending}
                style={{
                  background: 'transparent',
                  color: S.fgMuted,
                  border: S.hairline,
                  borderRadius: S.inputRadius,
                  padding: '8px 14px',
                  fontSize: 13,
                  cursor: upsertTag.isPending ? 'not-allowed' : 'pointer',
                  fontFamily: S.font,
                  opacity: upsertTag.isPending ? 0.6 : 1,
                }}
              >
                添加标签
              </button>
            </div>
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
              {isPending ? (isEditing ? '保存中…' : '创建中…') : (isEditing ? '保存修改' : '创建任务')}
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

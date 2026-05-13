import { useEffect, useState } from 'react'
import { S } from '@/design/tokens'
import type { AiInboxItem, Priority, TaskInputDto } from '@/lib/types'
import { useActiveProjects } from '@/features/projects/queries'
import { projectColorFor } from '@/lib/projectColor'
import { useAiInboxItems, useConvertAiInboxItem, useDismissAiInboxItem } from './queries'

const priorityLabel: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const inputStyle: React.CSSProperties = {
  border: S.hairline,
  borderRadius: 7,
  padding: '7px 9px',
  fontSize: 12,
  fontFamily: S.font,
  background: '#FFFEFC',
  color: S.fg,
  outline: 'none',
  boxSizing: 'border-box',
}

interface Draft {
  projectId: number | ''
  name: string
  description: string
  priority: Priority | ''
  startDate: string
  dueDate: string
}

function draftFromItem(item: AiInboxItem): Draft {
  return {
    projectId: item.projectCandidateId ?? '',
    name: item.parsedName,
    description: item.parsedDescription ?? '',
    priority: item.priority ?? '',
    startDate: item.startDate ?? '',
    dueDate: item.dueDate ?? '',
  }
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.8 ? S.success : value >= 0.55 ? S.warn : S.fgMuted
  return (
    <span
      style={{
        fontSize: 11,
        borderRadius: 5,
        padding: '2px 6px',
        color,
        background: value >= 0.8 ? 'rgba(45,138,78,0.10)' : value >= 0.55 ? S.warnSoft : S.chipBg,
      }}
    >
      {pct}%
    </span>
  )
}

function InboxRow({ item }: { item: AiInboxItem }) {
  const { data: projects = [] } = useActiveProjects()
  const convert = useConvertAiInboxItem()
  const dismiss = useDismissAiInboxItem()
  const [draft, setDraft] = useState<Draft>(() => draftFromItem(item))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(draftFromItem(item))
  }, [item])

  const selectedProject = projects.find(project => project.id === Number(draft.projectId))
  const pending = convert.isPending || dismiss.isPending

  const handleConvert = async () => {
    setError(null)
    if (draft.projectId === '' || !draft.name.trim()) {
      setError('请选择项目并填写任务名称。')
      return
    }
    const input: TaskInputDto = {
      projectId: Number(draft.projectId),
      name: draft.name.trim(),
      groupId: null,
      parentTaskId: null,
      priority: draft.priority || null,
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      estimateHours: null,
      description: draft.description.trim() || null,
    }
    try {
      await convert.mutateAsync({ id: item.id, input })
    } catch (err) {
      setError(`归类失败：${String(err)}`)
    }
  }

  const handleDismiss = async () => {
    setError(null)
    try {
      await dismiss.mutateAsync(item.id)
    } catch (err) {
      setError(`忽略失败：${String(err)}`)
    }
  }

  return (
    <div
      style={{
        border: S.hairline,
        borderRadius: 8,
        background: '#FFFEFC',
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: 'minmax(190px, 0.9fr) 24px minmax(270px, 1.2fr) minmax(170px, 0.8fr) 108px',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: S.fgMuted, marginBottom: 6 }}>原始输入</div>
        <div style={{ fontSize: 13, color: S.fg, lineHeight: 1.6 }}>
          {item.rawInput}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <Confidence value={item.confidence} />
          <span style={{ fontSize: 11, color: S.fgMuted }}>{item.createdAt}</span>
        </div>
      </div>

      <div style={{ color: S.fgMuted, fontSize: 17, textAlign: 'center' }}>→</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 92px 92px 76px', gap: 8, alignItems: 'center' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <input
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            style={{ ...inputStyle, width: '100%', fontWeight: 600, fontSize: 13 }}
            aria-label="暂存任务名称"
          />
        </div>
        <textarea
          value={draft.description}
          onChange={e => setDraft({ ...draft, description: e.target.value })}
          style={{ ...inputStyle, width: '100%', minHeight: 58, resize: 'vertical', gridColumn: '1 / -1' }}
          placeholder="描述"
          aria-label="暂存任务描述"
        />
        <input
          value={draft.dueDate}
          onChange={e => setDraft({ ...draft, dueDate: e.target.value })}
          type="date"
          style={{ ...inputStyle, width: '100%' }}
          aria-label="暂存任务截止日期"
        />
        <input
          value={draft.startDate}
          onChange={e => setDraft({ ...draft, startDate: e.target.value })}
          type="date"
          style={{ ...inputStyle, width: '100%' }}
          aria-label="暂存任务开始日期"
        />
        <select
          value={draft.priority}
          onChange={e => setDraft({ ...draft, priority: e.target.value as Priority | '' })}
          style={{ ...inputStyle, width: '100%' }}
          aria-label="暂存任务优先级"
        >
          <option value="">优先级</option>
          <option value="high">{priorityLabel.high}</option>
          <option value="medium">{priorityLabel.medium}</option>
          <option value="low">{priorityLabel.low}</option>
        </select>
      </div>

      <div>
        <select
          value={draft.projectId}
          onChange={e => setDraft({ ...draft, projectId: e.target.value ? Number(e.target.value) : '' })}
          style={{ ...inputStyle, width: '100%' }}
          aria-label="暂存任务所属项目"
        >
          <option value="">选择项目</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        {selectedProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: S.fgMuted }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: projectColorFor(selectedProject) }} />
            <span>{selectedProject.name}</span>
          </div>
        )}
        {item.projectCandidateId != null && (
          <div style={{ fontSize: 11, color: S.fgMuted, marginTop: 6 }}>
            AI 候选项目
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleConvert()}
          style={{
            background: S.success,
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '8px 10px',
            fontSize: 12,
            fontFamily: S.font,
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.65 : 1,
          }}
        >
          确认归类
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleDismiss()}
          style={{
            background: 'transparent',
            color: S.fgMuted,
            border: S.hairline,
            borderRadius: 7,
            padding: '7px 10px',
            fontSize: 12,
            fontFamily: S.font,
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.65 : 1,
          }}
        >
          忽略
        </button>
        {error && <div style={{ color: S.warn, fontSize: 11, lineHeight: 1.4 }}>{error}</div>}
      </div>
    </div>
  )
}

export function AiInboxView() {
  const { data: items = [], isLoading, isError, error } = useAiInboxItems('pending')

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: S.contentPad }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: S.heroSize, fontWeight: S.heroWeight, color: S.fg, letterSpacing: -0.2 }}>
            暂存任务
          </div>
          <div style={{ fontSize: 13, color: S.fgMuted, lineHeight: 1.6, marginTop: 8, maxWidth: 620 }}>
            这些任务尚未归类到项目中，请确认并分配到合适的项目。
          </div>
        </div>
        <div
          style={{
            border: S.hairline,
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 12,
            color: S.fgMuted,
            background: '#FFFEFC',
          }}
        >
          待分类 {items.length}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(190px, 0.9fr) 24px minmax(270px, 1.2fr) minmax(170px, 0.8fr) 108px',
          gap: 14,
          padding: '0 16px 8px',
          color: S.fgMuted,
          fontSize: 11.5,
        }}
      >
        <div>原始输入</div>
        <div />
        <div>AI 解析结果</div>
        <div>项目</div>
        <div>操作</div>
      </div>

      {isLoading ? (
        <div style={{ color: S.fgMuted, fontSize: 13, padding: '44px 0', textAlign: 'center' }}>加载中…</div>
      ) : isError ? (
        <div style={{ color: S.warn, fontSize: 13, padding: '44px 0', textAlign: 'center' }}>
          暂存任务加载失败：{String(error)}
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            border: S.hairline,
            borderRadius: 10,
            background: '#FFFEFC',
            padding: '46px 24px',
            textAlign: 'center',
            color: S.fgMuted,
            fontSize: 13,
          }}
        >
          暂存任务为空
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <InboxRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

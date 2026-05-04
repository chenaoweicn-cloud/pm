import { useEffect, useMemo, useState } from 'react'
import { S } from '@/design/tokens'
import { Checkbox } from '@/components/ui/Checkbox'
import { projectColorFor } from '@/lib/projectColor'
import { SEARCH_MIN_CHARS, useSearch } from '@/features/search/queries'
import { useActiveProjects, useArchivedProjects } from '@/features/projects/queries'
import type { Project, Task } from '@/lib/types'

interface Props {
  onClose: () => void
  onOpenProject: (projectId: number) => void
}

type SearchItem =
  | { kind: 'project'; key: string; projectId: number; project: Project }
  | { kind: 'task'; key: string; projectId: number; task: Task }

export function GlobalSearch({ onClose, onOpenProject }: Props) {
  const [q, setQ] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { data: results } = useSearch(q)
  const { data: activeProjects = [] } = useActiveProjects()
  const { data: archivedProjects = [] } = useArchivedProjects()

  const matches = results?.tasks ?? []
  const matchProjects = results?.projects ?? []
  const taskMatches = matches.slice(0, 6)
  const allProjects = [...activeProjects, ...archivedProjects]
  const canSearch = q.trim().length >= SEARCH_MIN_CHARS

  const items = useMemo<SearchItem[]>(
    () => [
      ...matchProjects.map(project => ({
        kind: 'project' as const,
        key: `project-${project.id}`,
        projectId: project.id,
        project,
      })),
      ...taskMatches.map(task => ({
        kind: 'task' as const,
        key: `task-${task.id}`,
        projectId: task.projectId,
        task,
      })),
    ],
    [matchProjects, taskMatches],
  )

  useEffect(() => {
    setSelectedIndex(current => {
      if (items.length === 0) return 0
      return Math.min(current, items.length - 1)
    })
  }, [items])

  const openItem = (item: SearchItem | undefined) => {
    if (!item) return
    onOpenProject(item.projectId)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        if (items.length === 0) return
        e.preventDefault()
        setSelectedIndex(current => (current + 1) % items.length)
        return
      }
      if (e.key === 'ArrowUp') {
        if (items.length === 0) return
        e.preventDefault()
        setSelectedIndex(current => (current - 1 + items.length) % items.length)
        return
      }
      if (e.key === 'Enter') {
        if (items.length === 0) return
        e.preventDefault()
        openItem(items[selectedIndex])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items, onOpenProject, selectedIndex])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(40,30,20,0.16)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 88,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 540,
          maxHeight: 420,
          background: S.cardBg,
          borderRadius: 12,
          boxShadow: '0 20px 50px rgba(60,40,20,0.18), 0 0 0 0.5px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: S.hairline,
            display: 'flex',
            alignItems: 'center',
            gap: 11,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={S.fgMuted} strokeWidth="1.6">
            <circle cx="7" cy="7" r="4.6" />
            <path d="M10.5 10.5l3 3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
            placeholder="搜索任务、项目、标签…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: S.fg,
              background: 'transparent',
              fontFamily: S.font,
            }}
          />
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 3,
              background: S.kbdBg,
              color: S.fgMuted,
              fontFamily: 'SF Mono, monospace',
            }}
          >
            esc
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
          {items.length === 0 && canSearch && (
            <div
              style={{
                padding: '18px',
                fontSize: 12,
                color: S.fgMuted,
                fontStyle: 'italic',
              }}
            >
              没有找到匹配结果
            </div>
          )}
          {matchProjects.length > 0 && (
            <>
              <div style={{ ...S.sectionLabel, padding: '8px 18px 4px' }}>
                项目 · {matchProjects.length}
              </div>
              {matchProjects.map((p, index) => {
                const sel = selectedIndex === index
                return (
                <div
                  key={p.id}
                  onClick={() => openItem(items[index])}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: '7px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    background: sel ? S.accentSoft : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: projectColorFor(p) }} />
                  <span style={{ fontSize: 13, color: S.fg, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: S.fgMuted }}>
                    {p.taskCount} 任务
                  </span>
                </div>
                )
              })}
            </>
          )}

          <div style={{ ...S.sectionLabel, padding: '8px 18px 4px' }}>
            任务 · {matches.length}
          </div>
          {taskMatches.map((t, i) => {
            const absoluteIndex = matchProjects.length + i
            const p = allProjects.find(x => x.id === t.projectId)
            const sel = selectedIndex === absoluteIndex
            return (
              <div
                key={t.id}
                onClick={() => openItem(items[absoluteIndex])}
                onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                style={{
                  margin: '0 8px',
                  padding: '7px 10px',
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: sel ? S.accentSoft : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Checkbox status={t.status} color={projectColorFor(p)} />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: S.fg,
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.name}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    color: S.fgMuted,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: projectColorFor(p) }} />
                  {(p?.name ?? '未知项目').split('·')[0].trim()}
                </span>
              </div>
            )
          })}
        </div>

        <div
          style={{
            padding: '8px 18px',
            borderTop: S.hairline,
            display: 'flex',
            gap: 14,
            fontSize: 11,
            color: S.fgMuted,
          }}
        >
          <span>
            <span
              style={{
                padding: '1px 5px',
                background: S.kbdBg,
                borderRadius: 3,
                fontFamily: 'SF Mono, monospace',
                fontSize: 10,
              }}
            >
              ↑↓
            </span>{' '}
            导航
          </span>
          <span>
            <span
              style={{
                padding: '1px 5px',
                background: S.kbdBg,
                borderRadius: 3,
                fontFamily: 'SF Mono, monospace',
                fontSize: 10,
              }}
            >
              ↵
            </span>{' '}
            打开
          </span>
          <div style={{ flex: 1 }} />
          <span>{matches.length + matchProjects.length} 个结果</span>
        </div>
      </div>
    </div>
  )
}

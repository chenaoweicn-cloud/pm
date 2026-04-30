import { useState } from 'react'
import { S } from '@/design/tokens'
import {
  useActiveProjects,
  useArchivedProjects,
  useArchiveProject,
  useSoftDeleteProject,
  useUnarchiveProject,
} from '@/features/projects/queries'
import { useAllActiveTasks, useTodayTasks } from '@/features/tasks/queries'
import { todayIso } from '@/lib/date'
import type { ViewKey } from './AppShell'

interface Props {
  view: ViewKey
  projectId: number
  setView: (view: ViewKey, projectId?: number) => void
  openSearch: () => void
  openProjectForm: () => void
}

interface NavItem {
  key: ViewKey | 'search'
  label: string
  badge?: number
  onClick?: () => void
}

export function Sidebar({ view, projectId, setView, openSearch, openProjectForm }: Props) {
  const today = todayIso()
  const { data: allTasks = [] } = useAllActiveTasks()
  const { data: todayTasksList = [] } = useTodayTasks(today)
  const { data: projects = [] } = useActiveProjects()
  const { data: archivedProjects = [], isLoading: archivedLoading } = useArchivedProjects()
  const archive = useArchiveProject()
  const softDelete = useSoftDeleteProject()
  const unarchive = useUnarchiveProject()
  const [showArchived, setShowArchived] = useState(false)

  const counts = {
    today: todayTasksList.length,
    cross: allTasks.filter(t => t.status !== 'done').length,
  }

  const navItems: NavItem[] = [
    { key: 'today', label: '今日待办', badge: counts.today },
    { key: 'cross', label: '跨项目任务', badge: counts.cross },
    { key: 'history', label: '历史回顾' },
    { key: 'search', label: '搜索…', onClick: openSearch },
    { key: 'trash', label: '回收站' },
  ]

  const itemActionStyle = (tone: 'default' | 'warn') => ({
    background: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: 11,
    lineHeight: 1,
    color: tone === 'warn' ? S.warn : S.fgMuted,
    opacity: 0.7,
    cursor: 'pointer',
    fontFamily: S.font,
    flexShrink: 0,
  } as const)

  return (
    <div
      style={{
        width: S.sidebarWidth,
        flexShrink: 0,
        background: S.sidebarBg,
        borderRight: S.sidebarBorder,
        padding: S.sidebarPad,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          marginBottom: 4,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: S.navGap, marginTop: 2 }}>
        {navItems.map(i => {
          const sel = i.key === view
          return (
            <div
              key={i.key}
              onClick={i.onClick ?? (() => setView(i.key as ViewKey))}
              style={{
                ...S.navItem,
                background: sel ? S.navActiveBg : 'transparent',
                color: sel ? S.navActiveFg : S.fgMuted,
                fontWeight: sel ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ flex: 1 }}>{i.label}</span>
              {i.badge != null && (
                <span style={{ fontSize: 10, opacity: sel ? 0.9 : 0.6 }}>{i.badge}</span>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ ...S.sectionLabel, marginTop: 14 }}>项目</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: S.navGap, overflow: 'auto', flex: 1 }}>
        {projects.map(p => {
          const sel = view === 'project' && projectId === p.id
          return (
            <div
              key={p.id}
              onClick={() => setView('project', p.id)}
              style={{
                ...S.navItem,
                background: sel ? S.navActiveBg : 'transparent',
                color: sel ? S.navActiveFg : S.fgMuted,
                fontWeight: sel ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
              <span
                style={{ width: 8, height: 8, borderRadius: '50%', background: p.color ?? '#6C6C6C', flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.name}
              </span>
              {p.dueCount != null && p.dueCount > 0 && (
                <span style={{ fontSize: 10, color: sel ? S.accent : S.fgMuted, opacity: 0.8 }}>
                  {p.dueCount}
                </span>
              )}
              <button
                disabled={archive.isPending}
                aria-label={`归档项目 ${p.name}`}
                title="归档项目"
                onClick={e => {
                  e.stopPropagation()
                  archive.mutate(p.id, {
                    onSuccess: () => {
                      if (sel) setView('today')
                    },
                  })
                }}
                style={{
                  ...itemActionStyle('default'),
                  opacity: archive.isPending ? 0.35 : 0.7,
                  cursor: archive.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                归档
              </button>
              <button
                disabled={softDelete.isPending}
                aria-label={`删除项目 ${p.name}`}
                title="删除项目"
                onClick={e => {
                  e.stopPropagation()
                  if (window.confirm('确定删除该项目？删除后可在回收站恢复。')) {
                    softDelete.mutate(p.id, {
                      onSuccess: () => {
                        if (sel) setView('today')
                      },
                    })
                  }
                }}
                style={{
                  ...itemActionStyle('warn'),
                  opacity: softDelete.isPending ? 0.35 : 0.82,
                  cursor: softDelete.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                删除
              </button>
            </div>
          )
        })}
      </div>

      {/* 归档项目折叠区 */}
      <div style={{ marginTop: 6 }}>
        <div
          onClick={() => setShowArchived(v => !v)}
          style={{
            ...S.sectionLabel,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          <span>{showArchived ? '▾' : '▸'}</span>
          <span style={{ flex: 1 }}>归档项目</span>
          {archivedProjects.length > 0 && (
            <span
              style={{
                fontSize: 10,
                background: S.accentSoft,
                color: S.accent,
                borderRadius: 4,
                padding: '1px 5px',
              }}
            >
              {archivedProjects.length}
            </span>
          )}
        </div>
        {showArchived && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.navGap, marginTop: 2 }}>
            {archivedLoading ? (
              <div style={{ fontSize: 12, color: S.fgMuted, padding: '4px 14px', fontStyle: 'italic' }}>加载中…</div>
            ) : archivedProjects.length === 0 ? (
              <div style={{ fontSize: 12, color: S.fgMuted, padding: '4px 14px', fontStyle: 'italic' }}>无归档项目</div>
            ) : (
              archivedProjects.map(p => (
                <div
                  key={p.id}
                  style={{
                    ...S.navItem,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    color: S.fgMuted,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: p.color ?? '#6C6C6C',
                      flexShrink: 0,
                      opacity: 0.5,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: 13,
                      color: S.fgMuted,
                    }}
                  >
                    {p.name}
                  </span>
                  <button
                    disabled={unarchive.isPending}
                    onClick={e => {
                      e.stopPropagation()
                      unarchive.mutate(p.id)
                    }}
                    style={{
                      background: 'transparent',
                      border: S.hairline,
                      borderRadius: 5,
                      padding: '2px 7px',
                      fontSize: 11,
                      color: S.fgMuted,
                      cursor: unarchive.isPending ? 'not-allowed' : 'pointer',
                      opacity: unarchive.isPending ? 0.5 : 1,
                      fontFamily: S.font,
                      flexShrink: 0,
                    }}
                  >
                    重启
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        onClick={() => setView('settings')}
        style={{
          ...S.navItem,
          background: view === 'settings' ? S.navActiveBg : 'transparent',
          color: view === 'settings' ? S.navActiveFg : S.fgMuted,
          fontWeight: view === 'settings' ? 600 : 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 2,
        }}
      >
        ⚙ 设置
      </div>

      <div
        onClick={openProjectForm}
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 12,
          color: S.fgMuted,
          borderTop: S.hairline,
          marginTop: 6,
          cursor: 'default',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5.5 2v7M2 5.5h7" />
        </svg>
        新建项目
      </div>
    </div>
  )
}

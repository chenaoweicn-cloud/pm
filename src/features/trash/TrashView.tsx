import { useState } from 'react'
import { S } from '@/design/tokens'
import { useTrash, useRestoreProject, useRestoreTask, usePurgeProject, usePurgeTask } from './queries'

type PendingPurge =
  | { kind: 'project'; id: number; name: string }
  | { kind: 'task'; id: number; name: string }

export function TrashView() {
  const { data, isLoading } = useTrash()
  const restoreProject = useRestoreProject()
  const restoreTask = useRestoreTask()
  const purgeProject = usePurgeProject()
  const purgeTask = usePurgeTask()
  const [pendingPurge, setPendingPurge] = useState<PendingPurge | null>(null)

  const projects = data?.projects ?? []
  const tasks = data?.tasks ?? []
  const isEmpty = projects.length === 0 && tasks.length === 0

  const projectsAnyPending = restoreProject.isPending || purgeProject.isPending
  const tasksAnyPending = restoreTask.isPending || purgeTask.isPending
  const isPurging = purgeProject.isPending || purgeTask.isPending

  const confirmPurge = () => {
    if (!pendingPurge || isPurging) return

    const mutation = pendingPurge.kind === 'project' ? purgeProject : purgeTask
    mutation.mutate(pendingPurge.id, {
      onSuccess: () => setPendingPurge(null),
      onError: error => {
        window.alert(`彻底删除失败：${String(error)}`)
      },
    })
  }

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: S.fgMuted,
          fontSize: 13,
          fontStyle: 'italic',
        }}
      >
        加载中…
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: S.contentPad }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: S.heroSize,
            fontWeight: S.heroWeight,
            color: S.fg,
            letterSpacing: -0.3,
          }}
        >
          回收站
        </div>
      </div>

      {isEmpty ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            color: S.fgMuted,
            fontSize: 13,
            fontStyle: 'italic',
          }}
        >
          回收站为空
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 项目区块 */}
          {projects.length > 0 && (
            <div
              style={{
                background: S.cardBg,
                borderRadius: S.cardRadius,
                border: S.cardBorder,
                boxShadow: S.cardShadow,
                overflow: 'hidden',
              }}
            >
              <div style={{ ...S.sectionLabel, paddingTop: 12, paddingBottom: 8 }}>项目</div>
              {projects.map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '10px 18px',
                      borderTop: S.hairline,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span style={{ flex: 1, fontSize: S.rowSize, color: S.fg }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: S.fgMuted, flexShrink: 0 }}>
                      {p.deletedAt ?? ''}
                    </span>
                    <button
                      disabled={projectsAnyPending}
                      onClick={() => restoreProject.mutate(p.id)}
                      style={{
                        border: S.hairline,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.accent,
                        cursor: projectsAnyPending ? 'not-allowed' : 'pointer',
                        opacity: projectsAnyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      恢复
                    </button>
                    <button
                      disabled={projectsAnyPending}
                      onClick={() => setPendingPurge({ kind: 'project', id: p.id, name: p.name })}
                      style={{
                        border: '1px solid currentColor',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.warn,
                        cursor: projectsAnyPending ? 'not-allowed' : 'pointer',
                        opacity: projectsAnyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      彻底删除
                    </button>
                  </div>
              ))}
            </div>
          )}

          {/* 任务区块 */}
          {tasks.length > 0 && (
            <div
              style={{
                background: S.cardBg,
                borderRadius: S.cardRadius,
                border: S.cardBorder,
                boxShadow: S.cardShadow,
                overflow: 'hidden',
              }}
            >
              <div style={{ ...S.sectionLabel, paddingTop: 12, paddingBottom: 8 }}>任务</div>
              {tasks.map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '10px 18px',
                      borderTop: S.hairline,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span style={{ flex: 1, fontSize: S.rowSize, color: S.fg }}>{t.name}</span>
                    <span style={{ fontSize: 11, color: S.fgMuted, flexShrink: 0 }}>
                      {t.deletedAt ?? ''}
                    </span>
                    <button
                      disabled={tasksAnyPending}
                      onClick={() => restoreTask.mutate(t.id)}
                      style={{
                        border: S.hairline,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.accent,
                        cursor: tasksAnyPending ? 'not-allowed' : 'pointer',
                        opacity: tasksAnyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      恢复
                    </button>
                    <button
                      disabled={tasksAnyPending}
                      onClick={() => setPendingPurge({ kind: 'task', id: t.id, name: t.name })}
                      style={{
                        border: '1px solid currentColor',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.warn,
                        cursor: tasksAnyPending ? 'not-allowed' : 'pointer',
                        opacity: tasksAnyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      彻底删除
                    </button>
                  </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pendingPurge && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="purge-title"
          onClick={() => {
            if (!isPurging) setPendingPurge(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 360,
              maxWidth: '90vw',
              background: S.cardBg,
              border: S.cardBorder,
              borderRadius: S.cardRadius,
              boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
              padding: 18,
            }}
          >
            <div id="purge-title" style={{ fontSize: 15, fontWeight: 700, color: S.fg }}>
              彻底删除{pendingPurge.kind === 'project' ? '项目' : '任务'}
            </div>
            <div style={{ fontSize: 13, color: S.fgMuted, lineHeight: 1.6, marginTop: 8 }}>
              确定彻底删除“{pendingPurge.name}”？此操作无法恢复。
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setPendingPurge(null)}
                style={{
                  background: 'transparent',
                  border: S.hairline,
                  borderRadius: S.inputRadius,
                  color: S.fgMuted,
                  cursor: isPurging ? 'not-allowed' : 'pointer',
                  fontFamily: S.font,
                  fontSize: 13,
                  padding: '7px 12px',
                  opacity: isPurging ? 0.6 : 1,
                }}
              >
                取消
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={confirmPurge}
                style={{
                  background: S.warn,
                  border: 'none',
                  borderRadius: S.inputRadius,
                  color: '#fff',
                  cursor: isPurging ? 'not-allowed' : 'pointer',
                  fontFamily: S.font,
                  fontSize: 13,
                  padding: '7px 14px',
                  opacity: isPurging ? 0.7 : 1,
                }}
              >
                {isPurging ? '删除中…' : '确认彻底删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

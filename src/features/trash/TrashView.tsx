import { S } from '@/design/tokens'
import { useTrash, useRestoreProject, useRestoreTask, usePurgeProject, usePurgeTask } from './queries'

export function TrashView() {
  const { data, isLoading } = useTrash()
  const restoreProject = useRestoreProject()
  const restoreTask = useRestoreTask()
  const purgeProject = usePurgeProject()
  const purgeTask = usePurgeTask()

  const projects = data?.projects ?? []
  const tasks = data?.tasks ?? []
  const isEmpty = projects.length === 0 && tasks.length === 0

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
              {projects.map(p => {
                const anyPending = restoreProject.isPending || purgeProject.isPending
                return (
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
                      disabled={anyPending}
                      onClick={() => restoreProject.mutate(p.id)}
                      style={{
                        border: S.hairline,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.accent,
                        cursor: anyPending ? 'not-allowed' : 'pointer',
                        opacity: anyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      恢复
                    </button>
                    <button
                      disabled={anyPending}
                      onClick={() => {
                        if (window.confirm('彻底删除？将无法恢复。')) {
                          purgeProject.mutate(p.id)
                        }
                      }}
                      style={{
                        border: '1px solid currentColor',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.warn,
                        cursor: anyPending ? 'not-allowed' : 'pointer',
                        opacity: anyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      彻底删除
                    </button>
                  </div>
                )
              })}
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
              {tasks.map(t => {
                const anyPending = restoreTask.isPending || purgeTask.isPending
                return (
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
                      disabled={anyPending}
                      onClick={() => restoreTask.mutate(t.id)}
                      style={{
                        border: S.hairline,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.accent,
                        cursor: anyPending ? 'not-allowed' : 'pointer',
                        opacity: anyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      恢复
                    </button>
                    <button
                      disabled={anyPending}
                      onClick={() => {
                        if (window.confirm('彻底删除？将无法恢复。')) {
                          purgeTask.mutate(t.id)
                        }
                      }}
                      style={{
                        border: '1px solid currentColor',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 12,
                        background: 'transparent',
                        color: S.warn,
                        cursor: anyPending ? 'not-allowed' : 'pointer',
                        opacity: anyPending ? 0.5 : 1,
                        fontFamily: S.font,
                        flexShrink: 0,
                      }}
                    >
                      彻底删除
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

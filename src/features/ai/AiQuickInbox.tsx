import { useEffect, useRef, useState } from 'react'
import { S } from '@/design/tokens'
import type { AiCaptureResult } from '@/lib/types'
import { useActiveAiModel, useAiCaptureTasks } from './queries'

interface Props {
  onClose: () => void
  onOpenSettings: () => void
  onOpenInbox: () => void
}

const inputStyle: React.CSSProperties = {
  border: S.hairline,
  borderRadius: S.inputRadius,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: S.font,
  background: '#FFFEFC',
  color: S.fg,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

const secondaryButton: React.CSSProperties = {
  background: 'transparent',
  color: S.fgMuted,
  border: S.hairline,
  borderRadius: S.inputRadius,
  padding: '8px 13px',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: S.font,
}

function StatBox({ label, value, action, onClick }: { label: string; value: number; action: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        textAlign: 'left',
        background: '#FCFAF6',
        border: S.hairline,
        borderRadius: 8,
        padding: 12,
        cursor: 'pointer',
        fontFamily: S.font,
      }}
    >
      <div style={{ fontSize: 12, color: S.fgMuted }}>{label}</div>
      <div style={{ fontSize: 24, color: S.fg, fontWeight: 700, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: S.accent, marginTop: 6 }}>{action}</div>
    </button>
  )
}

export function AiQuickInbox({ onClose, onOpenSettings, onOpenInbox }: Props) {
  const { data: activeModel, isLoading: modelLoading } = useActiveAiModel()
  const capture = useAiCaptureTasks()
  const [text, setText] = useState('')
  const [result, setResult] = useState<AiCaptureResult | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleSubmit()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  })

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || capture.isPending || !activeModel) return
    setResult(null)
    try {
      const next = await capture.mutateAsync(trimmed)
      setResult(next)
      setText('')
    } catch {
      // Mutation state drives the inline error UI.
    }
  }

  const disabled = capture.isPending || !text.trim() || !activeModel

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-inbox-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(42,41,38,0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: 'calc(100vw - 36px)',
          background: S.cardBg,
          border: S.cardBorder,
          borderRadius: 12,
          boxShadow: '0 18px 54px rgba(72,55,32,0.18)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 18px',
            borderBottom: S.hairline,
            background: '#FFFDF9',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              border: S.hairline,
              display: 'grid',
              placeItems: 'center',
              color: S.accent,
              background: S.accentSoft,
              fontSize: 13,
            }}
          >
            ✦
          </div>
          <div id="ai-inbox-title" style={{ flex: 1, fontSize: 15, fontWeight: 700, color: S.fg }}>
            AI Inbox
          </div>
          <span style={{ ...keycapStyle }}>⌘⇧I</span>
          <button
            type="button"
            aria-label="关闭 AI Inbox"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: S.fgMuted,
              fontSize: 20,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: S.fgMuted, lineHeight: 1.6 }}>
            用自然语言输入想法、需求或待办，AI 将为你创建任务。
          </div>

          {modelLoading ? (
            <div style={{ fontSize: 13, color: S.fgMuted, padding: '18px 0' }}>正在读取模型配置…</div>
          ) : !activeModel ? (
            <div
              style={{
                background: '#FCFAF6',
                border: S.hairline,
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, fontSize: 13, color: S.fg, lineHeight: 1.6 }}>
                还没有可用模型。请先在设置中添加 Base URL、模型名称和 API Key。
              </div>
              <button type="button" onClick={onOpenSettings} style={{ ...secondaryButton, color: S.accent }}>
                去设置
              </button>
            </div>
          ) : (
            <>
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={'例如：\n下周安排一次客户门户项目的需求评审会，准备评审材料；\n整理客户反馈，输出问题清单；\n跟开发确认权限管理的接口方案；'}
                rows={6}
                style={{
                  ...inputStyle,
                  minHeight: 132,
                  resize: 'vertical',
                  lineHeight: 1.7,
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: S.fgMuted }}>模型</span>
                <div
                  style={{
                    border: S.hairline,
                    borderRadius: 7,
                    padding: '7px 10px',
                    minWidth: 180,
                    fontSize: 13,
                    color: S.fg,
                    background: '#FFFEFC',
                  }}
                >
                  {activeModel.displayName}
                </div>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: S.fgMuted }}>快捷键</span>
                <span style={keycapStyle}>⌘↩</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={onClose} style={secondaryButton}>
                  关闭
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void handleSubmit()}
                  style={{
                    background: S.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: S.inputRadius,
                    padding: '8px 18px',
                    fontSize: 13,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.55 : 1,
                    fontFamily: S.font,
                    minWidth: 86,
                  }}
                >
                  {capture.isPending ? '处理中…' : '处理'}
                </button>
              </div>
            </>
          )}

          {capture.isError && (
            <div style={{ color: S.warn, fontSize: 12 }}>
              处理失败：{String(capture.error)}
            </div>
          )}

          {result && (
            <div style={{ borderTop: S.hairline, paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ color: S.success, fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: S.fg }}>处理完成</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <StatBox label="已创建任务" value={result.created.length} action="查看任务" onClick={onClose} />
                <StatBox label="已移入暂存任务" value={result.inboxItems.length} action="查看暂存任务" onClick={onOpenInbox} />
                <StatBox label="失败" value={result.failed.length} action="保留输入" onClick={() => setText(result.failed.map(i => i.rawInput).join('\n'))} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const keycapStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '3px 7px',
  borderRadius: 5,
  background: S.kbdBg,
  color: S.fgMuted,
  fontFamily: 'SF Mono, Menlo, monospace',
}

import { useEffect, useState } from 'react'
import { S } from '@/design/tokens'
import type { AiModel } from '@/lib/types'
import { useAiModels, useDeleteAiModel, useSaveAiModel, useSetActiveAiModel } from './queries'

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: S.fgMuted,
  marginBottom: 5,
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  border: S.hairline,
  borderRadius: S.inputRadius,
  padding: '8px 10px',
  fontSize: 13,
  width: '100%',
  fontFamily: S.font,
  background: '#FFFEFC',
  color: S.fg,
  outline: 'none',
  boxSizing: 'border-box',
}

const mutedButton: React.CSSProperties = {
  background: 'transparent',
  color: S.fgMuted,
  border: S.hairline,
  borderRadius: S.inputRadius,
  padding: '7px 12px',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: S.font,
}

function blankForm() {
  return {
    id: null as number | null,
    displayName: '',
    baseUrl: '',
    modelName: '',
    apiKey: '',
  }
}

export function AiModelSettings() {
  const { data: models = [], isLoading } = useAiModels()
  const saveModel = useSaveAiModel()
  const deleteModel = useDeleteAiModel()
  const setActiveModel = useSetActiveAiModel()
  const [form, setForm] = useState(blankForm)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const editing = form.id != null
  const pending = saveModel.isPending || deleteModel.isPending || setActiveModel.isPending

  useEffect(() => {
    if (form.id != null) return
    if (models.length === 0 && !form.baseUrl) {
      setForm(current => ({
        ...current,
        baseUrl: 'https://api.openai.com/v1',
      }))
    }
  }, [form.baseUrl, form.id, models.length])

  const selectModel = (model: AiModel) => {
    setMessage(null)
    setError(null)
    setForm({
      id: model.id,
      displayName: model.displayName,
      baseUrl: model.baseUrl,
      modelName: model.modelName,
      apiKey: '',
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    const displayName = form.displayName.trim()
    const baseUrl = form.baseUrl.trim().replace(/\/+$/, '')
    const modelName = form.modelName.trim()
    const apiKey = form.apiKey.trim()

    if (!displayName || !baseUrl || !modelName) {
      setError('请填写显示名称、Base URL 和模型名称。')
      return
    }
    if (!editing && !apiKey) {
      setError('新增模型时必须填写 API Key。')
      return
    }

    try {
      await saveModel.mutateAsync({
        id: form.id,
        displayName,
        baseUrl,
        modelName,
        apiKey: apiKey || null,
      })
      setForm(blankForm())
      setMessage('模型配置已保存')
    } catch (err) {
      setError(`保存失败：${String(err)}`)
    }
  }

  const handleDelete = async () => {
    if (form.id == null || pending) return
    const target = models.find(model => model.id === form.id)
    const confirmed = window.confirm(`删除模型“${target?.displayName ?? form.displayName}”？`)
    if (!confirmed) return
    setMessage(null)
    setError(null)
    try {
      await deleteModel.mutateAsync(form.id)
      setForm(blankForm())
      setMessage('模型已删除')
    } catch (err) {
      setError(`删除失败：${String(err)}`)
    }
  }

  const handleSetActive = async (id: number) => {
    setMessage(null)
    setError(null)
    try {
      await setActiveModel.mutateAsync(id)
      setMessage('当前模型已切换')
    } catch (err) {
      setError(`切换失败：${String(err)}`)
    }
  }

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: S.fg, marginBottom: 4 }}>
        AI 模型
      </div>
      <div style={{ fontSize: 12, color: S.fgMuted, lineHeight: 1.6, marginBottom: 18 }}>
        管理你连接的 AI 模型，应用将使用所选模型进行任务解析与生成。
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ ...S.sectionLabel, padding: 0, marginBottom: 10 }}>模型列表</div>
        {isLoading ? (
          <div style={{ fontSize: 13, color: S.fgMuted }}>加载中…</div>
        ) : models.length === 0 ? (
          <div
            style={{
              border: S.hairline,
              borderRadius: 8,
              padding: 14,
              background: '#FCFAF6',
              color: S.fgMuted,
              fontSize: 13,
            }}
          >
            还没有模型。添加一个 OpenAI-compatible 模型后即可使用 AI Inbox。
          </div>
        ) : (
          <div
            style={{
              border: S.hairline,
              borderRadius: 10,
              background: '#FFFEFC',
              overflow: 'hidden',
            }}
          >
            {models.map((model, index) => (
              <div
                key={model.id}
                onClick={() => selectModel(model)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderTop: index === 0 ? 'none' : S.hairline,
                  cursor: 'pointer',
                  background: form.id === model.id ? '#FCFAF6' : '#FFFEFC',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: model.isActive ? S.accentSoft : S.chipBg,
                    color: model.isActive ? S.accent : S.fgMuted,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: S.fg }}>{model.displayName}</span>
                    {model.isActive && (
                      <span
                        style={{
                          fontSize: 10,
                          color: S.accent,
                          background: S.accentSoft,
                          borderRadius: 5,
                          padding: '2px 6px',
                        }}
                      >
                        当前
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: S.fgMuted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {model.baseUrl} · {model.modelName}
                  </div>
                </div>
                {!model.isActive && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={e => {
                      e.stopPropagation()
                      void handleSetActive(model.id)
                    }}
                    style={{ ...mutedButton, color: S.accent, flexShrink: 0 }}
                  >
                    设为当前
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ borderTop: S.hairline, paddingTop: 18 }}>
        <div style={{ ...S.sectionLabel, padding: 0, marginBottom: 12 }}>模型配置</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="ai-model-display-name">显示名称</label>
            <input
              id="ai-model-display-name"
              value={form.displayName}
              onChange={e => setForm({ ...form, displayName: e.target.value })}
              style={inputStyle}
              placeholder="例如 GPT-4o"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ai-model-base-url">Base URL</label>
            <input
              id="ai-model-base-url"
              value={form.baseUrl}
              onChange={e => setForm({ ...form, baseUrl: e.target.value })}
              style={inputStyle}
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ai-model-name">模型名称</label>
            <input
              id="ai-model-name"
              value={form.modelName}
              onChange={e => setForm({ ...form, modelName: e.target.value })}
              style={inputStyle}
              placeholder="gpt-4o"
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ai-model-api-key">API Key</label>
            <input
              id="ai-model-api-key"
              value={form.apiKey}
              onChange={e => setForm({ ...form, apiKey: e.target.value })}
              type="password"
              style={inputStyle}
              placeholder={editing ? '留空则不修改已保存 Key' : '输入 API Key'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              background: S.success,
              border: 'none',
              color: '#fff',
              borderRadius: S.inputRadius,
              padding: '8px 16px',
              fontSize: 13,
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending ? 0.65 : 1,
              fontFamily: S.font,
            }}
          >
            {saveModel.isPending ? '保存中…' : editing ? '保存更改' : '添加模型'}
          </button>
          <button type="button" disabled={pending} onClick={() => setForm(blankForm())} style={mutedButton}>
            取消
          </button>
          {editing && (
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleDelete()}
              style={{ ...mutedButton, color: S.warn, border: '1px solid currentColor' }}
            >
              删除模型
            </button>
          )}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11.5, color: S.fgMuted }}>API Key 仅存储在本地设备，不会上传或显示。</span>
        </div>
      </form>

      {message && <div style={{ color: S.success, fontSize: 12, marginTop: 12 }}>{message}</div>}
      {error && <div style={{ color: S.warn, fontSize: 12, marginTop: 12 }}>{error}</div>}
    </div>
  )
}

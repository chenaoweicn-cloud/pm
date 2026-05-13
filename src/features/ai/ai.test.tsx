import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiQuickInbox } from './AiQuickInbox'
import { AiModelSettings } from './AiModelSettings'
import { AiInboxView } from './AiInboxView'
import type { AiInboxItem, AiModel, Project } from '@/lib/types'

const invokeMock = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (command: string, args?: unknown) => invokeMock(command, args),
}))

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const model: AiModel = {
  id: 1,
  displayName: 'GPT-4o',
  baseUrl: 'https://api.openai.com/v1',
  modelName: 'gpt-4o',
  isActive: true,
  createdAt: '2026-05-13',
  updatedAt: '2026-05-13',
}

const project: Project = {
  id: 2,
  name: '客户门户重构',
  status: 'active',
  type: null,
  startDate: null,
  endDate: null,
  archivedAt: null,
  deletedAt: null,
  createdAt: '2026-05-13',
  updatedAt: '2026-05-13',
}

const inboxItem: AiInboxItem = {
  id: 3,
  rawInput: '整理客户反馈清单',
  parsedName: '整理客户反馈清单',
  parsedDescription: '输出问题清单',
  priority: 'medium',
  startDate: null,
  dueDate: '2026-05-22',
  projectCandidateId: project.id,
  confidence: 0.64,
  status: 'pending',
  modelId: model.id,
  createdTaskId: null,
  createdAt: '2026-05-13',
  updatedAt: '2026-05-13',
}

beforeEach(() => {
  invokeMock.mockReset()
})

describe('AiQuickInbox', () => {
  it('shows model setup prompt when no active model exists', async () => {
    invokeMock.mockResolvedValueOnce(null)

    renderWithClient(
      <AiQuickInbox onClose={() => undefined} onOpenSettings={() => undefined} onOpenInbox={() => undefined} />,
    )

    expect(await screen.findByText('还没有可用模型。请先在设置中添加 Base URL、模型名称和 API Key。')).toBeInTheDocument()
    expect(screen.getByText('去设置')).toBeInTheDocument()
  })

  it('submits natural language and displays result summary', async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === 'get_active_ai_model') return Promise.resolve(model)
      if (command === 'ai_capture_tasks') {
        return Promise.resolve({ created: [], inboxItems: [inboxItem], failed: [] })
      }
      return Promise.resolve(null)
    })

    renderWithClient(
      <AiQuickInbox onClose={() => undefined} onOpenSettings={() => undefined} onOpenInbox={() => undefined} />,
    )

    const input = await screen.findByPlaceholderText(/下周安排一次客户门户项目/)
    fireEvent.change(input, { target: { value: '整理客户反馈清单' } })
    fireEvent.click(screen.getByText('处理'))

    expect(await screen.findByText('处理完成')).toBeInTheDocument()
    expect(screen.getByText('已移入暂存任务')).toBeInTheDocument()
    expect(invokeMock).toHaveBeenCalledWith('ai_capture_tasks', { text: '整理客户反馈清单' })
  })
})

describe('AiModelSettings', () => {
  it('saves a new model', async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === 'list_ai_models') return Promise.resolve([])
      if (command === 'save_ai_model') return Promise.resolve(model)
      return Promise.resolve(null)
    })

    renderWithClient(<AiModelSettings />)

    fireEvent.change(screen.getByLabelText('显示名称'), { target: { value: 'GPT-4o' } })
    fireEvent.change(screen.getByLabelText('Base URL'), { target: { value: 'https://api.openai.com/v1' } })
    fireEvent.change(screen.getByLabelText('模型名称'), { target: { value: 'gpt-4o' } })
    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'sk-test' } })
    fireEvent.click(screen.getByText('添加模型'))

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('save_ai_model', {
        input: {
          id: null,
          displayName: 'GPT-4o',
          baseUrl: 'https://api.openai.com/v1',
          modelName: 'gpt-4o',
          apiKey: 'sk-test',
        },
      })
    })
  })
})

describe('AiInboxView', () => {
  it('converts a pending inbox item into a task', async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === 'list_ai_inbox_items') return Promise.resolve([inboxItem])
      if (command === 'list_active_projects') return Promise.resolve([project])
      if (command === 'convert_ai_inbox_item') {
        return Promise.resolve({
          id: 9,
          projectId: project.id,
          groupId: null,
          parentTaskId: null,
          name: inboxItem.parsedName,
          status: 'not_started',
          priority: 'medium',
          startDate: null,
          dueDate: inboxItem.dueDate,
          estimateHours: null,
          description: inboxItem.parsedDescription,
          completedAt: null,
          deletedAt: null,
          createdAt: '2026-05-13',
          updatedAt: '2026-05-13',
        })
      }
      if (command === 'list_all_active_tasks') return Promise.resolve([])
      if (command === 'list_archived_projects') return Promise.resolve([])
      if (command === 'today_tasks') return Promise.resolve([])
      return Promise.resolve(null)
    })

    renderWithClient(<AiInboxView />)

    expect(await screen.findByText('整理客户反馈清单')).toBeInTheDocument()
    fireEvent.click(screen.getByText('确认归类'))

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('convert_ai_inbox_item', {
        id: inboxItem.id,
        input: {
          projectId: project.id,
          name: inboxItem.parsedName,
          groupId: null,
          parentTaskId: null,
          priority: 'medium',
          startDate: null,
          dueDate: inboxItem.dueDate,
          estimateHours: null,
          description: inboxItem.parsedDescription,
        },
      })
    })
  })
})

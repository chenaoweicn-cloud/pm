// Mock data ported verbatim from the design prototype's data.jsx.
// Replaces `lib/api.ts` calls until the Tauri/SQLite backend lands (plan tasks 10–22).

import type { Project, Task, TaskGroup } from './types'
import { TODAY } from './date'

export const PROJECTS: Project[] = [
  { id: 1, name: '长城保险 · 理赔中台二期', type: '二期挖掘', status: 'active', color: '#2F6FED', taskCount: 18, dueCount: 3 },
  { id: 2, name: '中远海运 · 订舱系统实施', type: '实施',     status: 'active', color: '#AF52DE', taskCount: 24, dueCount: 2 },
  { id: 3, name: '华能新能源 · 资产管理售前', type: '售前',     status: 'active', color: '#FF9F0A', taskCount: 9,  dueCount: 1 },
  { id: 4, name: '招商银行 · 对公信贷运维',   type: '运维',     status: 'active', color: '#30D158', taskCount: 12, dueCount: 0 },
  { id: 5, name: '国网华北 · 调度平台POC',    type: '售前',     status: 'active', color: '#FF375F', taskCount: 7,  dueCount: 1 },
  { id: 6, name: '京东健康 · 处方流转',       type: '实施',     status: 'active', color: '#64D2FF', taskCount: 14, dueCount: 2 },
]

export const ARCHIVED: Project[] = [
  { id: 7, name: '长城保险 · 理赔中台一期', type: '实施', status: 'archived', color: '#8E8E93', archivedAt: '2026-02-14' },
  { id: 8, name: '中金财富 · 客户画像POC',  type: '售前', status: 'archived', color: '#8E8E93', archivedAt: '2025-11-03' },
]

export const TASK_GROUPS: Record<number, TaskGroup[]> = {
  1: [
    { id: 101, projectId: 1, name: '需求调研' },
    { id: 102, projectId: 1, name: '方案设计' },
    { id: 103, projectId: 1, name: '原型与文档' },
  ],
  2: [
    { id: 201, projectId: 2, name: '上线冲刺' },
    { id: 202, projectId: 2, name: '回归与验收' },
  ],
}

export const TASKS: Task[] = [
  // 长城保险 二期 (id 1)
  { id: 1001, projectId: 1, groupId: 101, name: '访谈理赔运营负责人，梳理二期痛点', status: 'in_progress', priority: 'high',   startDate: '2026-04-20', dueDate: '2026-04-24', tags: ['访谈', '需求'] },
  { id: 1002, projectId: 1, groupId: 101, name: '整理一期未覆盖场景清单',         status: 'in_progress', priority: 'medium', startDate: '2026-04-21', dueDate: '2026-04-25', tags: ['需求'] },
  { id: 1003, projectId: 1, groupId: 102, name: '智能分案规则 v2 草稿',           status: 'not_started', priority: 'high',   startDate: '2026-04-23', dueDate: '2026-04-28', tags: ['方案'] },
  { id: 1004, projectId: 1, groupId: 103, name: '理赔流程图补充异常分支',         status: 'done',        completedAt: '2026-04-22', priority: 'medium', tags: ['文档'] },
  { id: 1005, projectId: 1, groupId: 103, name: 'Figma 原型 - 分案工作台',         status: 'done',        completedAt: '2026-04-21', priority: 'medium', tags: ['原型'] },
  { id: 1006, projectId: 1, groupId: 102, name: '对比友商理赔系统的SLA指标',       status: 'not_started', priority: 'low',    dueDate: '2026-04-30', tags: ['竞品'] },

  // 中远海运 订舱 (id 2)
  { id: 2001, projectId: 2, groupId: 201, name: '船期接口联调',                 status: 'in_progress', priority: 'high',   startDate: '2026-04-22', dueDate: '2026-04-24', tags: ['接口', '冲刺'] },
  { id: 2002, projectId: 2, groupId: 201, name: 'UAT 回归测试用例评审',         status: 'not_started', priority: 'high',   startDate: '2026-04-23', dueDate: '2026-04-23', tags: ['UAT'] },
  { id: 2003, projectId: 2, groupId: 202, name: '整理上线 checklist',           status: 'in_progress', priority: 'medium', dueDate: '2026-04-26', tags: ['上线'] },
  { id: 2004, projectId: 2, groupId: 201, name: '准备运营培训材料',             status: 'not_started', priority: 'medium', dueDate: '2026-04-29' },
  { id: 2005, projectId: 2, name: '周会同步进度 - 中远PM',                      status: 'done', completedAt: '2026-04-22', priority: 'low' },
  { id: 2006, projectId: 2, name: '提交变更单：舱位保留逻辑',                    status: 'done', completedAt: '2026-04-20', priority: 'high' },

  // 华能新能源 售前 (id 3)
  { id: 3001, projectId: 3, name: '售前方案 v2 撰写',           status: 'in_progress', priority: 'high', startDate: '2026-04-22', dueDate: '2026-04-24', tags: ['方案'] },
  { id: 3002, projectId: 3, name: '商务报价模型复核',           status: 'not_started', priority: 'medium', dueDate: '2026-04-25' },
  { id: 3003, projectId: 3, name: '与客户IT对齐集成范围',       status: 'done', completedAt: '2026-04-21', priority: 'high' },

  // 招商银行 运维 (id 4)
  { id: 4001, projectId: 4, name: '月度健康度报告',             status: 'not_started', priority: 'medium', dueDate: '2026-04-30' },
  { id: 4002, projectId: 4, name: '跟进P2工单：批处理超时',     status: 'in_progress', priority: 'medium', dueDate: '2026-04-25', tags: ['工单'] },
  { id: 4003, projectId: 4, name: '对公信贷-利率变动配置',       status: 'done', completedAt: '2026-04-18', priority: 'high' },

  // 国网华北 POC (id 5)
  { id: 5001, projectId: 5, name: 'POC 环境搭建确认',            status: 'in_progress', priority: 'high', startDate: '2026-04-22', dueDate: '2026-04-23', tags: ['POC'] },
  { id: 5002, projectId: 5, name: '准备调度场景演示脚本',         status: 'not_started', priority: 'medium', dueDate: '2026-04-28' },

  // 京东健康 (id 6)
  { id: 6001, projectId: 6, name: '处方外流接口 SIT',            status: 'in_progress', priority: 'high', dueDate: '2026-04-24', tags: ['接口'] },
  { id: 6002, projectId: 6, name: '药师审核界面走查',             status: 'not_started', priority: 'medium', startDate: '2026-04-24', dueDate: '2026-04-26' },
  { id: 6003, projectId: 6, name: '合规问题反馈收敛',             status: 'done', completedAt: '2026-04-19', priority: 'medium' },
]

export function tasksForProject(projectId: number): Task[] {
  return TASKS.filter(t => t.projectId === projectId)
}

export function todayTasks(): Task[] {
  // Per spec §5.4: status != 'done' AND (due_date <= today OR start_date <= today)
  return TASKS.filter(t => {
    if (t.status === 'done') return false
    return (t.dueDate != null && t.dueDate <= TODAY) || (t.startDate != null && t.startDate <= TODAY)
  })
}

export function projectById(id: number): Project | undefined {
  return [...PROJECTS, ...ARCHIVED].find(p => p.id === id)
}

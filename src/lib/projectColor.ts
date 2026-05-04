import type { Project } from './types'

const PROJECT_PALETTE = [
  '#C9622D',
  '#2D8A4E',
  '#2F7D8C',
  '#4E78A8',
  '#8B6F2A',
  '#A35362',
  '#6E6AA8',
  '#5E7D3A',
] as const

function hashProjectKey(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash
}

export function projectColorFor(project: Pick<Project, 'id' | 'name' | 'color'> | null | undefined) {
  if (project?.color) return project.color
  const key = project ? `${project.id}:${project.name}` : 'fallback'
  return PROJECT_PALETTE[hashProjectKey(key) % PROJECT_PALETTE.length]
}

export function projectColorForId(projectId: number) {
  return PROJECT_PALETTE[Math.abs(projectId) % PROJECT_PALETTE.length]
}

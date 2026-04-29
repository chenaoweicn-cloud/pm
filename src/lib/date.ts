export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const TODAY = isoDate(new Date())

export function formatDate(iso?: string): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日`
}

export function relDate(iso?: string): string {
  if (!iso) return ''
  const todayDate = new Date()
  const todayStr = isoDate(todayDate)
  if (iso === todayStr) return '今天'
  const diffMs = +new Date(iso) - +new Date(todayStr)
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays === -1) return '昨天'
  if (diffDays === 1) return '明天'
  if (diffDays < 0) return `逾期 ${-diffDays} 天`
  return `${diffDays} 天后`
}

export function todayIso(): string { return isoDate(new Date()) }

export function thisWeekRange(): { start: string; endExclusive: string } {
  const now = new Date()
  const day = now.getDay() || 7  // Sunday=7, week starts Monday
  const start = new Date(now); start.setDate(now.getDate() - day + 1); start.setHours(0,0,0,0)
  const end = new Date(start); end.setDate(start.getDate() + 7)
  return { start: isoDate(start), endExclusive: isoDate(end) }
}

export function thisMonthRange(): { start: string; endExclusive: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: isoDate(start), endExclusive: isoDate(end) }
}

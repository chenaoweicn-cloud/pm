// Frozen "today" so the prototype renders deterministically against the
// mock dataset. When wired to the real backend, replace with a live date.
export const TODAY = '2026-04-23'

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(iso?: string): string {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${parseInt(m, 10)}月${parseInt(d, 10)}日`
}

export function relDate(iso?: string): string {
  if (!iso) return ''
  if (iso === TODAY) return '今天'
  if (iso === '2026-04-22') return '昨天'
  if (iso === '2026-04-24') return '明天'
  if (iso < TODAY) {
    const days = Math.round((+new Date(TODAY) - +new Date(iso)) / 86400000)
    return `逾期 ${days} 天`
  }
  const days = Math.round((+new Date(iso) - +new Date(TODAY)) / 86400000)
  return `${days} 天后`
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

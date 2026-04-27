// Frozen "today" so the prototype renders deterministically against the
// mock dataset. When wired to the real backend, replace with a live date.
export const TODAY = '2026-04-23'

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

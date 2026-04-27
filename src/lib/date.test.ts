import { describe, it, expect } from 'vitest'
import { isoDate, formatDate, relDate, TODAY } from './date'

describe('isoDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 3, 23))).toBe('2026-04-23')
  })
})

describe('formatDate', () => {
  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })
  it('formats ISO date as M月D日', () => {
    expect(formatDate('2026-04-23')).toBe('4月23日')
  })
})

describe('relDate', () => {
  it('returns 今天 for TODAY', () => {
    expect(relDate(TODAY)).toBe('今天')
  })
  it('returns 昨天 for yesterday', () => {
    expect(relDate('2026-04-22')).toBe('昨天')
  })
  it('returns 明天 for tomorrow', () => {
    expect(relDate('2026-04-24')).toBe('明天')
  })
})

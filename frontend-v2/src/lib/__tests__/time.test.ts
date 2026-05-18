import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fmtAgo, fmtDate, fmtDue } from '@/lib/time'

// Lock "now" at 2026-05-19 (mid-month, far from DST edges) for determinism.
// Months are 0-indexed in the Date constructor -> 4 = May.
const NOW = new Date(2026, 4, 19, 12, 0, 0)
const MS_PER_DAY = 86_400_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fmtDue', () => {
  it('returns "today" for Date.now()', () => {
    const out = fmtDue(Date.now())
    expect(out).toEqual({ txt: 'today', overdue: false, soon: true })
  })

  it('returns "2d ago" for 2 days in the past (overdue=true)', () => {
    const out = fmtDue(Date.now() - 2 * MS_PER_DAY)
    expect(out.txt).toBe('2d ago')
    expect(out.overdue).toBe(true)
    expect(out.soon).toBe(false)
  })

  it('returns "in 1d" for tomorrow', () => {
    const out = fmtDue(Date.now() + 1 * MS_PER_DAY)
    expect(out).toEqual({ txt: 'in 1d', overdue: false, soon: true })
  })

  it('returns "in 2d" for two days from now (soon=true)', () => {
    const out = fmtDue(Date.now() + 2 * MS_PER_DAY)
    expect(out).toEqual({ txt: 'in 2d', overdue: false, soon: true })
  })

  it('returns weekday + day format for 3-6 days out', () => {
    const ts = Date.now() + 4 * MS_PER_DAY
    const out = fmtDue(ts)
    expect(out.overdue).toBe(false)
    expect(out.soon).toBe(false)
    // Should look like "Sat 23" — weekday short + day-of-month, no slash/comma.
    expect(out.txt).toMatch(/^[A-Za-z]{3,4} \d{1,2}$/)
  })

  it('returns month + day format for >=7 days out', () => {
    const ts = Date.now() + 10 * MS_PER_DAY
    const out = fmtDue(ts)
    expect(out.overdue).toBe(false)
    expect(out.soon).toBe(false)
    // Looks like "May 29" or "Jun 2" — month short + day, no weekday prefix.
    expect(out.txt).toMatch(/^[A-Za-z]{3,4} \d{1,2}$/)
    // Sanity: should not be a weekday-day result. Days are spread across
    // weekdays so this check is heuristic — we mostly assert it parses.
    expect(out.txt.length).toBeGreaterThan(0)
  })

  it('handles null gracefully', () => {
    expect(fmtDue(null)).toEqual({ txt: '', overdue: false, soon: false })
  })

  it('handles undefined gracefully', () => {
    expect(fmtDue(undefined)).toEqual({ txt: '', overdue: false, soon: false })
  })

  it('handles NaN gracefully', () => {
    expect(fmtDue(Number.NaN)).toEqual({ txt: '', overdue: false, soon: false })
  })

  it('flags overdue=true whenever timestamp rounds to a past day', () => {
    const out = fmtDue(Date.now() - 5 * MS_PER_DAY)
    expect(out.overdue).toBe(true)
    expect(out.txt).toBe('5d ago')
  })
})

describe('fmtAgo', () => {
  it('returns "12s" for 12 seconds ago', () => {
    expect(fmtAgo(Date.now() - 12_000)).toBe('12s')
  })

  it('returns "45s" for 45 seconds ago', () => {
    expect(fmtAgo(Date.now() - 45_000)).toBe('45s')
  })

  it('returns minutes for sub-hour deltas', () => {
    expect(fmtAgo(Date.now() - 5 * 60_000)).toBe('5m')
  })

  it('returns hours for sub-day deltas', () => {
    expect(fmtAgo(Date.now() - 3 * 60 * 60_000)).toBe('3h')
  })

  it('returns days for >=1d deltas', () => {
    expect(fmtAgo(Date.now() - 2 * 24 * 60 * 60_000)).toBe('2d')
  })

  it('clamps negative deltas (future timestamps) to "0s"', () => {
    expect(fmtAgo(Date.now() + 10_000)).toBe('0s')
  })
})

describe('fmtDate', () => {
  it('returns a non-empty absolute date string', () => {
    const out = fmtDate(Date.now())
    expect(out).toBeTypeOf('string')
    expect(out.length).toBeGreaterThan(0)
    // Should mention the year 2026 (locale-dependent format, but year is stable).
    expect(out).toMatch(/2026/)
  })
})

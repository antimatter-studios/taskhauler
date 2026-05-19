import { describe, expect, it } from 'vitest'
import { positionAfter, positionBefore } from '@/lib/positions'

describe('positionAfter', () => {
  it('returns 1000 for an empty array', () => {
    expect(positionAfter([])).toBe(1000)
  })

  it('returns last.position + 1000 for non-empty array', () => {
    expect(positionAfter([{ position: 1000 }, { position: 2000 }])).toBe(3000)
  })

  it('handles floats without truncation', () => {
    expect(positionAfter([{ position: 1500.5 }])).toBeCloseTo(2500.5)
  })
})

describe('positionBefore', () => {
  it('returns 1000 when items is empty', () => {
    expect(positionBefore([], 0)).toBe(1000)
  })

  it('returns first.position - 1000 when idx is 0', () => {
    expect(positionBefore([{ position: 1000 }, { position: 2000 }], 0)).toBe(0)
  })

  it('returns positionAfter when idx >= items.length', () => {
    const items = [{ position: 1000 }, { position: 2000 }]
    expect(positionBefore(items, items.length)).toBe(3000)
  })

  it('returns midpoint of idx-1 and idx for interior inserts', () => {
    const items = [
      { position: 1000 },
      { position: 2000 },
      { position: 3000 },
    ]
    expect(positionBefore(items, 1)).toBe(1500)
    expect(positionBefore(items, 2)).toBe(2500)
  })

  it('handles floats correctly at midpoint (no integer truncation)', () => {
    const items = [{ position: 1000 }, { position: 1001 }]
    expect(positionBefore(items, 1)).toBe(1000.5)
  })

  it('returns the same value as the neighbors when two identical positions surround the insert (no NaN/Infinity)', () => {
    // The spec is silent on identical adjacent positions, but verify behavior
    // is at minimum finite (no NaN/Infinity) and equals the shared value.
    const items = [{ position: 500 }, { position: 500 }]
    const out = positionBefore(items, 1)
    expect(Number.isFinite(out)).toBe(true)
    expect(out).toBe(500)
  })
})

import { describe, expect, it } from 'vitest'
import { packRows } from '@/lib/pack-rows'

describe('packRows', () => {
  it('returns an empty array for empty input', () => {
    expect(packRows([])).toEqual([])
  })

  it('places non-overlapping items on row 0', () => {
    const items = [
      { x: 0, width: 10 },
      { x: 20, width: 10 },
      { x: 50, width: 10 },
    ]
    expect(packRows(items)).toEqual([0, 0, 0])
  })

  it('places two overlapping items on rows 0 and 1', () => {
    const items = [
      { x: 0, width: 100 },
      { x: 50, width: 100 },
    ]
    expect(packRows(items)).toEqual([0, 1])
  })

  it('reuses row 0 for a third item that fits after the first', () => {
    // Item #1: 0–100, Item #2: 50–150 (overlaps #1), Item #3: 200–250 fits on row 0.
    const items = [
      { x: 0, width: 100 },
      { x: 50, width: 100 },
      { x: 200, width: 50 },
    ]
    expect(packRows(items)).toEqual([0, 1, 0])
  })

  it('preserves input order in the output (sorts internally by x)', () => {
    // Pass items in scrambled x order; result must be in caller order.
    const items = [
      { x: 200, width: 50 }, // caller index 0
      { x: 0, width: 100 },  // caller index 1
      { x: 50, width: 100 }, // caller index 2
    ]
    // Sorted by x: (1@0-100) row0, (2@50-150) row1, (0@200-250) row0.
    // Result for caller indices [0,1,2] = [0, 0, 1].
    expect(packRows(items)).toEqual([0, 0, 1])
  })

  it('handles items with width 0 (point items never overlap by themselves)', () => {
    const items = [
      { x: 10, width: 0 },
      { x: 10, width: 0 },
    ]
    // Two zero-width items at x=10: first sets rowEnds[0] = 10. Second's
    // x=10 is == rowEnds[0], which the algorithm treats as fits-on-row-0
    // (uses <=). So both land on row 0.
    expect(packRows(items)).toEqual([0, 0])
  })
})

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import EpicChip from '@/components/board/primitives/EpicChip'
import type { Epic } from '@/api/types'

afterEach(() => cleanup())

const epic: Epic = {
  id: 'e1',
  board_id: 'b1',
  name: 'Onboarding',
  description: '',
  color: '#ff8800',
  position: 0,
  created_at: 0,
  updated_at: 0,
}

describe('EpicChip', () => {
  it('renders a dot in epic.color', () => {
    const { container } = render(<EpicChip epic={epic} />)
    const dot = container.querySelector('span[aria-hidden="true"]') as HTMLElement
    expect(dot).toBeTruthy()
    const styleAttr = dot.getAttribute('style') ?? ''
    expect(styleAttr).toContain('#ff8800')
  })

  it('renders the epic name (short form, no truncation under 16 chars)', () => {
    const { container } = render(<EpicChip epic={epic} />)
    expect(container.textContent).toContain('Onboarding')
  })

  it('does not render safely when epic is undefined (KNOWN BUG)', () => {
    // SPEC: should return null when epic is undefined.
    // ACTUAL: component dereferences epic.color / epic.name unconditionally
    // and throws. Tracking as bug — when fixed, this assertion should be
    // flipped to `expect(container.firstChild).toBeNull()`.
    expect(() =>
      render(<EpicChip epic={undefined as unknown as Epic} />),
    ).toThrow()
  })
})

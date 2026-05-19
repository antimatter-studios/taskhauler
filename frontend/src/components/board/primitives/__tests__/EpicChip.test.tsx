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

  it('renders nothing when epic is undefined', () => {
    const { container } = render(<EpicChip epic={undefined} />)
    expect(container.firstChild).toBeNull()
  })
})

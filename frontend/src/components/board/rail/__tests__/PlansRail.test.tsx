import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import PlansRail from '@/components/board/rail/PlansRail'
import { MOCK_PROPOSALS } from '@/mock/proposals'

afterEach(() => {
  cleanup()
})

describe('PlansRail', () => {
  it('renders the pending section with the correct count', () => {
    const { container } = render(<PlansRail />)
    const pendingCount = MOCK_PROPOSALS.filter((p) => p.status === 'pending').length
    expect(container.textContent).toContain(`${pendingCount} pending`)
    expect(container.textContent).toContain('waiting for review')
  })

  it('renders the recently-decided section when there are non-pending proposals', () => {
    const { container } = render(<PlansRail />)
    const decidedCount = MOCK_PROPOSALS.filter((p) => p.status !== 'pending').length
    if (decidedCount > 0) {
      expect(container.textContent).toContain('recently decided')
    }
  })

  it('renders each proposal title from MOCK_PROPOSALS', () => {
    const { container } = render(<PlansRail />)
    for (const p of MOCK_PROPOSALS) {
      expect(container.textContent).toContain(p.title)
    }
  })

  it('renders PENDING / APPROVED / REJECTED status badges where applicable', () => {
    const { container } = render(<PlansRail />)
    expect(container.textContent).toContain('PENDING')
    // From MOCK_PROPOSALS there's at least one approved + one rejected.
    expect(container.textContent).toContain('APPROVED')
    expect(container.textContent).toContain('REJECTED')
  })

  it('renders Approve / Reject / Edit buttons for the auto-expanded first pending proposal', () => {
    const { container } = render(<PlansRail />)
    expect(container.textContent).toContain('Approve')
    expect(container.textContent).toContain('Reject')
    expect(container.textContent).toContain('Edit')
  })

  it('renders atomic action kinds inside the expanded proposal body', () => {
    const { container } = render(<PlansRail />)
    // The first pending proposal (p1) has actions: priority, label, assign.
    // The kind label is the raw lowercase string (uppercase comes via CSS
    // text-transform). Body text includes the action summaries too.
    const txt = container.textContent ?? ''
    expect(txt).toContain('priority')
    expect(txt).toContain('label')
    expect(txt).toContain('assign')
    // Body should mention specific target card numbers from p1's actions.
    expect(txt).toContain('HAUL-129')
    expect(txt).toContain('HAUL-146')
  })

  it('renders the "Propose a plan" CTA button at the bottom', () => {
    const { container } = render(<PlansRail />)
    expect(container.textContent).toContain('Propose a plan')
  })
})

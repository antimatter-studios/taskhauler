import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import ActivityRail from '@/components/board/rail/ActivityRail'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'

beforeEach(() => {
  useKanbanStore.setState({
    boards: [],
    activeBoardId: null,
    columns: [],
    epics: [],
    cards: [],
    loading: false,
    error: null,
  })
  useBoardUIStore.setState({
    view: 'kanban',
    grouping: 'col',
    filterAssignee: 'all',
    consoleOpen: true,
    railTab: 'activity',
    selectedCardId: null,
    focusedCardId: null,
    searchQuery: '',
  })
})

afterEach(() => {
  cleanup()
})

describe('ActivityRail', () => {
  it('renders the four filter chip labels', () => {
    const { container } = render(<ActivityRail />)
    expect(container.textContent).toContain('All')
    expect(container.textContent).toContain('Agents')
    expect(container.textContent).toContain('Comments')
    expect(container.textContent).toContain('Ships')
  })

  it('renders the three time-bucket section headers', () => {
    const { container } = render(<ActivityRail />)
    expect(container.textContent).toContain('JUST NOW')
    expect(container.textContent).toContain('EARLIER TODAY')
    expect(container.textContent).toContain('YESTERDAY+')
  })

  it('renders kind badges (e.g. AGENT, NOTE, MOVE, SHIP) from the activity feed', () => {
    const { container } = render(<ActivityRail />)
    expect(container.textContent).toContain('AGENT')
    expect(container.textContent).toContain('MOVE')
    expect(container.textContent).toContain('SHIP')
  })

  it('applies a fade-in animation to the newest "just now" event', () => {
    const { container } = render(<ActivityRail />)
    const animated = Array.from(
      container.querySelectorAll<HTMLElement>('div[style*="animation"]'),
    ).filter((el) => (el.getAttribute('style') ?? '').includes('fade-in'))
    expect(animated.length).toBeGreaterThan(0)
  })

  it('filtering by "Ships" hides AGENT-kind events from view', () => {
    const { container, getByText } = render(<ActivityRail />)
    // Sanity: AGENT badge present pre-filter.
    expect(container.textContent).toContain('AGENT')
    fireEvent.click(getByText('Ships'))
    // After filter, the visible body should not include AGENT badges.
    // (The filter chip label "Agents" still appears, so we check the badge.)
    const txt = container.textContent ?? ''
    // SHIP should be present (we kept ships); AGENT badge should be gone.
    expect(txt).toContain('SHIP')
    // Use a regex on the badge marker (1px-bordered "AGENT" string in body).
    // The most reliable assertion is that the AGENT-only events' text is gone.
    expect(txt).not.toContain('virtualization patch')
  })

  it('filter chip becomes visually active on click', () => {
    const { getByText } = render(<ActivityRail />)
    const commentsBtn = getByText('Comments')
    fireEvent.click(commentsBtn)
    const style = commentsBtn.getAttribute('style') ?? ''
    // Active state uses accent border + accent-bg background.
    expect(style).toContain('var(--accent)')
  })
})

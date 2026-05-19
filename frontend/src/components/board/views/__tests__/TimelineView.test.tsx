import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TimelineView } from '@/components/board/views/TimelineView'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_AGENTS } from '@/mock/agents'
import type { Board, Column, Card, Epic } from '@/api/types'

const board: Board = {
  id: 'b-t',
  name: 'TL Board',
  prefix: 'TL',
  description: '',
  created_at: 0,
  updated_at: 0,
}

const columns: Column[] = [
  { id: 'c-todo', board_id: 'b-t', name: 'Todo', position: 0, created_at: 0, updated_at: 0 },
  { id: 'c-done', board_id: 'b-t', name: 'Done', position: 1, created_at: 0, updated_at: 0 },
]

const epics: Epic[] = []

function mkCard(over: Partial<Card> & { id: string; number: number }): Card {
  return {
    id: over.id,
    number: over.number,
    board_id: 'b-t',
    column_id: 'c-todo',
    epic_id: '',
    title: `Card ${over.number}`,
    description: '',
    card_type: 'task',
    priority: 'medium',
    assignee_id: 0,
    assignee_agent: '',
    assignee_name: '',
    labels: '',
    due_date: null,
    position: over.number * 1000,
    created_at: 0,
    updated_at: 0,
    ...over,
  }
}

beforeEach(() => {
  useBoardUIStore.setState({
    view: 'timeline',
    grouping: 'col',
    filterAssignee: 'all',
    consoleOpen: true,
    railTab: 'console',
    selectedCardId: null,
    focusedCardId: null,
    searchQuery: '',
  })
  useAuthStore.setState({ user: null, loading: false, error: null })
})

afterEach(() => {
  cleanup()
  useKanbanStore.setState({ boards: [], activeBoardId: null, columns: [], epics: [], cards: [] })
})

describe('TimelineView', () => {
  it('renders all MOCK_AGENTS as agent lanes with @name labels', () => {
    useKanbanStore.setState({
      boards: [board],
      activeBoardId: 'b-t',
      columns,
      epics,
      cards: [],
      loading: false,
      error: null,
    })
    const { container } = render(<TimelineView />)
    for (const agent of MOCK_AGENTS) {
      expect(container.textContent).toContain(`@${agent.name}`)
    }
  })

  it('renders an Unassigned lane', () => {
    useKanbanStore.setState({
      boards: [board],
      activeBoardId: 'b-t',
      columns,
      epics,
      cards: [],
      loading: false,
      error: null,
    })
    const { container } = render(<TimelineView />)
    expect(container.textContent).toContain('Unassigned')
  })

  it('renders a user lane when a card has a user assignee', () => {
    const cards: Card[] = [
      mkCard({ id: 't1', number: 1, assignee_id: 101, assignee_name: 'Mira Chen' }),
    ]
    useKanbanStore.setState({
      boards: [board],
      activeBoardId: 'b-t',
      columns,
      epics,
      cards,
      loading: false,
      error: null,
    })
    const { container } = render(<TimelineView />)
    // MOCK_USERS resolves id 101 → "Mira Chen"
    expect(container.textContent).toContain('Mira Chen')
  })

  it('shows the empty-state message for lanes with no cards', () => {
    useKanbanStore.setState({
      boards: [board],
      activeBoardId: 'b-t',
      columns,
      epics,
      cards: [],
      loading: false,
      error: null,
    })
    const { container } = render(<TimelineView />)
    expect(container.textContent).toContain('no haul scheduled')
  })

  it('renders a positioned TimelineBar (style.left set) when a card has a due date in a lane', () => {
    const tomorrow = Date.now() + 86_400_000
    const cards: Card[] = [
      mkCard({
        id: 't-pos',
        number: 7,
        assignee_agent: 'relay',
        due_date: tomorrow,
      }),
    ]
    useKanbanStore.setState({
      boards: [board],
      activeBoardId: 'b-t',
      columns,
      epics,
      cards,
      loading: false,
      error: null,
    })
    const { container } = render(<TimelineView />)
    // The card prefix + number should appear inside the timeline bar.
    expect(container.textContent).toContain('TL-7')
    // Find a positioned element that came from TimelineBar (absolute + left:Npx).
    const positioned = Array.from(
      container.querySelectorAll<HTMLElement>('div[style*="position: absolute"]'),
    ).filter((el) => /left:\s*\d+(\.\d+)?px/.test(el.getAttribute('style') ?? ''))
    expect(positioned.length).toBeGreaterThan(0)
  })

  it('omits done-column cards from the timeline body', () => {
    const cards: Card[] = [
      mkCard({
        id: 't-shipped',
        number: 99,
        assignee_agent: 'relay',
        column_id: 'c-done',
        due_date: Date.now() + 86_400_000,
      }),
    ]
    useKanbanStore.setState({
      boards: [board],
      activeBoardId: 'b-t',
      columns,
      epics,
      cards,
      loading: false,
      error: null,
    })
    const { container } = render(<TimelineView />)
    expect(container.textContent).not.toContain('TL-99')
  })
})

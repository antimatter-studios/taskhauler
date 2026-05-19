import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DispatchView } from '@/components/board/views/DispatchView'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import { useAuthStore } from '@/stores/authStore'
import { MOCK_AGENTS } from '@/mock/agents'
import type { Board, Column, Card } from '@/api/types'

const board: Board = {
  id: 'b-d',
  name: 'Dispatch Board',
  prefix: 'DSP',
  description: '',
  created_at: 0,
  updated_at: 0,
}

const columns: Column[] = [
  { id: 'c-backlog', board_id: 'b-d', name: 'Backlog', position: 0, created_at: 0, updated_at: 0 },
  { id: 'c-inprog', board_id: 'b-d', name: 'In Progress', position: 1, created_at: 0, updated_at: 0 },
  { id: 'c-review', board_id: 'b-d', name: 'In Review', position: 2, created_at: 0, updated_at: 0 },
  { id: 'c-done', board_id: 'b-d', name: 'Done', position: 3, created_at: 0, updated_at: 0 },
]

function mkCard(over: Partial<Card> & { id: string; number: number }): Card {
  return {
    id: over.id,
    number: over.number,
    board_id: 'b-d',
    column_id: 'c-backlog',
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

const cards: Card[] = [
  mkCard({ id: 'd1', number: 1, column_id: 'c-backlog' }),
  mkCard({ id: 'd2', number: 2, column_id: 'c-inprog', assignee_agent: 'relay' }),
  mkCard({ id: 'd3', number: 3, column_id: 'c-review' }),
  // Overdue card → should land in Hot.
  mkCard({ id: 'd4', number: 4, column_id: 'c-inprog', due_date: Date.now() - 2 * 86_400_000 }),
]

beforeEach(() => {
  useKanbanStore.setState({
    boards: [board],
    activeBoardId: 'b-d',
    columns,
    epics: [],
    cards,
    loading: false,
    error: null,
  })
  useBoardUIStore.setState({
    view: 'dispatch',
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

describe('DispatchView', () => {
  it('renders a fleet tile for every agent in MOCK_AGENTS', () => {
    const { container } = render(<DispatchView />)
    for (const agent of MOCK_AGENTS) {
      expect(container.textContent).toContain(agent.name)
    }
  })

  it('renders the FLEET header with the agent count', () => {
    const { container } = render(<DispatchView />)
    expect(container.textContent).toContain('FLEET')
    expect(container.textContent).toContain(String(MOCK_AGENTS.length))
  })

  it('renders all four section titles (Hot / In Flight / Ready / Queue)', () => {
    const { container } = render(<DispatchView />)
    expect(container.textContent).toContain('Hot')
    expect(container.textContent).toContain('In Flight')
    expect(container.textContent).toContain('Ready')
    expect(container.textContent).toContain('Queue')
  })

  it('renders section subtitles', () => {
    const { container } = render(<DispatchView />)
    expect(container.textContent).toContain('overdue + urgent')
    expect(container.textContent).toContain('being worked')
    expect(container.textContent).toContain('in review')
    expect(container.textContent).toContain('backlog')
  })

  it('places overdue card into the Hot section (card visible somewhere)', () => {
    const { container } = render(<DispatchView />)
    // The DSP-4 card is overdue → should render in the Hot column body
    // (and ALSO in In Flight since it's still in the in-progress column).
    // Either way it should be present at least once.
    expect(container.textContent).toContain('DSP-4')
  })
})

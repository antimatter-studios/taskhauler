import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TerminalView } from '@/components/board/views/TerminalView'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import { useAuthStore } from '@/stores/authStore'
import type { Board, Column, Card } from '@/api/types'

const board: Board = {
  id: 'b-term',
  name: 'Term Board',
  prefix: 'HAUL',
  description: '',
  created_at: 0,
  updated_at: 0,
}

const columns: Column[] = [
  { id: 'c-todo', board_id: 'b-term', name: 'Todo', position: 0, created_at: 0, updated_at: 0 },
  { id: 'c-doing', board_id: 'b-term', name: 'In Progress', position: 1, created_at: 0, updated_at: 0 },
  { id: 'c-done', board_id: 'b-term', name: 'Done', position: 2, created_at: 0, updated_at: 0 },
]

function mkCard(over: Partial<Card> & { id: string; number: number }): Card {
  return {
    id: over.id,
    number: over.number,
    board_id: 'b-term',
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

const cards: Card[] = [
  mkCard({ id: 't1', number: 1, column_id: 'c-todo', priority: 'urgent' }),
  // relay is "working" per MOCK_TELEMETRY → should produce "● live" indicator.
  mkCard({ id: 't2', number: 2, column_id: 'c-doing', priority: 'high', assignee_agent: 'relay' }),
  mkCard({ id: 't3', number: 3, column_id: 'c-done', priority: 'low' }),
]

beforeEach(() => {
  useKanbanStore.setState({
    boards: [board],
    activeBoardId: 'b-term',
    columns,
    epics: [],
    cards,
    loading: false,
    error: null,
  })
  useBoardUIStore.setState({
    view: 'terminal',
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

describe('TerminalView', () => {
  it('renders the monospace prompt header', () => {
    const { container } = render(<TerminalView />)
    expect(container.textContent).toContain('board --list --group=column')
  })

  it('renders one section per column with the section divider character', () => {
    const { container } = render(<TerminalView />)
    expect(container.textContent).toContain('┌── TODO')
    expect(container.textContent).toContain('┌── IN PROGRESS')
    expect(container.textContent).toContain('┌── DONE')
  })

  it('renders HAUL-N prefix for each card', () => {
    const { container } = render(<TerminalView />)
    expect(container.textContent).toContain('HAUL-1')
    expect(container.textContent).toContain('HAUL-2')
    expect(container.textContent).toContain('HAUL-3')
  })

  it('renders the "● live" indicator for a card assigned to a working agent', () => {
    const { container } = render(<TerminalView />)
    // relay is in MOCK_TELEMETRY with status="working"
    expect(container.textContent).toContain('● live')
  })

  it('uses the board prefix in card numbers and applies a monospace font family', () => {
    const { container } = render(<TerminalView />)
    const root = container.firstChild as HTMLElement
    const style = root.getAttribute('style') ?? ''
    expect(style).toContain('var(--font-mono)')
  })

  it('shows section count badge with zero-padded count', () => {
    const { container } = render(<TerminalView />)
    // Each column has exactly 1 card → "[01]" badge.
    expect(container.textContent).toContain('[01]')
  })
})

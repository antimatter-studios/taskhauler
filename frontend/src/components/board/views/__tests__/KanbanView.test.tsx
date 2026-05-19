import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { KanbanView } from '@/components/board/views/KanbanView'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import { useAuthStore } from '@/stores/authStore'
import type { Board, Column, Card, Epic } from '@/api/types'

const board: Board = {
  id: 'b-test',
  name: 'Test Board',
  prefix: 'TST',
  description: '',
  created_at: 0,
  updated_at: 0,
}

const columns: Column[] = [
  { id: 'c-backlog', board_id: 'b-test', name: 'Backlog', position: 0, created_at: 0, updated_at: 0 },
  { id: 'c-inprogress', board_id: 'b-test', name: 'In Progress', position: 1, created_at: 0, updated_at: 0 },
  { id: 'c-done', board_id: 'b-test', name: 'Done', position: 2, created_at: 0, updated_at: 0 },
]

const epics: Epic[] = [
  { id: 'e-1', board_id: 'b-test', name: 'Onboarding', description: '', color: '#ff00aa', position: 0, created_at: 0, updated_at: 0 },
  { id: 'e-2', board_id: 'b-test', name: 'Billing', description: '', color: '#00aaff', position: 1, created_at: 0, updated_at: 0 },
]

function mkCard(over: Partial<Card> & { id: string; number: number }): Card {
  return {
    id: over.id,
    number: over.number,
    board_id: 'b-test',
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
  mkCard({ id: 'k1', number: 1, column_id: 'c-backlog', priority: 'urgent', epic_id: 'e-1' }),
  mkCard({ id: 'k2', number: 2, column_id: 'c-inprogress', priority: 'high', epic_id: 'e-1', assignee_agent: 'relay' }),
  mkCard({ id: 'k3', number: 3, column_id: 'c-done', priority: 'low', epic_id: 'e-2', assignee_id: 101, assignee_name: 'Mira' }),
  mkCard({ id: 'k4', number: 4, column_id: 'c-backlog', priority: 'medium', due_date: Date.now() + 86_400_000 }),
]

beforeEach(() => {
  useKanbanStore.setState({
    boards: [board],
    activeBoardId: 'b-test',
    columns,
    epics,
    cards,
    loading: false,
    error: null,
  })
  useBoardUIStore.setState({
    view: 'kanban',
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
  useBoardUIStore.setState({
    view: 'kanban',
    grouping: 'col',
    filterAssignee: 'all',
    selectedCardId: null,
    focusedCardId: null,
    searchQuery: '',
  })
})

describe('KanbanView', () => {
  it('renders one column per store column with column names visible', () => {
    const { container } = render(<KanbanView />)
    expect(container.textContent).toContain('Backlog')
    expect(container.textContent).toContain('In Progress')
    expect(container.textContent).toContain('Done')
  })

  it('renders cards with the board prefix', () => {
    const { container } = render(<KanbanView />)
    // Cards render TST-N via KanbanCard. At least one number should appear.
    expect(container.textContent).toContain('TST-1')
    expect(container.textContent).toContain('TST-2')
    expect(container.textContent).toContain('TST-3')
  })

  it('switching grouping to "priority" replaces columns with priority buckets', () => {
    useBoardUIStore.setState({ grouping: 'priority' })
    const { container } = render(<KanbanView />)
    expect(container.textContent).toContain('Urgent')
    expect(container.textContent).toContain('High')
    expect(container.textContent).toContain('Medium')
    expect(container.textContent).toContain('Low')
    // The original column names should not appear as group labels.
    // (We only check that "In Progress" is not present as a column header.)
    expect(container.textContent).not.toContain('In Progress')
  })

  it('switching grouping to "epic" renders one bucket per epic plus "No epic"', () => {
    useBoardUIStore.setState({ grouping: 'epic' })
    const { container } = render(<KanbanView />)
    expect(container.textContent).toContain('Onboarding')
    expect(container.textContent).toContain('Billing')
    expect(container.textContent).toContain('No epic')
  })

  it('switching grouping to "assignee" includes an agent lane and unassigned lane', () => {
    useBoardUIStore.setState({ grouping: 'assignee' })
    const { container } = render(<KanbanView />)
    expect(container.textContent).toContain('@relay')
    // Some unassigned cards exist (k1, k4) → "Unassigned" lane should appear.
    expect(container.textContent).toContain('Unassigned')
  })

  it('switching grouping to "due" shows the time-bucket lanes', () => {
    useBoardUIStore.setState({ grouping: 'due' })
    const { container } = render(<KanbanView />)
    expect(container.textContent).toContain('Overdue')
    expect(container.textContent).toContain('Today')
    expect(container.textContent).toContain('This week')
    expect(container.textContent).toContain('Later')
    expect(container.textContent).toContain('No due date')
  })
})

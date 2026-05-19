import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import CardDetailPanel from '@/components/board/rail/CardDetailPanel'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import type { Board, Column, Card, Epic, Comment } from '@/api/types'

const board: Board = {
  id: 'b-cd',
  name: 'Card Detail Board',
  prefix: 'CDP',
  description: '',
  created_at: 0,
  updated_at: 0,
}

const columns: Column[] = [
  { id: 'c-todo', board_id: 'b-cd', name: 'Todo', position: 0, created_at: 0, updated_at: 0 },
  { id: 'c-done', board_id: 'b-cd', name: 'Done', position: 1, created_at: 0, updated_at: 0 },
]

const epics: Epic[] = [
  { id: 'e-x', board_id: 'b-cd', name: 'Platform', description: '', color: '#88ccff', position: 0, created_at: 0, updated_at: 0 },
]

function mkCard(over: Partial<Card> & { id: string; number: number }): Card {
  return {
    id: over.id,
    number: over.number,
    board_id: 'b-cd',
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

const TOMORROW = Date.now() + 86_400_000

const cardFull: Card = mkCard({
  id: 'card-full',
  number: 42,
  title: 'Investigate flaky SSO',
  column_id: 'c-todo',
  epic_id: 'e-x',
  priority: 'high',
  assignee_id: 101,
  assignee_name: 'Mira Chen',
  due_date: TOMORROW,
  labels: 'auth,perf',
})

const cardSparse: Card = mkCard({
  id: 'card-sparse',
  number: 7,
  title: 'Minimal card',
  // no epic, no assignee, no due date, no labels, no priority
  priority: '',
  epic_id: '',
})

const listComments = vi.fn(async (_cardId: string): Promise<Comment[]> => [])
const createComment = vi.fn(async (_cardId: string, _body: string): Promise<Comment> => ({
  id: 'c-new',
  card_id: 'card-full',
  author_id: 1,
  author_name: 'Me',
  body: 'x',
  created_at: 0,
}))
const deleteComment = vi.fn(async () => {})

beforeEach(() => {
  listComments.mockClear()
  createComment.mockClear()
  deleteComment.mockClear()
  useKanbanStore.setState({
    boards: [board],
    activeBoardId: 'b-cd',
    columns,
    epics,
    cards: [cardFull, cardSparse],
    loading: false,
    error: null,
    listComments: listComments as unknown as ReturnType<typeof useKanbanStore.getState>['listComments'],
    createComment: createComment as unknown as ReturnType<typeof useKanbanStore.getState>['createComment'],
    deleteComment: deleteComment as unknown as ReturnType<typeof useKanbanStore.getState>['deleteComment'],
  })
  useBoardUIStore.setState({
    view: 'kanban',
    grouping: 'col',
    filterAssignee: 'all',
    consoleOpen: true,
    railTab: 'console',
    selectedCardId: cardFull.id,
    focusedCardId: null,
    searchQuery: '',
  })
})

afterEach(() => {
  cleanup()
})

describe('CardDetailPanel', () => {
  it('renders the selected card title and prefix-N header', () => {
    const { container } = render(<CardDetailPanel cardId={cardFull.id} />)
    expect(container.textContent).toContain('Investigate flaky SSO')
    expect(container.textContent).toContain('CDP-42')
  })

  it('renders the meta grid labels (Status / Priority / Assignee / Epic / Due / Estimate / Labels)', () => {
    const { container } = render(<CardDetailPanel cardId={cardFull.id} />)
    expect(container.textContent).toContain('Status')
    expect(container.textContent).toContain('Priority')
    expect(container.textContent).toContain('Assignee')
    expect(container.textContent).toContain('Epic')
    expect(container.textContent).toContain('Due')
    expect(container.textContent).toContain('Estimate')
    expect(container.textContent).toContain('Labels')
  })

  it('renders the resolved epic name, column name, and assignee name when present', () => {
    const { container } = render(<CardDetailPanel cardId={cardFull.id} />)
    expect(container.textContent).toContain('Todo') // column name
    expect(container.textContent).toContain('Platform') // epic name
    expect(container.textContent).toContain('Mira Chen') // assignee
    expect(container.textContent).toContain('High') // priority capitalised
  })

  it('renders Focus and Close action buttons in the header', () => {
    const { container } = render(<CardDetailPanel cardId={cardFull.id} />)
    expect(container.textContent).toContain('Focus')
    expect(container.textContent).toContain('Close')
  })

  it('null-safe: a sparse card with no epic/assignee/due/priority/labels renders without crashing', () => {
    const { container } = render(<CardDetailPanel cardId={cardSparse.id} />)
    // The component still renders the title and the meta grid.
    expect(container.textContent).toContain('Minimal card')
    expect(container.textContent).toContain('Unassigned')
  })

  it('renders an unknown-card fallback with a Close button when the id is not in the store', () => {
    const { container } = render(<CardDetailPanel cardId="no-such-card" />)
    expect(container.textContent).toContain('Card not found')
    expect(container.textContent).toContain('Close')
  })

  it('clicking Close clears the selectedCardId in boardUIStore', () => {
    const { getAllByText } = render(<CardDetailPanel cardId={cardFull.id} />)
    const closeBtns = getAllByText('Close')
    // The header Close button is the last one (only one in the body).
    fireEvent.click(closeBtns[closeBtns.length - 1])
    expect(useBoardUIStore.getState().selectedCardId).toBeNull()
  })

  it('clicking Focus sets focusedCardId in boardUIStore', () => {
    const { getByText } = render(<CardDetailPanel cardId={cardFull.id} />)
    fireEvent.click(getByText('Focus'))
    expect(useBoardUIStore.getState().focusedCardId).toBe(cardFull.id)
  })
})

// kanbanStore is the central state store for boards/columns/epics/cards.
// Each action calls into apiClient.tasks.* — we mock that whole namespace
// and assert state transitions plus that the right call shape was used.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  apiClient: {
    tasks: {
      listBoards: vi.fn(),
      createBoard: vi.fn(),
      updateBoard: vi.fn(),
      listColumns: vi.fn(),
      createColumn: vi.fn(),
      updateColumn: vi.fn(),
      deleteColumn: vi.fn(),
      listEpics: vi.fn(),
      createEpic: vi.fn(),
      updateEpic: vi.fn(),
      deleteEpic: vi.fn(),
      listCards: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      listComments: vi.fn(),
      createComment: vi.fn(),
      deleteComment: vi.fn(),
    },
  },
}))

import { apiClient } from '@/api/client'
import { useKanbanStore } from '@/stores/kanbanStore'
import type { Board, Card, Column, Epic } from '@/api/types'

const tasks = apiClient.tasks as unknown as Record<string, ReturnType<typeof vi.fn>>

function mkBoard(id: string, name = 'B'): Board {
  return { id, name, prefix: 'TH', description: '', created_at: 0, updated_at: 0 }
}
function mkColumn(id: string, board_id = 'b1', name = 'Todo', position = 0): Column {
  return { id, board_id, name, position, created_at: 0, updated_at: 0 }
}
function mkEpic(id: string, board_id = 'b1', name = 'E'): Epic {
  return { id, board_id, name, description: '', color: '#fff', position: 0, created_at: 0, updated_at: 0 }
}
function mkCard(id: string, overrides: Partial<Card> = {}): Card {
  return {
    id,
    number: 1,
    board_id: 'b1',
    column_id: 'c1',
    epic_id: '',
    title: 'T',
    description: '',
    card_type: 'task',
    priority: '',
    assignee_id: 0,
    assignee_agent: '',
    assignee_name: '',
    labels: '',
    due_date: null,
    position: 0,
    created_at: 0,
    updated_at: 0,
    ...overrides,
  }
}

beforeEach(() => {
  useKanbanStore.setState({
    boards: [],
    columns: [],
    epics: [],
    cards: [],
    activeBoardId: null,
    loading: false,
    error: null,
  })
  for (const key of Object.keys(tasks)) tasks[key].mockReset()
})

describe('kanbanStore initial state', () => {
  it('starts idle (loading=false) with empty collections', () => {
    const s = useKanbanStore.getState()
    expect(s.boards).toEqual([])
    expect(s.columns).toEqual([])
    expect(s.epics).toEqual([])
    expect(s.cards).toEqual([])
    expect(s.activeBoardId).toBeNull()
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
  })
})

describe('kanbanStore boards', () => {
  it('fetchBoards populates boards and clears loading', async () => {
    const boards = [mkBoard('b1'), mkBoard('b2')]
    tasks.listBoards.mockResolvedValue(boards)
    const result = await useKanbanStore.getState().fetchBoards()
    expect(result).toEqual(boards)
    expect(useKanbanStore.getState().boards).toEqual(boards)
    expect(useKanbanStore.getState().loading).toBe(false)
  })

  it('fetchBoards rejected: clears loading and writes error (no longer stuck loading=true forever)', async () => {
    tasks.listBoards.mockRejectedValue(new Error('boom'))
    await expect(useKanbanStore.getState().fetchBoards()).rejects.toThrow('boom')
    const s = useKanbanStore.getState()
    expect(s.loading).toBe(false)
    expect(s.error).toBe('boom')
  })

  it('fetchBoards clears a stale error on success', async () => {
    useKanbanStore.setState({ error: 'stale failure' })
    tasks.listBoards.mockResolvedValue([mkBoard('b1')])
    await useKanbanStore.getState().fetchBoards()
    expect(useKanbanStore.getState().error).toBeNull()
  })

  it('createBoard appends to boards', async () => {
    useKanbanStore.setState({ boards: [mkBoard('b1', 'A')] })
    const next = mkBoard('b2', 'B')
    tasks.createBoard.mockResolvedValue(next)
    await useKanbanStore.getState().createBoard({ name: 'B' })
    expect(useKanbanStore.getState().boards.map((b) => b.id)).toEqual(['b1', 'b2'])
  })

  it('updateBoard replaces the matching board', async () => {
    useKanbanStore.setState({ boards: [mkBoard('b1', 'A'), mkBoard('b2', 'B')] })
    tasks.updateBoard.mockResolvedValue(mkBoard('b2', 'B-renamed'))
    await useKanbanStore.getState().updateBoard('b2', { name: 'B-renamed' })
    expect(useKanbanStore.getState().boards.find((b) => b.id === 'b2')?.name).toBe('B-renamed')
  })

  it('setActiveBoard updates activeBoardId', () => {
    useKanbanStore.getState().setActiveBoard('b9')
    expect(useKanbanStore.getState().activeBoardId).toBe('b9')
  })
})

describe('kanbanStore fetchBoard', () => {
  it('populates columns, epics, cards in one shot', async () => {
    tasks.listColumns.mockResolvedValue([mkColumn('c1')])
    tasks.listEpics.mockResolvedValue([mkEpic('e1')])
    tasks.listCards.mockResolvedValue([mkCard('card1')])
    await useKanbanStore.getState().fetchBoard('b1')
    const s = useKanbanStore.getState()
    expect(s.columns).toHaveLength(1)
    expect(s.epics).toHaveLength(1)
    expect(s.cards).toHaveLength(1)
  })

  it('tolerates listEpics failure (endpoint may not exist) and yields empty epics', async () => {
    tasks.listColumns.mockResolvedValue([mkColumn('c1')])
    tasks.listEpics.mockRejectedValue(new Error('404'))
    tasks.listCards.mockResolvedValue([])
    await useKanbanStore.getState().fetchBoard('b1')
    const s = useKanbanStore.getState()
    expect(s.epics).toEqual([])
    expect(s.columns).toHaveLength(1)
  })

  it('toggles loading on/off across the call and clears error on success', async () => {
    useKanbanStore.setState({ error: 'previous failure' })
    tasks.listColumns.mockResolvedValue([])
    tasks.listEpics.mockResolvedValue([])
    tasks.listCards.mockResolvedValue([])
    await useKanbanStore.getState().fetchBoard('b1')
    const s = useKanbanStore.getState()
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
  })

  it('rejected: clears loading and writes error (no longer stuck loading=true forever)', async () => {
    tasks.listColumns.mockRejectedValue(new Error('boom'))
    tasks.listEpics.mockResolvedValue([])
    tasks.listCards.mockResolvedValue([])
    await expect(useKanbanStore.getState().fetchBoard('b1')).rejects.toThrow('boom')
    const s = useKanbanStore.getState()
    expect(s.loading).toBe(false)
    expect(s.error).toBe('boom')
  })
})

describe('kanbanStore columns CRUD', () => {
  it('createColumn appends a column', async () => {
    tasks.createColumn.mockResolvedValue(mkColumn('c1'))
    await useKanbanStore.getState().createColumn('b1', { name: 'Todo', position: 0 })
    expect(useKanbanStore.getState().columns).toHaveLength(1)
  })

  it('updateColumn replaces the matching column', async () => {
    useKanbanStore.setState({ columns: [mkColumn('c1', 'b1', 'Old')] })
    tasks.updateColumn.mockResolvedValue(mkColumn('c1', 'b1', 'New'))
    await useKanbanStore.getState().updateColumn('b1', 'c1', { name: 'New' })
    expect(useKanbanStore.getState().columns[0].name).toBe('New')
  })

  it('deleteColumn removes the matching column', async () => {
    useKanbanStore.setState({ columns: [mkColumn('c1'), mkColumn('c2')] })
    tasks.deleteColumn.mockResolvedValue(undefined)
    await useKanbanStore.getState().deleteColumn('b1', 'c1')
    expect(useKanbanStore.getState().columns.map((c) => c.id)).toEqual(['c2'])
  })
})

describe('kanbanStore epics CRUD', () => {
  it('createEpic appends an epic', async () => {
    tasks.createEpic.mockResolvedValue(mkEpic('e1'))
    await useKanbanStore.getState().createEpic('b1', { name: 'E' })
    expect(useKanbanStore.getState().epics).toHaveLength(1)
  })

  it('updateEpic replaces the matching epic', async () => {
    useKanbanStore.setState({ epics: [mkEpic('e1', 'b1', 'Old')] })
    tasks.updateEpic.mockResolvedValue(mkEpic('e1', 'b1', 'New'))
    await useKanbanStore.getState().updateEpic('b1', 'e1', { name: 'New' })
    expect(useKanbanStore.getState().epics[0].name).toBe('New')
  })

  it('deleteEpic removes the epic and clears epic_id on cards that referenced it', async () => {
    useKanbanStore.setState({
      epics: [mkEpic('e1'), mkEpic('e2')],
      cards: [
        mkCard('card1', { epic_id: 'e1' }),
        mkCard('card2', { epic_id: 'e2' }),
        mkCard('card3', { epic_id: 'e1' }),
      ],
    })
    tasks.deleteEpic.mockResolvedValue(undefined)
    await useKanbanStore.getState().deleteEpic('b1', 'e1')
    const s = useKanbanStore.getState()
    expect(s.epics.map((e) => e.id)).toEqual(['e2'])
    expect(s.cards.find((c) => c.id === 'card1')?.epic_id).toBe('')
    expect(s.cards.find((c) => c.id === 'card2')?.epic_id).toBe('e2')
    expect(s.cards.find((c) => c.id === 'card3')?.epic_id).toBe('')
  })
})

describe('kanbanStore cards CRUD', () => {
  it('createCard appends a card', async () => {
    tasks.createCard.mockResolvedValue(mkCard('card1'))
    await useKanbanStore.getState().createCard('b1', { column_id: 'c1', title: 'T' })
    expect(useKanbanStore.getState().cards).toHaveLength(1)
  })

  it('updateCard replaces the matching card', async () => {
    useKanbanStore.setState({ cards: [mkCard('card1', { title: 'old' })] })
    tasks.updateCard.mockResolvedValue(mkCard('card1', { title: 'new' }))
    await useKanbanStore.getState().updateCard('b1', 'card1', { title: 'new' })
    expect(useKanbanStore.getState().cards[0].title).toBe('new')
  })

  it('deleteCard removes the card', async () => {
    useKanbanStore.setState({ cards: [mkCard('card1'), mkCard('card2')] })
    tasks.deleteCard.mockResolvedValue(undefined)
    await useKanbanStore.getState().deleteCard('b1', 'card1')
    expect(useKanbanStore.getState().cards.map((c) => c.id)).toEqual(['card2'])
  })
})

describe('kanbanStore optimistic setters', () => {
  it('setCards applies a reducer over current cards', () => {
    useKanbanStore.setState({ cards: [mkCard('card1', { position: 0 }), mkCard('card2', { position: 1 })] })
    useKanbanStore.getState().setCards((cs) => cs.map((c) => ({ ...c, position: c.position + 10 })))
    expect(useKanbanStore.getState().cards.map((c) => c.position)).toEqual([10, 11])
  })

  it('setColumns applies a reducer over current columns', () => {
    useKanbanStore.setState({ columns: [mkColumn('c1', 'b1', 'A', 0), mkColumn('c2', 'b1', 'B', 1)] })
    useKanbanStore.getState().setColumns((cs) => cs.reverse())
    expect(useKanbanStore.getState().columns.map((c) => c.id)).toEqual(['c2', 'c1'])
  })
})

describe('kanbanStore comments passthrough', () => {
  it('listComments delegates to apiClient', async () => {
    tasks.listComments.mockResolvedValue([])
    await useKanbanStore.getState().listComments('card1')
    expect(tasks.listComments).toHaveBeenCalledWith('card1')
  })

  it('createComment delegates with body', async () => {
    tasks.createComment.mockResolvedValue({
      id: 'cm1',
      card_id: 'card1',
      author_id: 1,
      author_name: 'A',
      body: 'hi',
      created_at: 0,
    })
    await useKanbanStore.getState().createComment('card1', 'hi')
    expect(tasks.createComment).toHaveBeenCalledWith('card1', 'hi')
  })

  it('deleteComment delegates ids', async () => {
    tasks.deleteComment.mockResolvedValue(undefined)
    await useKanbanStore.getState().deleteComment('card1', 'cm1')
    expect(tasks.deleteComment).toHaveBeenCalledWith('card1', 'cm1')
  })
})

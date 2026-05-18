import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import BoardSidebar from '@/components/board/BoardSidebar'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useAuthStore } from '@/stores/authStore'
import type { Board, Card } from '@/api/types'
import type { User } from '@/api/types'

const board: Board = {
  id: 'b-test',
  name: 'Test Sprint',
  prefix: 'TST',
  description: '',
  created_at: 0,
  updated_at: 0,
}

const user: User = {
  id: 101,
  email: 'ada@example.com',
  display_name: 'Ada Lovelace',
  is_admin: false,
  is_service_account: false,
  created_at: 0,
  updated_at: 0,
}

beforeEach(() => {
  useKanbanStore.setState({
    boards: [board],
    activeBoardId: 'b-test',
    columns: [],
    epics: [],
    cards: [] as Card[],
    loading: false,
    error: null,
  })
  useAuthStore.setState({ user, loading: false, error: null })
})

afterEach(() => {
  cleanup()
  useKanbanStore.setState({
    boards: [],
    activeBoardId: null,
    columns: [],
    epics: [],
    cards: [],
  })
  useAuthStore.setState({ user: null })
})

describe('BoardSidebar', () => {
  it('renders the "Taskhauler" wordmark', () => {
    const { container } = render(<BoardSidebar />)
    expect(container.textContent).toContain('Taskhauler')
  })

  it('renders the "Inbox" nav row', () => {
    const { container } = render(<BoardSidebar />)
    expect(container.textContent).toContain('Inbox')
  })

  it('renders the active user display_name', () => {
    const { container } = render(<BoardSidebar />)
    expect(container.textContent).toContain('Ada Lovelace')
  })

  it('renders boards from the store', () => {
    const { container } = render(<BoardSidebar />)
    expect(container.textContent).toContain('Test Sprint')
    expect(container.textContent).toContain('TST')
  })
})

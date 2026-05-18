import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import BoardTopBar from '@/components/board/BoardTopBar'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import type { Board } from '@/api/types'

const board: Board = {
  id: 'b-test',
  name: 'Sprint Alpha',
  prefix: 'ALP',
  description: '',
  created_at: 0,
  updated_at: 0,
}

beforeEach(() => {
  useKanbanStore.setState({
    boards: [board],
    activeBoardId: 'b-test',
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
    railTab: 'console',
    selectedCardId: null,
    focusedCardId: null,
    searchQuery: '',
  })
})

afterEach(() => {
  cleanup()
})

describe('BoardTopBar', () => {
  it('renders the active board name as breadcrumb', () => {
    const { container } = render(<BoardTopBar />)
    expect(container.textContent).toContain('Sprint Alpha')
  })

  it('renders ThemeSwitcher with 3 swatches', () => {
    const { container } = render(<BoardTopBar />)
    const themeSwitcher = container.querySelector('div[title="Theme"]')
    expect(themeSwitcher).toBeTruthy()
    const swatches = themeSwitcher!.querySelectorAll('button')
    expect(swatches).toHaveLength(3)
  })
})

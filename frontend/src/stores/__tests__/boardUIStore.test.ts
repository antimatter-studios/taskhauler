// boardUIStore owns view chrome state. Two keys persist to localStorage:
//   • taskhauler.console-open  ← consoleOpen
//   • taskhauler.rail-tab      ← railTab
// Everything else is session-scoped.
//
// The store reads localStorage once at module load (the initial state), so
// these tests assert behaviour of the action setters — not the initial-load
// branch (which would require module-reset mid-test).

import { beforeEach, describe, expect, it } from 'vitest'
import { useBoardUIStore } from '@/stores/boardUIStore'

const CONSOLE_KEY = 'taskhauler.console-open'
const RAIL_KEY = 'taskhauler.rail-tab'

beforeEach(() => {
  localStorage.clear()
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

describe('boardUIStore initial state', () => {
  it('has the documented defaults after reset', () => {
    const s = useBoardUIStore.getState()
    expect(s.view).toBe('kanban')
    expect(s.grouping).toBe('col')
    expect(s.filterAssignee).toBe('all')
    expect(s.consoleOpen).toBe(true)
    expect(s.railTab).toBe('console')
    expect(s.selectedCardId).toBeNull()
    expect(s.focusedCardId).toBeNull()
    expect(s.searchQuery).toBe('')
  })
})

describe('boardUIStore view / grouping / filter setters', () => {
  it('setView updates the view', () => {
    useBoardUIStore.getState().setView('timeline')
    expect(useBoardUIStore.getState().view).toBe('timeline')
  })

  it('setGrouping updates the grouping mode', () => {
    useBoardUIStore.getState().setGrouping('priority')
    expect(useBoardUIStore.getState().grouping).toBe('priority')
  })

  it('setFilter updates the assignee filter', () => {
    useBoardUIStore.getState().setFilter('mine')
    expect(useBoardUIStore.getState().filterAssignee).toBe('mine')
  })
})

describe('boardUIStore consoleOpen persistence', () => {
  it('setConsoleOpen writes "false" to localStorage', () => {
    useBoardUIStore.getState().setConsoleOpen(false)
    expect(useBoardUIStore.getState().consoleOpen).toBe(false)
    expect(localStorage.getItem(CONSOLE_KEY)).toBe('false')
  })

  it('setConsoleOpen writes "true" to localStorage', () => {
    useBoardUIStore.getState().setConsoleOpen(false)
    useBoardUIStore.getState().setConsoleOpen(true)
    expect(useBoardUIStore.getState().consoleOpen).toBe(true)
    expect(localStorage.getItem(CONSOLE_KEY)).toBe('true')
  })

  it('toggleConsole flips state and persists', () => {
    useBoardUIStore.getState().toggleConsole()
    expect(useBoardUIStore.getState().consoleOpen).toBe(false)
    expect(localStorage.getItem(CONSOLE_KEY)).toBe('false')

    useBoardUIStore.getState().toggleConsole()
    expect(useBoardUIStore.getState().consoleOpen).toBe(true)
    expect(localStorage.getItem(CONSOLE_KEY)).toBe('true')
  })
})

describe('boardUIStore railTab persistence', () => {
  it('setRailTab updates state and persists', () => {
    useBoardUIStore.getState().setRailTab('activity')
    expect(useBoardUIStore.getState().railTab).toBe('activity')
    expect(localStorage.getItem(RAIL_KEY)).toBe('activity')
  })

  it('setRailTab handles each valid tab value', () => {
    useBoardUIStore.getState().setRailTab('plans')
    expect(localStorage.getItem(RAIL_KEY)).toBe('plans')
    useBoardUIStore.getState().setRailTab('console')
    expect(localStorage.getItem(RAIL_KEY)).toBe('console')
  })
})

describe('boardUIStore selection / focus / search', () => {
  it('selectCard updates selectedCardId', () => {
    useBoardUIStore.getState().selectCard('card-1')
    expect(useBoardUIStore.getState().selectedCardId).toBe('card-1')
    useBoardUIStore.getState().selectCard(null)
    expect(useBoardUIStore.getState().selectedCardId).toBeNull()
  })

  it('focusCard updates focusedCardId', () => {
    useBoardUIStore.getState().focusCard('card-2')
    expect(useBoardUIStore.getState().focusedCardId).toBe('card-2')
  })

  it('setSearchQuery updates searchQuery (not persisted)', () => {
    useBoardUIStore.getState().setSearchQuery('bug')
    expect(useBoardUIStore.getState().searchQuery).toBe('bug')
    // session-scoped — no localStorage write
    expect(localStorage.getItem('taskhauler.search')).toBeNull()
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import ConsoleRail from '@/components/board/rail/ConsoleRail'
import { useKanbanStore } from '@/stores/kanbanStore'
import { useBoardUIStore } from '@/stores/boardUIStore'
import { MOCK_PRESENCE } from '@/mock/presence'

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
    railTab: 'console',
    selectedCardId: null,
    focusedCardId: null,
    searchQuery: '',
  })
})

afterEach(() => {
  cleanup()
})

describe('ConsoleRail', () => {
  it('renders an "active now" section with the count of non-idle presences', () => {
    const { container } = render(<ConsoleRail />)
    const activeCount = MOCK_PRESENCE.filter((p) => p.action !== 'idle').length
    expect(container.textContent).toContain(`${activeCount} active now`)
    expect(container.textContent).toContain('on this board')
  })

  it('renders an "idle" section with the count of idle presences', () => {
    const { container } = render(<ConsoleRail />)
    const idleCount = MOCK_PRESENCE.filter((p) => p.action === 'idle').length
    expect(container.textContent).toContain(`${idleCount} idle`)
  })

  it('renders the actor display name for each presence (user + agent)', () => {
    const { container } = render(<ConsoleRail />)
    // From MOCK_PRESENCE: user 101 → Mira Chen, agent relay
    expect(container.textContent).toContain('Mira Chen')
    expect(container.textContent).toContain('@relay')
    expect(container.textContent).toContain('@scout')
  })

  it('renders AGENT and USER role badges', () => {
    const { container } = render(<ConsoleRail />)
    expect(container.textContent).toContain('AGENT')
    expect(container.textContent).toContain('USER')
  })

  it('shows the transcript "tail -f" indicator for the expanded working agent', () => {
    const { container } = render(<ConsoleRail />)
    // pr6 (relay) starts expanded by default and is working → transcript visible.
    expect(container.textContent).toContain('tail -f')
  })

  it('renders the invite CTA at the bottom of the rail', () => {
    const { container } = render(<ConsoleRail />)
    expect(container.textContent).toContain('Invite people or hauler agents')
  })

  it('renders a telemetry load row (e.g. "78% · 184t/m") for the working agent', () => {
    const { container } = render(<ConsoleRail />)
    // MOCK_TELEMETRY relay: load=0.78, tok=184
    expect(container.textContent).toContain('78% · 184t/m')
  })
})

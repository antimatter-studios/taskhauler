import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import PresenceCluster, {
  type PresenceEntry,
} from '@/components/board/primitives/PresenceCluster'
import { MOCK_USERS } from '@/mock/users'

afterEach(() => cleanup())

function userEntry(i: number, action: PresenceEntry['action'] = 'viewing'): PresenceEntry {
  const u = MOCK_USERS[i % MOCK_USERS.length]
  return {
    id: `u-${i}`,
    kind: 'user',
    userId: u.id as number,
    action,
  }
}

describe('PresenceCluster', () => {
  it('renders the first maxShown (default 5) entries', () => {
    const entries: PresenceEntry[] = Array.from({ length: 5 }, (_, i) => userEntry(i))
    const { container } = render(<PresenceCluster entries={entries} />)
    // Each visible entry produces a UserChip with a title attribute equal to display_name.
    const chips = container.querySelectorAll('span[title]')
    // Filter to chips whose title matches a known mock user (excludes outer wrapper).
    const userTitles = MOCK_USERS.map((u) => u.display_name)
    const visible = Array.from(chips).filter((el) =>
      userTitles.includes(el.getAttribute('title') ?? ''),
    )
    expect(visible).toHaveLength(5)
  })

  it('shows "+N" overflow when entries > maxShown', () => {
    const entries: PresenceEntry[] = Array.from({ length: 8 }, (_, i) => userEntry(i))
    const { container } = render(
      <PresenceCluster entries={entries} maxShown={5} />,
    )
    expect(container.textContent).toContain('+3')
  })

  it('renders "{N} active" label when showLabel=true', () => {
    const entries: PresenceEntry[] = [
      userEntry(0, 'viewing'),
      userEntry(1, 'editing'),
      userEntry(2, 'idle'),
    ]
    const { container } = render(
      <PresenceCluster entries={entries} showLabel />,
    )
    // idle entries don't count as active
    expect(container.textContent).toContain('2 active')
  })

  it('renders nothing for empty entries', () => {
    const { container } = render(<PresenceCluster entries={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

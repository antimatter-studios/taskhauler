import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import AssigneeChip from '@/components/board/primitives/AssigneeChip'
import { MOCK_USERS } from '@/mock/users'

afterEach(() => cleanup())

describe('AssigneeChip', () => {
  it('renders UserChip with MOCK_USER when userId matches', () => {
    const u = MOCK_USERS[0]
    const { container } = render(<AssigneeChip userId={u.id as number} />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.getAttribute('title')).toBe(u.display_name)
    // UserChip is rounded (no clip-path). AgentChip uses clip-path polygon.
    // happy-dom strips oklch from live DOM — verify via static markup.
    const html = renderToStaticMarkup(<AssigneeChip userId={u.id as number} />)
    expect(html).toContain('oklch')
    expect(html).not.toContain('clip-path')
  })

  it('renders AgentChip when agentName is given', () => {
    const { container } = render(<AssigneeChip agentName="mira" />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.getAttribute('title')).toBe('@mira')
    expect(span.style.clipPath).toContain('polygon')
  })

  it('renders "?" placeholder when neither is given', () => {
    const { container } = render(<AssigneeChip />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.textContent).toBe('?')
    expect(span.getAttribute('title')).toBe('Unassigned')
  })

  it('forwards working=true to AgentChip in the agent case', () => {
    const { container } = render(<AssigneeChip agentName="mira" working />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.style.boxShadow).not.toBe('none')
    expect(span.style.boxShadow.length).toBeGreaterThan(0)
  })
})

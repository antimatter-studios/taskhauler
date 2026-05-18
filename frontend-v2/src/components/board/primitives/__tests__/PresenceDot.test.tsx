import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import PresenceDot from '@/components/board/primitives/PresenceDot'

afterEach(() => cleanup())

describe('PresenceDot', () => {
  it('renders with the given color', () => {
    const { container } = render(<PresenceDot color="#22c55e" />)
    const span = container.querySelector('span') as HTMLElement
    expect(span).toBeTruthy()
    const styleAttr = span.getAttribute('style') ?? ''
    expect(styleAttr).toContain('#22c55e')
  })

  it('adds a pulse animation when active=true', () => {
    const { container } = render(<PresenceDot color="#22c55e" active />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.style.animation).toContain('presence-pulse')
  })

  it('does NOT have pulse animation when active=false', () => {
    const { container } = render(<PresenceDot color="#22c55e" active={false} />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.style.animation).toBe('')
  })
})

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import PriorityIndicator from '@/components/board/primitives/PriorityIndicator'

afterEach(() => cleanup())

function bars(container: HTMLElement): HTMLElement[] {
  // Inner bar spans are the children of the outer wrapper span.
  const wrapper = container.querySelector('span')
  if (!wrapper) return []
  return Array.from(wrapper.querySelectorAll('span')) as HTMLElement[]
}

describe('PriorityIndicator', () => {
  it('renders 1 bar for priority="low"', () => {
    const { container } = render(<PriorityIndicator priority="low" />)
    expect(bars(container)).toHaveLength(3) // 3 bar tracks rendered
    // Exactly 1 filled (fills [1,0,0])
    const wrapper = container.querySelector('span') as HTMLElement
    expect(wrapper.getAttribute('title')).toBe('Low')
  })

  it('renders 2 bars for priority="medium"', () => {
    const { container } = render(<PriorityIndicator priority="medium" />)
    const wrapper = container.querySelector('span') as HTMLElement
    expect(wrapper.getAttribute('title')).toBe('Medium')
    expect(bars(container)).toHaveLength(3)
  })

  it('renders 3 bars for priority="high"', () => {
    const { container } = render(<PriorityIndicator priority="high" />)
    const wrapper = container.querySelector('span') as HTMLElement
    expect(wrapper.getAttribute('title')).toBe('High')
    expect(bars(container)).toHaveLength(3)
  })

  it('renders a solid 8x8 red square for priority="urgent"', () => {
    const { container } = render(<PriorityIndicator priority="urgent" />)
    const wrapper = container.querySelector('span') as HTMLElement
    expect(wrapper.getAttribute('title')).toBe('Urgent')
    const inner = wrapper.querySelector('span') as HTMLElement
    expect(inner.style.width).toBe('8px')
    expect(inner.style.height).toBe('8px')
    expect(inner.style.background).toContain('var(--red)')
  })

  it('returns null for empty / undefined priority', () => {
    const { container: c1 } = render(<PriorityIndicator priority="" />)
    expect(c1.firstChild).toBeNull()
    cleanup()
    const { container: c2 } = render(<PriorityIndicator />)
    expect(c2.firstChild).toBeNull()
  })
})

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import AgentChip from '@/components/board/primitives/AgentChip'

afterEach(() => cleanup())

describe('AgentChip', () => {
  it('renders the first letter of name uppercased', () => {
    const { container } = render(<AgentChip name="mira" />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.textContent).toBe('M')
  })

  it('uses cyan palette for variant="default"', () => {
    const { container } = render(<AgentChip name="mira" variant="default" />)
    const span = container.querySelector('span') as HTMLElement
    const styleAttr = span.getAttribute('style') ?? ''
    // Default palette: bg #0f172a, fg #67e8f9
    expect(styleAttr).toContain('#0f172a')
    expect(styleAttr).toContain('#67e8f9')
  })

  it('uses yellow palette for variant="terminal"', () => {
    const { container } = render(<AgentChip name="mira" variant="terminal" />)
    const span = container.querySelector('span') as HTMLElement
    const styleAttr = span.getAttribute('style') ?? ''
    // Terminal palette: bg #facc15, fg #1c1917
    expect(styleAttr).toContain('#facc15')
    expect(styleAttr).toContain('#1c1917')
  })

  it('adds a box-shadow ring when working=true', () => {
    const { container: cWorking } = render(
      <AgentChip name="mira" working />,
    )
    const w = cWorking.querySelector('span') as HTMLElement
    expect(w.style.boxShadow).not.toBe('none')
    expect(w.style.boxShadow.length).toBeGreaterThan(0)

    cleanup()
    const { container: cIdle } = render(<AgentChip name="mira" />)
    const i = cIdle.querySelector('span') as HTMLElement
    expect(i.style.boxShadow).toBe('none')
  })

  it('uses a hex clipPath polygon', () => {
    const { container } = render(<AgentChip name="mira" />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.style.clipPath).toContain('polygon')
  })

  it('title attribute starts with "@"', () => {
    const { container } = render(<AgentChip name="mira" />)
    const span = container.querySelector('span') as HTMLElement
    expect(span.getAttribute('title')).toBe('@mira')
  })
})

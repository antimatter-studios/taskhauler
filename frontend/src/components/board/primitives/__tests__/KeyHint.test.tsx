import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import KeyHint from '@/components/board/primitives/KeyHint'

afterEach(() => cleanup())

describe('KeyHint', () => {
  it('renders children inside a kbd element', () => {
    const { container } = render(<KeyHint>⌘K</KeyHint>)
    const kbd = container.querySelector('kbd')
    expect(kbd).toBeTruthy()
    expect(kbd!.textContent).toBe('⌘K')
  })

  it('uses the mono font style', () => {
    const { container } = render(<KeyHint>C</KeyHint>)
    const kbd = container.querySelector('kbd') as HTMLElement
    expect(kbd.style.fontFamily).toContain('--mono')
  })
})

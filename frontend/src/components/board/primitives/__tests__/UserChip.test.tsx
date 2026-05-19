import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import UserChip from '@/components/board/primitives/UserChip'

afterEach(() => cleanup())

describe('UserChip', () => {
  it('renders 2-letter initials when no avatar provided', () => {
    const { container } = render(
      <UserChip user={{ id: 1, display_name: 'Ada Lovelace' }} />,
    )
    const span = container.querySelector('span')!
    expect(span.textContent).toBe('AL')
  })

  it('uses hue-based oklch background when user.hue is set', () => {
    // happy-dom drops unparseable CSS values like oklch() from the live DOM,
    // so we render to a static HTML string (React serializes style props
    // verbatim) and inspect that.
    const html = renderToStaticMarkup(
      <UserChip user={{ id: 1, display_name: 'Ada Lovelace', hue: 42 }} />,
    )
    expect(html).toContain('oklch')
    expect(html).toContain('42')
  })

  it('falls back to deterministic hash when hue is missing', () => {
    const html1 = renderToStaticMarkup(
      <UserChip user={{ id: 1, display_name: 'Sam Smith' }} />,
    )
    const html2 = renderToStaticMarkup(
      <UserChip user={{ id: 2, display_name: 'Sam Smith' }} />,
    )
    // same display_name → same hashed hue → identical markup
    expect(html1).toBe(html2)
    expect(html1).toContain('oklch')
  })

  it('respects size prop (default 22)', () => {
    const { container: cDef } = render(
      <UserChip user={{ id: 1, display_name: 'Ada Lovelace' }} />,
    )
    const def = cDef.querySelector('span') as HTMLElement
    expect(def.style.width).toBe('22px')
    expect(def.style.height).toBe('22px')

    cleanup()
    const { container: cBig } = render(
      <UserChip user={{ id: 1, display_name: 'Ada Lovelace' }} size={40} />,
    )
    const big = cBig.querySelector('span') as HTMLElement
    expect(big.style.width).toBe('40px')
    expect(big.style.height).toBe('40px')
  })

  it('sets title attribute to display_name', () => {
    const { container } = render(
      <UserChip user={{ id: 1, display_name: 'Ada Lovelace' }} />,
    )
    const span = container.querySelector('span') as HTMLElement
    expect(span.getAttribute('title')).toBe('Ada Lovelace')
  })
})

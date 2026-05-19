// Uses the default happy-dom environment. Note: a memory Storage shim is
// installed in test/setup.ts because happy-dom v20 omits `localStorage`.

import { beforeEach, describe, expect, it } from 'vitest'
import { THEMES, applyTheme, getStoredTheme, persistTheme } from '@/lib/theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('applyTheme', () => {
  it('sets data-theme attribute on documentElement', () => {
    applyTheme('mono')
    expect(document.documentElement.getAttribute('data-theme')).toBe('mono')
  })

  it('overwrites existing data-theme attribute', () => {
    applyTheme('mono')
    applyTheme('paper')
    expect(document.documentElement.getAttribute('data-theme')).toBe('paper')
  })
})

describe('persistTheme + getStoredTheme', () => {
  it('persistTheme writes to localStorage under "taskhauler.theme"', () => {
    persistTheme('paper')
    expect(localStorage.getItem('taskhauler.theme')).toBe('paper')
  })

  it('getStoredTheme reads back the persisted value', () => {
    persistTheme('mono')
    expect(getStoredTheme()).toBe('mono')
  })

  it('getStoredTheme returns "day" when localStorage is empty', () => {
    expect(getStoredTheme()).toBe('day')
  })

  it('getStoredTheme falls back to "day" for invalid stored values', () => {
    localStorage.setItem('taskhauler.theme', 'not-a-theme')
    expect(getStoredTheme()).toBe('day')
  })
})

describe('THEMES export', () => {
  it('contains exactly ["day", "mono", "paper"]', () => {
    expect(THEMES).toEqual(['day', 'mono', 'paper'])
  })
})

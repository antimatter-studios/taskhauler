// Global vitest setup.
//
// Polyfills localStorage / sessionStorage onto both `globalThis` and `window`
// when the chosen environment (happy-dom v20, jsdom) leaves them as `undefined`.
//
// Why this is needed:
//   • happy-dom v20 ships sessionStorage but not localStorage.
//   • jsdom defines localStorage via a getter, but the getter returns
//     `undefined` under Vitest's vm-context setup (and Node 22's experimental
//     `localStorage` global is also `undefined` without --localstorage-file).
// Either way, tests that exercise localStorage need a working Storage shim.

class MemoryStorage implements Storage {
  private data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value))
  }
}

function ensureStorage(name: 'localStorage' | 'sessionStorage'): void {
  const g = globalThis as unknown as Record<string, unknown>
  const w = (g.window ?? g) as Record<string, unknown>

  // Test by attempting access — both `undefined` values and throwing getters
  // count as "missing".
  let working = false
  try {
    working = typeof (w as Record<string, unknown>)[name] === 'object' && (w as Record<string, unknown>)[name] !== null
  } catch {
    working = false
  }
  if (working) return

  const store = new MemoryStorage()
  // Define on the window if present, then on globalThis so bare references
  // (`localStorage.clear()`) resolve.
  try {
    Object.defineProperty(w, name, { value: store, configurable: true, writable: true })
  } catch {
    // ignore — likely non-configurable on this environment.
  }
  try {
    Object.defineProperty(g, name, { value: store, configurable: true, writable: true })
  } catch {
    // ignore
  }
}

ensureStorage('localStorage')
ensureStorage('sessionStorage')

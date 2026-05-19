import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient } from '@/api/client'

const TOKEN_KEY = 'taskhauler_token'
const REFRESH_KEY = 'taskhauler_refresh_token'

type FetchInit = RequestInit & { headers?: Record<string, string> }

interface MockResponse {
  status: number
  body?: unknown
  text?: string
}

function fetchMock(): {
  calls: { url: string; init: FetchInit }[]
  enqueue: (r: MockResponse) => void
  reset: () => void
} {
  const calls: { url: string; init: FetchInit }[] = []
  const queue: MockResponse[] = []
  const fn = vi.fn(async (url: string, init?: FetchInit) => {
    calls.push({ url, init: init ?? {} })
    const r = queue.shift() ?? { status: 500, body: { error: 'no mock queued' } }
    const text = r.text ?? (r.body !== undefined ? JSON.stringify(r.body) : '')
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      async json() { return r.body },
      async text() { return text },
    } as Response
  })
  globalThis.fetch = fn as unknown as typeof fetch
  return {
    calls,
    enqueue: (r) => queue.push(r),
    reset: () => { calls.length = 0; queue.length = 0 },
  }
}

let mocks: ReturnType<typeof fetchMock>

beforeEach(() => {
  localStorage.clear()
  mocks = fetchMock()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiClient.tasks (HTTP plumbing)', () => {
  it('sends Authorization header when a token is in localStorage', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-abc')
    mocks.enqueue({ status: 200, body: [] })
    await apiClient.tasks.listBoards()
    expect(mocks.calls[0].init.headers).toMatchObject({ Authorization: 'Bearer tok-abc' })
  })

  it('omits Authorization header when no token is stored', async () => {
    mocks.enqueue({ status: 200, body: [] })
    await apiClient.tasks.listBoards()
    const headers = mocks.calls[0].init.headers ?? {}
    expect(headers).not.toHaveProperty('Authorization')
  })

  it('sets Content-Type for POST/PUT with body and serialises JSON', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    mocks.enqueue({ status: 200, body: { id: 'b1', name: 'X' } })
    await apiClient.tasks.createBoard({ name: 'X' })
    const call = mocks.calls[0]
    expect(call.init.method).toBe('POST')
    expect(call.init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(call.init.body).toBe(JSON.stringify({ name: 'X' }))
  })

  it('DELETE returns undefined on 204', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    mocks.enqueue({ status: 204, text: '' })
    const result = await apiClient.tasks.deleteBoard('b1')
    expect(result).toBeUndefined()
  })

  it('parses error.error field on non-ok responses', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    mocks.enqueue({ status: 400, body: { error: 'prefix already in use' } })
    await expect(apiClient.tasks.createBoard({ name: 'X' })).rejects.toThrow('prefix already in use')
  })

  it('falls back to "HTTP <status>" when error body is not parseable', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    mocks.enqueue({ status: 500, text: '<html>nope</html>' })
    await expect(apiClient.tasks.listBoards()).rejects.toThrow('HTTP 500')
  })

  it('search URL-encodes the query parameter', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    mocks.enqueue({ status: 200, body: [] })
    await apiClient.tasks.searchCards('b1', 'auth & login')
    expect(mocks.calls[0].url).toContain('q=auth%20%26%20login')
  })
})

describe('apiClient — 401 refresh flow', () => {
  it('refreshes once on 401, then retries the request with the new token', async () => {
    localStorage.setItem(TOKEN_KEY, 'stale')
    localStorage.setItem(REFRESH_KEY, 'refresh-tok')
    mocks.enqueue({ status: 401 })                                  // first request
    mocks.enqueue({ status: 200, body: { access_token: 'fresh' } }) // refresh
    mocks.enqueue({ status: 200, body: [] })                        // retry

    const result = await apiClient.tasks.listBoards()
    expect(result).toEqual([])
    expect(mocks.calls).toHaveLength(3)
    expect(mocks.calls[1].url).toContain('/auth/refresh')
    expect(mocks.calls[2].init.headers).toMatchObject({ Authorization: 'Bearer fresh' })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('fresh')
  })

  it('clears auth and throws when refresh fails', async () => {
    localStorage.setItem(TOKEN_KEY, 'stale')
    localStorage.setItem(REFRESH_KEY, 'refresh-tok')
    mocks.enqueue({ status: 401 })                                  // first request
    mocks.enqueue({ status: 401, body: { error: 'refresh denied' } }) // refresh fails

    await expect(apiClient.tasks.listBoards()).rejects.toThrow('unauthorized')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('does not attempt refresh when no refresh token is stored', async () => {
    localStorage.setItem(TOKEN_KEY, 'stale')
    mocks.enqueue({ status: 401 })

    await expect(apiClient.tasks.listBoards()).rejects.toThrow('unauthorized')
    expect(mocks.calls).toHaveLength(1)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('apiClient.auth', () => {
  it('login stores both tokens and returns the body', async () => {
    mocks.enqueue({
      status: 200,
      body: {
        access_token: 'a',
        refresh_token: 'r',
        user: { id: 1, email: 'x@y', display_name: 'X', is_admin: false },
      },
    })
    const body = await apiClient.auth.login('x@y', 'pw')
    expect(body.access_token).toBe('a')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('a')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('r')
  })

  it('login throws ApiError with backend message on failure', async () => {
    mocks.enqueue({ status: 401, body: { error: 'invalid credentials' } })
    await expect(apiClient.auth.login('x@y', 'wrong')).rejects.toThrow('invalid credentials')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('logout clears localStorage and fires POST /auth/logout', async () => {
    localStorage.setItem(TOKEN_KEY, 'a')
    localStorage.setItem(REFRESH_KEY, 'r')
    mocks.enqueue({ status: 204 })
    apiClient.auth.logout()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('isAuthenticated reflects token presence', () => {
    expect(apiClient.auth.isAuthenticated()).toBe(false)
    localStorage.setItem(TOKEN_KEY, 'a')
    expect(apiClient.auth.isAuthenticated()).toBe(true)
  })
})

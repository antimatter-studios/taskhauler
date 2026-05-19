// authStore wraps apiClient.auth.{login,logout,me,isAuthenticated}.
// Token storage is the client's concern — these tests only assert the
// store's user/loading/error fields and that the right client methods are
// called.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  apiClient: {
    auth: {
      login: vi.fn(),
      logout: vi.fn(),
      me: vi.fn(),
      isAuthenticated: vi.fn(),
    },
  },
}))

import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/api/types'

const loginMock = apiClient.auth.login as unknown as ReturnType<typeof vi.fn>
const logoutMock = apiClient.auth.logout as unknown as ReturnType<typeof vi.fn>
const meMock = apiClient.auth.me as unknown as ReturnType<typeof vi.fn>
const isAuthenticatedMock = apiClient.auth.isAuthenticated as unknown as ReturnType<typeof vi.fn>

const sampleUser: User = {
  id: 1,
  email: 'a@b.co',
  display_name: 'Alice',
  is_admin: false,
  is_service_account: false,
  created_at: 0,
  updated_at: 0,
}

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, error: null })
  loginMock.mockReset()
  logoutMock.mockReset()
  meMock.mockReset()
  isAuthenticatedMock.mockReset()
})

describe('authStore initial state', () => {
  it('starts logged-out with no error', () => {
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
  })
})

describe('authStore.login', () => {
  it('sets user on success and clears error', async () => {
    loginMock.mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      user: sampleUser,
    })
    await useAuthStore.getState().login('a@b.co', 'pw')
    const s = useAuthStore.getState()
    expect(s.user).toEqual(sampleUser)
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
    expect(loginMock).toHaveBeenCalledWith('a@b.co', 'pw')
  })

  it('sets error and rethrows on failure', async () => {
    loginMock.mockRejectedValue(new Error('invalid credentials'))
    await expect(useAuthStore.getState().login('a@b.co', 'wrong')).rejects.toThrow(
      'invalid credentials',
    )
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.loading).toBe(false)
    expect(s.error).toBe('invalid credentials')
  })

  it('uses fallback "Login failed" message when error has no message', async () => {
    loginMock.mockRejectedValue('not-an-error')
    await expect(useAuthStore.getState().login('a@b.co', 'pw')).rejects.toBeTruthy()
    expect(useAuthStore.getState().error).toBe('Login failed')
  })
})

describe('authStore.logout', () => {
  it('clears user and error and calls client.logout', () => {
    useAuthStore.setState({ user: sampleUser, error: 'stale' })
    useAuthStore.getState().logout()
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.error).toBeNull()
    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})

describe('authStore.fetchMe', () => {
  it('skips network and clears user when not authenticated', async () => {
    isAuthenticatedMock.mockReturnValue(false)
    await useAuthStore.getState().fetchMe()
    expect(meMock).not.toHaveBeenCalled()
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.loading).toBe(false)
  })

  it('populates user on successful me() call', async () => {
    isAuthenticatedMock.mockReturnValue(true)
    meMock.mockResolvedValue(sampleUser)
    await useAuthStore.getState().fetchMe()
    const s = useAuthStore.getState()
    expect(s.user).toEqual(sampleUser)
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
  })

  it('silently clears user when me() rejects (token already invalid)', async () => {
    isAuthenticatedMock.mockReturnValue(true)
    meMock.mockRejectedValue(new Error('401'))
    useAuthStore.setState({ user: sampleUser })
    await useAuthStore.getState().fetchMe()
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.loading).toBe(false)
  })
})

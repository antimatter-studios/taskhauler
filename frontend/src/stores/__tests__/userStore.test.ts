// userStore wraps the /users endpoint. The endpoint may not exist on the
// backend yet — the store swallows errors and falls back to []. We mock the
// apiClient seam to drive both branches deterministically.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  apiClient: {
    users: {
      listUsers: vi.fn(),
    },
  },
}))

import { apiClient } from '@/api/client'
import { useUserStore } from '@/stores/userStore'
import type { UserDetails } from '@/api/types'

const listUsersMock = apiClient.users.listUsers as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  useUserStore.setState({ users: [], loading: false, error: null })
  listUsersMock.mockReset()
})

describe('userStore', () => {
  it('has initial state with empty users and no error', () => {
    const s = useUserStore.getState()
    expect(s.users).toEqual([])
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
  })

  it('fetch() populates users on success', async () => {
    const users: UserDetails[] = [
      { id: 1, email: 'a@b.co', display_name: 'A' },
      { id: 2, email: 'c@d.co', display_name: 'C' },
    ]
    listUsersMock.mockResolvedValue(users)
    await useUserStore.getState().fetch()
    expect(useUserStore.getState().users).toEqual(users)
    expect(useUserStore.getState().error).toBeNull()
  })

  it('fetch() swallows API errors and leaves users empty', async () => {
    listUsersMock.mockRejectedValue(new Error('404'))
    await useUserStore.getState().fetch()
    const s = useUserStore.getState()
    expect(s.users).toEqual([])
    expect(s.error).toBeNull()
  })

  it('fetch() resets users to empty if previous fetch had data and new call fails', async () => {
    useUserStore.setState({ users: [{ id: 99, email: 'x@y.z', display_name: 'X' }] })
    listUsersMock.mockRejectedValue(new Error('boom'))
    await useUserStore.getState().fetch()
    expect(useUserStore.getState().users).toEqual([])
  })
})

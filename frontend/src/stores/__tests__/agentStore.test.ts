// agentStore is a stub — taskhauler has no agent registry yet, so the
// store always returns an empty list. Tests pin that contract.

import { beforeEach, describe, expect, it } from 'vitest'
import { useAgentStore } from '@/stores/agentStore'

beforeEach(() => {
  useAgentStore.setState({ aliases: [], loading: false, error: null })
})

describe('agentStore', () => {
  it('has initial state with empty aliases and no error', () => {
    const s = useAgentStore.getState()
    expect(s.aliases).toEqual([])
    expect(s.loading).toBe(false)
    expect(s.error).toBeNull()
  })

  it('fetch() resolves and leaves aliases empty', async () => {
    await useAgentStore.getState().fetch()
    const s = useAgentStore.getState()
    expect(s.aliases).toEqual([])
    expect(s.error).toBeNull()
  })

  it('fetch() resets aliases to empty even if state was pre-populated', async () => {
    useAgentStore.setState({
      aliases: [
        {
          name: 'leftover',
          type: 'agent',
          plugin: 'p',
          model: 'm',
          system_prompt: '',
          created_at: '',
          updated_at: '',
        },
      ],
    })
    await useAgentStore.getState().fetch()
    expect(useAgentStore.getState().aliases).toEqual([])
  })
})

// Shape conformance tests for mock fixtures.
//
// These guard against silent drift between mock data and the TS interfaces
// (or the components that consume them). They don't run the components —
// they just validate that every entry has the fields the rest of the app
// expects, with the right types and enum-membership.

import { describe, expect, it } from 'vitest'
import { MOCK_ACTIVITY } from '@/mock/activity'
import { MOCK_AGENTS } from '@/mock/agents'
import { MOCK_INBOX } from '@/mock/inbox'
import { MOCK_PRESENCE } from '@/mock/presence'
import { MOCK_PROPOSALS } from '@/mock/proposals'
import { MOCK_SUBTASKS } from '@/mock/subtasks'
import { MOCK_SUGGESTIONS } from '@/mock/suggestions'
import { MOCK_TELEMETRY } from '@/mock/telemetry'
import { MOCK_TRANSCRIPTS } from '@/mock/transcripts'
import { MOCK_USERS } from '@/mock/users'

const PRESENCE_ACTIONS = new Set([
  'viewing',
  'editing',
  'commenting',
  'working',
  'scanning',
  'idle',
])

const ACTIVITY_KINDS = new Set([
  'agent',
  'comment',
  'move',
  'assign',
  'create',
  'ship',
  'label',
  'priority',
])

const PROPOSAL_ACTION_KINDS = new Set([
  'priority',
  'move',
  'label',
  'split',
  'ping',
  'archive',
  'assign',
  'due',
])

const SUGGESTION_KINDS = new Set([
  'promote',
  'split',
  'assign',
  'escalate',
  'archive',
  'link',
])

describe('MOCK_USERS', () => {
  it('every entry has id/email/display_name/hue/avatar and avatar is 2 chars', () => {
    expect(MOCK_USERS.length).toBeGreaterThan(0)
    for (const u of MOCK_USERS) {
      expect(typeof u.id).toBe('number')
      expect(typeof u.email).toBe('string')
      expect(typeof u.display_name).toBe('string')
      expect(typeof u.hue).toBe('number')
      expect(typeof u.avatar).toBe('string')
      expect(u.avatar.length).toBe(2)
    }
  })
})

describe('MOCK_AGENTS', () => {
  it('every entry has the documented fields and status is "working"|"idle"', () => {
    expect(MOCK_AGENTS.length).toBeGreaterThan(0)
    for (const a of MOCK_AGENTS) {
      expect(typeof a.name).toBe('string')
      expect(typeof a.plugin).toBe('string')
      expect(typeof a.model).toBe('string')
      expect(typeof a.description).toBe('string')
      expect(['working', 'idle']).toContain(a.status)
    }
  })
})

describe('MOCK_PRESENCE', () => {
  it('every entry has id/kind/action/at and action is in the valid set', () => {
    expect(MOCK_PRESENCE.length).toBeGreaterThan(0)
    for (const p of MOCK_PRESENCE) {
      expect(typeof p.id).toBe('string')
      expect(['user', 'agent']).toContain(p.kind)
      expect(PRESENCE_ACTIONS.has(p.action)).toBe(true)
      expect(typeof p.at).toBe('number')
      // user_id is set for kind=user, agent_name for kind=agent.
      if (p.kind === 'user') expect(typeof p.user_id).toBe('number')
      if (p.kind === 'agent') expect(typeof p.agent_name).toBe('string')
      // card_id is either a string or null.
      if (p.card_id !== null) expect(typeof p.card_id).toBe('string')
    }
  })
})

describe('MOCK_TELEMETRY', () => {
  it('every entry has the expected fields, status valid, load in [0,1]', () => {
    expect(MOCK_TELEMETRY.length).toBeGreaterThan(0)
    for (const t of MOCK_TELEMETRY) {
      expect(typeof t.name).toBe('string')
      expect(['working', 'idle']).toContain(t.status)
      expect(typeof t.load).toBe('number')
      expect(t.load).toBeGreaterThanOrEqual(0)
      expect(t.load).toBeLessThanOrEqual(1)
      expect(typeof t.tok).toBe('number')
      expect(typeof t.last_act).toBe('number')
      // step and current_card_id are nullable.
      if (t.step !== null) expect(typeof t.step).toBe('string')
      if (t.current_card_id !== null) {
        expect(typeof t.current_card_id).toBe('string')
      }
    }
  })
})

describe('MOCK_TRANSCRIPTS', () => {
  it('every key is a valid agent name and every value is a non-empty array of lines', () => {
    const agentNames = new Set(MOCK_AGENTS.map((a) => a.name))
    const keys = Object.keys(MOCK_TRANSCRIPTS)
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      expect(agentNames.has(k)).toBe(true)
      const lines = MOCK_TRANSCRIPTS[k]
      expect(Array.isArray(lines)).toBe(true)
      expect(lines.length).toBeGreaterThan(0)
      for (const ln of lines) {
        expect(typeof ln.agent).toBe('string')
        expect(typeof ln.ts).toBe('number')
        expect(typeof ln.text).toBe('string')
      }
    }
  })
})

describe('MOCK_ACTIVITY', () => {
  it('every entry has id/board_id/kind/text/at with kind in valid set', () => {
    expect(MOCK_ACTIVITY.length).toBeGreaterThan(0)
    for (const e of MOCK_ACTIVITY) {
      expect(typeof e.id).toBe('string')
      expect(typeof e.board_id).toBe('string')
      expect(ACTIVITY_KINDS.has(e.kind)).toBe(true)
      expect(typeof e.text).toBe('string')
      expect(typeof e.at).toBe('number')
    }
  })
})

describe('MOCK_PROPOSALS', () => {
  it('every entry has the expected fields and status/action.kind are in valid sets', () => {
    expect(MOCK_PROPOSALS.length).toBeGreaterThan(0)
    for (const p of MOCK_PROPOSALS) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.board_id).toBe('string')
      expect(['user', 'agent']).toContain(p.proposer_kind)
      expect(typeof p.title).toBe('string')
      expect(typeof p.summary).toBe('string')
      expect(['pending', 'approved', 'rejected']).toContain(p.status)
      expect(Array.isArray(p.actions)).toBe(true)
      expect(p.actions.length).toBeGreaterThan(0)
      for (const action of p.actions) {
        expect(PROPOSAL_ACTION_KINDS.has(action.kind)).toBe(true)
      }
      expect(typeof p.at).toBe('number')
    }
  })
})

describe('MOCK_SUGGESTIONS', () => {
  it('every entry has id/kind/text with kind in valid set', () => {
    expect(MOCK_SUGGESTIONS.length).toBeGreaterThan(0)
    for (const s of MOCK_SUGGESTIONS) {
      expect(typeof s.id).toBe('string')
      expect(SUGGESTION_KINDS.has(s.kind)).toBe(true)
      expect(typeof s.text).toBe('string')
    }
  })
})

describe('MOCK_SUBTASKS', () => {
  it('every key maps to an array of subtasks with the right shape', () => {
    const keys = Object.keys(MOCK_SUBTASKS)
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) {
      expect(typeof k).toBe('string')
      const list = MOCK_SUBTASKS[k]
      expect(Array.isArray(list)).toBe(true)
      for (const st of list) {
        expect(typeof st.id).toBe('string')
        expect(typeof st.card_id).toBe('string')
        expect(typeof st.text).toBe('string')
        expect(typeof st.done).toBe('boolean')
        expect(typeof st.position).toBe('number')
      }
    }
  })
})

describe('MOCK_INBOX', () => {
  it('is a number', () => {
    expect(typeof MOCK_INBOX).toBe('number')
  })
})

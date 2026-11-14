import { IllegalMoveError } from 'game-kit/turns'
import { describe, expect, it } from 'vitest'
import { currentTurn } from './index'
import { setPosition } from './positions'
import { decide, edit, expectPending, planWith, reveal, scenario } from './testing/scenario'

describe('Intern', () => {
  it('does nothing in slot 1', () => {
    const state = reveal(scenario({ plans: { 0: planWith(1, 'intern') } }))
    expect(currentTurn(state).turnSeat).toBe(1)
    expect(state.track.Clay).toEqual([0, 0, 0])
  })

  it('copies the tile in the previous slot at strength 1', () => {
    const plan = ['develop', 'intern', 'invest', 'dance'] as const
    const state = reveal(scenario({ slot: 2, plans: { 0: [...plan] } }))
    const pending = expectPending(state, 'rondelMove')
    expect(pending.purpose).toBe('develop')
    expect(pending.options.map((option) => option.steps)).toEqual([1])
  })

  it('copies on the Intern tile side rather than the copied tile side', () => {
    const plan = ['develop', 'intern', 'invest', 'dance'] as const
    const start = scenario({
      slot: 2,
      plans: { 0: [...plan] },
      ongoing: { 0: ['extraHands'] },
      setup: (draft) => { draft.players[0].tiles.intern = 'upgraded' },
    })
    const moved = decide(reveal(start), { kind: 'rondelMove', steps: 2 })
    // The Develop tile is standard, but the Intern is upgraded, so the extra rally is offered.
    expect(expectPending(moved, 'developExtraRally').options).toEqual([1])
  })

  it('has strength 2 with Extra Hands', () => {
    const plan = ['develop', 'intern', 'invest', 'dance'] as const
    const start = scenario({ slot: 2, plans: { 0: [...plan] }, ongoing: { 0: ['extraHands'] } })
    expect(expectPending(reveal(start), 'rondelMove').options.map((option) => option.steps)).toEqual([1, 2])
  })
})

describe('Invest', () => {
  const investPlans = { 0: planWith(3, 'invest') }

  it('goes down on one track and up the same amount on an adjacent one', () => {
    const state = decide(reveal(scenario({ slot: 3, plans: investPlans })), {
      kind: 'invest',
      transfer: { from: 'Sage', to: 'Periwinkle', amount: 2 },
    })
    expect(state.track.Sage[0]).toBe(-2)
    expect(state.track.Periwinkle[0]).toBe(2)
  })

  it('goes up only as far as it actually went down after stopping at the bottom', () => {
    const start = scenario({ slot: 3, plans: investPlans, setup: (draft) => { draft.track.Sage[0] = -1 } })
    const state = decide(reveal(start), { kind: 'invest', transfer: { from: 'Sage', to: 'Periwinkle', amount: 3 } })
    expect(state.track.Sage[0]).toBe(-2)
    expect(state.track.Periwinkle[0]).toBe(1)
  })

  it('stops going up at the top of the track', () => {
    const start = scenario({ slot: 3, plans: investPlans, setup: (draft) => { draft.track.Periwinkle[0] = 4 } })
    const state = decide(reveal(start), { kind: 'invest', transfer: { from: 'Sage', to: 'Periwinkle', amount: 2 } })
    expect(state.track.Periwinkle[0]).toBe(4)
  })

  it('can invest nothing', () => {
    const state = decide(reveal(scenario({ slot: 3, plans: investPlans })), { kind: 'invest', transfer: null })
    expect(state.track.Sage[0]).toBe(0)
  })

  it('refuses tracks that are not neighbours when standard, including Clay and Mauve', () => {
    const state = reveal(scenario({ slot: 3, plans: investPlans }))
    expect(() => decide(state, { kind: 'invest', transfer: { from: 'Clay', to: 'Mauve', amount: 1 } })).toThrow(IllegalMoveError)
    expect(() => decide(state, { kind: 'invest', transfer: { from: 'Clay', to: 'Stone', amount: 1 } })).toThrow(IllegalMoveError)
  })

  it('allows any other track when upgraded', () => {
    const start = scenario({
      slot: 3,
      plans: investPlans,
      setup: (draft) => { draft.players[0].tiles.invest = 'upgraded' },
    })
    const state = decide(reveal(start), { kind: 'invest', transfer: { from: 'Clay', to: 'Mauve', amount: 1 } })
    expect(state.track.Mauve[0]).toBe(1)
  })

  it('refuses to move more than the slot strength', () => {
    const state = reveal(scenario({ slot: 2, plans: { 0: planWith(2, 'invest') } }))
    expect(() => decide(state, { kind: 'invest', transfer: { from: 'Sage', to: 'Periwinkle', amount: 3 } })).toThrow(IllegalMoveError)
  })
})

describe('Track limits', () => {
  it('stops at -2 and +4', () => {
    const state = scenario()
    const lowered = edit(state, (draft) => setPosition(draft, 0, 'Clay', -5))
    const raised = edit(state, (draft) => setPosition(draft, 0, 'Clay', 9))
    expect(lowered.track.Clay[0]).toBe(-2)
    expect(raised.track.Clay[0]).toBe(4)
  })
})

describe('Upgrade on reaching space 3', () => {
  // In the neutral scenario Clay upgrades Address, Sage Develop, Periwinkle Media.
  it('upgrades the track action tile at once', () => {
    const start = scenario({ plans: { 0: planWith(1, 'address') }, setup: (draft) => { draft.track.Sage[0] = 2 } })
    const state = decide(reveal(start), { kind: 'rondelMove', steps: 1 })
    expect(state.track.Sage[0]).toBe(3)
    expect(state.players[0].tiles.develop).toBe('upgraded')
  })

  it('applies to a later slot of the same round', () => {
    const plan = ['address', 'develop', 'media', 'leverage'] as const
    const start = scenario({
      plans: { 0: [...plan] },
      setup: (draft) => { draft.track.Sage[0] = 2 },
    })
    let state = decide(reveal(start), { kind: 'rondelMove', steps: 1 })
    state = edit(state, (draft) => {
      if (draft.resolution) draft.resolution.slot = 2
    })
    state = decide(reveal(edit(state, (draft) => { if (draft.resolution) draft.resolution.orderIndex = 0 })), { kind: 'rondelMove', steps: 2 })
    expect(state.players[0].tiles.develop).toBe('upgraded')
  })

  it('does not trigger again when the player returns to 3', () => {
    const state = scenario({ setup: (draft) => { draft.track.Sage[0] = 2 } })
    const upgradedOnce = edit(state, (draft) => setPosition(draft, 0, 'Sage', 3))
    const again = edit(upgradedOnce, (draft) => {
      setPosition(draft, 0, 'Sage', 1)
      setPosition(draft, 0, 'Sage', 3)
    })
    const upgradeEvents = again.log.filter((entry) => entry.text.includes('is upgraded'))
    expect(upgradeEvents).toHaveLength(1)
  })

  it('upgrades nothing when the track action tile is already upgraded', () => {
    const state = scenario({ setup: (draft) => { draft.players[0].tiles.develop = 'upgraded' } })
    const next = edit(state, (draft) => setPosition(draft, 0, 'Sage', 3))
    expect(next.log.some((entry) => entry.text.includes('is upgraded'))).toBe(false)
  })

  it('leaves the set-aside action to cards alone', () => {
    const state = scenario()
    const next = edit(state, (draft) => {
      for (const issue of ['Clay', 'Sage', 'Periwinkle', 'Stone', 'Seafoam', 'Mauve'] as const) setPosition(draft, 0, issue, 4)
    })
    expect(next.players[0].tiles[state.setAsideAction]).toBe('basic')
  })
})

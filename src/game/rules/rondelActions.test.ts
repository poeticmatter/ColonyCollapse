import { IllegalMoveError } from 'game-kit/turns'
import { describe, expect, it } from 'vitest'
import { tileIssue } from './index'
import { decide, expectPending, planWith, reveal, rondelTile, scenario } from './testing/scenario'

describe('Address', () => {
  it('moves the rondel pawn, goes up on the tile issue, then flips the tile', () => {
    const state = decide(reveal(scenario({ plans: { 0: planWith(1, 'address') } })), { kind: 'rondelMove', steps: 1 })
    expect(state.rondelPawn).toBe(1)
    expect(state.track.Sage[0]).toBe(1)
    expect(tileIssue(rondelTile(state, 1))).toBe('Periwinkle')
  })

  it('only allows as many steps as the slot strength', () => {
    const state = reveal(scenario({ plans: { 0: planWith(1, 'address') } }))
    expect(expectPending(state, 'rondelMove').options.map((option) => option.steps)).toEqual([1])
    expect(() => decide(state, { kind: 'rondelMove', steps: 2 })).toThrow(IllegalMoveError)
  })

  it('does not rally the flipped tile when standard', () => {
    const state = decide(reveal(scenario({ plans: { 0: planWith(1, 'address') } })), { kind: 'rondelMove', steps: 1 })
    expect(rondelTile(state, 1).disc).toBeNull()
  })

  it('rallies the flipped tile when upgraded', () => {
    const state = decide(
      reveal(scenario({ plans: { 0: planWith(1, 'address') }, setup: (draft) => { draft.players[0].tiles.address = 'upgraded' } })),
      { kind: 'rondelMove', steps: 1 },
    )
    expect(rondelTile(state, 1).disc).toBe(0)
  })

  it('lets Cross-Party Address flip the tile before going up', () => {
    const start = scenario({ plans: { 0: planWith(1, 'address') }, ongoing: { 0: ['crossPartyAddress'] } })
    const moved = decide(reveal(start), { kind: 'rondelMove', steps: 1 })
    const state = decide(moved, { kind: 'crossPartyFlip', flip: true })
    expect(state.track.Periwinkle[0]).toBe(1)
    expect(state.track.Sage[0]).toBe(0)
    expect(tileIssue(rondelTile(state, 1))).toBe('Sage')
  })
})

describe('Develop', () => {
  it('rallies the tile the pawn stops on', () => {
    const state = decide(reveal(scenario({ plans: { 0: planWith(1, 'develop') } })), { kind: 'rondelMove', steps: 1 })
    expect(rondelTile(state, 1).disc).toBe(0)
  })

  it('leaves the tile uncontrolled when the player is below 0 on its issue', () => {
    const start = scenario({ plans: { 0: planWith(1, 'develop') }, setup: (draft) => { draft.track.Sage[0] = -1 } })
    const state = decide(reveal(start), { kind: 'rondelMove', steps: 1 })
    expect(rondelTile(state, 1).disc).toBeNull()
  })

  it('also rallies one passed tile when upgraded, never the start or the destination twice', () => {
    const start = scenario({
      slot: 3,
      plans: { 0: planWith(3, 'develop') },
      setup: (draft) => { draft.players[0].tiles.develop = 'upgraded' },
    })
    const moved = decide(reveal(start), { kind: 'rondelMove', steps: 3 })
    expect(expectPending(moved, 'developExtraRally').options).toEqual([1, 2])
    const state = decide(moved, { kind: 'developExtraRally', slot: 2 })
    expect(rondelTile(state, 3).disc).toBe(0)
    expect(rondelTile(state, 2).disc).toBe(0)
    expect(rondelTile(state, 1).disc).toBeNull()
    expect(rondelTile(state, 0).disc).toBeNull()
  })

  it('lets the extra rally be declined', () => {
    const start = scenario({
      slot: 2,
      plans: { 0: planWith(2, 'develop') },
      setup: (draft) => { draft.players[0].tiles.develop = 'upgraded' },
    })
    const moved = decide(reveal(start), { kind: 'rondelMove', steps: 2 })
    const state = decide(moved, { kind: 'developExtraRally', slot: null })
    expect(rondelTile(state, 1).disc).toBeNull()
  })

  it('lets Site Prep flip the tile before rallying it', () => {
    const start = scenario({
      plans: { 0: planWith(1, 'develop') },
      ongoing: { 0: ['sitePrep'] },
      setup: (draft) => { draft.track.Periwinkle[0] = -1 },
    })
    const moved = decide(reveal(start), { kind: 'rondelMove', steps: 1 })
    const state = decide(moved, { kind: 'sitePrepFlip', slots: [1] })
    // The tile now shows Periwinkle, where the player is below 0, so the rally fails.
    expect(rondelTile(state, 1).disc).toBeNull()
    expect(tileIssue(rondelTile(state, 1))).toBe('Periwinkle')
  })
})

describe('Media', () => {
  const mediaPlans = { 0: planWith(1, 'media'), 1: planWith(1, 'media') }

  it('flips one tile when standard', () => {
    const state = decide(reveal(scenario({ plans: mediaPlans })), { kind: 'mediaFlip', slots: [3] })
    expect(tileIssue(rondelTile(state, 3))).toBe('Seafoam')
  })

  it('refuses to flip two tiles when standard', () => {
    const state = reveal(scenario({ plans: mediaPlans }))
    expect(() => decide(state, { kind: 'mediaFlip', slots: [1, 2] })).toThrow(IllegalMoveError)
  })

  it('may flip nothing', () => {
    const state = decide(reveal(scenario({ plans: mediaPlans })), { kind: 'mediaFlip', slots: [] })
    expect(tileIssue(rondelTile(state, 3))).toBe('Stone')
  })

  it('flips any number of tiles when upgraded', () => {
    const start = scenario({ plans: mediaPlans, setup: (draft) => { draft.players[0].tiles.media = 'upgraded' } })
    const state = decide(reveal(start), { kind: 'mediaFlip', slots: [0, 1, 2, 3] })
    expect(tileIssue(rondelTile(state, 0))).toBe('Sage')
    expect(tileIssue(rondelTile(state, 3))).toBe('Seafoam')
  })

  it('locks a flipped tile against Media for the rest of the slot', () => {
    const afterFirst = decide(reveal(scenario({ plans: mediaPlans })), { kind: 'mediaFlip', slots: [2] })
    expect(expectPending(reveal(afterFirst), 'mediaFlip').options).not.toContain(2)
  })

  it('unlocks tiles for the next slot', () => {
    const plans = { 0: ['media', 'intern', 'invest', 'dance'] as const, 1: ['invest', 'media', 'dance', 'intern'] as const }
    let state = scenario({ playerCount: 2, plans: { 0: [...plans[0]], 1: [...plans[1]] } })
    state = decide(reveal(state), { kind: 'mediaFlip', slots: [2] })
    state = decide(reveal(state), { kind: 'invest', transfer: null })
    // Slot 2: seat 0's Intern copies Media (strength 1), then seat 1's Media.
    state = decide(reveal(state), { kind: 'mediaFlip', slots: [] })
    expect(expectPending(reveal(state), 'mediaFlip').options).toContain(2)
  })

  it('does not apply the lock to other flips such as Address', () => {
    const plans = { 0: planWith(1, 'media'), 1: planWith(1, 'address') }
    let state = decide(reveal(scenario({ plans })), { kind: 'mediaFlip', slots: [1] })
    state = decide(reveal(state), { kind: 'rondelMove', steps: 1 })
    expect(tileIssue(rondelTile(state, 1))).toBe('Sage')
  })

  it('lets Press Cycle rally one of the tiles just flipped', () => {
    const start = scenario({
      plans: mediaPlans,
      ongoing: { 0: ['pressCycle'] },
      setup: (draft) => { draft.players[0].tiles.media = 'upgraded' },
    })
    const flipped = decide(reveal(start), { kind: 'mediaFlip', slots: [1, 2] })
    expect(expectPending(flipped, 'pressCycleRally').options).toEqual([1, 2])
    const state = decide(flipped, { kind: 'pressCycleRally', slot: 2 })
    expect(rondelTile(state, 2).disc).toBe(0)
    expect(rondelTile(state, 1).disc).toBeNull()
  })
})

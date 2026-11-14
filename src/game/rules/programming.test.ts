import { IllegalMoveError } from 'game-kit/turns'
import { describe, expect, it } from 'vitest'
import { colonyRules, currentTurn, pendingDecision, visiblePlanSlot } from './index'
import { decide, newGame, planWith, reveal, scenario, send } from './testing/scenario'

const PLAN = planWith(1, 'address')

describe('programming', () => {
  it('accepts plans from the seats in any order', () => {
    let state = newGame(3)
    state = send(state, { type: 'program', plan: PLAN }, 2)
    expect(colonyRules.activePlayers?.(state)).toEqual([0, 1])
    state = send(state, { type: 'program', plan: PLAN }, 0)
    expect(colonyRules.activePlayers?.(state)).toEqual([1])
    expect(colonyRules.activePlayer(state)).toBe(1)
  })

  it('keeps a seat that has not programmed able to program after another seat did', () => {
    const state = send(newGame(2), { type: 'program', plan: PLAN }, 1)
    expect(() => send(state, { type: 'program', plan: planWith(2, 'media') }, 0)).not.toThrow()
  })

  it('rejects a plan that repeats an action', () => {
    const plan = ['address', 'address', 'media', 'leverage'] as const
    expect(() => send(newGame(2), { type: 'program', plan: [...plan] }, 0)).toThrow(IllegalMoveError)
  })

  it('rejects a plan that is not four actions long', () => {
    expect(() => send(newGame(2), { type: 'program', plan: ['address', 'media'] }, 0)).toThrow(IllegalMoveError)
  })

  it('rejects changing a plan once it is sent', () => {
    const state = send(newGame(2), { type: 'program', plan: PLAN }, 0)
    expect(() => send(state, { type: 'program', plan: planWith(2, 'media') }, 0)).toThrow(IllegalMoveError)
  })

  it('starts resolving once the last seat has sent a plan', () => {
    const state = scenario({ playerCount: 2 })
    expect(state.phase).toBe('resolving')
    expect(state.resolution?.slot).toBe(1)
  })

  it('shows a plan slot only to its owner until it is revealed', () => {
    const state = scenario({ plans: { 0: planWith(1, 'address'), 1: planWith(1, 'media') } })
    expect(visiblePlanSlot(state, 1, 1, 0)).toBeNull()
    expect(visiblePlanSlot(state, 1, 1, 1)).toBe('media')
    expect(visiblePlanSlot(state, 1, 1, 'spectator')).toBeNull()
  })
})

describe('resolution order', () => {
  it('goes clockwise from the start player', () => {
    const state = scenario({ playerCount: 4, startPlayer: 2 })
    expect(currentTurn(state).order).toEqual([2, 3, 0, 1])
    expect(colonyRules.activePlayer(state)).toBe(2)
  })

  it('waits for the player to reveal before showing their tile to others', () => {
    const state = scenario({ plans: { 0: planWith(1, 'invest') } })
    expect(currentTurn(state).hasRevealed).toBe(false)
    expect(visiblePlanSlot(state, 0, 1, 1)).toBeNull()
    const revealed = reveal(state)
    expect(visiblePlanSlot(revealed, 0, 1, 1)).toBe('invest')
  })

  it('does not reveal the next player tile when the previous player finishes', () => {
    const state = scenario({ plans: { 0: planWith(1, 'intern'), 1: planWith(1, 'media') } })
    const afterFirst = reveal(state)
    expect(currentTurn(afterFirst).turnSeat).toBe(1)
    expect(currentTurn(afterFirst).hasRevealed).toBe(false)
    expect(visiblePlanSlot(afterFirst, 1, 1, 0)).toBeNull()
  })

  it('refuses a reveal from a seat whose turn it is not', () => {
    const state = scenario()
    expect(() => send(state, { type: 'reveal' }, 1)).toThrow(IllegalMoveError)
  })

  it('refuses a decision before the tile is revealed', () => {
    const state = scenario()
    expect(pendingDecision(state)).toBeNull()
    expect(() => send(state, { type: 'decide', decision: { kind: 'rondelMove', steps: 1 } })).toThrow(IllegalMoveError)
  })

  it('refuses an answer of the wrong kind', () => {
    const state = reveal(scenario({ plans: { 0: planWith(1, 'address') } }))
    expect(() => send(state, { type: 'decide', decision: { kind: 'gavelPass', pass: true } })).toThrow(IllegalMoveError)
  })

  it('moves to the next slot after the last player, in the order of the new start player', () => {
    const state = scenario({
      topCard: 'speakersFavor',
      plans: { 0: planWith(1, 'leverage'), 1: planWith(1, 'intern'), 2: planWith(1, 'intern') },
    })
    let next = reveal(state)
    const pending = pendingDecision(next)
    if (pending?.kind !== 'leveragePick') throw new Error('expected a leverage pick')
    next = send(next, { type: 'decide', decision: { kind: 'leveragePick', cardId: pending.cardIds[0], playEffect: true, up: null } })
    next = send(next, { type: 'decide', decision: { kind: 'speakersFavor', to: 2 } })
    expect(currentTurn(next).order).toEqual([0, 1, 2])
    next = reveal(reveal(next))
    expect(currentTurn(next).slot).toBe(2)
    expect(currentTurn(next).order).toEqual([2, 0, 1])
  })

  it('moves play on to the next round after slot 4 and polling', () => {
    const plan = ['address', 'develop', 'invest', 'intern'] as const
    let state = scenario({ playerCount: 2, slot: 4, plans: { 0: [...plan], 1: [...plan] } })
    for (let seat = 0; seat < 2; seat += 1) {
      state = decide(reveal(state), { kind: 'invest', transfer: null })
    }
    expect(state.round).toBe(2)
    expect(state.phase).toBe('programming')
    expect(state.rondel.every((tile) => tile !== null)).toBe(true)
    expect(Object.keys(state.board)).toHaveLength(6)
  })
})

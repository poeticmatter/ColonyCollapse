import { describe, expect, it } from 'vitest'
import { colonyRules } from './index'
import { nextBotMove, seededPick } from './testing/bot'
import { decide, expectPending, newGame, planWith, reveal, scenario } from './testing/scenario'
import type { GameState, Move } from './types'

function reasonFor(state: GameState, move: Move): string | null {
  return colonyRules.irreversibleReason?.(state, move) ?? null
}

describe('irreversibleReason', () => {
  it('flags revealing a Leverage tile, which draws cards', () => {
    const state = scenario({ plans: { 0: planWith(1, 'leverage') } })
    expect(reasonFor(state, { type: 'reveal' })).toBe("Drawing cards can't be undone.")
  })

  it('does not flag revealing a tile that draws nothing', () => {
    const state = scenario({ plans: { 0: planWith(1, 'address') } })
    expect(reasonFor(state, { type: 'reveal' })).toBeNull()
  })

  it('does not flag choosing among cards already drawn', () => {
    const state = reveal(scenario({ plans: { 0: planWith(1, 'leverage') } }))
    const [cardId] = expectPending(state, 'leveragePick').cardIds
    const move: Move = { type: 'decide', decision: { kind: 'leveragePick', cardId, playEffect: false, up: 'Clay' } }
    expect(reasonFor(state, move)).toBeNull()
  })

  it('flags a Leverage Intern copy, which also draws cards', () => {
    const plan = ['leverage', 'intern', 'invest', 'dance'] as const
    const state = scenario({ slot: 2, plans: { 0: [...plan] } })
    expect(reasonFor(state, { type: 'reveal' })).toBe("Drawing cards can't be undone.")
  })

  it('flags the move that ends a round before the last, which draws new tiles', () => {
    const plan = ['address', 'develop', 'invest', 'intern'] as const
    const state = decide(reveal(scenario({ playerCount: 2, slot: 4, plans: { 0: [...plan], 1: [...plan] } })), {
      kind: 'invest',
      transfer: null,
    })
    const lastMove: Move = { type: 'decide', decision: { kind: 'invest', transfer: null } }
    expect(reasonFor(reveal(state), lastMove)).toBe('Ending the round draws new tiles.')
  })

  it('does not flag the move that ends the game, which draws nothing', () => {
    const plan = ['address', 'develop', 'invest', 'intern'] as const
    const state = decide(
      reveal(
        scenario({
          playerCount: 2,
          slot: 4,
          plans: { 0: [...plan], 1: [...plan] },
          setup: (draft) => { draft.round = 5 },
        }),
      ),
      { kind: 'invest', transfer: null },
    )
    const lastMove: Move = { type: 'decide', decision: { kind: 'invest', transfer: null } }
    expect(reasonFor(reveal(state), lastMove)).toBeNull()
  })

  it('does not flag a move the rules reject', () => {
    const state = scenario({ plans: { 0: planWith(1, 'address') } })
    expect(reasonFor(state, { type: 'decide', decision: { kind: 'gavelPass', pass: true } })).toBeNull()
  })

  it('does not flag plans', () => {
    const state = newGame(2)
    const { move } = nextBotMove(state, seededPick(1))
    expect(reasonFor(state, move)).toBeNull()
  })
})

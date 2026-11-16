import { describe, expect, it } from 'vitest'
import { colonyRules } from './index'
import { scenario } from './testing/scenario'
import type { GameState, Move } from './types'

function reasonFor(state: GameState, move: Move): string | null {
  return colonyRules.irreversibleReason?.(state, move) ?? null
}

const onLastSlot = (draft: GameState) => {
  draft.dial = 5
}

describe('irreversibleReason', () => {
  it('does not flag an action that draws nothing', () => {
    expect(reasonFor(scenario(), { type: 'address' })).toBeNull()
  })

  it('does not flag ending a turn mid-round', () => {
    expect(reasonFor(scenario(), { type: 'endTurn' })).toBeNull()
  })

  it('flags ending a turn that passes the mark, which draws new tiles', () => {
    expect(reasonFor(scenario({ setup: onLastSlot }), { type: 'endTurn' })).toBe('Ending the round draws new tiles.')
  })

  it('flags paying to turn the dial past the mark', () => {
    expect(reasonFor(scenario({ setup: onLastSlot }), { type: 'turnDial' })).toBe('Ending the round draws new tiles.')
  })

  it('does not flag the move that ends the game, which draws nothing', () => {
    const state = scenario({ setup: (draft) => { onLastSlot(draft); draft.round = 5 } })
    expect(reasonFor(state, { type: 'endTurn' })).toBeNull()
  })

  it('does not flag a move the rules reject', () => {
    expect(reasonFor(scenario(), { type: 'rallyAround' })).toBeNull()
  })
})

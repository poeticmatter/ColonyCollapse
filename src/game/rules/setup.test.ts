import { describe, expect, it } from 'vitest'
import { ISSUES } from '../board/palette'
import { TILE_BLUEPRINTS } from '../data/tiles'
import { ACTION_POINTS_PER_TURN } from './constants'
import { colonyRules } from './index'
import { newGame } from './testing/scenario'

describe('tile data', () => {
  it('has two copies of each of the 15 colour pairs among the 30 tiles', () => {
    expect(TILE_BLUEPRINTS).toHaveLength(30)
    const copiesByPair = new Map<string, number>()
    for (const { faces } of TILE_BLUEPRINTS) {
      const key = faces.join('+')
      copiesByPair.set(key, (copiesByPair.get(key) ?? 0) + 1)
    }
    expect(copiesByPair.size).toBe(15)
    expect([...copiesByPair.values()].every((copies) => copies === 2)).toBe(true)
  })
})

describe('setup', () => {
  it('deals six tiles into the rondel and leaves 24 in the bag', () => {
    const state = newGame(3)
    expect(state.rondel.filter((tile) => tile !== null)).toHaveLength(6)
    expect(state.bag).toHaveLength(24)
  })

  it('starts everyone on 0 on every track', () => {
    const state = newGame(4)
    for (const issue of ISSUES) expect(state.track[issue]).toEqual([0, 0, 0, 0])
  })

  it('starts with the dial on slot 1 and a pawn per player in the hub', () => {
    const state = newGame(3)
    expect(state.dial).toBe(0)
    expect(state.pawns.map((pawn) => pawn.cell)).toEqual(['0,0', '0,0', '0,0'])
  })

  it('gives the first turn, with full points, to a seat at the table chosen by the seed', () => {
    const first = colonyRules.createInitialState({ settings: {}, playerCount: 5, seed: 42 })
    const second = colonyRules.createInitialState({ settings: {}, playerCount: 5, seed: 42 })
    expect(first.turn.seat).toBeGreaterThanOrEqual(0)
    expect(first.turn.seat).toBeLessThan(5)
    expect(first.turn.actionPoints).toBe(ACTION_POINTS_PER_TURN)
    expect(first.roundStarter).toBe(first.turn.seat)
    expect(second).toEqual(first)
  })

  it('waits for the first player only', () => {
    const state = newGame(4)
    expect(colonyRules.activePlayers?.(state)).toEqual([state.turn.seat])
  })
})

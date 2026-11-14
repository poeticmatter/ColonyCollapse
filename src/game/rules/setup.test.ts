import { describe, expect, it } from 'vitest'
import { ACTION_IDS } from '../art/actions'
import { ISSUES } from '../board/palette'
import { ABILITY_LIST, CARDS } from '../data/cards'
import { TILE_BLUEPRINTS } from '../data/tiles'
import { colonyRules } from './index'
import { newGame } from './testing/scenario'

describe('card and tile data', () => {
  it('has 45 seed cards from 18 abilities', () => {
    expect(CARDS).toHaveLength(45)
    expect(ABILITY_LIST).toHaveLength(18)
  })

  it('puts every issue on exactly 15 cards', () => {
    for (const issue of ISSUES) {
      const count = CARDS.filter((card) => card.issues.includes(issue)).length
      expect(count).toBe(15)
    }
  })

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

  it('removes one seed card per player from the deck', () => {
    const state = newGame(4)
    expect(state.deck).toHaveLength(45 - 4)
    expect(state.discard).toHaveLength(4)
  })

  it('moves each player up on one issue and down on another after the seed card', () => {
    const state = newGame(3)
    for (let seat = 0; seat < 3; seat += 1) {
      const positions = ISSUES.map((issue) => state.track[issue][seat]).sort((a, b) => a - b)
      expect(positions).toEqual([-1, 0, 0, 0, 0, 1])
    }
  })

  it('assigns six distinct actions to the six tracks and sets the seventh aside', () => {
    const state = newGame(2)
    const assigned = ISSUES.map((issue) => state.trackAction[issue])
    expect(new Set(assigned).size).toBe(6)
    expect([...assigned, state.setAsideAction].sort()).toEqual([...ACTION_IDS].sort())
  })

  it('starts with the rondel pawn on slot 1 and a pawn per player in the hub', () => {
    const state = newGame(3)
    expect(state.rondelPawn).toBe(0)
    expect(state.pawns.map((pawn) => pawn.cell)).toEqual(['0,0', '0,0', '0,0'])
  })

  it('chooses a start player at the table, the same one for the same seed', () => {
    const first = colonyRules.createInitialState({ settings: {}, playerCount: 5, seed: 42 })
    const second = colonyRules.createInitialState({ settings: {}, playerCount: 5, seed: 42 })
    expect(first.startPlayer).toBeGreaterThanOrEqual(0)
    expect(first.startPlayer).toBeLessThan(5)
    expect(second).toEqual(first)
  })

  it('begins in programming with every seat to move', () => {
    const state = newGame(4)
    expect(state.phase).toBe('programming')
    expect(colonyRules.activePlayers?.(state)).toEqual([0, 1, 2, 3])
  })
})

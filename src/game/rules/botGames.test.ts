import { describe, expect, it } from 'vitest'
import { getCellInfo, HUB_CELL_KEY } from '../board/geometry'
import { TRACK_MAX, TRACK_MIN } from '../board/track'
import { colonyRules } from './index'
import { pickFirst, playBotGame, randomPlayer, seededPick } from './testing/bot'
import type { GameState, Move } from './types'

const PLAYER_COUNTS = [2, 3, 4, 5]
const SEEDS = [1, 2, 3]

const ALL_MOVE_TYPES: Move['type'][] = ['turnDial', 'movePawn', 'rallyDial', 'address', 'shift', 'rallyAround', 'endTurn']

function expectConsistent(state: GameState): void {
  const tileIds = [
    ...state.bag.map((tile) => tile.id),
    ...state.rondel.flatMap((tile) => (tile ? [tile.id] : [])),
    ...Object.values(state.board).map((tile) => tile.id),
  ]
  expect(new Set(tileIds).size).toBe(30)
  expect(tileIds).toHaveLength(30)

  const occupiedCells = state.pawns.map((pawn) => pawn.cell).filter((cell) => cell !== HUB_CELL_KEY)
  expect(new Set(occupiedCells).size).toBe(occupiedCells.length)
  for (const pawn of state.pawns) {
    if (pawn.cell !== HUB_CELL_KEY) expect(pawn.hasLeftHub).toBe(true)
    expect(getCellInfo(pawn.cell)).toBeDefined()
  }
  for (const positions of Object.values(state.track)) {
    for (const position of positions) {
      expect(position).toBeGreaterThanOrEqual(TRACK_MIN)
      expect(position).toBeLessThanOrEqual(TRACK_MAX)
    }
  }
}

describe('random bot games', () => {
  for (const playerCount of PLAYER_COUNTS) {
    for (const seed of SEEDS) {
      it(`a player that always takes the first legal move finishes a ${playerCount}-player game (seed ${seed})`, () => {
        const { state } = playBotGame(playerCount, seed, randomPlayer(pickFirst))
        expect(state.phase).toBe('over')
        expect(colonyRules.activePlayers?.(state)).toEqual([])
        expectConsistent(state)
      })

      it(`a player choosing varied legal moves finishes a ${playerCount}-player game (seed ${seed})`, () => {
        const { state } = playBotGame(playerCount, seed, randomPlayer(seededPick(seed * 31 + playerCount)), expectConsistent)
        expect(state.phase).toBe('over')
        expect(Object.keys(state.board)).toHaveLength(30)
        expect(colonyRules.outcome?.(state).winners).toHaveLength(1)
      })
    }
  }

  it('keeps the state plain JSON after every move', () => {
    playBotGame(3, 7, randomPlayer(seededPick(7)), (state) => {
      expect(JSON.parse(JSON.stringify(state))).toEqual(state)
    })
  })

  it('plays every kind of move across varied games', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 10; seed += 1) {
      playBotGame(2 + (seed % 4), seed, randomPlayer(seededPick(seed))).moveTypes.forEach((type) => seen.add(type))
    }
    expect([...seen].sort()).toEqual([...ALL_MOVE_TYPES].sort())
  })
})

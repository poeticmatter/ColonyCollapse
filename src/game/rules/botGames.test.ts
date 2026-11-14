import { describe, expect, it } from 'vitest'
import { getCellInfo, HUB_CELL_KEY } from '../board/geometry'
import { TRACK_MAX, TRACK_MIN } from '../board/track'
import { colonyRules } from './index'
import { pickFirst, playBotGame, seededPick } from './testing/bot'
import type { GameState } from './types'

const PLAYER_COUNTS = [2, 3, 4, 5]
const SEEDS = [1, 2, 3]

const ALL_DECISION_KINDS = [
  'rondelMove', 'crossPartyFlip', 'developExtraRally', 'sitePrepFlip', 'mediaFlip', 'pressCycleRally',
  'leveragePick', 'dance', 'waggleSweep', 'invest', 'combOverturn', 'longFlight', 'longFlightRally',
  'dissidentRally', 'speakersFavor', 'wardSweep', 'blueprintRevision', 'reserveDeployment', 'forcedDown',
  'forcedUp', 'gavelPass',
]

function expectConsistent(state: GameState): void {
  const tileIds = [
    ...state.bag.map((tile) => tile.id),
    ...state.rondel.flatMap((tile) => (tile ? [tile.id] : [])),
    ...Object.values(state.board).map((tile) => tile.id),
  ]
  expect(new Set(tileIds).size).toBe(30)
  expect(tileIds).toHaveLength(30)

  const cardIds = [...state.deck, ...state.discard, ...state.players.flatMap((player) => player.ongoing)]
  expect(new Set(cardIds).size).toBe(cardIds.length)

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

describe('bot games', () => {
  for (const playerCount of PLAYER_COUNTS) {
    for (const seed of SEEDS) {
      it(`a bot that always takes the first legal choice finishes a ${playerCount}-player game (seed ${seed})`, () => {
        const { state } = playBotGame(playerCount, seed, pickFirst)
        expect(state.phase).toBe('over')
        expect(colonyRules.activePlayer(state)).toBeNull()
        expect(colonyRules.activePlayers?.(state)).toEqual([])
        expectConsistent(state)
      })

      it(`a bot choosing varied legal moves finishes a ${playerCount}-player game (seed ${seed})`, () => {
        const { state } = playBotGame(playerCount, seed, seededPick(seed * 31 + playerCount), expectConsistent)
        expect(state.phase).toBe('over')
        expect(colonyRules.outcome?.(state).winners).toHaveLength(1)
      })
    }
  }

  it('keeps the state plain JSON after every move', () => {
    playBotGame(3, 7, seededPick(7), (state) => {
      expect(JSON.parse(JSON.stringify(state))).toEqual(state)
    })
  })

  it('exercises every kind of decision across varied games', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 40; seed += 1) {
      const result = playBotGame(2 + (seed % 4), seed, seededPick(seed))
      result.decisionKinds.forEach((kind) => seen.add(kind))
    }
    expect([...seen].sort()).toEqual([...ALL_DECISION_KINDS].sort())
  })
})

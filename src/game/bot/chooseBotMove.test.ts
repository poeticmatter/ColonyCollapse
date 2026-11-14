import { describe, expect, it } from 'vitest'
import { ACTION_IDS, type ActionId } from '../art/actions'
import { colonyRules, finalRanking, pendingDecision, type GameState, type Move, type Seat } from '../rules'
import { chooseDecision, seededPick, type Pick } from '../rules/testing/bot'
import { chooseBotMove } from './index'

const MAX_MOVES = 5_000
const PLAYER_COUNTS = [2, 3, 4, 5]
const SEEDS = [1, 2, 3]
const STRENGTH_GAMES = 20
const STRENGTH_PLAYER_COUNT = 3
const MIN_WIN_SHARE = 0.5
const PLAN_LENGTH = 4

type MoveChooser = (state: GameState, seat: Seat) => Move

function randomPlan(pick: Pick): ActionId[] {
  const remaining = [...ACTION_IDS]
  return Array.from({ length: PLAN_LENGTH }, () => remaining.splice(remaining.indexOf(pick(remaining)), 1)[0])
}

function randomMoveChooser(pick: Pick): MoveChooser {
  return (state, seat) => {
    if (state.phase === 'programming') return { type: 'program', plan: randomPlan(pick) }
    const pending = pendingDecision(state)
    if (pending !== null && pending.actor === seat) return { type: 'decide', decision: chooseDecision(pending, pick) }
    return { type: 'reveal' }
  }
}

function playGame(playerCount: number, seed: number, chooserFor: (seat: Seat) => MoveChooser): GameState {
  let state = colonyRules.createInitialState({ settings: {}, playerCount, seed })
  for (let moveCount = 0; state.phase !== 'over'; moveCount += 1) {
    if (moveCount > MAX_MOVES) throw new Error(`Game did not end (players ${playerCount}, seed ${seed})`)
    const seat = colonyRules.activePlayers?.(state)[0]
    if (seat === undefined) throw new Error('Nobody is to move')
    state = colonyRules.applyMove(state, chooserFor(seat)(state, seat), seat)
  }
  return state
}

describe('chooseBotMove', () => {
  for (const playerCount of PLAYER_COUNTS) {
    for (const seed of SEEDS) {
      it(`plays a complete ${playerCount}-player game with legal moves (seed ${seed})`, () => {
        const state = playGame(playerCount, seed, () => chooseBotMove)
        expect(state.phase).toBe('over')
      })
    }
  }

  it('gives the same move for the same state and seat', () => {
    let state = colonyRules.createInitialState({ settings: {}, playerCount: 3, seed: 5 })
    for (let moveCount = 0; state.phase !== 'over' && moveCount < 80; moveCount += 1) {
      const seat = colonyRules.activePlayers?.(state)[0] ?? 0
      const move = chooseBotMove(state, seat)
      expect(chooseBotMove(structuredClone(state), seat)).toEqual(move)
      state = colonyRules.applyMove(state, move, seat)
    }
  })

  it('programs the same plan whatever the other seats have hidden in theirs', () => {
    const state = colonyRules.createInitialState({ settings: {}, playerCount: 3, seed: 9 })
    const withRivalPlan = colonyRules.applyMove(state, { type: 'program', plan: ['dance', 'invest', 'media', 'leverage'] }, 1)
    expect(chooseBotMove(withRivalPlan, 0)).toEqual(chooseBotMove(state, 0))
  })

  it('beats two random players clearly more often than chance', () => {
    let wins = 0
    for (let game = 0; game < STRENGTH_GAMES; game += 1) {
      const botSeat = game % STRENGTH_PLAYER_COUNT
      const randomChooser = randomMoveChooser(seededPick(game * 7 + 1))
      const state = playGame(STRENGTH_PLAYER_COUNT, game + 1, (seat) => (seat === botSeat ? chooseBotMove : randomChooser))
      if (finalRanking(state)[0] === botSeat) wins += 1
    }
    expect(wins / STRENGTH_GAMES).toBeGreaterThanOrEqual(MIN_WIN_SHARE)
  })
})

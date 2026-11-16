import { colonyRules, legalMoves } from '../index'
import type { GameState, Move } from '../types'

export type Pick = <T>(items: readonly T[]) => T

export const pickFirst: Pick = (items) => items[0]

/** A small deterministic generator so bot games are reproducible and varied. */
export function seededPick(seed: number): Pick {
  let state = seed >>> 0
  return (items) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return items[state % items.length]
  }
}

export type ChooseMove = (state: GameState) => Move

/** A player that picks among the legal moves. */
export function randomPlayer(pick: Pick): ChooseMove {
  return (state) => pick(legalMoves(state))
}

export interface BotGameResult {
  state: GameState
  moveCount: number
  moveTypes: Set<Move['type']>
}

const MAX_BOT_MOVES = 20_000

/** Plays a whole game, calling `afterMove` with each new state. */
export function playBotGame(
  playerCount: number,
  seed: number,
  chooseMove: ChooseMove,
  afterMove?: (state: GameState) => void,
): BotGameResult {
  let state = colonyRules.createInitialState({ settings: {}, playerCount, seed })
  const moveTypes = new Set<Move['type']>()
  let moveCount = 0
  while (state.phase !== 'over') {
    if (moveCount > MAX_BOT_MOVES) throw new Error(`Game did not end (players ${playerCount}, seed ${seed})`)
    const move = chooseMove(state)
    moveTypes.add(move.type)
    state = colonyRules.applyMove(state, move, state.turn.seat)
    moveCount += 1
    afterMove?.(state)
  }
  return { state, moveCount, moveTypes }
}

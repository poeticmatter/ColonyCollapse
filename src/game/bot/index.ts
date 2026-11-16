import { colonyRules, type GameState, type Move, type Seat } from '../rules'
import { bestTurn } from './search'

const PLAN_CACHE_LIMIT = 64

/**
 * The rest of a planned turn, keyed by the exact state each move is played from, so a turn is
 * planned once rather than once per move. It only memoises a pure function: a state it hasn't
 * seen is planned from scratch, with the same result.
 */
const plannedMoves = new Map<string, Move>()

function rememberMove(state: GameState, move: Move): void {
  plannedMoves.set(JSON.stringify(state), move)
  const oldestKey = plannedMoves.keys().next().value
  if (plannedMoves.size > PLAN_CACHE_LIMIT && oldestKey !== undefined) plannedMoves.delete(oldestKey)
}

function rememberPlan(root: GameState, moves: readonly Move[]): void {
  let state = root
  moves.forEach((move, index) => {
    rememberMove(state, move)
    const isLastMove = index === moves.length - 1
    if (!isLastMove) state = colonyRules.applyMove(state, move, state.turn.seat)
  })
}

/**
 * The computer opponent's next move for `seat`, which must be the seat on turn. A pure
 * function of the state, so every client agrees on it, and it reads only public information.
 */
export function chooseBotMove(state: GameState, seat: Seat): Move {
  if (state.turn.seat !== seat) throw new Error(`The bot was asked to move for seat ${seat}, but seat ${state.turn.seat} is on turn`)
  const planned = plannedMoves.get(JSON.stringify(state))
  if (planned) return planned
  const moves = bestTurn(state)
  rememberPlan(state, moves)
  return moves[0]
}

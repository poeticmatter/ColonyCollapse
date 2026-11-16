import { IllegalMoveError } from 'game-kit/turns'
import { performAction } from './actions'
import { ACTION_COST } from './constants'
import { endTurn } from './flow'
import { logEvent } from './log'
import type { ActionMove, GameState, Move, Seat } from './types'
import { seatName } from './util'

function stopSpending(state: GameState, seat: Seat): void {
  const { actionPoints } = state.turn
  if (actionPoints > 0) logEvent(state, seat, `${seatName(seat)} ends their turn with ${actionPoints} point(s) unspent.`)
  endTurn(state)
}

function buyAction(state: GameState, move: ActionMove, seat: Seat): void {
  const cost = ACTION_COST[move.type]
  if (state.turn.actionPoints < cost) throw new IllegalMoveError(`That costs ${cost} action points`)
  state.turn.actionPoints -= cost
  performAction(state, move, seat)
  // A paid dial step past the mark has already ended the turn and started the next one.
  const isTurnSpent = state.phase === 'playing' && state.turn.actionPoints === 0
  if (isTurnSpent) endTurn(state)
}

/**
 * Applies a move to a copy of the state and returns it. The copy is private to this call, which
 * is why the rules below may update it in place.
 */
export function applyColonyMove(state: GameState, move: Move, seat: Seat): GameState {
  if (state.phase === 'over') throw new IllegalMoveError('The game is over')
  if (seat !== state.turn.seat) throw new IllegalMoveError('It is not your turn')
  const next = structuredClone(state)
  if (move.type === 'endTurn') stopSpending(next, seat)
  else buyAction(next, move, seat)
  return next
}

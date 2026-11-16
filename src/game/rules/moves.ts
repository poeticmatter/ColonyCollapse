import { IllegalMoveError } from 'game-kit/turns'
import { ISSUES } from '../board/palette'
import { applyColonyMove } from './engine'
import { pawnOf, pawnSteps } from './pawns'
import { adjacentIssues } from './positions'
import type { GameState, Move } from './types'

/** Every move worth trying this turn, legal or not. */
function candidateMoves(state: GameState): Move[] {
  const pawn = pawnOf(state, state.turn.seat)
  const steps: Move[] = pawnSteps(state, pawn).map((to) => ({ type: 'movePawn', to }))
  const shifts: Move[] = ISSUES.flatMap((up) => adjacentIssues(up).map((down): Move => ({ type: 'shift', up, down })))
  return [
    { type: 'rallyDial' },
    { type: 'address' },
    ...shifts,
    ...steps,
    { type: 'rallyAround' },
    { type: 'turnDial' },
    { type: 'endTurn' },
  ]
}

export interface MoveResult {
  move: Move
  next: GameState
}

function tryMove(state: GameState, move: Move): MoveResult | null {
  try {
    return { move, next: applyColonyMove(state, move, state.turn.seat) }
  } catch (error) {
    if (error instanceof IllegalMoveError) return null
    throw error
  }
}

/** Each move the player on turn can make now, with the state it leads to; empty once the game is over. */
export function legalMoveResults(state: GameState): MoveResult[] {
  if (state.phase === 'over') return []
  return candidateMoves(state).flatMap((move) => tryMove(state, move) ?? [])
}

/** The moves the player on turn can make now; empty once the game is over. */
export function legalMoves(state: GameState): Move[] {
  return legalMoveResults(state).map((result) => result.move)
}

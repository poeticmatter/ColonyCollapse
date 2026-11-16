import { IllegalMoveError, type GameOutcome, type GameRules } from 'game-kit/turns'
import { applyColonyMove } from './engine'
import { finalRanking } from './scoring'
import { createInitialState } from './setup'
import type { GameState, Move, Seat, Settings } from './types'

const ROUND_END_REASON = 'Ending the round draws new tiles.'

function activePlayers(state: GameState): Seat[] {
  return state.phase === 'over' ? [] : [state.turn.seat]
}

function activePlayer(state: GameState): Seat | null {
  return activePlayers(state)[0] ?? null
}

/** A move can't be undone if it draws tiles at random: it would reveal what's coming. */
function irreversibleReason(state: GameState, move: Move): string | null {
  const seat = activePlayer(state)
  if (seat === null) return null
  try {
    const next = applyColonyMove(state, move, seat)
    return next.drawCount === state.drawCount ? null : ROUND_END_REASON
  } catch (error) {
    if (error instanceof IllegalMoveError) return null
    throw error
  }
}

function outcome(state: GameState): GameOutcome {
  const [winner] = finalRanking(state)
  return { winners: [winner], scores: state.players.map((player) => player.victoryPoints) }
}

export const colonyRules: GameRules<Settings, GameState, Move> = {
  createInitialState,
  activePlayer,
  activePlayers,
  applyMove: applyColonyMove,
  irreversibleReason,
  outcome,
}

export type { ActionMove, ActionType, GameState, Move, Seat, Settings } from './types'
export { ACTION_COST, ACTION_POINTS_PER_TURN, FINAL_ROUND } from './constants'
export { isDialOnLastSlot } from './flow'
export { legalMoveResults, legalMoves, type MoveResult } from './moves'
export {
  cellView,
  countBoardDiscs,
  dialTile,
  districtStandings,
  finalRanking,
  pawnOf,
  pawnSteps,
  rallyAroundGains,
  tileIssue,
  turnsLeftInRound,
  type CellView,
  type DistrictStanding,
} from './selectors'
export { splitLogText, type LogTextPart } from './util'

import { IllegalMoveError, type GameOutcome, type GameRules } from 'game-kit/turns'
import { applyColonyMove } from './engine'
import { topTask } from './stack'
import { isDecisionTask } from './registry'
import { finalRanking } from './scoring'
import { createInitialState } from './setup'
import type { GameState, Move, Seat, Settings } from './types'

const ROUND_END_REASON = 'Ending the round draws new tiles.'
const CARD_DRAW_REASON = "Drawing cards can't be undone."

function seatsToProgram(state: GameState): Seat[] {
  return state.players.flatMap((player, seat) => (player.plan === null ? [seat] : []))
}

function activePlayers(state: GameState): Seat[] {
  if (state.phase === 'over' || !state.resolution) return state.phase === 'programming' ? seatsToProgram(state) : []
  const task = topTask(state)
  const waiting = task !== null && isDecisionTask(task) ? task.seat : state.resolution.order[state.resolution.orderIndex]
  return [waiting]
}

function activePlayer(state: GameState): Seat | null {
  return activePlayers(state)[0] ?? null
}

/** A move can't be undone if it draws cards or tiles at random: it would reveal what's coming. */
function irreversibleReason(state: GameState, move: Move): string | null {
  const seat = activePlayer(state)
  if (seat === null || move.type === 'program') return null
  try {
    const next = applyColonyMove(state, move, seat)
    if (next.drawCount === state.drawCount) return null
    return next.round === state.round ? CARD_DRAW_REASON : ROUND_END_REASON
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

export type { Decision, PendingDecision } from './decisions'
export type { GameState, Move, Seat, Settings, SlotNumber } from './types'
export {
  cardById,
  cellView,
  currentTurn,
  districtStandings,
  effectiveController,
  holdsOngoing,
  isTileMediaLocked,
  pendingDecision,
  scores,
  tileIssue,
  trackPosition,
  unprogrammedActions,
  visiblePlanSlot,
  type CellView,
  type CurrentTurn,
  type DistrictStanding,
} from './selectors'
export { finalRanking } from './scoring'
export { splitLogText, type LogTextPart } from './util'

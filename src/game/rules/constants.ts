import type { Round } from '../board/geometry'
import type { ActionType } from './types'

export const FINAL_ROUND: Round = 5

export const ACTION_POINTS_PER_TURN = 5

/** What each action costs in action points. Rallying around the pawn is the big, tunable one. */
export const ACTION_COST: Readonly<Record<ActionType, number>> = {
  turnDial: 1,
  movePawn: 1,
  rallyDial: 1,
  address: 1,
  shift: 1,
  rallyAround: 3,
}

export const LOG_LIMIT = 50

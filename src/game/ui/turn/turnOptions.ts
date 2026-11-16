import type { CellKey } from '../../board/geometry'
import { ISSUES, type Issue } from '../../board/palette'
import { legalMoves, rallyAroundGains, type ActionType, type GameState, type Move } from '../../rules'

/** What the player on turn can do now, shaped for the turn controls. */
export interface TurnOptions {
  /** Actions that take no further choice, by type, when legal now. */
  canBuy: ReadonlySet<ActionType>
  /** Hexes the pawn can step to. */
  pawnSteps: CellKey[]
  /** Hexes rallying around the pawn would take. */
  rallyGains: CellKey[]
  /** For each issue that can go up by a shift, the neighbours that can go down to pay for it. */
  shiftsByUp: ReadonlyMap<Issue, Issue[]>
}

function shiftMap(moves: readonly Move[]): Map<Issue, Issue[]> {
  const byUp = new Map<Issue, Issue[]>()
  for (const issue of ISSUES) {
    const downs = moves.flatMap((move) => (move.type === 'shift' && move.up === issue ? [move.down] : []))
    if (downs.length > 0) byUp.set(issue, downs)
  }
  return byUp
}

export function turnOptions(state: GameState): TurnOptions {
  const moves = legalMoves(state)
  return {
    canBuy: new Set(moves.map((move) => move.type).filter((type): type is ActionType => type !== 'endTurn')),
    pawnSteps: moves.flatMap((move) => (move.type === 'movePawn' ? [move.to] : [])),
    rallyGains: rallyAroundGains(state, state.turn.seat),
    shiftsByUp: shiftMap(moves),
  }
}

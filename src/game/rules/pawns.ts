import { getNeighbourKeys, HUB_CELL_KEY, type CellKey } from '../board/geometry'
import type { GameState, Pawn, Seat } from './types'

/** Each player has exactly one pawn. */
export function pawnOf(state: GameState, seat: Seat): Pawn {
  const pawn = state.pawns.find((candidate) => candidate.seat === seat)
  if (!pawn) throw new Error(`Seat ${seat} has no pawn`)
  return pawn
}

/** The pawn standing on a non-hub cell. The hub can hold any number, so it has no single pawn. */
export function pawnAt(state: GameState, cell: CellKey): Pawn | null {
  if (cell === HUB_CELL_KEY) return null
  return state.pawns.find((pawn) => pawn.cell === cell) ?? null
}

/** Whether `pawn` may stand on `cell`: never on another pawn, and never back in the hub once it has left. */
function canStandOn(state: GameState, pawn: Pawn, cell: CellKey): boolean {
  if (cell === HUB_CELL_KEY) return !pawn.hasLeftHub
  const occupant = pawnAt(state, cell)
  return occupant === null || occupant.id === pawn.id
}

/** The hexes a pawn can step to: adjacent, free of pawns, and not the hub once it has left. */
export function pawnSteps(state: GameState, pawn: Pawn): CellKey[] {
  return getNeighbourKeys(pawn.cell).filter((cell) => canStandOn(state, pawn, cell))
}

export function movePawn(pawn: Pawn, destination: CellKey): void {
  pawn.cell = destination
  if (destination !== HUB_CELL_KEY) pawn.hasLeftHub = true
}

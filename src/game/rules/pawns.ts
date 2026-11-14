import { BOARD_CELLS, getNeighbourKeys, HUB_CELL_KEY, type CellKey } from '../board/geometry'
import type { GameState, Pawn, Seat } from './types'

export function pawnsOf(state: GameState, seat: Seat): Pawn[] {
  return state.pawns.filter((pawn) => pawn.seat === seat)
}

/** The pawn standing on a non-hub cell. The hub can hold any number, so it has no single pawn. */
export function pawnAt(state: GameState, cell: CellKey): Pawn | null {
  if (cell === HUB_CELL_KEY) return null
  return state.pawns.find((pawn) => pawn.cell === cell) ?? null
}

export function getPawn(state: GameState, pawnId: number): Pawn | null {
  return state.pawns.find((pawn) => pawn.id === pawnId) ?? null
}

/** Whether `pawn` may stand on `cell`: never on another pawn, and never back in the hub once it has left. */
function canStandOn(state: GameState, pawn: Pawn, cell: CellKey): boolean {
  if (cell === HUB_CELL_KEY) return !pawn.hasLeftHub
  const occupant = pawnAt(state, cell)
  return occupant === null || occupant.id === pawn.id
}

/**
 * Cells a pawn can reach with 1..`strength` steps, hex to hex, never entering or crossing a hex
 * holding another pawn, mapped to the fewest steps needed. The pawn's own cell is never a result.
 */
export function danceReach(state: GameState, pawn: Pawn, strength: number): Map<CellKey, number> {
  const reach = new Map<CellKey, number>()
  const visited = new Set<CellKey>([pawn.cell])
  let frontier: CellKey[] = [pawn.cell]
  for (let steps = 1; steps <= strength; steps += 1) {
    const next: CellKey[] = []
    for (const cell of frontier) {
      for (const neighbour of getNeighbourKeys(cell)) {
        if (visited.has(neighbour) || !canStandOn(state, pawn, neighbour)) continue
        visited.add(neighbour)
        reach.set(neighbour, steps)
        next.push(neighbour)
      }
    }
    frontier = next
  }
  return reach
}

/** Long Flight: any cell except the hub with no pawn on it. */
export function longFlightDestinations(state: GameState, pawn: Pawn): CellKey[] {
  return BOARD_CELLS.map((cell) => cell.key).filter(
    (cell) => cell !== HUB_CELL_KEY && cell !== pawn.cell && pawnAt(state, cell) === null,
  )
}

export function movePawn(pawn: Pawn, destination: CellKey): void {
  pawn.cell = destination
  if (destination !== HUB_CELL_KEY) pawn.hasLeftHub = true
}

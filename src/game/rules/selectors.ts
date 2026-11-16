import { getCellInfo, type CellKey } from '../board/geometry'
import type { Issue } from '../board/palette'
import { RONDEL_SLOT_COUNT } from '../board/rondel'
import { effectiveController } from './rally'
import { cellSite, readSite } from './sites'
import type { GameState, HexTile, Seat } from './types'

export { dialTile, rallyAroundGains } from './actions'
export { pawnOf, pawnSteps } from './pawns'
export { countBoardDiscs, districtStandings, finalRanking, type DistrictStanding } from './scoring'
export { tileIssue } from './sites'

/** How many more turns the round can last, counting the current one, if nobody pays to turn the dial. */
export function turnsLeftInRound(state: GameState): number {
  return RONDEL_SLOT_COUNT - state.dial
}

export interface CellView {
  cell: CellKey
  kind: 'hub' | 'printed' | 'slot'
  /** Null on the hub, a printed hex, or an empty slot. */
  tile: HexTile | null
  /** The issue of the printed hex or of the tile; null on the hub and empty slots. */
  issue: Issue | null
  disc: Seat | null
  /** Seats with a pawn here (several only in the hub). */
  pawnSeats: Seat[]
  /** Who controls the hex now, counting pawns. */
  controller: Seat | null
}

/** Everything the board draws for one cell. */
export function cellView(state: GameState, cell: CellKey): CellView {
  const info = getCellInfo(cell)
  const site = readSite(state, cellSite(cell))
  return {
    cell,
    kind: info.kind,
    tile: state.board[cell] ?? null,
    issue: site?.issue ?? null,
    disc: site?.disc ?? null,
    pawnSeats: state.pawns.filter((pawn) => pawn.cell === cell).map((pawn) => pawn.seat),
    controller: effectiveController(state, cell),
  }
}

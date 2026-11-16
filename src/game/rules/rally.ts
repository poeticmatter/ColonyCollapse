import { HUB_CELL_KEY, type CellKey } from '../board/geometry'
import { logEvent } from './log'
import { pawnAt } from './pawns'
import { getPosition } from './positions'
import { cellSite, describeSite, readSite, setSiteDisc } from './sites'
import type { GameState, Seat, SiteRef } from './types'
import { seatName } from './util'

/**
 * Whether rallying `site` would give `seat` its disc. Rallying compares the rallier with the
 * disc owner (not with any pawn standing there): with no disc, a position of 0 or more places
 * one; against another player's disc, strictly higher is needed; your own disc stays as it is.
 */
export function canTakeSite(state: GameState, seat: Seat, site: SiteRef): boolean {
  const view = readSite(state, site)
  if (!view || view.disc === seat) return false
  const position = getPosition(state, seat, view.issue)
  if (view.disc === null) return position >= 0
  return position > getPosition(state, view.disc, view.issue)
}

/** Rallies `site` for `seat`. Returns whether the disc changed. */
export function rallySite(state: GameState, seat: Seat, site: SiteRef): boolean {
  if (!canTakeSite(state, seat, site)) return false
  setSiteDisc(state, site, seat)
  logEvent(state, seat, `${seatName(seat)} takes control of ${describeSite(state, site)}.`)
  return true
}

/** Who controls a board cell: a pawn standing on it gives its owner control, disc or not. Null for the hub. */
export function effectiveController(state: GameState, cell: CellKey): Seat | null {
  if (cell === HUB_CELL_KEY) return null
  const pawn = pawnAt(state, cell)
  if (pawn) return pawn.seat
  return readSite(state, cellSite(cell))?.disc ?? null
}

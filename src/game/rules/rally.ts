import { HUB_CELL_KEY, type CellKey } from '../board/geometry'
import { WAGGLE_SWEEP_POSITION } from './constants'
import { logEvent } from './log'
import { holdsOngoing } from './ongoing'
import { pawnAt } from './pawns'
import { getPosition } from './positions'
import { cellSite, describeSite, readSite, setSiteDisc } from './sites'
import type { GameState, Seat, SiteRef } from './types'
import { seatName } from './util'

export interface RallyOptions {
  /** Upgraded Dance: being tied with the disc owner is enough. */
  canTie: boolean
  /** Waggle Sweep: counts as being on the top space of the issue. */
  countsAsFour: boolean
}

/**
 * Rallying compares the rallier with the disc owner (not with any pawn standing there): with no
 * disc, a position of 0 or more places one; against another player's disc, strictly higher is
 * needed (tied is enough with `canTie`); your own disc stays as it is. Returns whether the disc changed.
 */
export function rallySite(state: GameState, seat: Seat, site: SiteRef, options: RallyOptions): boolean {
  const view = readSite(state, site)
  if (!view || view.disc === seat) return false
  const position = options.countsAsFour ? WAGGLE_SWEEP_POSITION : getPosition(state, seat, view.issue)
  const isWinning = (() => {
    if (view.disc === null) return position >= 0
    const rival = getPosition(state, view.disc, view.issue)
    return options.canTie ? position >= rival : position > rival
  })()
  if (!isWinning) return false
  setSiteDisc(state, site, seat)
  logEvent(state, seat, `${seatName(seat)} takes control of ${describeSite(state, site)}.`)
  return true
}

/**
 * Who controls a board cell: a pawn standing on it gives its owner control, disc or not. With
 * Swift Withdrawal the disc owner keeps control against an opponent's pawn. Null for the hub.
 */
export function effectiveController(state: GameState, cell: CellKey): Seat | null {
  if (cell === HUB_CELL_KEY) return null
  const discOwner = readSite(state, cellSite(cell))?.disc ?? null
  const pawn = pawnAt(state, cell)
  if (!pawn) return discOwner
  const isDiscProtected =
    discOwner !== null && discOwner !== pawn.seat && holdsOngoing(state, discOwner, 'swiftWithdrawal')
  return isDiscProtected ? discOwner : pawn.seat
}

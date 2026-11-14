import type { ActionId } from '../../src/game/art/actions'
import { ISSUES } from '../../src/game/board/palette'
import type { GameState, Seat } from '../../src/game/rules'

/** Where a disc changed hands: by a player's action, or by polling handing an unclaimed tile to its issue's leader. */
export type DiscSource = ActionId | 'polling'

export interface DiscChange {
  round: number
  seat: Seat
  /** The disc's previous owner, or null if the hex had none. */
  from: Seat | null
  source: DiscSource
}

interface DiscSite {
  owner: Seat | null
  isOnBoard: boolean
}

/** Every disc in play, keyed by tile id (discs travel with tiles) or by printed hex. */
function discSites(state: GameState): Map<string, DiscSite> {
  const sites = new Map<string, DiscSite>()
  for (const tile of state.rondel) if (tile !== null) sites.set(`tile:${tile.id}`, { owner: tile.disc, isOnBoard: false })
  for (const tile of Object.values(state.board)) sites.set(`tile:${tile.id}`, { owner: tile.disc, isOnBoard: true })
  for (const issue of ISSUES) sites.set(`printed:${issue}`, { owner: state.printedDiscs[issue], isOnBoard: true })
  return sites
}

/** The tile being resolved when `state` was current, or null outside resolution. */
function actionInProgress(state: GameState): ActionId | null {
  const { resolution } = state
  if (resolution === null) return null
  const seat = resolution.order[resolution.orderIndex]
  return state.players[seat]?.plan?.[resolution.slot - 1] ?? null
}

/**
 * The discs that changed owner between two states. A tile that moved from the rondel to the board
 * in the same move was placed by polling, so a disc it gained then came from polling.
 */
export function discChanges(before: GameState, after: GameState): DiscChange[] {
  const previous = discSites(before)
  const action = actionInProgress(before)
  const changes: DiscChange[] = []
  for (const [key, site] of discSites(after)) {
    const earlier = previous.get(key)
    const from = earlier?.owner ?? null
    if (site.owner === null || site.owner === from) continue
    const isPolled = earlier !== undefined && !earlier.isOnBoard && site.isOnBoard && from === null
    const source = isPolled ? 'polling' : action
    if (source === null) throw new Error(`A disc changed outside resolution and polling (round ${before.round})`)
    changes.push({ round: before.round, seat: site.owner, from, source })
  }
  return changes
}

import type { ActionId } from '../../src/game/art/actions'
import { ISSUES, type Issue } from '../../src/game/board/palette'
import type { GameState, Seat } from '../../src/game/rules'
import { tileIssue } from '../../src/game/rules/sites'

/** Where a disc changed hands: by a player's action, or by polling handing an unclaimed tile to its issue's leader. */
export type DiscSource = ActionId | 'polling'

export interface DiscChange {
  /** Which tile or printed hex: the same key across a game. */
  site: string
  issue: Issue
  round: number
  /** The slot being resolved, or null for polling. */
  slot: number | null
  /** Where the acting seat was in that slot's order (0 = first), or null for polling. */
  turn: number | null
  seat: Seat
  /** The disc's previous owner, or null if the hex had none. */
  from: Seat | null
  /** Track spaces on the hex's issue just after the change: the new owner's, and the previous owner's. */
  seatSpace: number
  fromSpace: number | null
  source: DiscSource
}

interface DiscSite {
  owner: Seat | null
  issue: Issue
  isOnBoard: boolean
}

/** Every disc in play, keyed by tile id (discs travel with tiles) or by printed hex. */
function discSites(state: GameState): Map<string, DiscSite> {
  const sites = new Map<string, DiscSite>()
  for (const tile of state.rondel) if (tile !== null) sites.set(`tile:${tile.id}`, { owner: tile.disc, issue: tileIssue(tile), isOnBoard: false })
  for (const tile of Object.values(state.board)) sites.set(`tile:${tile.id}`, { owner: tile.disc, issue: tileIssue(tile), isOnBoard: true })
  for (const issue of ISSUES) sites.set(`printed:${issue}`, { owner: state.printedDiscs[issue], issue, isOnBoard: true })
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
    const isAction = source !== 'polling'
    const spaces = after.track[site.issue]
    changes.push({
      site: key,
      issue: site.issue,
      round: before.round,
      slot: isAction ? (before.resolution?.slot ?? null) : null,
      turn: isAction ? (before.resolution?.orderIndex ?? null) : null,
      seat: site.owner,
      from,
      seatSpace: spaces[site.owner],
      fromSpace: from === null ? null : spaces[from],
      source,
    })
  }
  return changes
}

import { ISSUES, type Issue } from '../board/palette'
import { clampToTrack, TRACK_UPGRADE_SPACE } from '../board/track'
import { logEvent } from './log'
import type { GameState, Seat } from './types'
import { seatName, titleCase } from './util'

export function getPosition(state: GameState, seat: Seat, issue: Issue): number {
  return state.track[issue][seat]
}

/**
 * Moves a player to `target` on a track (clamped to the track). Reaching the upgrade space
 * upgrades the tile of that track's action at once. The upgrade is permanent, so reaching the
 * space again, or with the tile already upgraded, changes nothing.
 */
export function setPosition(state: GameState, seat: Seat, issue: Issue, target: number): void {
  const before = getPosition(state, seat, issue)
  const after = clampToTrack(target)
  state.track[issue][seat] = after
  const hasReachedUpgradeSpace = before < TRACK_UPGRADE_SPACE && after >= TRACK_UPGRADE_SPACE
  if (!hasReachedUpgradeSpace) return
  const action = state.trackAction[issue]
  const tiles = state.players[seat].tiles
  if (tiles[action] === 'upgraded') return
  tiles[action] = 'upgraded'
  logEvent(state, seat, `${seatName(seat)} reaches ${after} on ${issue}: the ${titleCase(action)} tile is upgraded.`)
}

/** Moves by `delta` and returns how far the player actually moved after clamping. */
export function adjustPosition(state: GameState, seat: Seat, issue: Issue, delta: number): number {
  const before = getPosition(state, seat, issue)
  setPosition(state, seat, issue, before + delta)
  return getPosition(state, seat, issue) - before
}

/** The single highest position on an issue, if it is at least 0 and not shared. */
export function getLeader(state: GameState, issue: Issue): Seat | null {
  const positions = state.track[issue]
  const highest = Math.max(...positions)
  if (highest < 0) return null
  const leaders = positions.flatMap((position, seat) => (position === highest ? [seat] : []))
  return leaders.length === 1 ? leaders[0] : null
}

/** Neighbours in the ring order; Clay and Mauve are not adjacent. */
export function areAdjacentIssues(first: Issue, second: Issue): boolean {
  return Math.abs(ISSUES.indexOf(first) - ISSUES.indexOf(second)) === 1
}

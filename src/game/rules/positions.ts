import { ISSUES, type Issue } from '../board/palette'
import { clampToTrack } from '../board/track'
import type { GameState, Seat } from './types'

export function getPosition(state: GameState, seat: Seat, issue: Issue): number {
  return state.track[issue][seat]
}

/** Moves by `delta`, stopping at the ends of the track, and returns how far the player actually moved. */
export function adjustPosition(state: GameState, seat: Seat, issue: Issue, delta: number): number {
  const before = getPosition(state, seat, issue)
  state.track[issue][seat] = clampToTrack(before + delta)
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

/** The issues next to `issue` in ring order (one at either end of the ring, two otherwise). */
export function adjacentIssues(issue: Issue): Issue[] {
  return ISSUES.filter((other) => areAdjacentIssues(issue, other))
}

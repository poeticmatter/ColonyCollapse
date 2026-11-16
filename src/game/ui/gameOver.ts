import { countBoardDiscs, finalRanking } from '../rules/selectors'
import type { GameState, Seat } from '../rules'

export interface RankingRow {
  seat: Seat
  /** 1 for the winner. Every row has its own place: ties are already broken. */
  place: number
  victoryPoints: number
  /** Control discs on the board (pawns don't count): the first tiebreak. */
  discs: number
}

/** Final standings, best first. */
export function rankingRows(state: GameState): RankingRow[] {
  const discs = countBoardDiscs(state)
  return finalRanking(state).map((seat, index) => ({
    seat,
    place: index + 1,
    victoryPoints: state.players[seat].victoryPoints,
    discs: discs[seat],
  }))
}

/** Why first beat second when they finished level on VP, or null when VP decided it. */
export function tiebreakNote(rows: readonly RankingRow[], nameOf: (seat: Seat) => string): string | null {
  const [first, second] = rows
  if (!first || !second || first.victoryPoints !== second.victoryPoints) return null
  const winner = nameOf(first.seat)
  if (first.discs !== second.discs) {
    return `${winner} and ${nameOf(second.seat)} tied on VP; ${winner} wins on control discs on the board (${first.discs} to ${second.discs}).`
  }
  return `${winner} and ${nameOf(second.seat)} tied on VP and discs; ${winner} wins by sitting earlier in clockwise order from whoever started round 5.`
}

import { getDistrict } from '../board/geometry'
import { ISSUES, type Issue } from '../board/palette'
import { effectiveController } from './rally'
import type { GameState, Seat } from './types'
import { range } from './util'

export interface DistrictStanding {
  issue: Issue
  /** Hexes controlled per seat: the printed hex and every tile, pawns counting as control. */
  counts: number[]
  printedController: Seat | null
  /** Who would score the district now, or null if nobody. */
  winner: Seat | null
}

export function pickWinner(counts: readonly number[], printedController: Seat | null): Seat | null {
  const most = Math.max(...counts)
  if (most === 0) return null
  const tied = counts.flatMap((count, seat) => (count === most ? [seat] : []))
  if (tied.length === 1) return tied[0]
  // A tie goes to the tied player who controls the printed hex; if none does, nobody scores.
  return printedController !== null && tied.includes(printedController) ? printedController : null
}

/** District by district, who controls what and who would win it if the round ended now. */
export function districtStandings(state: GameState): DistrictStanding[] {
  return ISSUES.map((issue) => {
    const district = getDistrict(issue)
    const countedCells = [district.printedCell, ...district.slotCells.filter((cell) => state.board[cell])]
    const counts = range(state.playerCount).map(() => 0)
    for (const cell of countedCells) {
      const controller = effectiveController(state, cell)
      if (controller !== null) counts[controller] += 1
    }
    const printedController = effectiveController(state, district.printedCell)
    return { issue, counts, printedController, winner: pickWinner(counts, printedController) }
  })
}

/** Control discs on the board: printed hexes and placed tiles (pawns don't count). */
export function countBoardDiscs(state: GameState): number[] {
  const counts = range(state.playerCount).map(() => 0)
  const discOwners = [...Object.values(state.printedDiscs), ...Object.values(state.board).map((tile) => tile.disc)]
  for (const owner of discOwners) {
    if (owner !== null) counts[owner] += 1
  }
  return counts
}

/**
 * Seats from first to last: most victory points, then most control discs on the board, then the
 * earliest in clockwise order from the start player.
 */
export function finalRanking(state: GameState): Seat[] {
  const discs = countBoardDiscs(state)
  const clockwiseDistance = (seat: Seat) => (seat - state.startPlayer + state.playerCount) % state.playerCount
  return range(state.playerCount).sort(
    (a, b) =>
      state.players[b].victoryPoints - state.players[a].victoryPoints ||
      discs[b] - discs[a] ||
      clockwiseDistance(a) - clockwiseDistance(b),
  )
}

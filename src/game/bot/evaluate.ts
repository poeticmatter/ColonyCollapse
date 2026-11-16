import { ISSUES } from '../board/palette'
import { districtStandings, FINAL_ROUND, tileIssue, type GameState, type Seat } from '../rules'
import { getLeader } from '../rules/positions'
import { pickWinner } from '../rules/scoring'
import { range } from '../rules/util'
import {
  CONTROL_DISC_WEIGHT,
  DISTRICT_MARGIN_WEIGHT,
  FUTURE_ROUND_DISCOUNT,
  MAX_COUNTED_TRACK_MARGIN,
  NEGATIVE_TRACK_PENALTY,
  RIVAL_WEIGHT,
  TRACK_MARGIN_WEIGHT,
  TRACK_POSITION_WEIGHT,
  VICTORY_POINT_WEIGHT,
} from './weights'

export interface EvaluationContext {
  /**
   * Whether the rondel in `state` is one the bot has seen. A simulated round end refills it
   * from the bag, whose order the bot must not peek at.
   */
  isRondelKnown: boolean
}

interface DistrictProjection {
  counts: number[]
  winner: Seat | null
}

/** Rondel tile i lands in district i at polling and goes to its disc owner, or else to the leader of its issue. */
function rondelOwner(state: GameState, slot: number): Seat | null {
  const tile = state.rondel[slot]
  if (!tile) return null
  return tile.disc ?? getLeader(state, tileIssue(tile))
}

function projectDistricts(state: GameState, context: EvaluationContext): DistrictProjection[] {
  return districtStandings(state).map((standing, districtIndex) => {
    const counts = [...standing.counts]
    const owner = context.isRondelKnown ? rondelOwner(state, districtIndex) : null
    if (owner !== null) counts[owner] += 1
    return { counts, winner: pickWinner(counts, standing.printedController) }
  })
}

/** Victory points a district majority held now is worth: this round's, plus some of the rounds still to come. */
function districtWinValue(state: GameState): number {
  let futureRounds = 0
  for (let round = state.round + 1; round <= FINAL_ROUND; round += 1) futureRounds += round
  return state.round + FUTURE_ROUND_DISCOUNT * futureRounds
}

function bestRivalOf(values: readonly number[], seat: Seat): number {
  return Math.max(...values.filter((_, other) => other !== seat))
}

function districtValue(state: GameState, seat: Seat, districts: DistrictProjection[]): number {
  if (state.phase === 'over') return 0
  const winValue = districtWinValue(state)
  return districts.reduce((total, district) => {
    const margin = DISTRICT_MARGIN_WEIGHT * (district.counts[seat] - Math.max(0, bestRivalOf(district.counts, seat)))
    return total + margin + (district.winner === seat ? winValue : 0)
  }, 0)
}

function trackValue(state: GameState, seat: Seat): number {
  return ISSUES.reduce((total, issue) => {
    const positions = state.track[issue]
    const position = positions[seat]
    const penalty = position < 0 ? NEGATIVE_TRACK_PENALTY * -position : 0
    const margin = Math.max(-MAX_COUNTED_TRACK_MARGIN, Math.min(MAX_COUNTED_TRACK_MARGIN, position - bestRivalOf(positions, seat)))
    return total + TRACK_POSITION_WEIGHT * position + TRACK_MARGIN_WEIGHT * margin - penalty
  }, 0)
}

function discCount(state: GameState, seat: Seat): number {
  const boardDiscs = Object.values(state.board).filter((tile) => tile.disc === seat).length
  const printedDiscs = Object.values(state.printedDiscs).filter((owner) => owner === seat).length
  return boardDiscs + printedDiscs
}

function seatValue(state: GameState, seat: Seat, districts: DistrictProjection[]): number {
  return (
    VICTORY_POINT_WEIGHT * state.players[seat].victoryPoints +
    districtValue(state, seat, districts) +
    CONTROL_DISC_WEIGHT * discCount(state, seat) +
    trackValue(state, seat)
  )
}

/** How good `state` looks for `seat`: its own standing minus (a share of) the average rival's. */
export function evaluateState(state: GameState, seat: Seat, context: EvaluationContext): number {
  const districts = projectDistricts(state, context)
  const rivals = range(state.playerCount).filter((other) => other !== seat)
  const rivalTotal = rivals.reduce((total, rival) => total + seatValue(state, rival, districts), 0)
  const rivalAverage = rivals.length === 0 ? 0 : rivalTotal / rivals.length
  return seatValue(state, seat, districts) - RIVAL_WEIGHT * rivalAverage
}

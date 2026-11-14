import { ACTION_IDS } from '../art/actions'
import { ISSUES } from '../board/palette'
import { districtStandings, tileIssue, type GameState, type Seat } from '../rules'
import { getLeader } from '../rules/positions'
import { pickWinner } from '../rules/scoring'
import { FINAL_ROUND } from '../rules/constants'
import { range } from '../rules/util'
import {
  CONTROL_DISC_WEIGHT,
  DISTRICT_MARGIN_WEIGHT,
  FUTURE_ROUND_DISCOUNT,
  NEGATIVE_TRACK_PENALTY,
  ONGOING_CARD_WEIGHT,
  RIVAL_WEIGHT,
  TRACK_POSITION_WEIGHT,
  UPGRADED_TILE_VALUE,
  VICTORY_POINT_WEIGHT,
} from './weights'

/** What one seat is projected to hold in a district if the round ended now. */
interface DistrictProjection {
  counts: number[]
  winner: Seat | null
}

/**
 * Rondel tile i lands in district i at polling and goes to its disc owner, or else to the
 * leader of its issue. Only counted while the rondel is still the one the bot has seen: after
 * the round ends it is refilled from the hidden bag.
 */
function rondelOwner(state: GameState, slot: number): Seat | null {
  const tile = state.rondel[slot]
  if (!tile) return null
  return tile.disc ?? getLeader(state, tileIssue(tile))
}

function projectDistricts(state: GameState): DistrictProjection[] {
  const isRondelKnown = state.phase === 'resolving'
  return districtStandings(state).map((standing, districtIndex) => {
    const counts = [...standing.counts]
    const owner = isRondelKnown ? rondelOwner(state, districtIndex) : null
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

function districtValue(state: GameState, seat: Seat, districts: DistrictProjection[]): number {
  if (state.phase === 'over') return 0
  const winValue = districtWinValue(state)
  return districts.reduce((total, district) => {
    const rivalBest = Math.max(0, ...district.counts.filter((_, other) => other !== seat))
    const margin = DISTRICT_MARGIN_WEIGHT * (district.counts[seat] - rivalBest)
    return total + margin + (district.winner === seat ? winValue : 0)
  }, 0)
}

function trackValue(state: GameState, seat: Seat): number {
  return ISSUES.reduce((total, issue) => {
    const position = state.track[issue][seat]
    const penalty = position < 0 ? NEGATIVE_TRACK_PENALTY * -position : 0
    return total + TRACK_POSITION_WEIGHT * position - penalty
  }, 0)
}

function upgradedTileValue(state: GameState, seat: Seat): number {
  const { tiles } = state.players[seat]
  return ACTION_IDS.reduce((total, action) => total + (tiles[action] === 'upgraded' ? UPGRADED_TILE_VALUE[action] : 0), 0)
}

function discCount(state: GameState, seat: Seat): number {
  const boardDiscs = Object.values(state.board).filter((tile) => tile.disc === seat).length
  const printedDiscs = Object.values(state.printedDiscs).filter((owner) => owner === seat).length
  return boardDiscs + printedDiscs
}

function seatValue(state: GameState, seat: Seat, districts: DistrictProjection[]): number {
  const player = state.players[seat]
  return (
    VICTORY_POINT_WEIGHT * player.victoryPoints +
    districtValue(state, seat, districts) +
    CONTROL_DISC_WEIGHT * discCount(state, seat) +
    trackValue(state, seat) +
    upgradedTileValue(state, seat) +
    ONGOING_CARD_WEIGHT * player.ongoing.length
  )
}

/** How good `state` looks for `seat`: its own standing minus (a share of) the average rival's. */
export function evaluateState(state: GameState, seat: Seat): number {
  const districts = projectDistricts(state)
  const rivals = range(state.playerCount).filter((other) => other !== seat)
  const rivalTotal = rivals.reduce((total, rival) => total + seatValue(state, rival, districts), 0)
  const rivalAverage = rivals.length === 0 ? 0 : rivalTotal / rivals.length
  return seatValue(state, seat, districts) - RIVAL_WEIGHT * rivalAverage
}

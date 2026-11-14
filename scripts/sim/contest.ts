import { ACTION_IDS, ACTIONS } from '../../src/game/art/actions'
import { ISSUES } from '../../src/game/board/palette'
import type { DiscChange } from './discs'
import { playGame, type GameRecord } from './play'
import { heuristic } from './policies'
import { fixed, heading, mean, percent, table } from './stats'

/** How much the bots contest each other: rallies against rivals' discs, and races on the tracks. */

const PLAYER_COUNTS = [2, 3, 4, 5]
const FIRST_SEED = 1000
const ROUNDS = [1, 2, 3, 4, 5]
const TRACK_SPACES = [-2, -1, 0, 1, 2, 3, 4]
/** A seat on this space or higher is treated as investing in the track. */
const INVESTED_SPACE = 2

function mirrorGames(playerCount: number, games: number): GameRecord[] {
  return Array.from({ length: games }, (_, index) => playGame(playerCount, FIRST_SEED + index, Array(playerCount).fill(heuristic)))
}

const isCapture = (change: DiscChange) => change.from !== null
const isActionClaim = (change: DiscChange) => change.from === null && change.source !== 'polling'

function rallySummary(byCount: Map<number, GameRecord[]>): void {
  heading('Discs gained per seat per game')
  const rows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    const changes = records.flatMap((record) => record.discChanges)
    const seatGames = records.length * count
    const captures = changes.filter(isCapture).length
    const claims = changes.filter(isActionClaim).length
    const polled = changes.filter((change) => change.source === 'polling').length
    return [count, fixed(claims / seatGames), fixed(captures / seatGames), fixed(polled / seatGames), percent(captures, captures + claims)]
  })
  console.log(table(['players', 'rallied onto an empty hex', 'taken from a rival', 'given by polling', 'share of rallies that take a rival disc'], rows))
}

function capturesByRound(records: GameRecord[], playerCount: number): void {
  heading(`Rival discs taken per seat, by round (${playerCount} players)`)
  const seatGames = records.length * playerCount
  const changes = records.flatMap((record) => record.discChanges)
  const row = ROUNDS.map((round) => fixed(changes.filter((change) => change.round === round && isCapture(change)).length / seatGames, 2))
  console.log(table(ROUNDS.map((round) => `R${round}`), [row]))
}

function capturesByAction(records: GameRecord[], playerCount: number): void {
  heading(`Discs per programmed tile, by action (${playerCount} players)`)
  const plays = new Map(ACTION_IDS.map((action) => [action, 0]))
  for (const { plan } of records.flatMap((record) => record.plans)) for (const action of plan) plays.set(action, (plays.get(action) ?? 0) + 1)
  const changes = records.flatMap((record) => record.discChanges)
  const rows = ACTION_IDS.filter((action) => (plays.get(action) ?? 0) > 0).map((action) => {
    const fromAction = changes.filter((change) => change.source === action)
    const played = plays.get(action) ?? 0
    return [ACTIONS[action].name, played, fixed(fromAction.filter((change) => change.from === null).length / played, 2), fixed(fromAction.filter(isCapture).length / played, 2)]
  })
  console.log(table(['action', 'times programmed', 'empty hexes claimed per play', 'rival discs taken per play'], rows))
  console.log('\nIntern and card effects count under the tile being resolved.')
}

/** Each seat's tracks sorted high to low: `[best, second, ..., worst]`. */
function sortedSeatTracks(tracks: Record<string, number[]>, seat: number): number[] {
  return ISSUES.map((issue) => tracks[issue][seat]).sort((a, b) => b - a)
}

function trackHeights(byCount: Map<number, GameRecord[]>): void {
  heading("Each seat's highest track")
  const rows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    const seats = records.flatMap((record) => Array.from({ length: count }, (_, seat) => ({ record, seat })))
    const finalBest = seats.map(({ record, seat }) => sortedSeatTracks(record.finalTracks, seat)[0])
    const peakBest = seats.map(({ record, seat }) => sortedSeatTracks(record.trackPeak, seat)[0])
    const reachedThree = (values: number[]) => percent(values.filter((value) => value >= 3).length, values.length)
    return [count, fixed(mean(finalBest)), reachedThree(finalBest), percent(finalBest.filter((value) => value === 4).length, finalBest.length), fixed(mean(peakBest)), reachedThree(peakBest)]
  })
  console.log(table(['players', 'best track at game end', 'on 3+ at end', 'on 4 at end', 'highest space ever reached', 'ever on 3+'], rows))
}

function trackProfile(records: GameRecord[], playerCount: number): void {
  heading(`A seat's six tracks, best to worst, at the end of each round (${playerCount} players)`)
  const rows = ROUNDS.map((round) => {
    const profiles = records.flatMap((record) => Array.from({ length: playerCount }, (_, seat) => sortedSeatTracks(record.roundEndTracks[round - 1], seat)))
    return [`R${round}`, ...ISSUES.map((_, rank) => fixed(mean(profiles.map((profile) => profile[rank]))))]
  })
  console.log(table(['after', 'best', '2nd', '3rd', '4th', '5th', 'worst'], rows))
  const finals = records.flatMap((record) => ISSUES.flatMap((issue) => record.finalTracks[issue]))
  console.log()
  console.log(table(['space at game end', ...TRACK_SPACES.map(String)], [['share of seat-tracks', ...TRACK_SPACES.map((space) => percent(finals.filter((value) => value === space).length, finals.length))]]))
}

/** The seat's single best track at game end, or null if two or more tie for it. */
function favouriteIssue(record: GameRecord, seat: number): string | null {
  const positions = ISSUES.map((issue) => record.finalTracks[issue][seat])
  const top = Math.max(...positions)
  const favourites = ISSUES.filter((_, index) => positions[index] === top)
  return favourites.length === 1 ? favourites[0] : null
}

function trackFights(byCount: Map<number, GameRecord[]>): void {
  heading('Do seats race on the same track?')
  const rows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    const tracks = records.flatMap((record) => ISSUES.map((issue) => record.finalTracks[issue]))
    const contested = tracks.filter((positions) => positions.filter((position) => position >= INVESTED_SPACE).length >= 2).length
    const pairs = records.flatMap((record) =>
      Array.from({ length: count }, (_, seat) => seat).flatMap((seat) =>
        Array.from({ length: count - seat - 1 }, (_, offset) => [favouriteIssue(record, seat), favouriteIssue(record, seat + offset + 1)]),
      ),
    )
    const comparable = pairs.filter(([first, second]) => first !== null && second !== null)
    const shared = comparable.filter(([first, second]) => first === second).length
    const leadChanges = records.map((record) => ISSUES.reduce((total, issue) => total + record.leadChanges[issue], 0))
    return [
      count,
      percent(contested, tracks.length),
      `${percent(shared, comparable.length)} (chance ${fixed(100 / ISSUES.length)}%)`,
      fixed(mean(leadChanges)),
      fixed(mean(records.map((record) => record.overtakes))),
    ]
  })
  console.log(
    table(
      ['players', `tracks with 2+ seats on ${INVESTED_SPACE}+ at end`, 'two seats share a favourite track', 'track lead changes per game', 'overtakes per game'],
      rows,
    ),
  )
  console.log(`\nAn overtake is a seat climbing from level with or below a rival on 1+ to above them. A lead change is a track's single leader (on 0+) becoming someone new.`)
}

export function contest(games: number): void {
  const byCount = new Map(PLAYER_COUNTS.map((count) => [count, mirrorGames(count, games)]))
  console.log(`# Contest: ${games} mirror games per player count, every seat the heuristic bot`)
  rallySummary(byCount)
  for (const count of [3]) {
    capturesByRound(byCount.get(count) ?? [], count)
    capturesByAction(byCount.get(count) ?? [], count)
  }
  trackHeights(byCount)
  for (const count of [3]) trackProfile(byCount.get(count) ?? [], count)
  trackFights(byCount)
}

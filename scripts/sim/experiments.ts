import { ACTION_IDS, ACTIONS, type ActionId } from '../../src/game/art/actions'
import { ISSUES } from '../../src/game/board/palette'
import { ABILITIES, cardById, type AbilityId } from '../../src/game/data/cards'
import { banning, heuristic, markerKeeper, placing, random, randomPlanner, type Policy } from './policies'
import { playGame, positionOf, type GameRecord } from './play'
import { fixed, heading, marginOfError, mean, percent, table } from './stats'

/**
 * Bot-vs-bot experiments. Run one with `npm run sim -- <name> [games] [option]` (`actions` takes an action id as its option).
 * No search: every seat is the shipped heuristic bot or a simple variant of it.
 */

const PLAYER_COUNTS = [2, 3, 4, 5]
const FIRST_SEED = 1000

function mirrorGames(playerCount: number, games: number): GameRecord[] {
  return Array.from({ length: games }, (_, index) => playGame(playerCount, FIRST_SEED + index, Array(playerCount).fill(heuristic)))
}

/** One test seat plays `test`, the rest `field`; the test seat rotates so seat order averages out. */
function testSeatGames(playerCount: number, games: number, test: Policy, field: Policy): { records: GameRecord[]; testWins: number } {
  let testWins = 0
  const records = Array.from({ length: games }, (_, index) => {
    const testSeat = index % playerCount
    const policies = Array.from({ length: playerCount }, (_, seat) => (seat === testSeat ? test : field))
    const record = playGame(playerCount, FIRST_SEED + index, policies)
    if (record.winner === testSeat) testWins += 1
    return record
  })
  return { records, testWins }
}

function seatOrder(byCount: Map<number, GameRecord[]>): void {
  heading('Win rate by position (0 = round 1 start player)')
  const rows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    const wins = Array(count).fill(0)
    for (const record of records) wins[positionOf(record, record.winner)] += 1
    return [count, ...Array.from({ length: 5 }, (_, position) => (position < count ? percent(wins[position], records.length) : '')), `${fixed(100 / count)}%`]
  })
  console.log(table(['players', 'pos 0', 'pos 1', 'pos 2', 'pos 3', 'pos 4', 'fair share'], rows))
  const games = byCount.get(PLAYER_COUNTS[0])?.length ?? 0
  console.log(`
With ${games} games a cell is good to about ${marginOfError(games / 2, games)} points.`)
}

function scoring(byCount: Map<number, GameRecord[]>): void {
  heading('Scores')
  const rows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    const winnerPoints = records.map((record) => record.victoryPoints[record.winner])
    const margins = records.map((record) => {
      const sorted = [...record.victoryPoints].sort((a, b) => b - a)
      return sorted[0] - sorted[1]
    })
    const awarded = records.map((record) => record.victoryPoints.reduce((total, points) => total + points, 0))
    const zeroScorers = records.reduce((total, record) => total + record.victoryPoints.filter((points) => points === 0).length, 0)
    const leaderAfterFour = records.filter((record) => {
      const afterFour = record.victoryPoints.map((points, seat) => points - record.roundPoints[4][seat])
      return afterFour.indexOf(Math.max(...afterFour)) === record.winner
    }).length
    return [
      count,
      fixed(mean(winnerPoints)),
      fixed(mean(margins)),
      percent(margins.filter((margin) => margin <= 3).length, records.length),
      percent(records.filter((record) => record.isTiebreakWin).length, records.length),
      percent(mean(awarded), 90),
      percent(zeroScorers, records.length * count),
      percent(leaderAfterFour, records.length),
    ]
  })
  console.log(table(['players', 'winner VP', 'margin', 'margin ≤3', 'tiebreak', 'VP awarded of 90', 'seats on 0 VP', 'leader after R4 wins'], rows))

  heading('Share of all VP scored in each round (a district is worth R in round R)')
  const roundRows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    const districtsScored = [1, 2, 3, 4, 5].map((round) =>
      mean(records.map((record) => record.roundPoints[round - 1].reduce((total, points) => total + points, 0) / round)),
    )
    return [count, ...districtsScored.map((districts) => `${fixed(districts)} of 6`)]
  })
  console.log(table(['players', 'R1 districts scored', 'R2', 'R3', 'R4', 'R5'], roundRows))
}

function plans(records: GameRecord[], playerCount: number): void {
  heading(`Programmed actions by slot (${playerCount} players)`)
  const slotCounts = ACTION_IDS.map(() => [0, 0, 0, 0])
  for (const { plan } of records.flatMap((record) => record.plans)) {
    plan.forEach((action, slotIndex) => (slotCounts[ACTION_IDS.indexOf(action)][slotIndex] += 1))
  }
  const planCount = records.reduce((total, record) => total + record.plans.length, 0)
  console.log(
    table(
      ['action', 'slot 1', 'slot 2', 'slot 3', 'slot 4', 'programmed'],
      ACTION_IDS.map((action, index) => [
        ACTIONS[action].name,
        ...slotCounts[index].map((count) => percent(count, planCount)),
        percent(slotCounts[index].reduce((a, b) => a + b, 0), planCount),
      ]),
    ),
  )
  const distinct = new Set(records.flatMap((record) => record.plans.map((entry) => entry.plan.join(','))))
  const sameAsLastRound = records.reduce((total, record) => {
    return total + record.plans.filter((entry) => {
      const previous = record.plans.find((other) => other.seat === entry.seat && other.round === entry.round - 1)
      return previous !== undefined && previous.plan.join() === entry.plan.join()
    }).length
  }, 0)
  console.log(`\nDistinct plans: ${distinct.size} of 840 possible. Same plan as the seat's previous round: ${percent(sameAsLastRound, planCount - records.length * playerCount)}.`)
  const top = [...countBy(records.flatMap((record) => record.plans.map((entry) => entry.plan.map((action) => ACTIONS[action].name).join(' → '))))]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  console.log(table(['most common plans', 'share'], top.map(([plan, count]) => [plan, percent(count, planCount)])))
}

function countBy(keys: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
  return counts
}

function upgrades(records: GameRecord[], playerCount: number): void {
  heading(`Upgrades (${playerCount} players)`)
  const seatGames = records.length * playerCount
  const rows = ACTION_IDS.map((action) => {
    const rounds = records.flatMap((record) => record.upgradeRound[action].filter((round): round is number => round !== null))
    const asSetAside = records.filter((record) => record.setAsideAction === action)
    const setAsideUpgrades = asSetAside.reduce((total, record) => total + record.upgradeRound[action].filter((round) => round !== null).length, 0)
    return [ACTIONS[action].name, percent(rounds.length, seatGames), fixed(mean(rounds)), percent(setAsideUpgrades, asSetAside.length * playerCount)]
  })
  console.log(table(['action', 'upgraded (seat-games)', 'mean round', 'upgraded when set aside'], rows))

  const winsByUpgrades = new Map<number, { seats: number; wins: number }>()
  for (const record of records) {
    for (let seat = 0; seat < playerCount; seat += 1) {
      const count = ACTION_IDS.filter((action) => record.upgradeRound[action][seat] !== null).length
      const entry = winsByUpgrades.get(count) ?? { seats: 0, wins: 0 }
      entry.seats += 1
      if (record.winner === seat) entry.wins += 1
      winsByUpgrades.set(count, entry)
    }
  }
  console.log()
  console.log(
    table(
      ['tiles upgraded by game end', 'seats', 'win rate'],
      [...winsByUpgrades].sort((a, b) => a[0] - b[0]).map(([count, { seats, wins }]) => [count, seats, percent(wins, seats)]),
    ),
  )
}

function tracks(records: GameRecord[], playerCount: number): void {
  heading(`Final track positions (${playerCount} players)`)
  const positions = records.flatMap((record) => ISSUES.flatMap((issue) => record.finalTracks[issue]))
  const rows = [-2, -1, 0, 1, 2, 3, 4].map((space) => [space, percent(positions.filter((position) => position === space).length, positions.length)])
  console.log(table(['space', 'share of seat-tracks'], rows))
}

function cards(records: GameRecord[], playerCount: number): void {
  heading(`Leverage picks (${playerCount} players; fair win rate ${fixed(100 / playerCount)}%)`)
  const byAbility = new Map<AbilityId, { takes: number; effects: number; winningTakes: number }>()
  for (const record of records) {
    for (const take of record.leverage) {
      const { ability } = cardById(take.cardId)
      const entry = byAbility.get(ability) ?? { takes: 0, effects: 0, winningTakes: 0 }
      entry.takes += 1
      if (take.playEffect) entry.effects += 1
      if (record.winner === take.seat) entry.winningTakes += 1
      byAbility.set(ability, entry)
    }
  }
  const takes = records.reduce((total, record) => total + record.leverage.length, 0)
  console.log(`Leverage picks per game: ${fixed(takes / records.length)}`)
  const rows = [...byAbility]
    .sort((a, b) => b[1].takes - a[1].takes)
    .map(([ability, entry]) => [
      `${ABILITIES[ability].title} (${ABILITIES[ability].type})`,
      entry.takes,
      percent(entry.effects, entry.takes),
      `${percent(entry.winningTakes, entry.takes)} ${marginOfError(entry.winningTakes, entry.takes)}`,
    ])
  console.log(table(['card', 'kept', 'effect played', 'taker won'], rows))
}

function pace(byCount: Map<number, GameRecord[]>): void {
  heading('Pace')
  const rows = PLAYER_COUNTS.map((count) => {
    const records = byCount.get(count) ?? []
    return [count, fixed(mean(records.map((record) => record.moveCount)), 0), fixed(mean(records.map((record) => record.startPlayerChanges))), fixed(mean(records.map((record) => record.milliseconds)), 0)]
  })
  console.log(table(['players', 'moves per game', 'start player changes', 'ms per game'], rows))
}

function baseline(games: number): void {
  const byCount = new Map(PLAYER_COUNTS.map((count) => [count, mirrorGames(count, games)]))
  console.log(`# Mirror matches: ${games} games per player count, every seat the heuristic bot`)
  seatOrder(byCount)
  scoring(byCount)
  pace(byCount)
  for (const count of [2, 4]) plans(byCount.get(count) ?? [], count)
  for (const count of [3]) {
    upgrades(byCount.get(count) ?? [], count)
    tracks(byCount.get(count) ?? [], count)
    cards(byCount.get(count) ?? [], count)
  }
}

function ladder(games: number): void {
  console.log(`# Strength ladder: one test seat against the field, ${games} three-player games each`)
  const matchups: [string, Policy, Policy][] = [
    ['heuristic vs random', heuristic, random],
    ['heuristic vs random-plan heuristic', heuristic, randomPlanner],
    ['random-plan heuristic vs random', randomPlanner, random],
    ['random vs heuristic', random, heuristic],
  ]
  const rows = matchups.map(([name, test, field]) => {
    const { testWins } = testSeatGames(3, games, test, field)
    return [name, `${percent(testWins, games)} ${marginOfError(testWins, games)}`]
  })
  console.log(table(['test seat vs two of the field', 'test seat wins (fair 33.3%)'], rows))
}

function actionBans(games: number, playerCount: number): void {
  console.log(`# Action bans: one seat never programs an action, against heuristic bots, ${games} ${playerCount}-player games each`)
  const fair = 100 / playerCount
  // The bot never programs Media, so banning it changes nothing.
  const rows = ACTION_IDS.filter((action) => action !== 'media').map((action) => {
    const { testWins } = testSeatGames(playerCount, games, banning(action), heuristic)
    return [ACTIONS[action].name, `${percent(testWins, games)} ${marginOfError(testWins, games)}`, fixed((100 * testWins) / games - fair)]
  })
  console.log(table([`banned action`, `banning seat wins (fair ${fixed(fair)}%)`, 'points vs fair'], rows))
}

const SLOT_COUNT = 4

function testSeatSummary(playerCount: number, games: number, test: Policy): (string | number)[] {
  const { records, testWins } = testSeatGames(playerCount, games, test, heuristic)
  const testPoints = records.map((record, index) => record.victoryPoints[index % playerCount])
  return [`${percent(testWins, games)} ${marginOfError(testWins, games)}`, fixed(mean(testPoints))]
}

/** How often the shipped bot programs `action`, and in which slot, in 3 player mirror games. */
function shippedUsage(records: GameRecord[], action: ActionId): string {
  const plans = records.flatMap((record) => record.plans.map((entry) => entry.plan))
  const slots = Array.from({ length: SLOT_COUNT }, (_, slot) => plans.filter((plan) => plan[slot] === action).length)
  const total = slots.reduce((a, b) => a + b, 0)
  return `programmed in ${percent(total, plans.length)} of plans (slot 1–4: ${slots.map((count) => percent(count, plans.length)).join(' / ')})`
}

/** For each action: one seat always programs it in a given slot, or never programs it. */
function actionSlots(games: number, only?: string): void {
  const playerCount = 3
  const actions = only === undefined ? ACTION_IDS : ACTION_IDS.filter((action) => action === only)
  if (actions.length === 0) throw new Error(`Unknown action "${only}". Try: ${ACTION_IDS.join(', ')}`)
  const mirror = mirrorGames(playerCount, games)
  const shippedPoints = mean(mirror.flatMap((record) => record.victoryPoints))
  console.log(`# Action slots: one seat forces an action into a slot, ${games} ${playerCount}-player games per row. Shipped bot mean VP ${fixed(shippedPoints)}.`)
  for (const action of actions) {
    heading(ACTIONS[action].name)
    console.log(`Shipped bot: ${shippedUsage(mirror, action)}
`)
    const variants: [string, Policy][] = Array.from({ length: SLOT_COUNT }, (_, slot) => [`always slot ${slot + 1}`, placing(action, slot)])
    // The shipped bot already never programs Media, so its "never" row is the shipped bot.
    if (action !== 'media') variants.push(['never', banning(action)])
    const rows = variants.map(([name, policy]) => [name, ...testSeatSummary(playerCount, games, policy)])
    console.log(table(['test seat', `wins (fair ${fixed(100 / playerCount)}%)`, 'mean VP'], rows))
  }
}

function marker(games: number): void {
  console.log(`# Start marker: one seat keeps the marker instead of passing it, ${games} games each`)
  const rows = [3, 4].map((count) => {
    const { testWins } = testSeatGames(count, games, markerKeeper, heuristic)
    return [count, `${percent(testWins, games)} ${marginOfError(testWins, games)}`, `${fixed(100 / count)}%`]
  })
  console.log(table(['players', 'keeper wins', 'fair'], rows))
}

const EXPERIMENTS: Record<string, (games: number, option?: string) => void> = {
  baseline,
  ladder,
  bans: (games) => actionBans(games, 3),
  marker,
  actions: actionSlots,
}

const [name = 'baseline', gamesArgument = '300', option] = process.argv.slice(2)
const experiment = EXPERIMENTS[name]
if (!experiment) throw new Error(`Unknown experiment "${name}". Try: ${Object.keys(EXPERIMENTS).join(', ')}`)
experiment(Number(gamesArgument), option)

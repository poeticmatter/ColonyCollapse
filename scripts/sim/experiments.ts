/**
 * Bot-vs-bot games on the action-point rules, summarised per player count:
 *   npm run sim -- [gamesPerPlayerCount] [playerCounts, comma-separated]
 * e.g. `npm run sim -- 20 3,4`.
 */
import { chooseBotMove } from '../../src/game/bot'
import { colonyRules, finalRanking, type GameState, type Move } from '../../src/game/rules'

const DEFAULT_GAMES = 10
const DEFAULT_PLAYER_COUNTS = [2, 3, 4, 5]
const MAX_MOVES = 5_000

type MoveType = Move['type']

interface GameRecord {
  playerCount: number
  firstPlayer: number
  victoryPoints: number[]
  winner: number
  moveCounts: Record<MoveType, number>
  turns: number
  rounds: number
  /** Rounds that ended because someone paid to turn the dial past the mark. */
  roundsEndedByPaying: number
  unspentPoints: number
}

function emptyMoveCounts(): Record<MoveType, number> {
  return { turnDial: 0, movePawn: 0, rallyDial: 0, address: 0, shift: 0, rallyAround: 0, endTurn: 0 }
}

function playGame(playerCount: number, seed: number): GameRecord {
  let state: GameState = colonyRules.createInitialState({ settings: {}, playerCount, seed })
  const record: GameRecord = {
    playerCount,
    firstPlayer: state.turn.seat,
    victoryPoints: [],
    winner: -1,
    moveCounts: emptyMoveCounts(),
    turns: 0,
    rounds: 0,
    roundsEndedByPaying: 0,
    unspentPoints: 0,
  }
  for (let moves = 0; state.phase !== 'over'; moves += 1) {
    if (moves > MAX_MOVES) throw new Error(`Game did not end (players ${playerCount}, seed ${seed})`)
    const before = state
    const move = chooseBotMove(state, state.turn.seat)
    state = colonyRules.applyMove(state, move, state.turn.seat)
    record.moveCounts[move.type] += 1
    if (move.type === 'endTurn') record.unspentPoints += before.turn.actionPoints
    const isTurnOver = state.phase === 'over' || state.turn.seat !== before.turn.seat
    if (isTurnOver) record.turns += 1
    const isRoundOver = state.phase === 'over' || state.round !== before.round
    if (isRoundOver) {
      record.rounds += 1
      if (move.type === 'turnDial') record.roundsEndedByPaying += 1
    }
  }
  record.victoryPoints = state.players.map((player) => player.victoryPoints)
  record.winner = finalRanking(state)[0]
  return record
}

function percent(part: number, whole: number): string {
  return whole === 0 ? '—' : `${((100 * part) / whole).toFixed(0)}%`
}

function average(values: readonly number[]): string {
  return values.length === 0 ? '—' : (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)
}

function report(records: readonly GameRecord[]): void {
  const [{ playerCount }] = records
  const turns = records.reduce((total, record) => total + record.turns, 0)
  const rounds = records.reduce((total, record) => total + record.rounds, 0)
  console.log(`\n=== ${playerCount} players, ${records.length} games ===`)

  const winsByOrder = Array.from({ length: playerCount }, () => 0)
  const pointsByOrder: number[][] = Array.from({ length: playerCount }, () => [])
  for (const record of records) {
    const orderOf = (seat: number) => (seat - record.firstPlayer + playerCount) % playerCount
    winsByOrder[orderOf(record.winner)] += 1
    record.victoryPoints.forEach((points, seat) => pointsByOrder[orderOf(seat)].push(points))
  }
  console.log('Seat order (1 = first to play): win rate, average VP')
  winsByOrder.forEach((wins, order) => {
    console.log(`  ${order + 1}: ${percent(wins, records.length).padStart(4)}  ${average(pointsByOrder[order])} VP`)
  })

  console.log(`Turns per round: ${(turns / rounds).toFixed(2)} (at most 6)`)
  const paidRounds = records.reduce((total, record) => total + record.roundsEndedByPaying, 0)
  console.log(`Rounds ended by paying to pass the mark: ${percent(paidRounds, rounds)}`)
  const unspent = records.reduce((total, record) => total + record.unspentPoints, 0)
  console.log(`Unspent points per turn: ${(unspent / turns).toFixed(2)}`)
  console.log(`Winning VP: ${average(records.map((record) => Math.max(...record.victoryPoints)))}`)

  console.log('Actions bought per turn:')
  const moveTypes = Object.keys(emptyMoveCounts()) as MoveType[]
  for (const type of moveTypes.filter((candidate) => candidate !== 'endTurn')) {
    const count = records.reduce((total, record) => total + record.moveCounts[type], 0)
    console.log(`  ${type.padEnd(12)} ${(count / turns).toFixed(2)}`)
  }
}

function parsePlayerCounts(argument: string | undefined): number[] {
  if (!argument) return DEFAULT_PLAYER_COUNTS
  return argument.split(',').map((part) => Number(part))
}

const games = Number(process.argv[2] ?? DEFAULT_GAMES)
for (const playerCount of parsePlayerCounts(process.argv[3])) {
  const records = Array.from({ length: games }, (_, index) => playGame(playerCount, index + 1))
  report(records)
}

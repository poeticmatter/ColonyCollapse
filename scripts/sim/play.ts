import { activePlayersOf } from 'game-kit/turns'
import { ACTION_IDS, type ActionId } from '../../src/game/art/actions'
import { ISSUES, type Issue } from '../../src/game/board/palette'
import { colonyRules, finalRanking, type GameState, type Move, type Seat } from '../../src/game/rules'
import { range } from '../../src/game/rules/util'
import type { Policy } from './policies'

const MAX_MOVES = 20_000

export interface LeverageTake {
  seat: Seat
  round: number
  cardId: number
  playEffect: boolean
  up: Issue | 'swap' | null
}

/** Everything one simulated game tells us. Seats are table seats; `position` is clockwise from the first start player. */
export interface GameRecord {
  playerCount: number
  seed: number
  firstStartPlayer: Seat
  finalStartPlayer: Seat
  victoryPoints: number[]
  winner: Seat
  /** The winner was tied on VP and won on a tiebreak. */
  isTiebreakWin: boolean
  /** `roundPoints[round - 1][seat]`. */
  roundPoints: number[][]
  plans: { seat: Seat; round: number; plan: ActionId[] }[]
  leverage: LeverageTake[]
  /** The round each seat's tile was upgraded in, or null if it never was. */
  upgradeRound: Record<ActionId, (number | null)[]>
  setAsideAction: ActionId
  trackAction: Record<Issue, ActionId>
  finalTracks: Record<Issue, number[]>
  boardDiscs: number[]
  startPlayerChanges: number
  moveCount: number
  decisionCounts: Record<string, number>
  milliseconds: number
}

export function positionOf(record: GameRecord, seat: Seat): number {
  return (seat - record.firstStartPlayer + record.playerCount) % record.playerCount
}

function countBoardDiscs(state: GameState): number[] {
  const discs = range(state.playerCount).map(() => 0)
  for (const tile of Object.values(state.board)) if (tile.disc !== null) discs[tile.disc] += 1
  for (const owner of Object.values(state.printedDiscs)) if (owner !== null) discs[owner] += 1
  return discs
}

function emptyUpgradeRounds(playerCount: number): Record<ActionId, (number | null)[]> {
  const rounds = {} as Record<ActionId, (number | null)[]> // filled for every action just below
  for (const action of ACTION_IDS) rounds[action] = range(playerCount).map(() => null)
  return rounds
}

class GameRecorder {
  readonly roundPoints: number[][] = []
  readonly plans: GameRecord['plans'] = []
  readonly leverage: LeverageTake[] = []
  readonly decisionCounts: Record<string, number> = {}
  readonly upgradeRound: Record<ActionId, (number | null)[]>
  startPlayerChanges = 0

  constructor(start: GameState) {
    this.upgradeRound = emptyUpgradeRounds(start.playerCount)
    this.noteUpgrades(start)
  }

  noteMove(before: GameState, after: GameState, seat: Seat, move: Move): void {
    if (move.type === 'program') this.plans.push({ seat, round: before.round, plan: move.plan })
    if (move.type === 'decide') {
      const { decision } = move
      this.decisionCounts[decision.kind] = (this.decisionCounts[decision.kind] ?? 0) + 1
      if (decision.kind === 'leveragePick') {
        this.leverage.push({ seat, round: before.round, cardId: decision.cardId, playEffect: decision.playEffect, up: decision.up })
      }
    }
    if (after.startPlayer !== before.startPlayer) this.startPlayerChanges += 1
    const isRoundScored = after.round !== before.round || (after.phase === 'over' && before.phase !== 'over')
    if (isRoundScored) {
      this.roundPoints.push(after.players.map((player, index) => player.victoryPoints - before.players[index].victoryPoints))
    }
    this.noteUpgrades(after)
  }

  private noteUpgrades(state: GameState): void {
    for (const action of ACTION_IDS) {
      state.players.forEach((player, seat) => {
        if (player.tiles[action] === 'upgraded' && this.upgradeRound[action][seat] === null) this.upgradeRound[action][seat] = state.round
      })
    }
  }
}

/** Plays one game to the end, `policies[seat]` choosing for each seat. */
export function playGame(playerCount: number, seed: number, policies: Policy[]): GameRecord {
  const startedAt = performance.now()
  const start = colonyRules.createInitialState({ settings: {}, playerCount, seed })
  const recorder = new GameRecorder(start)
  let state = start
  let moveCount = 0
  while (state.phase !== 'over') {
    if (moveCount > MAX_MOVES) throw new Error(`Game did not end (players ${playerCount}, seed ${seed})`)
    const seat = activePlayersOf(colonyRules, state)[0]
    if (seat === undefined) throw new Error('Nobody to move in an unfinished game')
    const move = policies[seat](state, seat)
    const next = colonyRules.applyMove(state, move, seat)
    recorder.noteMove(state, next, seat, move)
    state = next
    moveCount += 1
  }
  const ranking = finalRanking(state)
  const victoryPoints = state.players.map((player) => player.victoryPoints)
  const winner = ranking[0]
  return {
    playerCount,
    seed,
    firstStartPlayer: start.startPlayer,
    finalStartPlayer: state.startPlayer,
    victoryPoints,
    winner,
    isTiebreakWin: victoryPoints.filter((points) => points === victoryPoints[winner]).length > 1,
    roundPoints: recorder.roundPoints,
    plans: recorder.plans,
    leverage: recorder.leverage,
    upgradeRound: recorder.upgradeRound,
    setAsideAction: state.setAsideAction,
    trackAction: state.trackAction,
    finalTracks: Object.fromEntries(ISSUES.map((issue) => [issue, [...state.track[issue]]])) as Record<Issue, number[]>, // keys are exactly ISSUES
    boardDiscs: countBoardDiscs(state),
    startPlayerChanges: recorder.startPlayerChanges,
    moveCount,
    decisionCounts: recorder.decisionCounts,
    milliseconds: performance.now() - startedAt,
  }
}

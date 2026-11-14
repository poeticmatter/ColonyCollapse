import type { ActionId } from '../art/actions'
import { ACTION_IDS } from '../art/actions'
import { getCellInfo, type CellKey, type Round } from '../board/geometry'
import type { Issue } from '../board/palette'
import type { PendingDecision } from './decisions'
import { isDecisionTask, describeTask } from './registry'
import { effectiveController } from './rally'
import { cellSite, readSite } from './sites'
import { topTask } from './stack'
import type { GameState, HexTile, Phase, Seat, SlotNumber } from './types'

export { cardById } from '../data/cards'
export { holdsOngoing } from './ongoing'
export { effectiveController } from './rally'
export { countBoardDiscs, districtStandings, finalRanking, type DistrictStanding } from './scoring'
export { tileIssue } from './sites'

/**
 * The decision the game is waiting for, with everything needed to draw the choice, or null when
 * nothing is waiting (programming, a tile still to be revealed, or the game is over).
 */
export function pendingDecision(state: GameState): PendingDecision | null {
  const task = topTask(state)
  if (state.phase !== 'resolving' || task === null || !isDecisionTask(task)) return null
  return describeTask(state, task)
}

export interface CurrentTurn {
  phase: Phase
  round: Round
  /** The slot being resolved, 1..4, or null outside resolution. */
  slot: SlotNumber | null
  /** The strength of actions in this slot (equal to the slot number). */
  strength: number | null
  /** Who holds the start player marker now (changes apply from the next slot). */
  startPlayer: Seat
  /** The seat order of the slot being resolved. */
  order: Seat[]
  /** The seat whose slot action it is, or null outside resolution. */
  turnSeat: Seat | null
  /** Whether that seat has revealed their tile yet. */
  hasRevealed: boolean
  /** The seat the game waits for during resolution (the turn's player, or whoever must answer a decision), else null. */
  actor: Seat | null
  /** Seats that still have to send a plan. */
  seatsToProgram: Seat[]
}

export function currentTurn(state: GameState): CurrentTurn {
  const resolution = state.resolution
  const task = topTask(state)
  const turnSeat = resolution ? resolution.order[resolution.orderIndex] : null
  const decisionSeat = task !== null && isDecisionTask(task) ? task.seat : null
  return {
    phase: state.phase,
    round: state.round,
    slot: resolution?.slot ?? null,
    strength: resolution?.slot ?? null,
    startPlayer: state.startPlayer,
    order: resolution?.order ?? [],
    turnSeat,
    hasRevealed: resolution?.hasRevealed ?? false,
    actor: state.phase === 'resolving' ? (decisionSeat ?? turnSeat) : null,
    seatsToProgram: state.players.flatMap((player, seat) => (player.plan === null ? [seat] : [])),
  }
}

function hasStartedSlot(state: GameState, owner: Seat, slot: SlotNumber): boolean {
  const resolution = state.resolution
  if (!resolution) return false
  if (slot !== resolution.slot) return slot < resolution.slot
  const position = resolution.order.indexOf(owner)
  return position < resolution.orderIndex || (position === resolution.orderIndex && resolution.hasRevealed)
}

/**
 * The action in `owner`'s slot as `viewer` may see it: the owner always sees their own plan;
 * others see a slot only once its tile has been revealed (and everything once the game is over).
 * Null while hidden, or before the owner has sent a plan.
 */
export function visiblePlanSlot(state: GameState, owner: Seat, slot: SlotNumber, viewer: Seat | 'spectator'): ActionId | null {
  const plan = state.players[owner].plan
  if (!plan) return null
  const canSee = viewer === owner || state.phase === 'over' || hasStartedSlot(state, owner, slot)
  return canSee ? plan[slot - 1] : null
}

/** The actions a player left out of this round's plan. */
export function unprogrammedActions(state: GameState, seat: Seat): ActionId[] {
  const plan = state.players[seat].plan ?? []
  return ACTION_IDS.filter((action) => !plan.includes(action))
}

export function trackPosition(state: GameState, seat: Seat, issue: Issue): number {
  return state.track[issue][seat]
}

export function scores(state: GameState): number[] {
  return state.players.map((player) => player.victoryPoints)
}

export function isTileMediaLocked(state: GameState, tile: HexTile): boolean {
  return state.resolution?.mediaLocked.includes(tile.id) ?? false
}

export interface CellView {
  cell: CellKey
  kind: 'hub' | 'printed' | 'slot'
  /** Null on the hub, a printed hex, or an empty slot. */
  tile: HexTile | null
  /** The issue of the printed hex or of the tile; null on the hub and empty slots. */
  issue: Issue | null
  disc: Seat | null
  /** Seats with a pawn here (several only in the hub). */
  pawnSeats: Seat[]
  /** Who controls the hex now, counting pawns. */
  controller: Seat | null
}

/** Everything the board draws for one cell. */
export function cellView(state: GameState, cell: CellKey): CellView {
  const info = getCellInfo(cell)
  const site = readSite(state, cellSite(cell))
  return {
    cell,
    kind: info.kind,
    tile: state.board[cell] ?? null,
    issue: site?.issue ?? null,
    disc: site?.disc ?? null,
    pawnSeats: state.pawns.filter((pawn) => pawn.cell === cell).map((pawn) => pawn.seat),
    controller: effectiveController(state, cell),
  }
}

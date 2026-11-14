import type { ActionId, ActionSide } from '../art/actions'
import type { CellKey, Round } from '../board/geometry'
import type { Issue } from '../board/palette'
import type { Decision } from './decisions'
import type { Task } from './tasks'

/** A seat at the table, 0-based. Seat order is clockwise. */
export type Seat = number

/** The game has no options yet. */
export type Settings = Record<string, never>

export type SlotNumber = 1 | 2 | 3 | 4

export type Phase = 'programming' | 'resolving' | 'over'

export interface HexTile {
  /** Unique, 1..30. */
  id: number
  faces: [Issue, Issue]
  /** Index into `faces` of the colour face up. */
  side: 0 | 1
  /** The control disc on this tile: whose it is, or null. It travels with the tile. */
  disc: Seat | null
}

export interface Pawn {
  id: number
  seat: Seat
  cell: CellKey
  /** Once a pawn has left the hub it can never go back. */
  hasLeftHub: boolean
}

export interface PlayerState {
  /** The four actions programmed for slots 1..4, or null until the player has sent their plan. */
  plan: ActionId[] | null
  tiles: Record<ActionId, ActionSide>
  /** Ongoing cards in front of the player (card ids). */
  ongoing: number[]
  victoryPoints: number
}

/** Anything a disc can sit on: a tile in the rondel, or a printed hex / tile on the board. */
export type SiteRef = { type: 'rondel'; slot: number } | { type: 'cell'; cell: CellKey }

export interface LogEntry {
  round: Round
  slot: SlotNumber | null
  /** The seat the entry is about, if any. */
  seat: Seat | null
  text: string
}

export interface ResolutionState {
  slot: SlotNumber
  /** Seat order for this slot, fixed when the slot starts. */
  order: Seat[]
  /** Index into `order` of the player whose action it is. */
  orderIndex: number
  /** Whether that player has revealed their tile yet. */
  hasRevealed: boolean
  /** Ids of tiles flipped by Media during this slot, which Media can't flip again. */
  mediaLocked: number[]
  /** Pending work of the current action; the last entry runs first. */
  stack: Task[]
}

/** Plain JSON throughout: this is stored in the database. */
export interface GameState {
  playerCount: number
  round: Round
  phase: Phase
  startPlayer: Seat
  /** Mulberry32 state, advanced by every random draw. */
  rng: number
  /** Counts every random draw and every card taken from the deck; used to tell which moves can't be undone. */
  drawCount: number
  /** Tiles not yet in play; the next to be drawn is first. */
  bag: HexTile[]
  /** Six slots, slot i belonging to district i. Null while empty (only between polling and the next refill). */
  rondel: (HexTile | null)[]
  /** The shared rondel pawn: the slot it stands on. */
  rondelPawn: number
  /** Tiles placed on the board, by cell. */
  board: Record<CellKey, HexTile>
  /** Discs on the six printed hexes, by district issue. */
  printedDiscs: Record<Issue, Seat | null>
  pawns: Pawn[]
  /** Track positions: `track[issue][seat]`. */
  track: Record<Issue, number[]>
  /** Reaching the upgrade space on a track upgrades this action for the player. */
  trackAction: Record<Issue, ActionId>
  /** The action no track upgrades. */
  setAsideAction: ActionId
  players: PlayerState[]
  /** Seed card ids; the next to be drawn is first. */
  deck: number[]
  discard: number[]
  resolution: ResolutionState | null
  /** The latest events, oldest first. */
  log: LogEntry[]
}

export type Move =
  | { type: 'program'; plan: ActionId[] }
  /** The player whose turn it is turns their programmed tile face up and starts it. */
  | { type: 'reveal' }
  | { type: 'decide'; decision: Decision }

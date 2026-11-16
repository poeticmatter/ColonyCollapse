import type { CellKey, Round } from '../board/geometry'
import type { Issue } from '../board/palette'

/** A seat at the table, 0-based. Seat order is clockwise. */
export type Seat = number

/** The game has no options yet. */
export type Settings = Record<string, never>

export type Phase = 'playing' | 'over'

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
  victoryPoints: number
}

/** Anything a disc can sit on: a tile in the rondel, or a printed hex / tile on the board. */
export type SiteRef = { type: 'rondel'; slot: number } | { type: 'cell'; cell: CellKey }

export interface LogEntry {
  round: Round
  /** The seat the entry is about, if any. */
  seat: Seat | null
  text: string
}

export interface TurnState {
  seat: Seat
  /** Action points left to spend this turn. */
  actionPoints: number
}

/** Plain JSON throughout: this is stored in the database. */
export interface GameState {
  playerCount: number
  round: Round
  phase: Phase
  /** Mulberry32 state, advanced by every random draw. */
  rng: number
  /** Counts every random draw; used to tell which moves can't be undone. */
  drawCount: number
  /** Tiles not yet in play; the next to be drawn is first. */
  bag: HexTile[]
  /** Six slots, slot i belonging to district i. Null only between polling and the refill. */
  rondel: (HexTile | null)[]
  /** The rondel slot the dial points at. */
  dial: number
  /** Tiles placed on the board, by cell. */
  board: Record<CellKey, HexTile>
  /** Discs on the six printed hexes, by district issue. */
  printedDiscs: Record<Issue, Seat | null>
  pawns: Pawn[]
  /** Track positions: `track[issue][seat]`. */
  track: Record<Issue, number[]>
  players: PlayerState[]
  /** Who took the first turn of the current round (the last tiebreak counts from them). */
  roundStarter: Seat
  /** The turn in progress; after the game ends, the last one played. */
  turn: TurnState
  /** The latest events, oldest first. */
  log: LogEntry[]
}

/** The actions a player buys with action points. */
export type ActionMove =
  | { type: 'turnDial' }
  | { type: 'movePawn'; to: CellKey }
  | { type: 'rallyDial' }
  | { type: 'address' }
  | { type: 'shift'; up: Issue; down: Issue }
  | { type: 'rallyAround' }

export type ActionType = ActionMove['type']

/** `endTurn` stops spending: the remaining points are lost. */
export type Move = ActionMove | { type: 'endTurn' }

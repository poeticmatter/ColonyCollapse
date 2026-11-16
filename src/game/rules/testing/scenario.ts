import { ISSUES } from '../../board/palette'
import { colonyRules } from '../index'
import type { GameState, HexTile, Move, Seat } from '../types'

/** A copy of `state` after `mutate` changed it, for building a situation by hand. */
export function edit(state: GameState, mutate: (draft: GameState) => void): GameState {
  const copy = structuredClone(state)
  mutate(copy)
  return copy
}

export function newGame(playerCount = 3, seed = 1): GameState {
  return colonyRules.createInitialState({ settings: {}, playerCount, seed })
}

/** Plays `moves` in order for whoever is on turn. */
export function play(state: GameState, ...moves: Move[]): GameState {
  return moves.reduce((current, move) => colonyRules.applyMove(current, move, current.turn.seat), state)
}

export function rondelTile(state: GameState, slot: number): HexTile {
  const tile = state.rondel[slot]
  if (!tile) throw new Error(`No rondel tile in slot ${slot}`)
  return tile
}

export interface ScenarioOptions {
  playerCount?: number
  /** The seat on turn, and the one who started the round; defaults to 0. */
  seat?: Seat
  /** Changes the neutral starting position further. */
  setup?: (draft: GameState) => void
}

/**
 * A game with a known shape: `seat` is on turn with full points, all tracks at 0, nothing
 * controlled, the dial on slot 1, and rondel slot n showing issue n with issue n+1 underneath.
 */
export function scenario(options: ScenarioOptions = {}): GameState {
  const { playerCount = 3, seat = 0, setup } = options
  return edit(newGame(playerCount), (draft) => {
    draft.roundStarter = seat
    draft.turn.seat = seat
    for (const issue of ISSUES) draft.track[issue] = draft.players.map(() => 0)
    draft.rondel = draft.rondel.map((tile, slot) =>
      tile ? { ...tile, faces: [ISSUES[slot], ISSUES[(slot + 1) % ISSUES.length]], side: 0, disc: null } : null,
    )
    draft.dial = 0
    setup?.(draft)
  })
}

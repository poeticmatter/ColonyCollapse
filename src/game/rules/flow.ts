import { ROUNDS } from '../board/geometry'
import { DIAL_START_SLOT, LAST_SLOT_BEFORE_MARK, RONDEL_SLOT_COUNT } from '../board/rondel'
import { ACTION_POINTS_PER_TURN, FINAL_ROUND } from './constants'
import { logEvent } from './log'
import { runPolling } from './polling'
import { drawRandomIndex } from './rng'
import type { GameState, Seat } from './types'
import { seatName } from './util'

const TILE_SIDES = 2

/** Fills every empty rondel slot from the bag, each tile coming up on a random side. */
export function refillRondel(state: GameState): void {
  for (let slot = 0; slot < RONDEL_SLOT_COUNT; slot += 1) {
    if (state.rondel[slot]) continue
    const tile = state.bag.shift()
    if (!tile) throw new Error('The bag has run out of tiles')
    tile.side = drawRandomIndex(state, TILE_SIDES) === 0 ? 0 : 1
    state.rondel[slot] = tile
  }
}

export function startTurn(state: GameState, seat: Seat): void {
  state.turn = { seat, actionPoints: ACTION_POINTS_PER_TURN }
}

function seatAfter(state: GameState, seat: Seat): Seat {
  return (seat + 1) % state.playerCount
}

export function isDialOnLastSlot(state: GameState): boolean {
  return state.dial === LAST_SLOT_BEFORE_MARK
}

/** The dial has passed the mark: poll, then start the next round (or end the game) with the next player. */
function passMark(state: GameState): void {
  const nextStarter = seatAfter(state, state.turn.seat)
  state.dial = DIAL_START_SLOT
  logEvent(state, null, `The dial passes the mark: round ${state.round} ends.`)
  runPolling(state)
  if (state.round === FINAL_ROUND) {
    state.phase = 'over'
    logEvent(state, null, 'The game is over.')
    return
  }
  state.round = ROUNDS[state.round]
  refillRondel(state)
  state.roundStarter = nextStarter
  startTurn(state, nextStarter)
  logEvent(state, nextStarter, `Round ${state.round} begins with ${seatName(nextStarter)}.`)
}

/**
 * A paid step of the dial. Passing the mark this way ends the payer's turn at once: polling
 * follows straight away, with no end-of-turn step.
 */
export function payDialStep(state: GameState): void {
  if (isDialOnLastSlot(state)) {
    passMark(state)
    return
  }
  state.dial += 1
}

/** The end of a turn: the dial steps once, which may pass the mark. */
export function endTurn(state: GameState): void {
  if (isDialOnLastSlot(state)) {
    passMark(state)
    return
  }
  state.dial += 1
  startTurn(state, seatAfter(state, state.turn.seat))
}

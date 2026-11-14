import { ROUNDS } from '../board/geometry'
import { RONDEL_SLOT_COUNT } from '../board/rondel'
import { FINAL_ROUND, SLOT_NUMBERS } from './constants'
import { logEvent } from './log'
import { runPolling } from './polling'
import { drawRandomIndex } from './rng'
import { getResolution } from './stack'
import type { GameState, SlotNumber } from './types'
import { range, seatName } from './util'

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

export function beginProgramming(state: GameState): void {
  state.phase = 'programming'
  state.resolution = null
  for (const player of state.players) player.plan = null
}

/** The seat order for a slot: clockwise from whoever holds the start player marker right now. */
function beginSlot(state: GameState, slot: SlotNumber): void {
  state.resolution = {
    slot,
    order: range(state.playerCount).map((offset) => (state.startPlayer + offset) % state.playerCount),
    orderIndex: 0,
    hasRevealed: false,
    mediaLocked: [],
    stack: [],
  }
}

export function beginResolving(state: GameState): void {
  state.phase = 'resolving'
  beginSlot(state, SLOT_NUMBERS[0])
}

/**
 * Between rounds the marker moves one seat clockwise, so nobody acts last in every slot of
 * the game (simulations showed the last seat winning about twice its share without this).
 */
function passStartPlayer(state: GameState): void {
  state.startPlayer = (state.startPlayer + 1) % state.playerCount
  logEvent(state, state.startPlayer, `${seatName(state.startPlayer)} is now the start player.`)
}

function finishRound(state: GameState): void {
  state.resolution = null
  runPolling(state)
  if (state.round === FINAL_ROUND) {
    state.phase = 'over'
    logEvent(state, null, 'The game is over.')
    return
  }
  state.round = ROUNDS[state.round]
  passStartPlayer(state)
  refillRondel(state)
  beginProgramming(state)
  logEvent(state, null, `Round ${state.round} begins: choose your four actions.`)
}

/** The current player's action is done: on to the next player, the next slot, or polling. */
export function advanceTurn(state: GameState): void {
  const resolution = getResolution(state)
  resolution.orderIndex += 1
  resolution.hasRevealed = false
  if (resolution.orderIndex < resolution.order.length) return
  const nextSlot = SLOT_NUMBERS[resolution.slot]
  if (nextSlot === undefined) finishRound(state)
  else beginSlot(state, nextSlot)
}

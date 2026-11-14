import type { GameState, Seat } from '../rules'

const HASH_MULTIPLIER = 0x9e3779b1
const HASH_ROTATION = 15

/**
 * A number derived only from public parts of the state and the seat, so every browser that
 * computes the same bot move gets the same "random" tie-breaks.
 */
export function hashState(state: GameState, seat: Seat, salt = 0): number {
  const resolution = state.resolution
  const parts = [
    state.rng,
    state.drawCount,
    state.round,
    resolution?.slot ?? 0,
    resolution?.orderIndex ?? 0,
    state.log.length,
    seat,
    salt,
  ]
  let hash = 0
  for (const part of parts) {
    hash = Math.imul(hash ^ (part | 0), HASH_MULTIPLIER)
    hash ^= hash >>> HASH_ROTATION
  }
  return hash >>> 0
}

/** A number in [0, 1) that varies with `salt`. */
export function hashFraction(state: GameState, seat: Seat, salt: number): number {
  return hashState(state, seat, salt) / 2 ** 32
}

import { LOG_LIMIT } from './constants'
import type { GameState, Seat } from './types'

/** Appends a plain-English event, keeping only the latest `LOG_LIMIT`. */
export function logEvent(state: GameState, seat: Seat | null, text: string): void {
  state.log.push({ round: state.round, slot: state.resolution?.slot ?? null, seat, text })
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT)
}

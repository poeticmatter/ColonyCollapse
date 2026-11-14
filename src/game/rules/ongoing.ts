import { cardById, type AbilityId } from '../data/cards'
import type { GameState, Seat } from './types'

/** The id of the player's in-front card with this ability, or null. */
export function findOngoingCard(state: GameState, seat: Seat, ability: AbilityId): number | null {
  return state.players[seat].ongoing.find((cardId) => cardById(cardId).ability === ability) ?? null
}

export function holdsOngoing(state: GameState, seat: Seat, ability: AbilityId): boolean {
  return findOngoingCard(state, seat, ability) !== null
}

import { nextIndex } from 'game-kit/turns'
import type { GameState } from './types'

/** An integer in [0, count), advancing the game's generator. */
export function drawRandomIndex(state: GameState, count: number): number {
  const { index, nextState } = nextIndex(state.rng, count)
  state.rng = nextState
  state.drawCount += 1
  return index
}

/** Fisher-Yates, in place. */
export function shuffleInPlace<T>(state: GameState, items: T[]): void {
  for (let last = items.length - 1; last > 0; last -= 1) {
    const swapWith = drawRandomIndex(state, last + 1)
    ;[items[last], items[swapWith]] = [items[swapWith], items[last]]
  }
}

/**
 * Takes up to `count` cards off the deck, one at a time. When the deck runs dry the discard pile
 * is shuffled into a new deck. Fewer cards come back only if every card is out of the deck.
 */
export function drawCards(state: GameState, count: number): number[] {
  const drawn: number[] = []
  while (drawn.length < count) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break
      state.deck = state.discard
      state.discard = []
      shuffleInPlace(state, state.deck)
    }
    const cardId = state.deck.shift()
    if (cardId === undefined) break
    state.drawCount += 1
    drawn.push(cardId)
  }
  return drawn
}

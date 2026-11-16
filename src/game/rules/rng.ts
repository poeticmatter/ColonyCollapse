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

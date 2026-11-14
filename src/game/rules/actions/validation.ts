import { IllegalMoveError } from 'game-kit/turns'
import { hasDuplicates } from '../util'

/** Throws unless `chosen` lists each of its entries once and every entry is one of `options`. */
export function assertDistinctSubset<T>(chosen: readonly T[], options: readonly T[], message: string): void {
  const isEveryChoiceAnOption = chosen.every((item) => options.includes(item))
  if (!isEveryChoiceAnOption || hasDuplicates(chosen)) throw new IllegalMoveError(message)
}

export function assertOneOf<T>(chosen: T, options: readonly T[], message: string): void {
  if (!options.includes(chosen)) throw new IllegalMoveError(message)
}

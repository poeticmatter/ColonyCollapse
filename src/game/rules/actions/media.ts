import { IllegalMoveError } from 'game-kit/turns'
import type { DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { holdsOngoing } from '../ongoing'
import { rallySite } from '../rally'
import { flipTile, rondelSite } from '../sites'
import { getResolution, pushTasks } from '../stack'
import type { GameState } from '../types'
import { seatName } from '../util'
import { assertDistinctSubset } from './validation'

/** Rondel slots Media may flip: every tile not already flipped by Media during this slot. */
export function unlockedRondelSlots(state: GameState): number[] {
  const locked = getResolution(state).mediaLocked
  return state.rondel.flatMap((tile, slot) => (tile && !locked.includes(tile.id) ? [slot] : []))
}

export const mediaFlipHandler: DecisionHandler<'mediaFlip'> = {
  describe(state, task) {
    const options = unlockedRondelSlots(state)
    if (options.length === 0) return null
    const maxFlips = task.side === 'upgraded' ? options.length : 1
    return { kind: 'mediaFlip', actor: task.seat, options, maxFlips }
  },

  apply(state, task, decision, pending) {
    assertDistinctSubset(decision.slots, pending.options, 'Media can only flip rondel tiles that are not locked')
    if (decision.slots.length > pending.maxFlips) {
      throw new IllegalMoveError(`Media flips at most ${pending.maxFlips} tile(s)`)
    }
    const locked = getResolution(state).mediaLocked
    for (const slot of decision.slots) {
      const tile = state.rondel[slot]
      if (!tile) continue
      flipTile(tile)
      locked.push(tile.id)
    }
    if (decision.slots.length === 0) return
    logEvent(state, task.seat, `${seatName(task.seat)} flips ${decision.slots.length} rondel tile(s) with Media.`)
    if (holdsOngoing(state, task.seat, 'pressCycle')) {
      pushTasks(state, { kind: 'pressCycleRally', seat: task.seat, slots: decision.slots })
    }
  },
}

export const pressCycleRallyHandler: DecisionHandler<'pressCycleRally'> = {
  describe: (_state, task) => ({ kind: 'pressCycleRally', actor: task.seat, options: task.slots }),

  apply(state, task, decision, pending) {
    if (decision.slot === null) return
    if (!pending.options.includes(decision.slot)) throw new IllegalMoveError('Press Cycle rallies a tile you just flipped')
    rallySite(state, task.seat, rondelSite(decision.slot), { canTie: false, countsAsFour: false })
  },
}

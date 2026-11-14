import { EXTRA_HANDS_INTERN_STRENGTH, INTERN_STRENGTH } from '../constants'
import type { AutoHandler } from '../handlers'
import { logEvent } from '../log'
import { holdsOngoing } from '../ongoing'
import { getResolution, pushTasks } from '../stack'
import { seatName, titleCase } from '../util'

/**
 * Intern copies what is printed on the tile in the previous slot (not what that tile did), at
 * strength 1 or 2, on the Intern tile's own side. Slot 1 has no previous slot.
 */
const startIntern: AutoHandler<'startAction'> = (state, task) => {
  const { slot } = getResolution(state)
  const copied = slot >= 2 ? state.players[task.seat].plan?.[slot - 2] : undefined
  if (copied === undefined || copied === 'intern') {
    logEvent(state, task.seat, `${seatName(task.seat)}'s Intern has nothing to copy.`)
    return
  }
  const strength = holdsOngoing(state, task.seat, 'extraHands') ? EXTRA_HANDS_INTERN_STRENGTH : INTERN_STRENGTH
  logEvent(state, task.seat, `${seatName(task.seat)}'s Intern copies ${titleCase(copied)}.`)
  pushTasks(state, { kind: 'startAction', seat: task.seat, action: copied, side: task.side, strength })
}

/** Turns an action tile, its side and its strength into the first task of that action. */
export const startAction: AutoHandler<'startAction'> = (state, task) => {
  const { seat, side, strength } = task
  switch (task.action) {
    case 'address':
      pushTasks(state, { kind: 'rondelMove', seat, purpose: 'address', side, strength })
      break
    case 'develop':
      pushTasks(state, { kind: 'rondelMove', seat, purpose: 'develop', side, strength })
      break
    case 'media':
      pushTasks(state, { kind: 'mediaFlip', seat, side })
      break
    case 'leverage':
      pushTasks(state, { kind: 'leverageDraw', seat, side, count: strength })
      break
    case 'dance':
      pushTasks(state, { kind: 'dance', seat, side, strength })
      break
    case 'invest':
      pushTasks(state, { kind: 'invest', seat, side, strength })
      break
    case 'intern':
      startIntern(state, task)
      break
  }
}

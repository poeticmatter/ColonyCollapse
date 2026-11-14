import { IllegalMoveError } from 'game-kit/turns'
import { cardById, type Card } from '../../data/cards'
import type { AutoHandler, DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { holdsOngoing } from '../ongoing'
import { drawCards } from '../rng'
import { pushTasks } from '../stack'
import type { Task } from '../tasks'
import type { GameState, Seat } from '../types'
import { seatName } from '../util'

export const leverageDraw: AutoHandler<'leverageDraw'> = (state, task) => {
  const cardIds = drawCards(state, task.count)
  logEvent(state, task.seat, `${seatName(task.seat)} draws ${cardIds.length} card(s) with Leverage.`)
  if (cardIds.length === 0) return
  pushTasks(state, { kind: 'leveragePick', seat: task.seat, side: task.side, cardIds })
}

/** Policy Trade can swap in place of going up; the drawn Policy Trade itself counts once its effect is played. */
function isSwapAllowed(state: GameState, seat: Seat, card: Card, playEffect: boolean): boolean {
  return holdsOngoing(state, seat, 'policyTrade') || (playEffect && card.ability === 'policyTrade')
}

export const leveragePickHandler: DecisionHandler<'leveragePick'> = {
  describe: (state, task) => ({
    kind: 'leveragePick',
    actor: task.seat,
    cardIds: task.cardIds,
    canDoBoth: task.side === 'upgraded',
    canSwap: holdsOngoing(state, task.seat, 'policyTrade'),
  }),

  apply(state, task, decision, pending) {
    if (!pending.cardIds.includes(decision.cardId)) throw new IllegalMoveError('Choose one of the cards you drew')
    const card = cardById(decision.cardId)
    const goesUp = decision.up !== null
    if (pending.canDoBoth ? !decision.playEffect && !goesUp : decision.playEffect === goesUp) {
      throw new IllegalMoveError(
        pending.canDoBoth ? 'Resolve the effect, go up, or both' : 'Either resolve the effect or go up, not both',
      )
    }
    if (decision.up === 'swap') {
      if (!isSwapAllowed(state, task.seat, card, decision.playEffect)) throw new IllegalMoveError('You have no Policy Trade')
    } else if (decision.up !== null && !card.issues.includes(decision.up)) {
      throw new IllegalMoveError(`${card.issues.join(' and ')} are the issues on that card`)
    }

    for (const cardId of task.cardIds) {
      if (cardId !== decision.cardId) state.discard.push(cardId)
    }
    const tasks: Task[] = []
    if (decision.playEffect) tasks.push({ kind: 'playCard', seat: task.seat, cardId: card.id })
    else state.discard.push(card.id)
    if (decision.up === 'swap') {
      tasks.push({ kind: 'swapTracks', seat: task.seat, first: card.issues[0], second: card.issues[1] })
    } else if (decision.up !== null) {
      tasks.push({ kind: 'adjustTrack', seat: task.seat, issue: decision.up, delta: 1 })
    }
    pushTasks(state, ...tasks)
  },
}

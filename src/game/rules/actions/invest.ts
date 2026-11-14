import { IllegalMoveError } from 'game-kit/turns'
import { ISSUES } from '../../board/palette'
import type { DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { adjustPosition, areAdjacentIssues, getPosition } from '../positions'
import { seatName } from '../util'

export const investHandler: DecisionHandler<'invest'> = {
  describe: (_state, task) => ({
    kind: 'invest',
    actor: task.seat,
    maxAmount: task.strength,
    sources: ISSUES.map((from) => ({
      from,
      to: ISSUES.filter((to) => to !== from && (task.side === 'upgraded' || areAdjacentIssues(from, to))),
    })),
  }),

  apply(state, task, decision, pending) {
    const { transfer } = decision
    if (transfer === null) return
    const source = pending.sources.find((candidate) => candidate.from === transfer.from)
    if (!source || !source.to.includes(transfer.to)) {
      throw new IllegalMoveError(task.side === 'upgraded' ? 'Choose two different issues' : 'Choose two neighbouring issues')
    }
    if (!Number.isInteger(transfer.amount) || transfer.amount < 1 || transfer.amount > pending.maxAmount) {
      throw new IllegalMoveError(`Invest moves between 1 and ${pending.maxAmount} spaces`)
    }
    // The second track only gains what the first actually lost, since a track stops at its bottom.
    const before = getPosition(state, task.seat, transfer.from)
    adjustPosition(state, task.seat, transfer.from, -transfer.amount)
    const lost = before - getPosition(state, task.seat, transfer.from)
    adjustPosition(state, task.seat, transfer.to, lost)
    logEvent(state, task.seat, `${seatName(task.seat)} invests ${lost}: down on ${transfer.from}, up on ${transfer.to}.`)
  },
}

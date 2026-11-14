import { IllegalMoveError } from 'game-kit/turns'
import { RONDEL_SLOT_COUNT } from '../../board/rondel'
import type { RondelMoveOption } from '../decisions'
import type { AutoHandler, DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { holdsOngoing } from '../ongoing'
import { adjustPosition } from '../positions'
import { rallySite } from '../rally'
import { flipTile, rondelSite, tileIssue } from '../sites'
import { pushTasks } from '../stack'
import type { Task } from '../tasks'
import type { GameState, Seat } from '../types'
import { range, seatName } from '../util'
import { assertDistinctSubset } from './validation'

function rondelTile(state: GameState, slot: number) {
  const tile = state.rondel[slot]
  if (!tile) throw new Error(`The rondel has no tile in slot ${slot + 1}`)
  return tile
}

function describeTile(state: GameState, slot: number): string {
  return `the ${tileIssue(rondelTile(state, slot))} tile in rondel slot ${slot + 1}`
}

function addressTasks(state: GameState, seat: Seat, destination: number, isUpgraded: boolean): Task[] {
  const flipBefore: Task[] = holdsOngoing(state, seat, 'crossPartyAddress')
    ? [{ kind: 'crossPartyFlip', seat, slot: destination }]
    : []
  const rallyAfter: Task[] = isUpgraded
    ? [{ kind: 'rally', seat, site: rondelSite(destination), canTie: false, countsAsFour: false }]
    : []
  return [
    ...flipBefore,
    { kind: 'gainOnRondelTile', seat, slot: destination },
    { kind: 'flipRondelTile', slot: destination },
    ...rallyAfter,
  ]
}

/** Develop's tail: the optional Site Prep flip, then rally every target. */
export function developTasks(state: GameState, seat: Seat, targets: number[]): Task[] {
  const flipBefore: Task[] = holdsOngoing(state, seat, 'sitePrep') ? [{ kind: 'sitePrepFlip', seat, targets }] : []
  const rallies: Task[] = targets.map((slot) => ({
    kind: 'rally',
    seat,
    site: rondelSite(slot),
    canTie: false,
    countsAsFour: false,
  }))
  return [...flipBefore, ...rallies]
}

export const rondelMoveHandler: DecisionHandler<'rondelMove'> = {
  describe(state, task) {
    const options: RondelMoveOption[] = range(task.strength)
      .map((index) => index + 1)
      .map((steps) => ({
        steps,
        destination: (state.rondelPawn + steps) % RONDEL_SLOT_COUNT,
        passed: range(steps - 1).map((offset) => (state.rondelPawn + 1 + offset) % RONDEL_SLOT_COUNT),
      }))
      .filter((option) => state.rondel[option.destination] !== null)
    if (options.length === 0) return null
    return { kind: 'rondelMove', actor: task.seat, purpose: task.purpose, options }
  },

  apply(state, task, decision, pending) {
    const option = pending.options.find((candidate) => candidate.steps === decision.steps)
    if (!option) throw new IllegalMoveError(`The rondel pawn can move 1 to ${task.strength} spaces`)
    state.rondelPawn = option.destination
    logEvent(state, task.seat, `${seatName(task.seat)} moves the rondel pawn ${option.steps} to ${describeTile(state, option.destination)}.`)
    if (task.purpose === 'address') {
      pushTasks(state, ...addressTasks(state, task.seat, option.destination, task.side === 'upgraded'))
      return
    }
    const canRallyPassedTile = task.side === 'upgraded' && option.passed.length > 0
    if (canRallyPassedTile) {
      pushTasks(state, { kind: 'developExtraRally', seat: task.seat, destination: option.destination, passed: option.passed })
      return
    }
    pushTasks(state, ...developTasks(state, task.seat, [option.destination]))
  },
}

export const crossPartyFlipHandler: DecisionHandler<'crossPartyFlip'> = {
  describe: (_state, task) => ({ kind: 'crossPartyFlip', actor: task.seat, slot: task.slot }),

  apply(state, task, decision) {
    if (!decision.flip) return
    flipTile(rondelTile(state, task.slot))
    logEvent(state, task.seat, `${seatName(task.seat)} flips ${describeTile(state, task.slot)} first.`)
  },
}

export const developExtraRallyHandler: DecisionHandler<'developExtraRally'> = {
  describe: (_state, task) => ({ kind: 'developExtraRally', actor: task.seat, options: task.passed }),

  apply(state, task, decision, pending) {
    if (decision.slot !== null && !pending.options.includes(decision.slot)) {
      throw new IllegalMoveError('That tile was not passed on the way')
    }
    const targets = decision.slot === null ? [task.destination] : [task.destination, decision.slot]
    pushTasks(state, ...developTasks(state, task.seat, targets))
  },
}

export const sitePrepFlipHandler: DecisionHandler<'sitePrepFlip'> = {
  describe: (_state, task) => ({ kind: 'sitePrepFlip', actor: task.seat, options: task.targets }),

  apply(state, task, decision, pending) {
    assertDistinctSubset(decision.slots, pending.options, 'Site Prep can only flip the tiles about to be rallied')
    for (const slot of decision.slots) flipTile(rondelTile(state, slot))
    if (decision.slots.length > 0) logEvent(state, task.seat, `${seatName(task.seat)} flips ${decision.slots.length} tile(s) with Site Prep.`)
  },
}

export const gainOnRondelTile: AutoHandler<'gainOnRondelTile'> = (state, task) => {
  const issue = tileIssue(rondelTile(state, task.slot))
  adjustPosition(state, task.seat, issue, 1)
  logEvent(state, task.seat, `${seatName(task.seat)} goes up on ${issue}.`)
}

/** Address and Cross-Party flips are not Media flips, so the Media lock ignores them. */
export const flipRondelTile: AutoHandler<'flipRondelTile'> = (state, task) => {
  flipTile(rondelTile(state, task.slot))
}

export const rally: AutoHandler<'rally'> = (state, task) => {
  rallySite(state, task.seat, task.site, { canTie: task.canTie, countsAsFour: task.countsAsFour })
}

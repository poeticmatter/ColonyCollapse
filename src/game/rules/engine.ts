import { IllegalMoveError } from 'game-kit/turns'
import { ACTION_IDS } from '../art/actions'
import type { ActionId } from '../art/actions'
import { MAX_SETTLE_STEPS, PLAN_LENGTH } from './constants'
import type { Decision } from './decisions'
import { advanceTurn, beginResolving } from './flow'
import { logEvent } from './log'
import { applyDecisionToTask, describeTask, isDecisionTask, runAutoTask } from './registry'
import { getResolution, pushTasks, topTask } from './stack'
import type { GameState, Move, ResolutionState, Seat } from './types'
import { hasDuplicates, seatName, titleCase } from './util'

/**
 * Runs automatic tasks, skipping decisions with nothing to choose, until a player has to decide
 * or reveal, and moves on to the next player, slot or round whenever an action is complete.
 */
function settle(state: GameState): void {
  for (let steps = 0; state.resolution; steps += 1) {
    if (steps > MAX_SETTLE_STEPS) throw new Error('Resolution did not settle')
    const task = topTask(state)
    if (task === null) {
      if (!state.resolution.hasRevealed) return
      advanceTurn(state)
      continue
    }
    if (!isDecisionTask(task)) {
      state.resolution.stack.pop()
      runAutoTask(state, task)
    } else if (describeTask(state, task) !== null) {
      return
    } else {
      state.resolution.stack.pop()
    }
  }
}

function assertValidPlan(plan: readonly ActionId[]): void {
  const isEveryActionKnown = plan.every((action) => ACTION_IDS.includes(action))
  if (plan.length !== PLAN_LENGTH || !isEveryActionKnown || hasDuplicates(plan)) {
    throw new IllegalMoveError(`Program ${PLAN_LENGTH} different actions`)
  }
}

function program(state: GameState, plan: ActionId[], seat: Seat): void {
  if (state.phase !== 'programming') throw new IllegalMoveError('Plans are only sent while programming')
  const player = state.players[seat]
  if (player.plan !== null) throw new IllegalMoveError('You have already sent your plan')
  assertValidPlan(plan)
  player.plan = [...plan]
  logEvent(state, seat, `${seatName(seat)} has sent a plan.`)
  if (state.players.some((other) => other.plan === null)) return
  beginResolving(state)
  logEvent(state, null, 'All plans are in. Slot 1: tiles are revealed in turn.')
}

function requireResolving(state: GameState): ResolutionState {
  if (state.phase !== 'resolving') throw new IllegalMoveError('No action is being resolved')
  return getResolution(state)
}

function reveal(state: GameState, seat: Seat): void {
  const resolution = requireResolving(state)
  if (resolution.order[resolution.orderIndex] !== seat) throw new IllegalMoveError('It is not your turn')
  if (resolution.hasRevealed) throw new IllegalMoveError('Your tile is already revealed')
  const plan = state.players[seat].plan
  const action = plan?.[resolution.slot - 1]
  if (!action) throw new Error(`Seat ${seat} has no plan for slot ${resolution.slot}`)
  const side = state.players[seat].tiles[action]
  resolution.hasRevealed = true
  logEvent(state, seat, `${seatName(seat)} reveals ${titleCase(action)}${side === 'upgraded' ? ' (upgraded)' : ''} at strength ${resolution.slot}.`)
  pushTasks(
    state,
    { kind: 'startAction', seat, action, side, strength: resolution.slot },
    { kind: 'gavelOffer', seat },
  )
}

function decide(state: GameState, decision: Decision, seat: Seat): void {
  requireResolving(state)
  const task = topTask(state)
  if (task === null || !isDecisionTask(task)) throw new IllegalMoveError('Reveal your tile first')
  if (task.seat !== seat) throw new IllegalMoveError('It is not your decision')
  if (decision.kind !== task.kind) throw new IllegalMoveError(`The game is waiting for a ${task.kind} decision`)
  const pending = describeTask(state, task)
  if (pending === null) throw new Error(`Decision ${task.kind} was left waiting with nothing to choose`)
  getResolution(state).stack.pop()
  applyDecisionToTask(state, task, decision, pending)
}

/**
 * Applies a move to a copy of the state and returns it. The copy is private to this call, which
 * is why the rules below may update it in place.
 */
export function applyColonyMove(state: GameState, move: Move, seat: Seat): GameState {
  if (state.phase === 'over') throw new IllegalMoveError('The game is over')
  const next = structuredClone(state)
  switch (move.type) {
    case 'program':
      program(next, move.plan, seat)
      break
    case 'reveal':
      reveal(next, seat)
      break
    case 'decide':
      decide(next, move.decision, seat)
      break
  }
  settle(next)
  return next
}

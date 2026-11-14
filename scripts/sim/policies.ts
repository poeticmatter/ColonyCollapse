import { ACTION_IDS, type ActionId } from '../../src/game/art/actions'
import { chooseBotMove } from '../../src/game/bot'
import { hashState } from '../../src/game/bot/hash'
import { pendingDecision, type GameState, type Move, type Seat } from '../../src/game/rules'
import { chooseDecision, seededPick } from '../../src/game/rules/testing/bot'

/** How one seat picks its moves. Every policy is deterministic given the state, like the real bot. */
export type Policy = (state: GameState, seat: Seat) => Move

export const heuristic: Policy = chooseBotMove

/** A fresh seeded picker per move, so a random seat never depends on how often it was asked before. */
function pickFor(state: GameState, seat: Seat) {
  return seededPick(hashState(state, seat, 0x5eed))
}

function randomPlan(state: GameState, seat: Seat): ActionId[] {
  const pick = pickFor(state, seat)
  const remaining = [...ACTION_IDS]
  const plan: ActionId[] = []
  while (plan.length < 4) {
    const action = pick(remaining)
    remaining.splice(remaining.indexOf(action), 1)
    plan.push(action)
  }
  return plan
}

/** Random plans and random legal answers: the baseline the heuristic was tuned against. */
export const random: Policy = (state, seat) => {
  if (state.phase === 'programming') return { type: 'program', plan: randomPlan(state, seat) }
  const pending = pendingDecision(state)
  if (pending !== null && pending.actor === seat) return { type: 'decide', decision: chooseDecision(pending, pickFor(state, seat)) }
  return { type: 'reveal' }
}

/** The heuristic's decisions with random plans: what the planning heuristic is worth on its own. */
export const randomPlanner: Policy = (state, seat) =>
  state.phase === 'programming' ? { type: 'program', plan: randomPlan(state, seat) } : heuristic(state, seat)

/** The heuristic, but it never programs `banned`: the action goes back and its best unused rival takes the slot. */
export function banning(banned: ActionId): Policy {
  return (state, seat) => {
    const move = heuristic(state, seat)
    if (move.type !== 'program' || !move.plan.includes(banned)) return move
    const replacement = ACTION_IDS.find((action) => action !== banned && action !== 'intern' && !move.plan.includes(action))
    if (replacement === undefined) throw new Error('No action left to stand in for the banned one')
    return { type: 'program', plan: move.plan.map((action) => (action === banned ? replacement : action)) }
  }
}

/** The heuristic, but it keeps the start player marker (never passes it with Deferred Gavel, never gives it away). */
export const markerKeeper: Policy = (state, seat) => {
  const pending = pendingDecision(state)
  if (pending?.actor === seat && pending.kind === 'gavelPass') return { type: 'decide', decision: { kind: 'gavelPass', pass: false } }
  if (pending?.actor === seat && pending.kind === 'speakersFavor' && pending.options.includes(seat)) {
    return { type: 'decide', decision: { kind: 'speakersFavor', to: seat } }
  }
  return heuristic(state, seat)
}

/**
 * The heuristic, but `action` always goes in `slot` (0-based). If the plan has it elsewhere it moves
 * there and the tiles between shift along; if not, it replaces the tile in that slot.
 */
export function placing(action: ActionId, slot: number): Policy {
  return (state, seat) => {
    const move = heuristic(state, seat)
    if (move.type !== 'program') return move
    if (!move.plan.includes(action)) return { type: 'program', plan: move.plan.map((planned, index) => (index === slot ? action : planned)) }
    const others = move.plan.filter((planned) => planned !== action)
    return { type: 'program', plan: [...others.slice(0, slot), action, ...others.slice(slot)] }
  }
}

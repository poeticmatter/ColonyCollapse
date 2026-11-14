import { IllegalMoveError } from 'game-kit/turns'
import { colonyRules, pendingDecision, type Decision, type GameState, type PendingDecision, type Seat } from '../rules'
import { candidateDecisions, isSlotSetDecision, withSlots } from './candidates'
import { evaluateState } from './evaluate'
import { hashState } from './hash'
import { LOOKAHEAD_BREADTH, LOOKAHEAD_DEPTH } from './weights'

interface ScoredDecision {
  decision: Decision
  value: number
  /** The state the decision leads to. */
  next: GameState
}

const TIE_TOLERANCE = 1e-9

function simulate(state: GameState, decision: Decision, seat: Seat): GameState | null {
  try {
    return colonyRules.applyMove(state, { type: 'decide', decision }, seat)
  } catch (error) {
    if (error instanceof IllegalMoveError) return null
    throw error
  }
}

function scoreDecisions(state: GameState, decisions: Decision[], seat: Seat): ScoredDecision[] {
  return decisions.flatMap((decision) => {
    const next = simulate(state, decision, seat)
    return next === null ? [] : [{ decision, next, value: evaluateState(next, seat) }]
  })
}

/** Subsets of tiles are too many to list; also try flipping exactly the single flips that helped. */
function withImprovingUnion(scored: ScoredDecision[], pending: PendingDecision, state: GameState, seat: Seat): ScoredDecision[] {
  const slotSets = scored.flatMap((entry) => (isSlotSetDecision(entry.decision) ? [{ ...entry, decision: entry.decision }] : []))
  const baseline = slotSets.find((entry) => entry.decision.slots.length === 0)
  if (!baseline) return scored
  const maxSize = pending.kind === 'mediaFlip' ? pending.maxFlips : Infinity
  const improving = slotSets
    .filter((entry) => entry.decision.slots.length === 1 && entry.value > baseline.value)
    .sort((first, second) => second.value - first.value)
    .slice(0, maxSize)
    .map((entry) => entry.decision.slots[0])
  if (improving.length < 2) return scored
  return [...scored, ...scoreDecisions(state, [withSlots(baseline.decision, improving)], seat)]
}

function isStillMyDecision(next: GameState, seat: Seat): PendingDecision | null {
  const pending = pendingDecision(next)
  return pending !== null && pending.actor === seat ? pending : null
}

/**
 * Looks one more decision ahead for the most promising candidates: an effect that only plays
 * out through a follow-up choice (Dissident Rally, Dance's landing rally) is worth what that
 * choice makes of it, not what the state looks like before it.
 */
function refineByLookahead(scored: ScoredDecision[], seat: Seat, depth: number): ScoredDecision[] {
  if (depth <= 0) return scored
  const promising = new Set(
    [...scored].sort((first, second) => second.value - first.value).slice(0, LOOKAHEAD_BREADTH),
  )
  return scored.map((entry) => {
    const followUp = promising.has(entry) ? isStillMyDecision(entry.next, seat) : null
    if (followUp === null) return entry
    const best = bestScored(entry.next, followUp, seat, depth - 1)
    return best === null ? entry : { ...entry, value: best.value }
  })
}

function bestScored(state: GameState, pending: PendingDecision, seat: Seat, depth: number): ScoredDecision | null {
  const scored = scoreDecisions(state, candidateDecisions(pending), seat)
  const refined = refineByLookahead(withImprovingUnion(scored, pending, state, seat), seat, depth)
  return pickBest(refined, state, seat)
}

function pickBest(scored: ScoredDecision[], state: GameState, seat: Seat): ScoredDecision | null {
  if (scored.length === 0) return null
  const topValue = Math.max(...scored.map((entry) => entry.value))
  const ties = scored.filter((entry) => entry.value >= topValue - TIE_TOLERANCE)
  return ties[hashState(state, seat) % ties.length]
}

/**
 * Passing the start player marker, or giving it away, makes the bot the last to act in each
 * slot: last mover sees every rival's rally before answering it.
 */
function seatAfter(state: GameState, seat: Seat): Seat {
  return (seat + 1) % state.playerCount
}

function chooseByRule(state: GameState, pending: PendingDecision, seat: Seat): Decision | null {
  if (pending.kind === 'gavelPass') return { kind: 'gavelPass', pass: true }
  if (pending.kind !== 'speakersFavor') return null
  const preferred = seatAfter(state, seat)
  return { kind: 'speakersFavor', to: pending.options.includes(preferred) ? preferred : pending.options[0] }
}

/** Always legal: when nothing simulates, the first listed option of the decision is used. */
function firstLegalDecision(state: GameState, pending: PendingDecision, seat: Seat): Decision {
  const fallback = candidateDecisions(pending).find((decision) => simulate(state, decision, seat) !== null)
  if (!fallback) throw new Error(`No legal answer for the ${pending.kind} decision`)
  return fallback
}

export function chooseDecisionFor(state: GameState, pending: PendingDecision, seat: Seat): Decision {
  const ruled = chooseByRule(state, pending, seat)
  if (ruled !== null) return ruled
  const best = bestScored(state, pending, seat, LOOKAHEAD_DEPTH)
  return best?.decision ?? firstLegalDecision(state, pending, seat)
}

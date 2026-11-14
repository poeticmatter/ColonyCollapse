import { ACTION_IDS, type ActionId } from '../../art/actions'
import { cardById } from '../../data/cards'
import type { Decision, PendingDecision } from '../decisions'
import { colonyRules, pendingDecision } from '../index'
import type { GameState, Move } from '../types'

export type Pick = <T>(items: readonly T[]) => T

export const pickFirst: Pick = (items) => items[0]

/** A small deterministic generator so bot games are reproducible and varied. */
export function seededPick(seed: number): Pick {
  let state = seed >>> 0
  return (items) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return items[state % items.length]
  }
}

/** Always sends a legal answer: picks among the options the pending decision lists. */
export function chooseDecision(pending: PendingDecision, pick: Pick): Decision {
  switch (pending.kind) {
    case 'rondelMove':
      return { kind: 'rondelMove', steps: pick(pending.options).steps }
    case 'crossPartyFlip':
      return { kind: 'crossPartyFlip', flip: pick([true, false]) }
    case 'developExtraRally':
      return { kind: 'developExtraRally', slot: pick([null, ...pending.options]) }
    case 'sitePrepFlip':
      return { kind: 'sitePrepFlip', slots: pick([[], pending.options]) }
    case 'mediaFlip':
      return { kind: 'mediaFlip', slots: pick([[], pending.options.slice(0, pending.maxFlips)]) }
    case 'pressCycleRally':
      return { kind: 'pressCycleRally', slot: pick([null, ...pending.options]) }
    case 'leveragePick': {
      const cardId = pick(pending.cardIds)
      const ups = pending.canSwap ? [...cardById(cardId).issues, 'swap' as const] : [...cardById(cardId).issues]
      const mode = pick(pending.canDoBoth ? ['effect', 'up', 'both'] : ['effect', 'up'])
      return {
        kind: 'leveragePick',
        cardId,
        playEffect: mode !== 'up',
        up: mode === 'effect' ? null : pick(ups),
      }
    }
    case 'dance': {
      const pawn = pick(pending.pawns)
      return { kind: 'dance', pawnId: pawn.pawnId, to: pick(pawn.destinations).cell }
    }
    case 'waggleSweep':
      return { kind: 'waggleSweep', cell: pick([null, ...pending.options]) }
    case 'invest': {
      const source = pick(pending.sources.filter((candidate) => candidate.to.length > 0))
      const transfer = { from: source.from, to: pick(source.to), amount: pending.maxAmount }
      return { kind: 'invest', transfer: pick([null, transfer]) }
    }
    case 'combOverturn':
      return { kind: 'combOverturn', slots: pick([[], pending.options]) }
    case 'longFlight': {
      const pawn = pick(pending.pawns)
      return { kind: 'longFlight', pawnId: pawn.pawnId, to: pick(pawn.destinations) }
    }
    case 'longFlightRally':
      return { kind: 'longFlightRally', cell: pick([null, ...pending.options]) }
    case 'dissidentRally':
      return { kind: 'dissidentRally', site: pick(pending.options) }
    case 'speakersFavor':
      return { kind: 'speakersFavor', to: pick(pending.options) }
    case 'wardSweep':
      return { kind: 'wardSweep', district: pick(pending.options) }
    case 'blueprintRevision':
      return { kind: 'blueprintRevision', action: pick(pending.options) }
    case 'reserveDeployment':
      return { kind: 'reserveDeployment', action: pick(pending.options) }
    case 'forcedDown':
      return { kind: 'forcedDown', target: pick(pending.targets), issue: pick(pending.issues) }
    case 'forcedUp':
      return { kind: 'forcedUp', issue: pick(pending.options) }
    case 'gavelPass':
      return { kind: 'gavelPass', pass: pick([true, false]) }
  }
}

function randomPlan(pick: Pick): ActionId[] {
  const remaining = [...ACTION_IDS]
  const plan: ActionId[] = []
  while (plan.length < 4) {
    const action = pick(remaining)
    remaining.splice(remaining.indexOf(action), 1)
    plan.push(action)
  }
  return plan
}

/** The move the bot would send next, and the seat sending it. */
export function nextBotMove(state: GameState, pick: Pick): { seat: number; move: Move } {
  const seat = colonyRules.activePlayer(state)
  if (seat === null) throw new Error('The game is over')
  if (state.phase === 'programming') return { seat, move: { type: 'program', plan: randomPlan(pick) } }
  const pending = pendingDecision(state)
  if (pending === null) return { seat, move: { type: 'reveal' } }
  return { seat: pending.actor, move: { type: 'decide', decision: chooseDecision(pending, pick) } }
}

export interface BotGameResult {
  state: GameState
  moveCount: number
  decisionKinds: Set<string>
}

const MAX_BOT_MOVES = 20_000

/** Plays a whole game, calling `afterMove` with each new state. */
export function playBotGame(
  playerCount: number,
  seed: number,
  pick: Pick,
  afterMove?: (state: GameState) => void,
): BotGameResult {
  let state = colonyRules.createInitialState({ settings: {}, playerCount, seed })
  const decisionKinds = new Set<string>()
  let moveCount = 0
  while (state.phase !== 'over') {
    if (moveCount > MAX_BOT_MOVES) throw new Error(`Game did not end (players ${playerCount}, seed ${seed})`)
    const { seat, move } = nextBotMove(state, pick)
    if (move.type === 'decide') decisionKinds.add(move.decision.kind)
    state = colonyRules.applyMove(state, move, seat)
    moveCount += 1
    afterMove?.(state)
  }
  return { state, moveCount, decisionKinds }
}

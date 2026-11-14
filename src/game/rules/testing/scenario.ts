import { ACTION_IDS, type ActionId } from '../../art/actions'
import { ISSUES } from '../../board/palette'
import { CARDS, type AbilityId } from '../../data/cards'
import { colonyRules, pendingDecision } from '../index'
import type { Decision, PendingDecision } from '../decisions'
import type { GameState, HexTile, Move, Seat, SlotNumber } from '../types'

export function cardIdOf(ability: AbilityId, copy = 0): number {
  const card = CARDS.filter((candidate) => candidate.ability === ability)[copy]
  if (!card) throw new Error(`No ${ability} card`)
  return card.id
}

/** A copy of `state` after `mutate` changed it, for building a situation by hand. */
export function edit(state: GameState, mutate: (draft: GameState) => void): GameState {
  const copy = structuredClone(state)
  mutate(copy)
  return copy
}

export function newGame(playerCount = 3, seed = 1): GameState {
  return colonyRules.createInitialState({ settings: {}, playerCount, seed })
}

export function activeSeat(state: GameState): Seat {
  const seat = colonyRules.activePlayer(state)
  if (seat === null) throw new Error('Nobody is to move')
  return seat
}

export function send(state: GameState, move: Move, seat: Seat = activeSeat(state)): GameState {
  return colonyRules.applyMove(state, move, seat)
}

export function reveal(state: GameState): GameState {
  return send(state, { type: 'reveal' })
}

/** Answers the pending decision on behalf of whoever must answer it. */
export function decide(state: GameState, decision: Decision): GameState {
  const pending = pendingDecision(state)
  if (!pending) throw new Error('No decision is pending')
  return send(state, { type: 'decide', decision }, pending.actor)
}

export function rondelTile(state: GameState, slot: number): HexTile {
  const tile = state.rondel[slot]
  if (!tile) throw new Error(`No rondel tile in slot ${slot}`)
  return tile
}

/** A plan with `action` in `slot` and the other actions filling the remaining slots. */
export function planWith(slot: SlotNumber, action: ActionId): ActionId[] {
  const others = ACTION_IDS.filter((candidate) => candidate !== action)
  return ([1, 2, 3, 4] as const).map((position) => (position === slot ? action : others[position - (position > slot ? 2 : 1)]))
}

const FILLER_PLAN: ActionId[] = ['invest', 'media', 'dance', 'intern']

export interface ScenarioOptions {
  playerCount?: number
  /** Seat holding the start player marker when the slot order is fixed; defaults to 0. */
  startPlayer?: Seat
  /** Resolve this slot first (earlier slots are skipped), so strength is the slot number. */
  slot?: SlotNumber
  plans?: Partial<Record<Seat, ActionId[]>>
  /** The card on top of the deck, drawn by the next Leverage. */
  topCard?: AbilityId
  /** Ongoing cards already in front of each seat. */
  ongoing?: Partial<Record<Seat, AbilityId[]>>
  /** Changes the neutral starting position further. */
  setup?: (draft: GameState) => void
}

/** Gives a game a known shape: seat 0 starts, all tracks at 0, tile n shows issue n, nothing controlled. */
function neutralize(draft: GameState, startPlayer: Seat): void {
  draft.startPlayer = startPlayer
  for (const issue of ISSUES) draft.track[issue] = draft.players.map(() => 0)
  ISSUES.forEach((issue, index) => {
    draft.trackAction[issue] = ACTION_IDS[index]
  })
  draft.setAsideAction = ACTION_IDS[ISSUES.length]
  draft.rondel = draft.rondel.map((tile, slot) =>
    tile ? { ...tile, faces: [ISSUES[slot], ISSUES[(slot + 1) % ISSUES.length]], side: 0, disc: null } : null,
  )
  draft.rondelPawn = 0
  draft.deck = CARDS.map((card) => card.id)
  draft.discard = []
}

/**
 * A game in the resolving phase, about to reveal `slot`'s tiles with seat 0 first. Seats without
 * a plan in `options.plans` get a harmless filler plan.
 */
export function scenario(options: ScenarioOptions = {}): GameState {
  const { playerCount = 3, startPlayer = 0, slot = 1, plans = {}, topCard, ongoing = {}, setup } = options
  let state = newGame(playerCount)
  state = edit(state, (draft) => neutralize(draft, startPlayer))
  for (let seat = 0; seat < playerCount; seat += 1) {
    state = send(state, { type: 'program', plan: plans[seat] ?? FILLER_PLAN }, seat)
  }
  return edit(state, (draft) => {
    if (draft.resolution) draft.resolution.slot = slot
    if (topCard) {
      const cardId = cardIdOf(topCard)
      draft.deck = [cardId, ...draft.deck.filter((id) => id !== cardId)]
    }
    for (const [seat, abilities] of Object.entries(ongoing)) {
      draft.players[Number(seat)].ongoing = (abilities ?? []).map((ability) => cardIdOf(ability))
      draft.deck = draft.deck.filter((id) => !draft.players[Number(seat)].ongoing.includes(id))
    }
    setup?.(draft)
  })
}

/** The pending decision, which must be of the given kind. */
export function expectPending<K extends PendingDecision['kind']>(
  state: GameState,
  kind: K,
): Extract<PendingDecision, { kind: K }> {
  const pending = pendingDecision(state)
  if (pending?.kind !== kind) throw new Error(`Expected a ${kind} decision, got ${pending?.kind ?? 'none'}`)
  // The kind was just checked, but TypeScript cannot narrow a union by a generic discriminant.
  return pending as Extract<PendingDecision, { kind: K }>
}

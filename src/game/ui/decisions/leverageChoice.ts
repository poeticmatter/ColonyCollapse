import type { Issue } from '../../board/palette'
import { cardById } from '../../data/cards'
import type { Decision } from '../../rules'
import type { PendingOf } from '../../rules/tasks'

/** What the player has picked so far for Leverage: a card, whether to use its effect, and an issue to go up on. */
export interface LeverageChoice {
  cardId: number | null
  playEffect: boolean
  up: Issue | 'swap' | null
}

export const NO_LEVERAGE_CHOICE: LeverageChoice = { cardId: null, playEffect: true, up: null }

type LeveragePending = PendingOf<'leveragePick'>

/** Picks a card; the usual play, using its effect, is the starting point. */
export function pickCard(cardId: number): LeverageChoice {
  return { cardId, playEffect: true, up: null }
}

/** Turning the effect on drops the "go up" unless upgraded Leverage allows both. */
export function setPlayEffect(choice: LeverageChoice, playEffect: boolean, canDoBoth: boolean): LeverageChoice {
  if (playEffect && !canDoBoth) return { ...choice, playEffect, up: null }
  return { ...choice, playEffect }
}

/** Going up drops the effect unless upgraded Leverage allows both. */
export function setUp(choice: LeverageChoice, up: Issue | 'swap' | null, canDoBoth: boolean): LeverageChoice {
  if (up !== null && !canDoBoth) return { ...choice, up, playEffect: false }
  return { ...choice, up }
}

/** The "go up" options for the chosen card: its two issues, and a swap where Policy Trade allows it. */
export function upOptions(choice: LeverageChoice, pending: LeveragePending): (Issue | 'swap')[] {
  if (choice.cardId === null) return []
  const card = cardById(choice.cardId)
  const isSwapAllowed = pending.canSwap || (pending.canDoBoth && choice.playEffect && card.ability === 'policyTrade')
  return isSwapAllowed ? [...card.issues, 'swap'] : [...card.issues]
}

/** Mirrors the rules: a drawn card, and either effect or up (or, with upgraded Leverage, either or both). */
export function isLeverageChoiceValid(choice: LeverageChoice, pending: LeveragePending): boolean {
  if (choice.cardId === null || !pending.cardIds.includes(choice.cardId)) return false
  const goesUp = choice.up !== null
  const isPlayValid = pending.canDoBoth ? choice.playEffect || goesUp : choice.playEffect !== goesUp
  return isPlayValid && (choice.up === null || upOptions(choice, pending).includes(choice.up))
}

export function toLeverageDecision(choice: LeverageChoice): Decision | null {
  if (choice.cardId === null) return null
  return { kind: 'leveragePick', cardId: choice.cardId, playEffect: choice.playEffect, up: choice.up }
}

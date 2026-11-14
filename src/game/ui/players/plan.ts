import type { ActionId } from '../../art/actions'
import { PLAN_LENGTH } from '../../rules/constants'

/** A plan being built: one entry per slot, null while empty. */
export type PlanDraft = readonly (ActionId | null)[]

export const EMPTY_PLAN_DRAFT: PlanDraft = Array.from({ length: PLAN_LENGTH }, () => null)

/** The 0-based slot an action is placed in, or -1 when it isn't in the draft. */
export function slotOfAction(draft: PlanDraft, action: ActionId): number {
  return draft.indexOf(action)
}

/** Puts `action` in the first empty slot. Does nothing if the plan is full or the action is already in it. */
export function placeInNextEmptySlot(draft: PlanDraft, action: ActionId): PlanDraft {
  const emptyIndex = draft.indexOf(null)
  if (emptyIndex === -1 || draft.includes(action)) return draft
  return draft.map((entry, index) => (index === emptyIndex ? action : entry))
}

export function clearSlot(draft: PlanDraft, index: number): PlanDraft {
  return draft.map((entry, position) => (position === index ? null : entry))
}

/** Picking an action that is already placed takes it back out; otherwise it fills the next empty slot. */
export function toggleAction(draft: PlanDraft, action: ActionId): PlanDraft {
  const index = slotOfAction(draft, action)
  return index === -1 ? placeInNextEmptySlot(draft, action) : clearSlot(draft, index)
}

/** The plan to send, or null until every slot is filled. */
export function toPlan(draft: PlanDraft): ActionId[] | null {
  const plan = draft.filter((entry): entry is ActionId => entry !== null)
  return plan.length === PLAN_LENGTH ? plan : null
}

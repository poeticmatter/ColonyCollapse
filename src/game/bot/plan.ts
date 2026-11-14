import { ACTION_IDS, type ActionId } from '../art/actions'
import type { GameState, Seat, SlotNumber } from '../rules'
import { PLAN_LENGTH, SLOT_NUMBERS } from '../rules/constants'
import { hashFraction } from './hash'
import { UPGRADED_TILE_VALUE } from './weights'

/** What an action is worth at slot strength 1: `base`, plus `perStrength` for each further point. */
interface ActionWorth {
  base: number
  perStrength: number
}

/** Strength-hungry actions (Dance, Leverage, Develop) belong late; Media is cheap and goes early. */
const ACTION_WORTH: Readonly<Record<ActionId, ActionWorth>> = {
  address: { base: 2.2, perStrength: 0.3 },
  develop: { base: 1.8, perStrength: 0.7 },
  media: { base: 1.6, perStrength: -0.25 },
  leverage: { base: 1.0, perStrength: 0.7 },
  dance: { base: 0.2, perStrength: 1.0 },
  intern: { base: -0.4, perStrength: 0 },
  invest: { base: 1.2, perStrength: 0.4 },
}

/** Intern only copies something worthwhile when the slot before it holds a real action. */
const INTERN_COPY_BONUS = 1.6
const INTERN_IN_FIRST_SLOT_PENALTY = 10
const INTERN_COPYABLE: readonly ActionId[] = ['address', 'develop', 'leverage', 'dance', 'invest']
/** Keeps equally good plans from always being the same, without overriding a real preference. */
const PLAN_JITTER = 0.35

function actionWorth(action: ActionId, slot: SlotNumber, side: 'basic' | 'upgraded'): number {
  const { base, perStrength } = ACTION_WORTH[action]
  const upgradeBonus = side === 'upgraded' ? UPGRADED_TILE_VALUE[action] : 0
  return base + perStrength * (slot - 1) + upgradeBonus
}

function internBonus(plan: readonly ActionId[], slotIndex: number): number {
  if (plan[slotIndex] !== 'intern') return 0
  if (slotIndex === 0) return -INTERN_IN_FIRST_SLOT_PENALTY
  return INTERN_COPYABLE.includes(plan[slotIndex - 1]) ? INTERN_COPY_BONUS : 0
}

function* orderedPlans(available: readonly ActionId[], prefix: ActionId[] = []): Generator<ActionId[]> {
  if (prefix.length === PLAN_LENGTH) {
    yield prefix
    return
  }
  for (const action of available) {
    if (!prefix.includes(action)) yield* orderedPlans(available, [...prefix, action])
  }
}

function scorePlan(state: GameState, seat: Seat, plan: readonly ActionId[]): number {
  const { tiles } = state.players[seat]
  return plan.reduce((total, action, slotIndex) => {
    const slot = SLOT_NUMBERS[slotIndex]
    const jitter = PLAN_JITTER * hashFraction(state, seat, ACTION_IDS.indexOf(action) * PLAN_LENGTH + slotIndex)
    return total + actionWorth(action, slot, tiles[action]) + internBonus(plan, slotIndex) + jitter
  }, 0)
}

/** The best ordering of four of the seat's seven tiles, judged without knowing what rivals will play. */
export function choosePlan(state: GameState, seat: Seat): ActionId[] {
  let bestPlan: ActionId[] = []
  let bestScore = -Infinity
  for (const plan of orderedPlans(ACTION_IDS)) {
    const score = scorePlan(state, seat, plan)
    if (score > bestScore) {
      bestScore = score
      bestPlan = plan
    }
  }
  return bestPlan
}

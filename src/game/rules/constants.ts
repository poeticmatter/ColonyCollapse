import type { Round } from '../board/geometry'
import type { SlotNumber } from './types'

export const PLAN_LENGTH = 4
export const SLOT_NUMBERS: readonly SlotNumber[] = [1, 2, 3, 4]
export const FINAL_ROUND: Round = 5

/** Reserve Deployment resolves a tile at this strength whatever slot it is played in. */
export const RESERVE_STRENGTH = 3
export const INTERN_STRENGTH = 1
export const EXTRA_HANDS_INTERN_STRENGTH = 2

/** The track position Waggle Sweep pretends to hold. */
export const WAGGLE_SWEEP_POSITION = 4

export const LOG_LIMIT = 50

/** Guards `settle` against a task that keeps re-adding itself. */
export const MAX_SETTLE_STEPS = 10_000

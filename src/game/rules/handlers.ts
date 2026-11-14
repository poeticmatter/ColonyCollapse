import type { Decision, DecisionKind } from './decisions'
import type { AutoTask, AutoTaskOf, PendingOf, TaskOf } from './tasks'
import type { GameState } from './types'

/** How one kind of decision task is shown (`describe`) and answered (`apply`). */
export interface DecisionHandler<K extends DecisionKind> {
  /** The choice to put to the player, or null when there is nothing to choose and the task is skipped. */
  describe(state: GameState, task: TaskOf<K>): PendingOf<K> | null
  /** Applies an answer of the same kind, which was already checked to match; throws IllegalMoveError if it is not among the options. */
  apply(state: GameState, task: TaskOf<K>, decision: Extract<Decision, { kind: K }>, pending: PendingOf<K>): void
}

export type DecisionHandlers = { [K in DecisionKind]: DecisionHandler<K> }

/** How one kind of automatic task runs. */
export type AutoHandler<K extends AutoTask['kind']> = (state: GameState, task: AutoTaskOf<K>) => void

export type AutoHandlers = { [K in AutoTask['kind']]: AutoHandler<K> }

import type { Task } from './tasks'
import type { GameState, ResolutionState } from './types'

export function getResolution(state: GameState): ResolutionState {
  if (!state.resolution) throw new Error('No action is being resolved')
  return state.resolution
}

/** Queues tasks so that the first listed runs first, ahead of anything already waiting. */
export function pushTasks(state: GameState, ...tasks: Task[]): void {
  getResolution(state).stack.push(...[...tasks].reverse())
}

export function topTask(state: GameState): Task | null {
  const stack = state.resolution?.stack
  return stack && stack.length > 0 ? stack[stack.length - 1] : null
}

import { pendingDecision, type GameState, type Move, type Seat } from '../rules'
import { chooseDecisionFor } from './choose'
import { choosePlan } from './plan'

/**
 * The computer opponent's next move for `seat`, which must be one of the seats the game is
 * waiting for. A pure function of the state and the seat, so every client agrees on it, and it
 * reads only what the seat can see (its own plan, never a rival's hidden one).
 */
export function chooseBotMove(state: GameState, seat: Seat): Move {
  if (state.phase === 'programming') return { type: 'program', plan: choosePlan(state, seat) }
  const pending = pendingDecision(state)
  if (pending !== null && pending.actor === seat) {
    return { type: 'decide', decision: chooseDecisionFor(state, pending, seat) }
  }
  return { type: 'reveal' }
}

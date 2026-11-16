import { finalRanking } from '../rules'
import type { GameState, Seat } from '../rules'

type Viewer = Seat | 'spectator'

function pointsText(points: number): string {
  return `${points} action ${points === 1 ? 'point' : 'points'} left`
}

/** The one-line "what now?" for this viewer. */
export function statusPrompt(state: GameState, viewer: Viewer, nameOf: (seat: Seat) => string): string {
  if (state.phase === 'over') return `Game over — ${nameOf(finalRanking(state)[0])} wins`
  const { seat, actionPoints } = state.turn
  if (seat === viewer) return `Your turn: ${pointsText(actionPoints)}`
  return `${nameOf(seat)}'s turn: ${pointsText(actionPoints)}`
}

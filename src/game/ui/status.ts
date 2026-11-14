import { ACTIONS } from '../art/actions'
import { currentTurn, finalRanking, pendingDecision, visiblePlanSlot } from '../rules'
import type { GameState, Seat } from '../rules'
import { DECISION_LABELS } from './decisions/labels'
import { joinNames } from './seating'

type Viewer = Seat | 'spectator'

/** The one-line "what now?" for this viewer. */
export function statusPrompt(state: GameState, viewer: Viewer, nameOf: (seat: Seat) => string): string {
  const turn = currentTurn(state)
  if (turn.phase === 'over') return `Game over — ${nameOf(finalRanking(state)[0])} wins`
  if (turn.phase === 'programming') return programmingPrompt(state, viewer, nameOf)
  return resolvingPrompt(state, viewer, nameOf)
}

function programmingPrompt(state: GameState, viewer: Viewer, nameOf: (seat: Seat) => string): string {
  const { seatsToProgram } = currentTurn(state)
  if (viewer !== 'spectator' && seatsToProgram.includes(viewer)) return 'Program your 4 actions'
  const waitingFor = joinNames(seatsToProgram.map(nameOf))
  return viewer === 'spectator' ? `Waiting for ${waitingFor} to program` : `Plan sent. Waiting for ${waitingFor} to program`
}

function resolvingPrompt(state: GameState, viewer: Viewer, nameOf: (seat: Seat) => string): string {
  const turn = currentTurn(state)
  const pending = pendingDecision(state)
  if (pending) {
    const label = DECISION_LABELS[pending.kind]
    return pending.actor === viewer ? `Your decision: ${label.forActor}` : `${nameOf(pending.actor)} is ${label.forOthers}`
  }
  const { turnSeat, slot, strength } = turn
  if (turnSeat === null || slot === null) return ''
  if (turnSeat !== viewer) return `Waiting for ${nameOf(turnSeat)} to reveal slot ${slot}`
  const action = visiblePlanSlot(state, turnSeat, slot, viewer)
  if (action === null) return `Your action: reveal slot ${slot}`
  const side = state.players[turnSeat].tiles[action]
  const upgraded = side === 'upgraded' ? ', upgraded' : ''
  return `Your action: reveal slot ${slot} (${ACTIONS[action].name}${upgraded}, strength ${strength})`
}

import { HUB_CELL_KEY } from '../../board/geometry'
import { ABILITIES, cardById, type AbilityId } from '../../data/cards'
import type { AutoHandler, DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { findOngoingCard, holdsOngoing } from '../ongoing'
import { adjustPosition, getPosition, setPosition } from '../positions'
import { pushTasks } from '../stack'
import type { Task } from '../tasks'
import type { GameState, Seat } from '../types'
import { seatName } from '../util'

/** The decisions an Immediate card's effect needs, in order. Ongoing abilities have no effect to resolve. */
function effectTasksFor(ability: AbilityId, seat: Seat): Task[] {
  switch (ability) {
    case 'combOverturn':
    case 'longFlight':
    case 'dissidentRally':
    case 'speakersFavor':
    case 'wardSweep':
    case 'blueprintRevision':
    case 'reserveDeployment':
      return [{ kind: ability, seat }]
    case 'forcedRealignment':
      return [{ kind: 'forcedDown', seat }]
    case 'secondDancer':
      return [{ kind: 'addPawn', seat }]
    default:
      return []
  }
}

/** Plays a card's effect: Ongoing cards go in front of the player; Immediate ones resolve, twice with Echoing Decree. */
export const playCard: AutoHandler<'playCard'> = (state, task) => {
  const card = cardById(task.cardId)
  const ability = ABILITIES[card.ability]
  logEvent(state, task.seat, `${seatName(task.seat)} plays ${ability.title}.`)
  if (ability.type === 'Ongoing') {
    state.players[task.seat].ongoing.push(card.id)
    return
  }
  state.discard.push(card.id)
  const effect = effectTasksFor(card.ability, task.seat)
  const echoId = findOngoingCard(state, task.seat, 'echoingDecree')
  if (echoId === null) {
    pushTasks(state, ...effect)
    return
  }
  const player = state.players[task.seat]
  player.ongoing = player.ongoing.filter((cardId) => cardId !== echoId)
  state.discard.push(echoId)
  logEvent(state, task.seat, `Echoing Decree resolves ${ability.title} a second time, then is discarded.`)
  pushTasks(state, ...effect, ...effect.map((repeat) => ({ ...repeat })))
}

export const adjustTrack: AutoHandler<'adjustTrack'> = (state, task) => {
  adjustPosition(state, task.seat, task.issue, task.delta)
  const direction = task.delta > 0 ? 'up' : 'down'
  logEvent(state, task.seat, `${seatName(task.seat)} goes ${direction} on ${task.issue}.`)
}

export const swapTracks: AutoHandler<'swapTracks'> = (state, task) => {
  const firstPosition = getPosition(state, task.seat, task.first)
  const secondPosition = getPosition(state, task.seat, task.second)
  setPosition(state, task.seat, task.first, secondPosition)
  setPosition(state, task.seat, task.second, firstPosition)
  logEvent(state, task.seat, `${seatName(task.seat)} swaps their ${task.first} and ${task.second} positions.`)
}

export const addPawn: AutoHandler<'addPawn'> = (state, task) => {
  const nextId = Math.max(...state.pawns.map((pawn) => pawn.id)) + 1
  state.pawns.push({ id: nextId, seat: task.seat, cell: HUB_CELL_KEY, hasLeftHub: false })
  logEvent(state, task.seat, `${seatName(task.seat)} adds a pawn to the hub.`)
}

/** At the end of the player's action, offers Deferred Gavel if they hold the start player marker. */
export const gavelOffer: AutoHandler<'gavelOffer'> = (state, task) => {
  if (state.startPlayer !== task.seat || !holdsOngoing(state, task.seat, 'deferredGavel')) return
  pushTasks(state, { kind: 'gavelPass', seat: task.seat })
}

export const gavelPassHandler: DecisionHandler<'gavelPass'> = {
  describe: (state: GameState, task) => ({
    kind: 'gavelPass',
    actor: task.seat,
    to: (task.seat + 1) % state.playerCount,
  }),

  apply(state, task, decision, pending) {
    if (!decision.pass) return
    state.startPlayer = pending.to
    logEvent(state, task.seat, `${seatName(task.seat)} passes the start player marker to ${seatName(pending.to)}.`)
  },
}

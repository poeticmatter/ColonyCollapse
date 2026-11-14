import { IllegalMoveError } from 'game-kit/turns'
import { getNeighbourKeys, type CellKey } from '../../board/geometry'
import type { DancePawnOption, LongFlightPawnOption } from '../decisions'
import type { DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { holdsOngoing } from '../ongoing'
import { danceReach, getPawn, longFlightDestinations, movePawn, pawnsOf } from '../pawns'
import { rallySite } from '../rally'
import { cellSite, rallyTargetsAround, readSite } from '../sites'
import { pushTasks } from '../stack'
import type { Task } from '../tasks'
import type { GameState, Pawn, Seat } from '../types'
import { assertOneOf } from './validation'
import { seatName } from '../util'

function ownPawn(state: GameState, seat: Seat, pawnId: number): Pawn {
  const pawn = getPawn(state, pawnId)
  if (!pawn || pawn.seat !== seat) throw new IllegalMoveError('Move one of your own pawns')
  return pawn
}

function rallyTasks(seat: Seat, targets: CellKey[], canTie: boolean, waggleCell: CellKey | null): Task[] {
  return targets.map((cell) => ({
    kind: 'rally',
    seat,
    site: cellSite(cell),
    canTie,
    countsAsFour: cell === waggleCell,
  }))
}

export const danceHandler: DecisionHandler<'dance'> = {
  describe(state, task) {
    const pawns: DancePawnOption[] = pawnsOf(state, task.seat)
      .map((pawn) => ({
        pawnId: pawn.id,
        from: pawn.cell,
        destinations: [...danceReach(state, pawn, task.strength)].map(([cell, steps]) => ({
          cell,
          steps,
          rallies: rallyTargetsAround(state, cell),
        })),
      }))
      .filter((option) => option.destinations.length > 0)
    if (pawns.length === 0) return null
    return { kind: 'dance', actor: task.seat, canTie: task.side === 'upgraded', pawns }
  },

  apply(state, task, decision, pending) {
    const option = pending.pawns.find((candidate) => candidate.pawnId === decision.pawnId)
    const destination = option?.destinations.find((candidate) => candidate.cell === decision.to)
    if (!option || !destination) throw new IllegalMoveError('That pawn cannot dance there')
    movePawn(ownPawn(state, task.seat, decision.pawnId), destination.cell)
    logEvent(state, task.seat, `${seatName(task.seat)} dances ${destination.steps} step(s) to ${destination.cell}.`)
    if (holdsOngoing(state, task.seat, 'waggleSweep') && destination.rallies.length > 0) {
      pushTasks(state, { kind: 'waggleSweep', seat: task.seat, targets: destination.rallies, canTie: pending.canTie })
      return
    }
    pushTasks(state, ...rallyTasks(task.seat, destination.rallies, pending.canTie, null))
  },
}

export const waggleSweepHandler: DecisionHandler<'waggleSweep'> = {
  describe: (_state, task) => ({ kind: 'waggleSweep', actor: task.seat, options: task.targets }),

  apply(state, task, decision, pending) {
    if (decision.cell !== null) assertOneOf(decision.cell, pending.options, 'Waggle Sweep applies to a hex the dance rallies')
    pushTasks(state, ...rallyTasks(task.seat, task.targets, task.canTie, decision.cell))
  },
}

export const longFlightHandler: DecisionHandler<'longFlight'> = {
  describe(state, task) {
    const pawns: LongFlightPawnOption[] = pawnsOf(state, task.seat)
      .map((pawn) => ({ pawnId: pawn.id, from: pawn.cell, destinations: longFlightDestinations(state, pawn) }))
      .filter((option) => option.destinations.length > 0)
    return pawns.length === 0 ? null : { kind: 'longFlight', actor: task.seat, pawns }
  },

  apply(state, task, decision, pending) {
    const option = pending.pawns.find((candidate) => candidate.pawnId === decision.pawnId)
    if (!option || !option.destinations.includes(decision.to)) throw new IllegalMoveError('That pawn cannot fly there')
    movePawn(ownPawn(state, task.seat, decision.pawnId), decision.to)
    logEvent(state, task.seat, `${seatName(task.seat)} flies a pawn to ${decision.to}.`)
    pushTasks(state, { kind: 'longFlightRally', seat: task.seat, landing: decision.to })
  },
}

export const longFlightRallyHandler: DecisionHandler<'longFlightRally'> = {
  describe(state, task) {
    const options = getNeighbourKeys(task.landing).filter((cell) => readSite(state, cellSite(cell)) !== null)
    return options.length === 0 ? null : { kind: 'longFlightRally', actor: task.seat, options }
  },

  apply(state, task, decision, pending) {
    if (decision.cell === null) return
    assertOneOf(decision.cell, pending.options, 'Rally a hex next to where the pawn landed')
    rallySite(state, task.seat, cellSite(decision.cell), { canTie: false, countsAsFour: false })
  },
}

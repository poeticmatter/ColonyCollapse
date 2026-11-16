import { IllegalMoveError } from 'game-kit/turns'
import { getCellInfo, HUB_CELL_KEY, type CellKey } from '../board/geometry'
import type { Issue } from '../board/palette'
import { TRACK_MAX, TRACK_MIN } from '../board/track'
import { payDialStep } from './flow'
import { logEvent } from './log'
import { movePawn, pawnOf, pawnSteps } from './pawns'
import { adjustPosition, areAdjacentIssues, getPosition } from './positions'
import { canTakeSite, rallySite } from './rally'
import { cellSite, flipTile, rallyTargetsAround, rondelSite, tileIssue } from './sites'
import type { ActionMove, GameState, HexTile, Seat } from './types'
import { seatName } from './util'

/** The tile the dial points at. Always present while a turn is being played. */
export function dialTile(state: GameState): HexTile {
  const tile = state.rondel[state.dial]
  if (!tile) throw new Error(`The rondel has no tile in slot ${state.dial + 1}`)
  return tile
}

/** The hexes rallying around the pawn would take for `seat`; empty while the pawn is in the hub. */
export function rallyAroundGains(state: GameState, seat: Seat): CellKey[] {
  const pawn = pawnOf(state, seat)
  if (pawn.cell === HUB_CELL_KEY) return []
  return rallyTargetsAround(state, pawn.cell).filter((cell) => canTakeSite(state, seat, cellSite(cell)))
}

function turnDial(state: GameState, seat: Seat): void {
  logEvent(state, seat, `${seatName(seat)} turns the dial.`)
  payDialStep(state)
}

function stepPawn(state: GameState, seat: Seat, to: CellKey): void {
  const pawn = pawnOf(state, seat)
  if (!pawnSteps(state, pawn).includes(to)) throw new IllegalMoveError('Your pawn can only step to a free adjacent hex')
  movePawn(pawn, to)
  const info = getCellInfo(to)
  logEvent(state, seat, `${seatName(seat)} moves their pawn into the ${info.kind === 'hub' ? 'hub' : `${info.district} district`}.`)
}

function rallyDialTile(state: GameState, seat: Seat): void {
  const site = rondelSite(state.dial)
  if (!canTakeSite(state, seat, site)) throw new IllegalMoveError("Rallying the dial tile wouldn't change who controls it")
  rallySite(state, seat, site)
}

function addressDialTile(state: GameState, seat: Seat): void {
  const tile = dialTile(state)
  const issue = tileIssue(tile)
  adjustPosition(state, seat, issue, 1)
  flipTile(tile)
  logEvent(state, seat, `${seatName(seat)} addresses ${issue}: up on ${issue}, and the tile flips to ${tileIssue(tile)}.`)
}

function shiftTracks(state: GameState, seat: Seat, up: Issue, down: Issue): void {
  if (!areAdjacentIssues(up, down)) throw new IllegalMoveError('Shift between two neighbouring issues')
  if (getPosition(state, seat, down) <= TRACK_MIN) throw new IllegalMoveError(`You can't go down on ${down}: it's at the bottom`)
  if (getPosition(state, seat, up) >= TRACK_MAX) throw new IllegalMoveError(`You can't go up on ${up}: it's at the top`)
  adjustPosition(state, seat, down, -1)
  adjustPosition(state, seat, up, 1)
  logEvent(state, seat, `${seatName(seat)} shifts: up on ${up}, down on ${down}.`)
}

function rallyAroundPawn(state: GameState, seat: Seat): void {
  if (pawnOf(state, seat).cell === HUB_CELL_KEY) throw new IllegalMoveError("Your pawn can't rally from the hub")
  const gains = rallyAroundGains(state, seat)
  if (gains.length === 0) throw new IllegalMoveError("Rallying around your pawn wouldn't change who controls anything")
  logEvent(state, seat, `${seatName(seat)} rallies around their pawn.`)
  for (const cell of gains) rallySite(state, seat, cellSite(cell))
}

/** Carries out a paid action. The points are already spent. */
export function performAction(state: GameState, move: ActionMove, seat: Seat): void {
  switch (move.type) {
    case 'turnDial':
      return turnDial(state, seat)
    case 'movePawn':
      return stepPawn(state, seat, move.to)
    case 'rallyDial':
      return rallyDialTile(state, seat)
    case 'address':
      return addressDialTile(state, seat)
    case 'shift':
      return shiftTracks(state, seat, move.up, move.down)
    case 'rallyAround':
      return rallyAroundPawn(state, seat)
  }
}

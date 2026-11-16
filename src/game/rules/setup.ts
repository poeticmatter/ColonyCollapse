import type { MatchSetup } from 'game-kit/turns'
import { HUB_CELL_KEY } from '../board/geometry'
import type { Issue } from '../board/palette'
import { DIAL_START_SLOT, RONDEL_SLOT_COUNT } from '../board/rondel'
import { TRACK_START } from '../board/track'
import { TILE_BLUEPRINTS } from '../data/tiles'
import { ACTION_POINTS_PER_TURN } from './constants'
import { refillRondel, startTurn } from './flow'
import { logEvent } from './log'
import { drawRandomIndex, shuffleInPlace } from './rng'
import type { GameState, Settings } from './types'
import { range, seatName } from './util'

function recordPerIssue<T>(valueFor: (issue: Issue) => T): Record<Issue, T> {
  return {
    Clay: valueFor('Clay'),
    Sage: valueFor('Sage'),
    Periwinkle: valueFor('Periwinkle'),
    Stone: valueFor('Stone'),
    Seafoam: valueFor('Seafoam'),
    Mauve: valueFor('Mauve'),
  }
}

export function createInitialState({ playerCount, seed }: MatchSetup<Settings>): GameState {
  const seats = range(playerCount)
  const state: GameState = {
    playerCount,
    round: 1,
    phase: 'playing',
    rng: seed,
    drawCount: 0,
    bag: TILE_BLUEPRINTS.map((blueprint) => ({ id: blueprint.id, faces: [...blueprint.faces], side: 0, disc: null })),
    rondel: range(RONDEL_SLOT_COUNT).map(() => null),
    dial: DIAL_START_SLOT,
    board: {},
    printedDiscs: recordPerIssue(() => null),
    pawns: seats.map((seat) => ({ id: seat, seat, cell: HUB_CELL_KEY, hasLeftHub: false })),
    track: recordPerIssue(() => seats.map(() => TRACK_START)),
    players: seats.map(() => ({ victoryPoints: 0 })),
    roundStarter: 0,
    turn: { seat: 0, actionPoints: ACTION_POINTS_PER_TURN },
    log: [],
  }
  shuffleInPlace(state, state.bag)
  refillRondel(state)
  const firstPlayer = drawRandomIndex(state, playerCount)
  state.roundStarter = firstPlayer
  startTurn(state, firstPlayer)
  logEvent(state, firstPlayer, `Round 1 begins with ${seatName(firstPlayer)}.`)
  return state
}

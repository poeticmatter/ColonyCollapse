import type { MatchSetup } from 'game-kit/turns'
import { ACTION_IDS, type ActionId, type ActionSide } from '../art/actions'
import { getPlayerColor, ISSUES, type Issue } from '../board/palette'
import { RONDEL_SLOT_COUNT } from '../board/rondel'
import { TRACK_START } from '../board/track'
import { cardById, CARDS } from '../data/cards'
import { TILE_BLUEPRINTS } from '../data/tiles'
import { HUB_CELL_KEY } from '../board/geometry'
import { beginProgramming, refillRondel } from './flow'
import { logEvent } from './log'
import { adjustPosition } from './positions'
import { drawRandomIndex, shuffleInPlace } from './rng'
import type { GameState, PlayerState, Settings } from './types'
import { range, seatName } from './util'

function basicTiles(): Record<ActionId, ActionSide> {
  return {
    address: 'basic',
    develop: 'basic',
    media: 'basic',
    leverage: 'basic',
    dance: 'basic',
    intern: 'basic',
    invest: 'basic',
  }
}

function newPlayer(): PlayerState {
  return { plan: null, tiles: basicTiles(), ongoing: [], victoryPoints: 0 }
}

function emptyBoardRecord<T>(value: T): Record<Issue, T> {
  return { Clay: value, Sage: value, Periwinkle: value, Stone: value, Seafoam: value, Mauve: value }
}

/** Six of the seven actions are assigned to the six issue tracks at random; the seventh is set aside. */
function assignTrackActions(state: GameState): void {
  const actions = [...ACTION_IDS]
  shuffleInPlace(state, actions)
  const trackActions = emptyBoardRecord<ActionId>(actions[0])
  ISSUES.forEach((issue, index) => {
    trackActions[issue] = actions[index]
  })
  state.trackAction = trackActions
  state.setAsideAction = actions[ISSUES.length]
}

/** Each player gets one seed card: up 1 on its first issue, down 1 on its second, then it is discarded. */
function dealSeedCards(state: GameState): void {
  for (let seat = 0; seat < state.playerCount; seat += 1) {
    const cardId = state.deck.shift()
    if (cardId === undefined) throw new Error('The deck has run out of seed cards')
    const [up, down] = cardById(cardId).issues
    adjustPosition(state, seat, up, 1)
    adjustPosition(state, seat, down, -1)
    state.discard.push(cardId)
    logEvent(state, seat, `${seatName(seat)} starts up on ${up} and down on ${down}.`)
  }
}

export function createInitialState({ playerCount, seed }: MatchSetup<Settings>): GameState {
  const seats = range(playerCount)
  const state: GameState = {
    playerCount,
    round: 1,
    phase: 'programming',
    startPlayer: 0,
    rng: seed,
    drawCount: 0,
    bag: TILE_BLUEPRINTS.map((blueprint) => ({ id: blueprint.id, faces: [...blueprint.faces], side: 0, disc: null })),
    rondel: range(RONDEL_SLOT_COUNT).map(() => null),
    rondelPawn: 0,
    board: {},
    printedDiscs: emptyBoardRecord(null),
    pawns: seats.map((seat) => ({ id: seat, seat, cell: HUB_CELL_KEY, hasLeftHub: false })),
    track: ISSUES.reduce(
      (track, issue) => ({ ...track, [issue]: seats.map(() => TRACK_START) }),
      emptyBoardRecord<number[]>([]),
    ),
    trackAction: emptyBoardRecord<ActionId>('address'),
    setAsideAction: 'address',
    players: seats.map(newPlayer),
    deck: CARDS.map((card) => card.id),
    discard: [],
    resolution: null,
    log: [],
  }
  shuffleInPlace(state, state.bag)
  refillRondel(state)
  assignTrackActions(state)
  shuffleInPlace(state, state.deck)
  dealSeedCards(state)
  state.startPlayer = drawRandomIndex(state, playerCount)
  beginProgramming(state)
  logEvent(state, state.startPlayer, `${getPlayerColor(state.startPlayer).name} is the start player. Round 1: choose your four actions.`)
  return state
}

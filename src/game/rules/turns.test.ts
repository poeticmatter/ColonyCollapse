import { describe, expect, it } from 'vitest'
import { getCellInfo, getDistrict, getNeighbourKeys, HUB_CELL_KEY, type CellKey } from '../board/geometry'
import { ACTION_POINTS_PER_TURN } from './constants'
import { colonyRules, legalMoves } from './index'
import { edit, play, rondelTile, scenario } from './testing/scenario'
import type { GameState, Move } from './types'

const CLAY_PRINTED = getDistrict('Clay').printedCell

function isLegal(state: GameState, move: Move): boolean {
  return legalMoves(state).some((legal) => JSON.stringify(legal) === JSON.stringify(move))
}

function withPawnAt(cell: CellKey, seat = 0) {
  return (draft: GameState) => {
    draft.pawns[seat] = { id: seat, seat, cell, hasLeftHub: cell !== HUB_CELL_KEY }
  }
}

describe('action points', () => {
  it('spends 1 point on a simple action', () => {
    expect(play(scenario(), { type: 'address' }).turn.actionPoints).toBe(ACTION_POINTS_PER_TURN - 1)
  })

  it('spends 3 points to rally around the pawn', () => {
    const state = play(scenario({ setup: withPawnAt(CLAY_PRINTED) }), { type: 'rallyAround' })
    expect(state.turn.actionPoints).toBe(ACTION_POINTS_PER_TURN - 3)
  })

  it('lets an action be bought again and again', () => {
    const state = play(scenario(), { type: 'address' }, { type: 'address' }, { type: 'address' })
    expect(state.turn.actionPoints).toBe(ACTION_POINTS_PER_TURN - 3)
  })

  it('refuses an action the player cannot afford', () => {
    const state = scenario({ setup: (draft) => { withPawnAt(CLAY_PRINTED)(draft); draft.turn.actionPoints = 2 } })
    expect(() => play(state, { type: 'rallyAround' })).toThrow('That costs 3 action points')
  })

  it('refuses a move from a player who is not on turn', () => {
    expect(() => colonyRules.applyMove(scenario(), { type: 'address' }, 1)).toThrow('It is not your turn')
  })
})

describe('ending a turn', () => {
  it('passes play clockwise and turns the dial one step', () => {
    const state = play(scenario(), { type: 'endTurn' })
    expect(state.turn).toEqual({ seat: 1, actionPoints: ACTION_POINTS_PER_TURN })
    expect(state.dial).toBe(1)
  })

  it('ends by itself once every point is spent', () => {
    const state = play(scenario(), ...Array<Move>(ACTION_POINTS_PER_TURN).fill({ type: 'address' }))
    expect(state.turn.seat).toBe(1)
    expect(state.dial).toBe(1)
  })

  it('ends the round when the end-of-turn step passes the mark, and the next player starts the next round', () => {
    const state = play(scenario({ seat: 2, setup: (draft) => { draft.dial = 5 } }), { type: 'endTurn' })
    expect(state.round).toBe(2)
    expect(state.dial).toBe(0)
    expect(state.turn).toEqual({ seat: 0, actionPoints: ACTION_POINTS_PER_TURN })
    expect(state.roundStarter).toBe(0)
  })

  it('makes a round one lap of the dial: six turns when nobody pays to turn it', () => {
    let state = scenario()
    for (let turn = 0; turn < 5; turn += 1) state = play(state, { type: 'endTurn' })
    expect(state.round).toBe(1)
    expect(play(state, { type: 'endTurn' }).round).toBe(2)
  })

  it('ends the game after round 5', () => {
    const state = play(scenario({ setup: (draft) => { draft.round = 5; draft.dial = 5 } }), { type: 'endTurn' })
    expect(state.phase).toBe('over')
    expect(colonyRules.activePlayers?.(state)).toEqual([])
  })
})

describe('turning the dial', () => {
  it('moves the dial one step without ending the turn', () => {
    const state = play(scenario(), { type: 'turnDial' })
    expect(state.dial).toBe(1)
    expect(state.turn).toEqual({ seat: 0, actionPoints: ACTION_POINTS_PER_TURN - 1 })
  })

  it('ends the turn at once when it passes the mark, with no end-of-turn step', () => {
    const state = play(scenario({ setup: (draft) => { draft.dial = 5 } }), { type: 'turnDial' })
    expect(state.round).toBe(2)
    expect(state.dial).toBe(0)
    expect(state.turn).toEqual({ seat: 1, actionPoints: ACTION_POINTS_PER_TURN })
  })

  it('is followed by the end-of-turn step when bought with the last point', () => {
    const state = play(scenario({ setup: (draft) => { draft.turn.actionPoints = 1 } }), { type: 'turnDial' })
    expect(state.dial).toBe(2)
    expect(state.turn.seat).toBe(1)
  })
})

describe('addressing the dial tile', () => {
  it('goes up 1 on the tile’s issue, then flips it', () => {
    const state = play(scenario(), { type: 'address' })
    expect(state.track.Clay[0]).toBe(1)
    expect(rondelTile(state, 0).side).toBe(1)
  })

  it('acts on whichever tile the dial points at', () => {
    const state = play(scenario(), { type: 'turnDial' }, { type: 'address' })
    expect(state.track.Sage[0]).toBe(1)
  })

  it('still flips the tile when the track is at the top', () => {
    const state = play(scenario({ setup: (draft) => { draft.track.Clay[0] = 4 } }), { type: 'address' })
    expect(state.track.Clay[0]).toBe(4)
    expect(rondelTile(state, 0).side).toBe(1)
  })
})

describe('rallying the dial tile', () => {
  it('places a disc on the dial tile', () => {
    expect(rondelTile(play(scenario(), { type: 'rallyDial' }), 0).disc).toBe(0)
  })

  it('takes a rival’s disc when higher on the issue', () => {
    const state = scenario({ setup: (draft) => { rondelTile(draft, 0).disc = 1; draft.track.Clay = [1, 0, 0] } })
    expect(rondelTile(play(state, { type: 'rallyDial' }), 0).disc).toBe(0)
  })

  it('cannot be bought when it would change nothing', () => {
    expect(isLegal(scenario({ setup: (draft) => { rondelTile(draft, 0).disc = 1 } }), { type: 'rallyDial' })).toBe(false)
    expect(isLegal(scenario({ setup: (draft) => { draft.track.Clay[0] = -1 } }), { type: 'rallyDial' })).toBe(false)
  })
})

describe('shifting between tracks', () => {
  it('goes up on one issue and down on a neighbour', () => {
    const state = play(scenario(), { type: 'shift', up: 'Sage', down: 'Clay' })
    expect(state.track.Sage[0]).toBe(1)
    expect(state.track.Clay[0]).toBe(-1)
  })

  it('refuses issues that are not neighbours, Clay and Mauve included', () => {
    expect(isLegal(scenario(), { type: 'shift', up: 'Stone', down: 'Clay' })).toBe(false)
    expect(isLegal(scenario(), { type: 'shift', up: 'Mauve', down: 'Clay' })).toBe(false)
  })

  it('refuses going down on a track at the bottom', () => {
    expect(isLegal(scenario({ setup: (draft) => { draft.track.Clay[0] = -2 } }), { type: 'shift', up: 'Sage', down: 'Clay' })).toBe(false)
  })

  it('refuses going up on a track at the top', () => {
    expect(isLegal(scenario({ setup: (draft) => { draft.track.Sage[0] = 4 } }), { type: 'shift', up: 'Sage', down: 'Clay' })).toBe(false)
  })
})

describe('moving the pawn', () => {
  it('steps from the hub to an adjacent hex', () => {
    const [to] = getNeighbourKeys(HUB_CELL_KEY)
    const state = play(scenario(), { type: 'movePawn', to })
    expect(state.pawns[0].cell).toBe(to)
    expect(state.pawns[0].hasLeftHub).toBe(true)
  })

  it('refuses a hex that is not adjacent', () => {
    const farCell = getDistrict('Clay').slotCells.find((cell) => !getNeighbourKeys(HUB_CELL_KEY).includes(cell))
    if (!farCell) throw new Error('Expected a slot away from the hub')
    expect(isLegal(scenario(), { type: 'movePawn', to: farCell })).toBe(false)
  })

  it('refuses a hex with another pawn on it', () => {
    expect(isLegal(scenario({ setup: withPawnAt(CLAY_PRINTED, 1) }), { type: 'movePawn', to: CLAY_PRINTED })).toBe(false)
  })

  it('never goes back into the hub', () => {
    expect(isLegal(scenario({ setup: withPawnAt(CLAY_PRINTED) }), { type: 'movePawn', to: HUB_CELL_KEY })).toBe(false)
  })
})

describe('rallying around the pawn', () => {
  it('rallies the pawn’s own hex and every adjacent hex', () => {
    const clay = getDistrict('Clay')
    const neighbour = clay.slotCells.find((cell) => getNeighbourKeys(CLAY_PRINTED).includes(cell))
    if (!neighbour) throw new Error('Expected a Clay slot next to the printed hex')
    const state = scenario({
      setup: (draft) => {
        withPawnAt(CLAY_PRINTED)(draft)
        draft.board[neighbour] = { id: 99, faces: ['Clay', 'Sage'], side: 0, disc: null }
      },
    })
    const after = play(state, { type: 'rallyAround' })
    expect(after.printedDiscs.Clay).toBe(0)
    expect(after.board[neighbour].disc).toBe(0)
  })

  it('cannot be bought from the hub', () => {
    expect(isLegal(scenario(), { type: 'rallyAround' })).toBe(false)
  })

  it('cannot be bought when it would change nothing', () => {
    const state = scenario({
      setup: (draft) => {
        withPawnAt(CLAY_PRINTED)(draft)
        for (const cell of [CLAY_PRINTED, ...getNeighbourKeys(CLAY_PRINTED)]) {
          const info = getCellInfo(cell)
          if (info.kind === 'printed') draft.printedDiscs[info.district] = 0
        }
      },
    })
    expect(isLegal(state, { type: 'rallyAround' })).toBe(false)
  })
})

describe('legalMoves', () => {
  it('always offers ending the turn while the game is on', () => {
    expect(legalMoves(scenario())).toContainEqual({ type: 'endTurn' })
  })

  it('offers nothing once the game is over', () => {
    expect(legalMoves(edit(scenario(), (draft) => { draft.phase = 'over' }))).toEqual([])
  })
})

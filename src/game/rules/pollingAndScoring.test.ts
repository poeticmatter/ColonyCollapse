import { describe, expect, it } from 'vitest'
import { getDistrict } from '../board/geometry'
import { ISSUES } from '../board/palette'
import { colonyRules, districtStandings, finalRanking } from './index'
import { runPolling } from './polling'
import { rallySite, type RallyOptions } from './rally'
import { decide, edit, reveal, scenario } from './testing/scenario'
import type { GameState, HexTile, Seat, SiteRef } from './types'

function tileOf(disc: Seat | null = null, id = 99): HexTile {
  return { id, faces: ['Mauve', 'Clay'], side: 0, disc }
}

function polled(state: GameState, mutate?: (draft: GameState) => void): GameState {
  return edit(state, (draft) => {
    mutate?.(draft)
    runPolling(draft)
  })
}

describe('placing tiles at polling', () => {
  it("puts a rondel tile on its district's slot for the round", () => {
    const state = polled(scenario())
    for (const issue of ISSUES) expect(state.board[getDistrict(issue).slotCells[0]]).toBeDefined()
    expect(state.rondel.every((tile) => tile === null)).toBe(true)
  })

  it('uses the slot for the current round', () => {
    const state = polled(scenario(), (draft) => { draft.round = 3 })
    expect(state.board[getDistrict('Clay').slotCells[2]]).toBeDefined()
  })

  it('moves on to the next higher free slot when the slot is taken', () => {
    const state = polled(scenario(), (draft) => { draft.board[getDistrict('Clay').slotCells[0]] = tileOf() })
    expect(state.board[getDistrict('Clay').slotCells[1]].id).not.toBe(99)
  })

  it('wraps around to the lowest slots when the highest is taken', () => {
    const clay = getDistrict('Clay')
    const state = polled(scenario(), (draft) => {
      draft.round = 5
      draft.board[clay.slotCells[4]] = tileOf()
    })
    expect(state.board[clay.slotCells[0]].id).not.toBe(99)
  })

  it('moves to the next district clockwise when the district is full', () => {
    const clay = getDistrict('Clay')
    const state = polled(scenario(), (draft) => {
      clay.slotCells.forEach((cell, index) => { draft.board[cell] = tileOf(null, 90 + index) })
    })
    const sage = getDistrict('Sage')
    const sageTiles = sage.slotCells.filter((cell) => state.board[cell])
    expect(sageTiles).toHaveLength(2)
  })
})

describe('discs for tiles entering play', () => {
  it('gives the tile to the unique leader on its issue', () => {
    const state = polled(scenario(), (draft) => { draft.track.Clay = [2, 1, 0] })
    expect(state.board[getDistrict('Clay').slotCells[0]].disc).toBe(0)
  })

  it('leaves the tile uncontrolled when the lead is tied', () => {
    const state = polled(scenario(), (draft) => { draft.track.Clay = [1, 1, 0] })
    expect(state.board[getDistrict('Clay').slotCells[0]].disc).toBeNull()
  })

  it('leaves the tile uncontrolled when everyone is below 0', () => {
    const state = polled(scenario(), (draft) => { draft.track.Clay = [-1, -2, -1] })
    expect(state.board[getDistrict('Clay').slotCells[0]].disc).toBeNull()
  })

  it('lets a leader on 0 take the tile', () => {
    const state = polled(scenario(), (draft) => { draft.track.Clay = [-1, 0, -2] })
    expect(state.board[getDistrict('Clay').slotCells[0]].disc).toBe(1)
  })

  it('keeps a disc a tile already carries from the rondel', () => {
    const state = polled(scenario(), (draft) => {
      draft.track.Clay = [3, 0, 0]
      if (draft.rondel[0]) draft.rondel[0].disc = 2
    })
    expect(state.board[getDistrict('Clay').slotCells[0]].disc).toBe(2)
  })
})

describe('district scoring', () => {
  const clay = getDistrict('Clay')

  function standingOfClay(state: GameState) {
    const standing = districtStandings(state).find((candidate) => candidate.issue === 'Clay')
    if (!standing) throw new Error('No Clay standing')
    return standing
  }

  it('goes to the player controlling the most hexes', () => {
    const state = scenario({
      setup: (draft) => {
        draft.board[clay.slotCells[0]] = tileOf(1, 91)
        draft.board[clay.slotCells[1]] = tileOf(1, 92)
        draft.printedDiscs.Clay = 0
      },
    })
    expect(standingOfClay(state).counts).toEqual([1, 2, 0])
    expect(standingOfClay(state).winner).toBe(1)
  })

  it('goes to the tied player who controls the printed hex', () => {
    const state = scenario({
      setup: (draft) => {
        draft.board[clay.slotCells[0]] = tileOf(1, 91)
        draft.printedDiscs.Clay = 0
      },
    })
    expect(standingOfClay(state).winner).toBe(0)
  })

  it('goes to nobody when the tied players do not control the printed hex', () => {
    const state = scenario({
      setup: (draft) => {
        draft.board[clay.slotCells[0]] = tileOf(1, 91)
        draft.board[clay.slotCells[1]] = tileOf(2, 92)
        draft.printedDiscs.Clay = null
      },
    })
    expect(standingOfClay(state).winner).toBeNull()
  })

  it('goes to nobody in an empty district', () => {
    expect(standingOfClay(scenario()).winner).toBeNull()
  })

  it('counts a pawn as control of a hex, disc or not', () => {
    const state = scenario({
      setup: (draft) => {
        draft.board[clay.slotCells[0]] = tileOf(1, 91)
        draft.pawns[0] = { id: 0, seat: 0, cell: clay.slotCells[0], hasLeftHub: true }
      },
    })
    expect(standingOfClay(state).counts).toEqual([1, 0, 0])
  })

  it('does not count a pawn on an empty slot', () => {
    const state = scenario({
      setup: (draft) => { draft.pawns[0] = { id: 0, seat: 0, cell: clay.slotCells[3], hasLeftHub: true } },
    })
    expect(standingOfClay(state).counts).toEqual([0, 0, 0])
  })

  it('awards the round number in victory points when polling', () => {
    const state = polled(scenario(), (draft) => {
      draft.round = 3
      draft.printedDiscs.Clay = 2
    })
    expect(state.players[2].victoryPoints).toBe(3)
  })
})

describe('final ranking', () => {
  it('ranks by victory points first', () => {
    const state = scenario({ setup: (draft) => { draft.players[1].victoryPoints = 7; draft.players[2].victoryPoints = 4 } })
    expect(finalRanking(state)).toEqual([1, 2, 0])
  })

  it('breaks a tie with the most control discs on the board', () => {
    const state = scenario({
      setup: (draft) => {
        draft.players.forEach((player) => { player.victoryPoints = 5 })
        draft.printedDiscs.Clay = 2
        draft.printedDiscs.Sage = 2
        draft.printedDiscs.Stone = 1
      },
    })
    expect(finalRanking(state)).toEqual([2, 1, 0])
  })

  it('breaks a remaining tie in favour of the earliest seat clockwise from the final start player', () => {
    const state = scenario({
      setup: (draft) => {
        draft.players.forEach((player) => { player.victoryPoints = 5 })
        draft.startPlayer = 1
      },
    })
    expect(finalRanking(state)).toEqual([1, 2, 0])
  })

  it('reports the winner and scores as the game outcome', () => {
    const state = edit(scenario(), (draft) => {
      draft.phase = 'over'
      draft.resolution = null
      draft.players[2].victoryPoints = 9
    })
    expect(colonyRules.outcome?.(state)).toEqual({ winners: [2], scores: [0, 0, 9] })
  })
})

describe('rally', () => {
  const site: SiteRef = { type: 'rondel', slot: 0 }
  const plain: RallyOptions = { canTie: false, countsAsFour: false }

  function discAfterRally(seat: Seat, setup: (draft: GameState) => void, options: RallyOptions = plain): Seat | null {
    const state = edit(scenario(), (draft) => {
      setup(draft)
      rallySite(draft, seat, site, options)
    })
    return state.rondel[0]?.disc ?? null
  }

  it('places a disc on an uncontrolled tile when on 0 or more', () => {
    expect(discAfterRally(0, () => undefined)).toBe(0)
  })

  it('does not place a disc when below 0', () => {
    expect(discAfterRally(0, (draft) => { draft.track.Clay[0] = -1 })).toBeNull()
  })

  it('replaces a disc when strictly higher than its owner', () => {
    const disc = discAfterRally(0, (draft) => {
      if (draft.rondel[0]) draft.rondel[0].disc = 1
      draft.track.Clay = [2, 1, 0]
    })
    expect(disc).toBe(0)
  })

  it('does not replace a disc when tied', () => {
    const disc = discAfterRally(0, (draft) => {
      if (draft.rondel[0]) draft.rondel[0].disc = 1
      draft.track.Clay = [1, 1, 0]
    })
    expect(disc).toBe(1)
  })

  it('replaces a disc when tied if ties are enough', () => {
    const disc = discAfterRally(
      0,
      (draft) => {
        if (draft.rondel[0]) draft.rondel[0].disc = 1
        draft.track.Clay = [1, 1, 0]
      },
      { canTie: true, countsAsFour: false },
    )
    expect(disc).toBe(0)
  })

  it('leaves the player own disc alone', () => {
    const disc = discAfterRally(0, (draft) => {
      if (draft.rondel[0]) draft.rondel[0].disc = 0
    })
    expect(disc).toBe(0)
  })

  it('compares with the disc owner and ignores a pawn standing on the hex', () => {
    const cell = getDistrict('Clay').slotCells[0]
    const state = edit(scenario(), (draft) => {
      draft.board[cell] = tileOf(1)
      draft.board[cell].faces = ['Clay', 'Mauve']
      draft.track.Clay = [0, 3, 0]
      draft.pawns[0] = { id: 0, seat: 0, cell, hasLeftHub: true }
      rallySite(draft, 0, { type: 'cell', cell }, plain)
    })
    expect(state.board[cell].disc).toBe(1)
  })
})

describe('round end', () => {
  it('plays on after slot 4 of round 1 with a fresh rondel', () => {
    const plan = ['address', 'develop', 'invest', 'intern'] as const
    let state = scenario({ playerCount: 2, slot: 4, plans: { 0: [...plan], 1: [...plan] } })
    state = decide(reveal(state), { kind: 'invest', transfer: null })
    state = decide(reveal(state), { kind: 'invest', transfer: null })
    expect(state.round).toBe(2)
    expect(state.bag).toHaveLength(18)
  })
})

import { IllegalMoveError } from 'game-kit/turns'
import { describe, expect, it } from 'vitest'
import type { AbilityId } from '../data/cards'
import { getCellInfo, getDistrict, getNeighbourKeys, HUB_CELL_KEY } from '../board/geometry'
import { currentTurn, effectiveController, holdsOngoing, pendingDecision, tileIssue } from './index'
import { cardIdOf, decide, expectPending, planWith, reveal, rondelTile, scenario } from './testing/scenario'
import type { GameState, HexTile } from './types'

const CLAY_PRINTED = getDistrict('Clay').printedCell
const SLOT_NEXT_TO_CLAY_PRINTED = getNeighbourKeys(CLAY_PRINTED).filter((cell) => getCellInfo(cell).kind === 'slot')[0]

function tileOf(issue: HexTile['faces'][0], disc: HexTile['disc'] = null): HexTile {
  return { id: 99, faces: [issue, 'Mauve'], side: 0, disc }
}

/** Seat 0 reveals Leverage in slot 1, keeps the top card and plays its effect. */
function playViaLeverage(ability: AbilityId, setup?: (draft: GameState) => void, ongoing?: AbilityId[]): GameState {
  const start = scenario({
    topCard: ability,
    plans: { 0: planWith(1, 'leverage'), 1: planWith(1, 'intern'), 2: planWith(1, 'intern') },
    ongoing: ongoing ? { 0: ongoing } : {},
    setup,
  })
  return decide(reveal(start), { kind: 'leveragePick', cardId: cardIdOf(ability), playEffect: true, up: null })
}

describe('Immediate cards', () => {
  it('Comb Overturn flips the chosen rondel tiles, ignoring the Media lock', () => {
    const state = playViaLeverage('combOverturn', (draft) => { draft.resolution?.mediaLocked.push(draft.rondel[2]?.id ?? 0) })
    const flipped = decide(state, { kind: 'combOverturn', slots: [2, 3] })
    expect(tileIssue(rondelTile(flipped, 2))).toBe('Stone')
    expect(tileIssue(rondelTile(flipped, 3))).toBe('Seafoam')
  })

  it('Long Flight moves a pawn anywhere free except the hub, then rallies a neighbour', () => {
    const state = playViaLeverage('longFlight', (draft) => {
      draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = tileOf('Stone')
      draft.pawns.push({ id: 50, seat: 1, cell: getDistrict('Sage').printedCell, hasLeftHub: true })
    })
    const pending = expectPending(state, 'longFlight')
    expect(pending.pawns[0].destinations).not.toContain(HUB_CELL_KEY)
    expect(pending.pawns[0].destinations).not.toContain(getDistrict('Sage').printedCell)
    const landed = decide(state, { kind: 'longFlight', pawnId: 0, to: CLAY_PRINTED })
    expect(expectPending(landed, 'longFlightRally').options).toContain(SLOT_NEXT_TO_CLAY_PRINTED)
    const done = decide(landed, { kind: 'longFlightRally', cell: SLOT_NEXT_TO_CLAY_PRINTED })
    expect(done.board[SLOT_NEXT_TO_CLAY_PRINTED].disc).toBe(0)
    expect(done.pawns[0].cell).toBe(CLAY_PRINTED)
  })

  it('Dissident Rally takes a tile from a stronger rival', () => {
    const state = playViaLeverage('dissidentRally', (draft) => {
      draft.rondel[1] = { ...rondelTile(draft, 1), disc: 1 }
      draft.track.Sage = [-2, 4, 0]
    })
    const done = decide(state, { kind: 'dissidentRally', site: { type: 'rondel', slot: 1 } })
    expect(rondelTile(done, 1).disc).toBe(0)
  })

  it('Speaker\'s Favor changes the order from the next slot', () => {
    const state = decide(playViaLeverage('speakersFavor'), { kind: 'speakersFavor', to: 1 })
    expect(state.startPlayer).toBe(1)
    expect(currentTurn(state).order).toEqual([0, 1, 2])
  })

  it('Ward Sweep rallies every hex of one district', () => {
    const slotCell = getDistrict('Clay').slotCells[0]
    const state = playViaLeverage('wardSweep', (draft) => { draft.board[slotCell] = tileOf('Stone') })
    const done = decide(state, { kind: 'wardSweep', district: 'Clay' })
    expect(done.printedDiscs.Clay).toBe(0)
    expect(done.board[slotCell].disc).toBe(0)
    expect(done.printedDiscs.Sage).toBeNull()
  })

  it('Blueprint Revision can upgrade the set-aside action tile', () => {
    const state = playViaLeverage('blueprintRevision')
    expect(expectPending(state, 'blueprintRevision').options).toContain('intern')
    const done = decide(state, { kind: 'blueprintRevision', action: 'intern' })
    expect(done.players[0].tiles.intern).toBe('upgraded')
  })

  it('Reserve Deployment resolves an unprogrammed tile at strength 3', () => {
    const state = playViaLeverage('reserveDeployment')
    const pending = expectPending(state, 'reserveDeployment')
    expect(pending.options.sort()).toEqual(['dance', 'intern', 'invest'])
    const deployed = decide(state, { kind: 'reserveDeployment', action: 'invest' })
    expect(expectPending(deployed, 'invest').maxAmount).toBe(3)
  })

  it('Forced Realignment hands the second decision to the player pushed down', () => {
    const state = playViaLeverage('forcedRealignment')
    const down = decide(state, { kind: 'forcedDown', target: 2, issue: 'Sage' })
    const pending = expectPending(down, 'forcedUp')
    expect(pending.actor).toBe(2)
    expect(pending.options).not.toContain('Sage')
    expect(down.track.Sage[2]).toBe(-1)
    const done = decide(down, { kind: 'forcedUp', issue: 'Stone' })
    expect(done.track.Stone[2]).toBe(1)
    expect(currentTurn(done).turnSeat).toBe(1)
  })

  it('Forced Realignment rejects the same issue for going up', () => {
    const down = decide(playViaLeverage('forcedRealignment'), { kind: 'forcedDown', target: 1, issue: 'Sage' })
    expect(() => decide(down, { kind: 'forcedUp', issue: 'Sage' })).toThrow(IllegalMoveError)
  })

  it('Second Dancer adds a second pawn to the hub', () => {
    const state = playViaLeverage('secondDancer')
    expect(state.pawns.filter((pawn) => pawn.seat === 0 && pawn.cell === HUB_CELL_KEY)).toHaveLength(2)
  })

  it('lets Dance move either of two pawns', () => {
    const start = scenario({
      plans: { 0: planWith(1, 'dance') },
      setup: (draft) => { draft.pawns.push({ id: 50, seat: 0, cell: HUB_CELL_KEY, hasLeftHub: false }) },
    })
    expect(expectPending(reveal(start), 'dance').pawns.map((pawn) => pawn.pawnId)).toEqual([0, 50])
  })

  it('Echoing Decree resolves an Immediate effect twice, then is discarded', () => {
    const state = playViaLeverage('combOverturn', undefined, ['echoingDecree'])
    const first = decide(state, { kind: 'combOverturn', slots: [0] })
    expect(pendingDecision(first)?.kind).toBe('combOverturn')
    const second = decide(first, { kind: 'combOverturn', slots: [0] })
    expect(tileIssue(rondelTile(second, 0))).toBe('Clay')
    expect(holdsOngoing(second, 0, 'echoingDecree')).toBe(false)
  })
})

describe('Ongoing cards', () => {
  it('Deferred Gavel lets the start player pass the marker at the end of their action', () => {
    const start = scenario({ plans: { 0: planWith(1, 'intern') }, ongoing: { 0: ['deferredGavel'] } })
    const offered = reveal(start)
    expect(expectPending(offered, 'gavelPass').to).toBe(1)
    const passed = decide(offered, { kind: 'gavelPass', pass: true })
    expect(passed.startPlayer).toBe(1)
    expect(currentTurn(passed).order).toEqual([0, 1, 2])
  })

  it('Deferred Gavel is not offered to a player without the marker', () => {
    const start = scenario({ plans: { 1: planWith(1, 'intern') }, ongoing: { 1: ['deferredGavel'] } })
    const afterFirst = decide(reveal(start), { kind: 'invest', transfer: null })
    expect(pendingDecision(reveal(afterFirst))).toBeNull()
  })

  it('Waggle Sweep lets one rallied hex count as being on 4', () => {
    const start = scenario({
      plans: { 0: planWith(1, 'dance') },
      ongoing: { 0: ['waggleSweep'] },
      setup: (draft) => {
        draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = tileOf('Stone', 1)
        draft.track.Stone = [-2, 3, 0]
      },
    })
    const landed = decide(reveal(start), { kind: 'dance', pawnId: 0, to: CLAY_PRINTED })
    const done = decide(landed, { kind: 'waggleSweep', cell: SLOT_NEXT_TO_CLAY_PRINTED })
    expect(done.board[SLOT_NEXT_TO_CLAY_PRINTED].disc).toBe(0)
  })

  it('Swift Withdrawal keeps a disc counting for its owner against an opponent pawn', () => {
    const state = scenario({
      ongoing: { 1: ['swiftWithdrawal'] },
      setup: (draft) => {
        draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = tileOf('Stone', 1)
        draft.pawns[0] = { id: 0, seat: 0, cell: SLOT_NEXT_TO_CLAY_PRINTED, hasLeftHub: true }
      },
    })
    expect(effectiveController(state, SLOT_NEXT_TO_CLAY_PRINTED)).toBe(1)
  })

  it('without Swift Withdrawal an opponent pawn takes control of a disc hex', () => {
    const state = scenario({
      setup: (draft) => {
        draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = tileOf('Stone', 1)
        draft.pawns[0] = { id: 0, seat: 0, cell: SLOT_NEXT_TO_CLAY_PRINTED, hasLeftHub: true }
      },
    })
    expect(effectiveController(state, SLOT_NEXT_TO_CLAY_PRINTED)).toBe(0)
  })
})

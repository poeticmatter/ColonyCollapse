import { IllegalMoveError } from 'game-kit/turns'
import { describe, expect, it } from 'vitest'
import { getCellInfo, getDistrict, getNeighbourKeys, HUB_CELL_KEY } from '../board/geometry'
import { cardById } from '../data/cards'
import { currentTurn } from './index'
import { cardIdOf, decide, expectPending, planWith, reveal, scenario } from './testing/scenario'
import type { HexTile } from './types'

const CLAY_PRINTED = getDistrict('Clay').printedCell
const SLOT_NEXT_TO_CLAY_PRINTED = getNeighbourKeys(CLAY_PRINTED).filter((cell) => getCellInfo(cell).kind === 'slot')[0]

function boardTile(issue: HexTile['faces'][0], disc: HexTile['disc'] = null): HexTile {
  return { id: 99, faces: [issue, 'Mauve'], side: 0, disc }
}

const dancePlans = { 0: planWith(1, 'dance') }

describe('Dance', () => {
  it('moves a pawn one step and rallies the landing hex and its neighbours', () => {
    const start = scenario({
      plans: dancePlans,
      setup: (draft) => { draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = boardTile('Stone') },
    })
    const pending = expectPending(reveal(start), 'dance')
    const destination = pending.pawns[0].destinations.find((candidate) => candidate.cell === CLAY_PRINTED)
    expect(destination?.rallies).toContain(SLOT_NEXT_TO_CLAY_PRINTED)
    expect(destination?.rallies).not.toContain(HUB_CELL_KEY)

    const state = decide(reveal(start), { kind: 'dance', pawnId: pending.pawns[0].pawnId, to: CLAY_PRINTED })
    expect(state.printedDiscs.Clay).toBe(0)
    expect(state.board[SLOT_NEXT_TO_CLAY_PRINTED].disc).toBe(0)
  })

  it('moves at most as many steps as the slot strength', () => {
    const pending = expectPending(reveal(scenario({ plans: dancePlans })), 'dance')
    expect(pending.pawns[0].destinations.every((destination) => destination.steps === 1)).toBe(true)
    const farCell = getDistrict('Clay').slotCells[4]
    expect(() => decide(reveal(scenario({ plans: dancePlans })), { kind: 'dance', pawnId: 0, to: farCell })).toThrow(IllegalMoveError)
  })

  it('never lands on a hex with another pawn', () => {
    const start = scenario({
      plans: dancePlans,
      setup: (draft) => { draft.pawns.push({ id: 50, seat: 1, cell: CLAY_PRINTED, hasLeftHub: true }) },
    })
    const cells = expectPending(reveal(start), 'dance').pawns[0].destinations.map((destination) => destination.cell)
    expect(cells).not.toContain(CLAY_PRINTED)
  })

  it('cannot pass through a hex with another pawn', () => {
    const blockers = getNeighbourKeys(HUB_CELL_KEY).map((cell, index) => ({ id: 50 + index, seat: 1, cell, hasLeftHub: true }))
    const start = scenario({ slot: 2, plans: { 0: planWith(2, 'dance') }, setup: (draft) => { draft.pawns.push(...blockers) } })
    // Every neighbour of the hub is blocked, so the dance has nowhere to go and is skipped.
    expect(currentTurn(reveal(start)).turnSeat).toBe(1)
  })

  it('never goes back into the hub once the pawn has left it', () => {
    const start = scenario({
      plans: dancePlans,
      setup: (draft) => { draft.pawns[0] = { id: 0, seat: 0, cell: CLAY_PRINTED, hasLeftHub: true } },
    })
    const cells = expectPending(reveal(start), 'dance').pawns[0].destinations.map((destination) => destination.cell)
    expect(cells).not.toContain(HUB_CELL_KEY)
  })

  describe('against another disc', () => {
    const rivalTile = (): HexTile => boardTile('Stone', 1)
    const tiedPositions = (draft: { track: Record<string, number[]> }) => {
      draft.track.Stone = [1, 1, 0]
    }

    it('is not enough to be tied when standard', () => {
      const start = scenario({
        plans: dancePlans,
        setup: (draft) => { tiedPositions(draft); draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = rivalTile() },
      })
      const state = decide(reveal(start), { kind: 'dance', pawnId: 0, to: CLAY_PRINTED })
      expect(state.board[SLOT_NEXT_TO_CLAY_PRINTED].disc).toBe(1)
    })

    it('is enough to be tied when upgraded', () => {
      const start = scenario({
        plans: dancePlans,
        setup: (draft) => {
          tiedPositions(draft)
          draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = rivalTile()
          draft.players[0].tiles.dance = 'upgraded'
        },
      })
      const state = decide(reveal(start), { kind: 'dance', pawnId: 0, to: CLAY_PRINTED })
      expect(state.board[SLOT_NEXT_TO_CLAY_PRINTED].disc).toBe(0)
    })

    it('needs to be strictly higher when standard', () => {
      const start = scenario({
        plans: dancePlans,
        setup: (draft) => {
          draft.track.Stone = [2, 1, 0]
          draft.board[SLOT_NEXT_TO_CLAY_PRINTED] = rivalTile()
        },
      })
      const state = decide(reveal(start), { kind: 'dance', pawnId: 0, to: CLAY_PRINTED })
      expect(state.board[SLOT_NEXT_TO_CLAY_PRINTED].disc).toBe(0)
    })
  })
})

describe('Leverage', () => {
  const leveragePlans = { 0: planWith(3, 'leverage') }

  it('draws as many cards as the slot strength', () => {
    const pending = expectPending(reveal(scenario({ slot: 3, plans: leveragePlans })), 'leveragePick')
    expect(pending.cardIds).toHaveLength(3)
  })

  it('keeps one card to go up on one of its issues and discards the rest', () => {
    const start = scenario({ slot: 3, plans: leveragePlans })
    const pending = expectPending(reveal(start), 'leveragePick')
    const [keptId] = pending.cardIds
    const [issue] = cardById(keptId).issues
    const state = decide(reveal(start), { kind: 'leveragePick', cardId: keptId, playEffect: false, up: issue })
    expect(state.track[issue][0]).toBe(1)
    expect(state.discard.sort()).toEqual([...pending.cardIds].sort())
  })

  it('does not allow both effect and up when standard', () => {
    const start = scenario({ slot: 3, plans: leveragePlans })
    const [cardId] = expectPending(reveal(start), 'leveragePick').cardIds
    const [issue] = cardById(cardId).issues
    expect(() => decide(reveal(start), { kind: 'leveragePick', cardId, playEffect: true, up: issue })).toThrow(IllegalMoveError)
  })

  it('allows both effect and up when upgraded', () => {
    const start = scenario({
      slot: 3,
      plans: leveragePlans,
      topCard: 'sitePrep',
      setup: (draft) => { draft.players[0].tiles.leverage = 'upgraded' },
    })
    const cardId = cardIdOf('sitePrep')
    const [issue] = cardById(cardId).issues
    const state = decide(reveal(start), { kind: 'leveragePick', cardId, playEffect: true, up: issue })
    expect(state.players[0].ongoing).toContain(cardId)
    expect(state.track[issue][0]).toBe(1)
  })

  it('puts an Ongoing card in front of the player when its effect is chosen', () => {
    const start = scenario({ plans: { 0: planWith(1, 'leverage') }, topCard: 'extraHands' })
    const cardId = cardIdOf('extraHands')
    const state = decide(reveal(start), { kind: 'leveragePick', cardId, playEffect: true, up: null })
    expect(state.players[0].ongoing).toEqual([cardId])
    expect(state.discard).not.toContain(cardId)
  })

  it('reshuffles the discard pile into the deck when the deck runs out', () => {
    const start = scenario({
      slot: 3,
      plans: leveragePlans,
      setup: (draft) => {
        draft.discard = draft.deck.slice(1)
        draft.deck = draft.deck.slice(0, 1)
      },
    })
    const pending = expectPending(reveal(start), 'leveragePick')
    expect(pending.cardIds).toHaveLength(3)
  })

  it('lets Policy Trade swap the positions on the card issues instead of going up', () => {
    const start = scenario({
      plans: { 0: planWith(1, 'leverage') },
      topCard: 'sitePrep',
      ongoing: { 0: ['policyTrade'] },
      setup: (draft) => {
        const [first, second] = cardById(cardIdOf('sitePrep')).issues
        draft.track[first][0] = 2
        draft.track[second][0] = -1
      },
    })
    const cardId = cardIdOf('sitePrep')
    const [first, second] = cardById(cardId).issues
    const state = decide(reveal(start), { kind: 'leveragePick', cardId, playEffect: false, up: 'swap' })
    expect(state.track[first][0]).toBe(-1)
    expect(state.track[second][0]).toBe(2)
  })
})

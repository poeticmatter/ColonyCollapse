import { describe, expect, it } from 'vitest'
import { getDistrict } from '../board/geometry'
import { colonyRules, legalMoves, tileIssue } from '../rules'
import { getLeader } from '../rules/positions'
import { playBotGame } from '../rules/testing/bot'
import { rondelTile, scenario } from '../rules/testing/scenario'
import { chooseBotMove } from './index'
import { bestTurn } from './search'

describe('chooseBotMove', () => {
  it('always chooses a legal move', () => {
    const state = scenario()
    expect(legalMoves(state)).toContainEqual(chooseBotMove(state, 0))
  })

  it('chooses the same move for the same state', () => {
    const state = scenario({ seat: 1 })
    expect(chooseBotMove(structuredClone(state), 1)).toEqual(bestTurn(state)[0])
  })

  it('refuses to move for a seat that is not on turn', () => {
    expect(() => chooseBotMove(scenario(), 2)).toThrow('seat 0 is on turn')
  })

  it('secures the uncontested dial tile, by disc or by leading its issue at polling', () => {
    const start = scenario()
    const end = bestTurn(start).reduce((state, move) => colonyRules.applyMove(state, move, 0), start)
    const tile = rondelTile(end, 0)
    expect(tile.disc === 0 || getLeader(end, tileIssue(tile)) === 0).toBe(true)
  })

  it('takes back a disc a rival holds when it can outrank them', () => {
    const state = scenario({
      setup: (draft) => {
        const cell = getDistrict('Clay').slotCells[0]
        draft.board[cell] = { id: 99, faces: ['Clay', 'Sage'], side: 0, disc: 1 }
        draft.track.Clay = [1, 0, 0]
        draft.pawns[0] = { id: 0, seat: 0, cell: getDistrict('Clay').printedCell, hasLeftHub: true }
        rondelTile(draft, 0).disc = 0
      },
    })
    expect(bestTurn(state)).toContainEqual({ type: 'rallyAround' })
  })

  it('plays a whole game against itself', () => {
    const { state } = playBotGame(3, 5, (current) => chooseBotMove(current, current.turn.seat))
    expect(state.phase).toBe('over')
    expect(colonyRules.outcome?.(state).winners).toHaveLength(1)
  }, 60_000)
})

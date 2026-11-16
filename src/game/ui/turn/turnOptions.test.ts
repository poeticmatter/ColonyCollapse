import { describe, expect, it } from 'vitest'
import { getDistrict, getNeighbourKeys, HUB_CELL_KEY } from '../../board/geometry'
import { scenario } from '../../rules/testing/scenario'
import { turnOptions } from './turnOptions'

describe('turnOptions', () => {
  it('offers the dial actions and every step out of the hub at the start of a turn', () => {
    const options = turnOptions(scenario())
    expect([...options.canBuy]).toEqual(expect.arrayContaining(['rallyDial', 'address', 'turnDial']))
    expect(options.canBuy.has('rallyAround')).toBe(false)
    expect(options.pawnSteps.sort()).toEqual(getNeighbourKeys(HUB_CELL_KEY).sort())
  })

  it('groups shifts by the issue that goes up', () => {
    const { shiftsByUp } = turnOptions(scenario())
    expect(shiftsByUp.get('Clay')).toEqual(['Sage'])
    expect(shiftsByUp.get('Sage')).toEqual(['Clay', 'Periwinkle'])
  })

  it('lists the hexes rallying around the pawn would take', () => {
    const printed = getDistrict('Clay').printedCell
    const state = scenario({ setup: (draft) => { draft.pawns[0] = { id: 0, seat: 0, cell: printed, hasLeftHub: true } } })
    expect(turnOptions(state).rallyGains).toContain(printed)
  })
})

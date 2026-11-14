import { describe, expect, it } from 'vitest'
import { getCellInfo } from '../../board/geometry'
import { currentTurn } from '../../rules'
import { decide, expectPending, planWith, reveal, scenario } from '../../rules/testing/scenario'
import { decisionKey, districtCells, rondelMovesByDestination, splitSites, toggleWithLimit } from './helpers'

describe('splitSites', () => {
  it('separates rondel slots from board cells', () => {
    const { cells, slots } = splitSites([
      { type: 'rondel', slot: 2 },
      { type: 'cell', cell: '1,-1' },
    ])
    expect([...slots]).toEqual([2])
    expect([...cells]).toEqual(['1,-1'])
  })
})

describe('toggleWithLimit', () => {
  it('adds a slot until the limit is reached', () => {
    expect(toggleWithLimit([1], 3, 2)).toEqual([1, 3])
    expect(toggleWithLimit([1, 3], 4, 2)).toEqual([1, 3])
  })

  it('removes a slot that is picked again', () => {
    expect(toggleWithLimit([1, 3], 1, 2)).toEqual([3])
  })

  it('replaces the pick when only one may be chosen', () => {
    expect(toggleWithLimit([1], 3, 1)).toEqual([3])
  })
})

describe('rondelMovesByDestination', () => {
  it('maps each stopping slot to the move that gets there', () => {
    const state = reveal(scenario({ slot: 3, plans: { 0: planWith(3, 'address') } }))
    const pending = expectPending(state, 'rondelMove')
    const byDestination = rondelMovesByDestination(pending.options)
    expect(byDestination.get(1)?.steps).toBe(1)
    expect(byDestination.get(3)?.steps).toBe(3)
  })
})

describe('districtCells', () => {
  it('lists the printed hex and five slots of a district', () => {
    const cells = districtCells('Sage')
    expect(cells).toHaveLength(6)
    expect(cells.every((cell) => getCellInfo(cell).district === 'Sage')).toBe(true)
  })
})

describe('decisionKey', () => {
  it('changes when the same kind of decision comes up again', () => {
    const first = reveal(scenario({ slot: 2, plans: { 0: planWith(2, 'address'), 1: planWith(2, 'address') } }))
    const pendingFirst = expectPending(first, 'rondelMove')
    const key = decisionKey(first, pendingFirst)
    expect(decisionKey(first, pendingFirst)).toBe(key)
    const after = decide(first, { kind: 'rondelMove', steps: 1 })
    expect(currentTurn(after).turnSeat).toBe(1)
    const second = reveal(after)
    const pendingSecond = expectPending(second, 'rondelMove')
    expect(decisionKey(second, pendingSecond)).not.toBe(key)
  })
})

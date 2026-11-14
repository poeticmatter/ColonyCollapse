import { describe, expect, it } from 'vitest'
import {
  BOARD_CELLS,
  CELL_INFO,
  DISTRICTS,
  HUB_CELL_KEY,
  ROUNDS,
  getNeighbourKeys,
  getSlotCell,
  hexDistanceFromHub,
  parseCellKey,
} from './geometry'
import { ISSUES } from './palette'

describe('board geometry', () => {
  it('has 37 cells: the hub plus three rings', () => {
    expect(BOARD_CELLS).toHaveLength(37)
  })

  it('has one district per issue, in ring order', () => {
    expect(DISTRICTS.map((district) => district.issue)).toEqual([...ISSUES])
  })

  it('gives each district one printed cell in the centre ring and five slots', () => {
    for (const district of DISTRICTS) {
      expect(hexDistanceFromHub(parseCellKey(district.printedCell))).toBe(1)
      expect(district.slotCells).toHaveLength(5)
    }
  })

  it('numbers each district\'s slots with the rounds 1 to 5 exactly once', () => {
    for (const district of DISTRICTS) {
      const rounds = district.slotCells.map((key) => {
        const info = CELL_INFO.get(key)
        return info?.kind === 'slot' ? info.round : undefined
      })
      expect(rounds).toEqual([...ROUNDS])
    }
  })

  it('numbers middle-ring slots before outer-ring slots', () => {
    for (const district of DISTRICTS) {
      const rings = district.slotCells.map((key) => hexDistanceFromHub(parseCellKey(key)))
      expect(rings).toEqual([...rings].sort((a, b) => a - b))
    }
  })

  it('puts every cell except the hub in exactly one district', () => {
    const claims = new Map<string, number>()
    for (const district of DISTRICTS) {
      for (const key of [district.printedCell, ...district.slotCells]) claims.set(key, (claims.get(key) ?? 0) + 1)
    }
    expect(claims.has(HUB_CELL_KEY)).toBe(false)
    expect(claims.size).toBe(36)
    expect([...claims.values()].every((count) => count === 1)).toBe(true)
  })

  it('looks up every cell, with the hub being the only one outside a district', () => {
    expect(CELL_INFO.size).toBe(37)
    expect(CELL_INFO.get(HUB_CELL_KEY)).toEqual({ kind: 'hub', district: null })
    expect(CELL_INFO.get(DISTRICTS[0]?.printedCell ?? '')).toEqual({ kind: 'printed', district: 'Clay' })
  })

  it('finds the slot for a district and round', () => {
    for (const district of DISTRICTS) {
      expect(getSlotCell(district.issue, 3)).toBe(district.slotCells[2])
    }
  })

  it('has symmetric neighbours', () => {
    for (const cell of BOARD_CELLS) {
      for (const neighbourKey of getNeighbourKeys(cell.key)) {
        expect(getNeighbourKeys(neighbourKey)).toContain(cell.key)
      }
    }
  })

  it('gives the hub six neighbours and a rim cell fewer', () => {
    expect(getNeighbourKeys(HUB_CELL_KEY)).toHaveLength(6)
    expect(getNeighbourKeys('3,-3')).toHaveLength(3)
  })
})

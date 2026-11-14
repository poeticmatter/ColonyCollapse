import { getDistrict, type CellKey } from '../../board/geometry'
import type { Issue } from '../../board/palette'
import type { PendingDecision, RondelMoveOption } from '../../rules/decisions'
import type { GameState, SiteRef } from '../../rules/types'

/** Splits board and rondel sites into the cells and rondel slots to highlight. */
export function splitSites(sites: readonly SiteRef[]): { cells: Set<CellKey>; slots: Set<number> } {
  const cells = new Set<CellKey>()
  const slots = new Set<number>()
  for (const site of sites) {
    if (site.type === 'rondel') slots.add(site.slot)
    else cells.add(site.cell)
  }
  return { cells, slots }
}

/** The rondel pawn's options keyed by the slot each would stop on. */
export function rondelMovesByDestination(options: readonly RondelMoveOption[]): Map<number, RondelMoveOption> {
  return new Map(options.map((option) => [option.destination, option]))
}

/**
 * Adds or removes `slot` from a pick of at most `limit`. With a limit of one, picking another
 * slot replaces the first; with more, a full pick ignores new slots until one is dropped.
 */
export function toggleWithLimit(selected: readonly number[], slot: number, limit: number): number[] {
  if (selected.includes(slot)) return selected.filter((entry) => entry !== slot)
  if (limit === 1) return [slot]
  return selected.length < limit ? [...selected, slot] : [...selected]
}

/** Every hex of a district: its printed hex and its five slots. */
export function districtCells(issue: Issue): CellKey[] {
  const district = getDistrict(issue)
  return [district.printedCell, ...district.slotCells]
}

/**
 * Identifies one decision so a panel's own pick (a chosen pawn, a half-made selection) is
 * dropped whenever the game moves on, even to another decision of the same kind.
 */
export function decisionKey(state: GameState, pending: PendingDecision): string {
  const lastEntry = state.log.at(-1)
  return [state.round, state.resolution?.slot, state.resolution?.orderIndex, state.log.length, lastEntry?.text, JSON.stringify(pending)].join('|')
}

import { getCellInfo, getDistrict, getNeighbourKeys, type CellKey } from '../board/geometry'
import { ISSUES, type Issue } from '../board/palette'
import type { GameState, HexTile, Seat, SiteRef } from './types'

export interface SiteView {
  issue: Issue
  disc: Seat | null
}

export function tileIssue(tile: HexTile): Issue {
  return tile.faces[tile.side]
}

export function flipTile(tile: HexTile): void {
  tile.side = tile.side === 0 ? 1 : 0
}

function tileAt(state: GameState, site: SiteRef): HexTile | null {
  if (site.type === 'rondel') return state.rondel[site.slot] ?? null
  return state.board[site.cell] ?? null
}

/** What can be rallied at `site`: a tile or a printed hex. Null for the hub and empty slots. */
export function readSite(state: GameState, site: SiteRef): SiteView | null {
  if (site.type === 'cell') {
    const info = getCellInfo(site.cell)
    if (info.kind === 'hub') return null
    if (info.kind === 'printed') return { issue: info.district, disc: state.printedDiscs[info.district] }
  }
  const tile = tileAt(state, site)
  return tile ? { issue: tileIssue(tile), disc: tile.disc } : null
}

export function setSiteDisc(state: GameState, site: SiteRef, seat: Seat): void {
  if (site.type === 'cell') {
    const info = getCellInfo(site.cell)
    if (info.kind === 'printed') {
      state.printedDiscs[info.district] = seat
      return
    }
  }
  const tile = tileAt(state, site)
  if (!tile) throw new Error('No tile to put a disc on')
  tile.disc = seat
}

export function cellSite(cell: CellKey): SiteRef {
  return { type: 'cell', cell }
}

export function rondelSite(slot: number): SiteRef {
  return { type: 'rondel', slot }
}

export function isSameSite(first: SiteRef, second: SiteRef): boolean {
  if (first.type === 'rondel') return second.type === 'rondel' && first.slot === second.slot
  return second.type === 'cell' && first.cell === second.cell
}

/** The cells of a district that hold something to rally: its printed hex, then each filled slot. */
export function districtSites(state: GameState, issue: Issue): SiteRef[] {
  const district = getDistrict(issue)
  return [district.printedCell, ...district.slotCells].map(cellSite).filter((site) => readSite(state, site) !== null)
}

/** Every tile in play, rondel first, then the board district by district. */
export function allTileSites(state: GameState): SiteRef[] {
  const rondelSites = state.rondel.flatMap((tile, slot) => (tile ? [rondelSite(slot)] : []))
  const boardSites = ISSUES.flatMap((issue) =>
    getDistrict(issue)
      .slotCells.filter((cell) => state.board[cell])
      .map(cellSite),
  )
  return [...rondelSites, ...boardSites]
}

/** The cell itself and its neighbours, where something can be rallied. */
export function rallyTargetsAround(state: GameState, cell: CellKey): CellKey[] {
  return [cell, ...getNeighbourKeys(cell)].filter((candidate) => readSite(state, cellSite(candidate)) !== null)
}

export function describeSite(state: GameState, site: SiteRef): string {
  const view = readSite(state, site)
  if (!view) return 'an empty hex'
  const isPrinted = site.type === 'cell' && getCellInfo(site.cell).kind === 'printed'
  return isPrinted ? `the ${view.issue} printed hex` : `a ${view.issue} tile`
}

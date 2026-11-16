import { getCellInfo, getNeighbourKeys, type CellKey } from '../board/geometry'
import type { Issue } from '../board/palette'
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

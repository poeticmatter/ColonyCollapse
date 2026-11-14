import { getCellInfo, getDistrict, type CellKey } from '../board/geometry'
import { ISSUES } from '../board/palette'
import { RONDEL_SLOT_COUNT } from '../board/rondel'
import { logEvent } from './log'
import { getLeader } from './positions'
import { districtStandings } from './scoring'
import { tileIssue } from './sites'
import type { GameState } from './types'
import { seatName } from './util'

/**
 * The slot a rondel tile lands on: its own district's slot for this round, else the next
 * higher-numbered free slot (wrapping), else the same search in the next district clockwise.
 */
function findFreeSlot(state: GameState, rondelSlot: number): CellKey {
  const roundIndex = state.round - 1
  for (let districtOffset = 0; districtOffset < ISSUES.length; districtOffset += 1) {
    const { slotCells } = getDistrict(ISSUES[(rondelSlot + districtOffset) % ISSUES.length])
    for (let slotOffset = 0; slotOffset < slotCells.length; slotOffset += 1) {
      const cell = slotCells[(roundIndex + slotOffset) % slotCells.length]
      if (!state.board[cell]) return cell
    }
  }
  throw new Error('The board has no free slot left')
}

function placeRondelTiles(state: GameState): CellKey[] {
  const placedCells: CellKey[] = []
  for (let slot = 0; slot < RONDEL_SLOT_COUNT; slot += 1) {
    const tile = state.rondel[slot]
    if (!tile) continue
    const cell = findFreeSlot(state, slot)
    state.board[cell] = tile
    state.rondel[slot] = null
    placedCells.push(cell)
    logEvent(state, null, `A ${tileIssue(tile)} tile is placed in the ${getCellInfo(cell).district} district.`)
  }
  return placedCells
}

/** A tile entering play with no disc takes one from the unique leader on its issue, if that leader is on 0 or more. */
function giveEnteringTilesDiscs(state: GameState, cells: readonly CellKey[]): void {
  for (const cell of cells) {
    const tile = state.board[cell]
    if (tile.disc !== null) continue
    const leader = getLeader(state, tileIssue(tile))
    if (leader === null) continue
    tile.disc = leader
    logEvent(state, leader, `${seatName(leader)} leads on ${tileIssue(tile)} and takes the new tile.`)
  }
}

function awardDistricts(state: GameState): void {
  for (const standing of districtStandings(state)) {
    if (standing.winner === null) continue
    state.players[standing.winner].victoryPoints += state.round
    logEvent(state, standing.winner, `${seatName(standing.winner)} wins the ${standing.issue} district: ${state.round} VP.`)
  }
}

/** End of a round: place the rondel's tiles, give new tiles their discs, then score the districts. */
export function runPolling(state: GameState): void {
  giveEnteringTilesDiscs(state, placeRondelTiles(state))
  awardDistricts(state)
}

import { describe, expect, it } from 'vitest'
import { edit, newGame } from '../rules/testing/scenario'
import { rankingRows, tiebreakNote } from './gameOver'

const nameOf = (seat: number) => ['Ann', 'Bo', 'Cy'][seat]

describe('final ranking', () => {
  it('orders seats by victory points', () => {
    const state = edit(newGame(3), (draft) => {
      draft.players[0].victoryPoints = 4
      draft.players[1].victoryPoints = 9
      draft.players[2].victoryPoints = 6
    })
    const rows = rankingRows(state)
    expect(rows.map((row) => row.seat)).toEqual([1, 2, 0])
    expect(rows.map((row) => row.place)).toEqual([1, 2, 3])
    expect(tiebreakNote(rows, nameOf)).toBeNull()
  })

  it('explains a tie on VP decided by discs on the board', () => {
    const state = edit(newGame(3), (draft) => {
      for (const player of draft.players) player.victoryPoints = 5
      draft.printedDiscs.Clay = 2
      draft.printedDiscs.Sage = 2
      draft.printedDiscs.Stone = 0
    })
    const rows = rankingRows(state)
    expect(rows[0]).toMatchObject({ seat: 2, discs: 2 })
    expect(tiebreakNote(rows, nameOf)).toContain('Cy and Ann tied on VP; Cy wins on control discs')
  })

  it('explains a tie that only seat order can break', () => {
    const state = edit(newGame(3), (draft) => {
      for (const player of draft.players) player.victoryPoints = 5
      draft.roundStarter = 1
    })
    expect(tiebreakNote(rankingRows(state), nameOf)).toContain('Bo wins by sitting earlier')
  })
})

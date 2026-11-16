import { describe, expect, it } from 'vitest'
import { pickFirst, playBotGame, randomPlayer } from '../rules/testing/bot'
import { play, scenario } from '../rules/testing/scenario'
import { statusPrompt } from './status'

const nameOf = (seat: number) => ['Red', 'Blue', 'Green'][seat]

describe('statusPrompt', () => {
  it('tells the player on turn how many points they have left', () => {
    expect(statusPrompt(play(scenario(), { type: 'address' }), 0, nameOf)).toBe('Your turn: 4 action points left')
  })

  it('tells everyone else whose turn it is', () => {
    expect(statusPrompt(scenario(), 1, nameOf)).toBe("Red's turn: 5 action points left")
    expect(statusPrompt(scenario(), 'spectator', nameOf)).toBe("Red's turn: 5 action points left")
  })

  it('uses the singular for one point', () => {
    const state = scenario({ setup: (draft) => { draft.turn.actionPoints = 1 } })
    expect(statusPrompt(state, 0, nameOf)).toBe('Your turn: 1 action point left')
  })

  it('names the winner when the game is over', () => {
    const { state } = playBotGame(3, 1, randomPlayer(pickFirst))
    expect(statusPrompt(state, 0, (seat) => `Seat ${seat}`)).toMatch(/^Game over — Seat \d wins$/)
  })
})

import { describe, expect, it } from 'vitest'
import { playBotGame, pickFirst } from '../rules/testing/bot'
import { cardIdOf, decide, expectPending, newGame, planWith, reveal, scenario, send } from '../rules/testing/scenario'
import { statusPrompt } from './status'

const nameOf = (seat: number) => ['Red', 'Blue', 'Green'][seat]

describe('statusPrompt', () => {
  it('asks a player who has not programmed to program', () => {
    expect(statusPrompt(newGame(3), 1, nameOf)).toBe('Program your 4 actions')
  })

  it('tells a player whose plan is sent who is still programming', () => {
    const state = send(newGame(3), { type: 'program', plan: planWith(1, 'address') }, 0)
    expect(statusPrompt(state, 0, nameOf)).toBe('Plan sent. Waiting for Blue and Green to program')
  })

  it('tells a spectator who is still programming', () => {
    const state = send(newGame(3), { type: 'program', plan: planWith(1, 'address') }, 0)
    expect(statusPrompt(state, 'spectator', nameOf)).toBe('Waiting for Blue and Green to program')
  })

  it('tells the player on turn to reveal, naming their own tile', () => {
    const state = scenario({ slot: 2, plans: { 0: planWith(2, 'develop') } })
    expect(statusPrompt(state, 0, nameOf)).toBe('Your action: reveal slot 2 (Develop, strength 2)')
  })

  it('does not name the tile of the player on turn to anyone else', () => {
    const state = scenario({ slot: 2, plans: { 0: planWith(2, 'develop') } })
    expect(statusPrompt(state, 1, nameOf)).toBe('Waiting for Red to reveal slot 2')
    expect(statusPrompt(state, 'spectator', nameOf)).toBe('Waiting for Red to reveal slot 2')
  })

  it('tells the deciding player what to decide and everyone else who is deciding', () => {
    const state = reveal(scenario({ slot: 2, plans: { 0: planWith(2, 'dance') } }))
    expectPending(state, 'dance')
    expect(statusPrompt(state, 0, nameOf)).toBe('Your decision: Choose a Dance destination')
    expect(statusPrompt(state, 2, nameOf)).toBe('Red is choosing a Dance destination')
  })

  it('names the pushed player as the one deciding after Forced Realignment', () => {
    const state = scenario({ slot: 2, plans: { 0: planWith(2, 'leverage') }, topCard: 'forcedRealignment' })
    const afterPick = decide(reveal(state), {
      kind: 'leveragePick',
      cardId: cardIdOf('forcedRealignment'),
      playEffect: true,
      up: null,
    })
    const afterDown = decide(afterPick, { kind: 'forcedDown', target: 1, issue: 'Clay' })
    expectPending(afterDown, 'forcedUp')
    expect(statusPrompt(afterDown, 0, nameOf)).toBe('Blue is choosing an issue to go up on (Forced Realignment)')
  })

  it('names the winner when the game is over', () => {
    const { state } = playBotGame(3, 1, pickFirst)
    expect(statusPrompt(state, 0, (seat) => `Seat ${seat}`)).toMatch(/^Game over — Seat \d wins$/)
  })
})

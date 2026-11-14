import type { BoardProps, UserRole } from 'game-kit/turns'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ColonyBoard } from '../Board'
import { ABILITIES, cardById } from '../data/cards'
import { colonyRules, pendingDecision } from '../rules'
import type { DecisionKind } from '../rules/decisions'
import type { GameState, Move } from '../rules'
import { pickFirst, playBotGame } from '../rules/testing/bot'
import type { ActionId } from '../art/actions'
import { cardIdOf, edit, expectPending, newGame, planWith, reveal, scenario, send } from '../rules/testing/scenario'
import { DECISION_LABELS } from './decisions/labels'

const NAMES = ['Ann', 'Bo', 'Cy']

function render(state: GameState, role: UserRole): string {
  const props: BoardProps<GameState, Move> = {
    state,
    role,
    players: NAMES.slice(0, state.playerCount).map((name) => ({ name })),
    onMove: () => undefined,
    seating: 'remote',
    lookOf: (seat) => seat,
  }
  return renderToString(<ColonyBoard {...props} />)
}

/** Seat 0 has revealed `action` in `slot` and the game waits on the decision it opens. */
function decisionState(action: ActionId, slot: 1 | 2 | 3 | 4 = 2): GameState {
  return reveal(scenario({ slot, plans: { 0: planWith(slot, action) } }))
}

describe('programming', () => {
  it('shows a player who has not programmed the programming controls', () => {
    const html = render(newGame(3), 1)
    expect(html).toContain('Program your 4 actions')
    expect(html).toContain('Choose 4 more')
  })

  it('shows a spectator only who is being waited for', () => {
    const html = render(newGame(3), 'spectator')
    expect(html).toContain('Waiting for Ann, Bo and Cy to program')
    expect(html).not.toContain('Choose 4 more')
  })

  it('shows a player whose plan is sent their plan, read only', () => {
    const state = send(newGame(3), { type: 'program', plan: planWith(1, 'address') }, 0)
    const html = render(state, 0)
    expect(html).toContain('Plan sent. Waiting for Bo and Cy to program')
    expect(html).not.toContain('Choose 4 more')
    expect(html).toContain('Slot 1')
  })

  it('lists the viewer first and marks them', () => {
    const html = render(newGame(3), 2)
    expect(html.indexOf('Cy')).toBeLessThan(html.indexOf('Ann'))
    expect(html).toContain('(you)')
  })
})

describe('hidden information', () => {
  it('draws the same screen for another player whatever plan a seat has sent', () => {
    const withPlan = (plan: ActionId[]) => send(newGame(3), { type: 'program', plan }, 0)
    const first = render(withPlan(planWith(1, 'address')), 1)
    const second = render(withPlan(planWith(3, 'invest')), 1)
    expect(first).toBe(second)
  })

  it('shows the owner the plan others cannot see', () => {
    const withPlan = (plan: ActionId[]) => send(newGame(3), { type: 'program', plan }, 0)
    expect(render(withPlan(planWith(1, 'address')), 0)).not.toBe(render(withPlan(planWith(3, 'invest')), 0))
  })

  it('shows a seat that has sent a plan as ready, with its slots face down', () => {
    const state = send(newGame(3), { type: 'program', plan: planWith(1, 'address') }, 0)
    const html = render(state, 1)
    expect(html).toContain('Ready')
    expect(html.match(/aria-label="Face down"/g)).toHaveLength(4)
  })

  it('shows the drawn Leverage cards to the player choosing and to nobody else', () => {
    const state = reveal(scenario({ slot: 3, plans: { 0: planWith(3, 'leverage') } }))
    const { cardIds } = expectPending(state, 'leveragePick')
    const titles = cardIds.map((cardId) => ABILITIES[cardById(cardId).ability].title)

    const actorHtml = render(state, 0)
    for (const title of titles) expect(actorHtml).toContain(title)

    const otherState = reveal(scenario({ slot: 3, plans: { 0: planWith(3, 'leverage') }, topCard: 'wardSweep' }))
    expect(expectPending(otherState, 'leveragePick').cardIds).not.toEqual(cardIds)
    expect(render(otherState, 1)).toBe(render(state, 1))
    expect(render(otherState, 'spectator')).toBe(render(state, 'spectator'))
  })

  it('does not tell another player which tiles a reserve deployment can use', () => {
    const state = scenario({ slot: 2, plans: { 0: planWith(2, 'leverage') }, topCard: 'reserveDeployment' })
    const afterPick = send(
      reveal(state),
      { type: 'decide', decision: { kind: 'leveragePick', cardId: cardIdOf('reserveDeployment'), playEffect: true, up: null } },
      0,
    )
    expectPending(afterPick, 'reserveDeployment')
    expect(render(afterPick, 0)).toContain('Deploy an unprogrammed tile')
    expect(render(afterPick, 1)).not.toContain('Deploy ')
  })
})

describe('resolution', () => {
  it('gives the player on turn a reveal button and others a waiting message', () => {
    const state = scenario({ slot: 2, plans: { 0: planWith(2, 'develop') } })
    expect(render(state, 0)).toContain('Reveal &amp; resolve')
    const others = render(state, 1)
    expect(others).not.toContain('Reveal &amp; resolve')
    expect(others).toContain('Waiting for Ann to reveal slot 2')
  })

  const decisionCases: [ActionId, DecisionKind][] = [
    ['address', 'rondelMove'],
    ['media', 'mediaFlip'],
    ['dance', 'dance'],
    ['invest', 'invest'],
    ['leverage', 'leveragePick'],
  ]

  it.each(decisionCases)('shows the %s decision (%s) with controls to the deciding player', (action, kind) => {
    const state = decisionState(action)
    expect(pendingDecision(state)?.kind).toBe(kind)
    const html = render(state, 0)
    expect(html).toContain(DECISION_LABELS[kind].forActor)
  })

  it.each(decisionCases)('shows the %s decision (%s) to others as a description only', (action, kind) => {
    const state = decisionState(action)
    const label = DECISION_LABELS[kind]
    for (const role of [1, 'spectator'] as const) {
      const html = render(state, role)
      expect(html).toContain(`Ann is ${label.forOthers}`)
      expect(html).not.toContain(`>${label.forActor}<`)
    }
  })

  it('asks the pushed player, not the one on turn, to answer Forced Realignment', () => {
    const state = scenario({ slot: 2, plans: { 0: planWith(2, 'leverage') }, topCard: 'forcedRealignment' })
    const pushed = send(
      send(reveal(state), { type: 'decide', decision: { kind: 'leveragePick', cardId: cardIdOf('forcedRealignment'), playEffect: true, up: null } }, 0),
      { type: 'decide', decision: { kind: 'forcedDown', target: 1, issue: 'Clay' } },
      0,
    )
    expect(colonyRules.activePlayer(pushed)).toBe(1)
    expect(render(pushed, 1)).toContain('Choose a different issue to go up on')
    expect(render(pushed, 0)).toContain('Bo is choosing an issue to go up on')
  })

  it('shows Media-locked rondel tiles', () => {
    const state = decisionState('media', 1)
    const flipped = send(state, { type: 'decide', decision: { kind: 'mediaFlip', slots: [0] } }, 0)
    const locked = edit(flipped, (draft) => {
      if (draft.resolution) draft.resolution.mediaLocked = [draft.rondel[0]?.id ?? -1]
    })
    expect(render(locked, 1)).toContain("Media can&#x27;t flip it again")
  })
})

describe('game over', () => {
  it('shows the final ranking and the winner', () => {
    const { state } = playBotGame(3, 2, pickFirst)
    const html = render(state, 0)
    expect(html).toContain('Final ranking')
    expect(html).toContain('wins')
    expect(html).not.toContain('Reveal &amp; resolve')
  })
})

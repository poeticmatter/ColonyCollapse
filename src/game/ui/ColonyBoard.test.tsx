import type { BoardProps, UserRole } from 'game-kit/turns'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ColonyBoard } from '../Board'
import type { GameState, Move } from '../rules'
import { pickFirst, playBotGame, randomPlayer } from '../rules/testing/bot'
import { scenario } from '../rules/testing/scenario'

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

describe('the player on turn', () => {
  it('gets the turn controls with every action and its cost', () => {
    const html = render(scenario(), 0)
    expect(html).toContain('Your turn')
    expect(html).toContain('Rally the dial tile')
    expect(html).toContain('Address: up on')
    expect(html).toContain('Shift: up 1 on one issue')
    expect(html).toContain('Rally around your pawn (not from the hub)')
    expect(html).toContain('Turn the dial one step')
    expect(html).toContain('Stop here (5 unspent points are lost)')
  })

  it('is warned when turning the dial would pass the mark', () => {
    const html = render(scenario({ setup: (draft) => { draft.dial = 5 } }), 0)
    expect(html).toContain('Turn the dial past the mark: ends your turn and the round')
  })

  it('sees how many hexes rallying around their pawn would take', () => {
    const state = scenario({ setup: (draft) => { draft.pawns[0] = { id: 0, seat: 0, cell: '1,-1', hasLeftHub: true } } })
    expect(render(state, 0)).toMatch(/Rally around your pawn: takes \d+ (hex|hexes) \(dashed\)/)
  })
})

describe('everyone else', () => {
  it('sees whose turn it is and no controls', () => {
    for (const role of [1, 'spectator'] as const) {
      const html = render(scenario(), role)
      expect(html).toContain('Ann&#x27;s turn: 5 action points left')
      expect(html).not.toContain('Rally the dial tile')
    }
  })

  it('lists the viewer first and marks them', () => {
    const html = render(scenario(), 2)
    const playersPanel = html.slice(html.indexOf('>Players<'))
    expect(playersPanel.indexOf('Cy')).toBeLessThan(playersPanel.indexOf('Ann'))
    expect(playersPanel).toContain('(you)')
  })
})

describe('game over', () => {
  it('shows the final ranking and the winner', () => {
    const { state } = playBotGame(3, 2, randomPlayer(pickFirst))
    const html = render(state, 0)
    expect(html).toContain('Final ranking')
    expect(html).toContain('wins')
    expect(html).not.toContain('Your turn')
  })
})

import { describe, expect, it } from 'vitest'
import { newGame } from '../../rules/testing/scenario'
import { placePopover, POPOVER_WIDTH_PX } from './placement'
import { upgradeSourceText } from './upgradeSource'

const PHONE = { width: 375, height: 800 }

describe('help popover placement', () => {
  it('opens below a tile near the top of the screen', () => {
    expect(placePopover({ left: 20, top: 100, bottom: 160 }, PHONE).top).toBe(166)
  })

  it('opens above a tile near the bottom of the screen', () => {
    expect(placePopover({ left: 20, top: 700, bottom: 760 }, PHONE).bottom).toBe(106)
  })

  it('stays inside the right edge of the screen', () => {
    expect(placePopover({ left: 340, top: 100, bottom: 160 }, PHONE).left).toBe(PHONE.width - POPOVER_WIDTH_PX - 8)
  })

  it('stays inside the left edge of a screen narrower than the popover', () => {
    expect(placePopover({ left: 0, top: 100, bottom: 160 }, { width: 250, height: 800 }).left).toBe(8)
  })
})

describe('where an upgrade comes from', () => {
  const state = newGame(3)

  it('names the track that upgrades a track action', () => {
    const action = state.trackAction.Clay
    expect(upgradeSourceText(state, action)).toBe('Upgrades the first time you reach 3 on Clay.')
  })

  it('says only a card upgrades the set-aside action', () => {
    expect(upgradeSourceText(state, state.setAsideAction)).toMatch(/only a card/)
  })
})

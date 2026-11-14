import { describe, expect, it } from 'vitest'
import { cardById } from '../../data/cards'
import { cardIdOf } from '../../rules/testing/scenario'
import type { PendingOf } from '../../rules/tasks'
import { isLeverageChoiceValid, NO_LEVERAGE_CHOICE, pickCard, setPlayEffect, setUp, toLeverageDecision, upOptions } from './leverageChoice'

const POLICY_TRADE = cardIdOf('policyTrade')
const COMB_OVERTURN = cardIdOf('combOverturn')

function pending(overrides: Partial<PendingOf<'leveragePick'>> = {}): PendingOf<'leveragePick'> {
  return { kind: 'leveragePick', actor: 0, cardIds: [POLICY_TRADE, COMB_OVERTURN], canDoBoth: false, canSwap: false, ...overrides }
}

describe('leverage choice', () => {
  it('starts with the card played for its effect', () => {
    expect(isLeverageChoiceValid(pickCard(COMB_OVERTURN), pending())).toBe(true)
  })

  it('needs a card before it is valid', () => {
    expect(isLeverageChoiceValid(NO_LEVERAGE_CHOICE, pending())).toBe(false)
  })

  it('rejects a card that was not drawn', () => {
    expect(isLeverageChoiceValid(pickCard(cardIdOf('wardSweep')), pending())).toBe(false)
  })

  it('swaps the effect for going up when the upgrade is missing', () => {
    const [issue] = cardById(COMB_OVERTURN).issues
    const choice = setUp(pickCard(COMB_OVERTURN), issue, false)
    expect(choice).toMatchObject({ playEffect: false, up: issue })
    expect(isLeverageChoiceValid(choice, pending())).toBe(true)
  })

  it('turning the effect on again drops the going up when the upgrade is missing', () => {
    const [issue] = cardById(COMB_OVERTURN).issues
    const choice = setPlayEffect(setUp(pickCard(COMB_OVERTURN), issue, false), true, false)
    expect(choice).toMatchObject({ playEffect: true, up: null })
  })

  it('is invalid with neither the effect nor going up', () => {
    const choice = setPlayEffect(pickCard(COMB_OVERTURN), false, false)
    expect(isLeverageChoiceValid(choice, pending())).toBe(false)
  })

  it('allows both with upgraded Leverage', () => {
    const [issue] = cardById(COMB_OVERTURN).issues
    const choice = setUp(pickCard(COMB_OVERTURN), issue, true)
    expect(choice).toMatchObject({ playEffect: true, up: issue })
    expect(isLeverageChoiceValid(choice, pending({ canDoBoth: true }))).toBe(true)
  })

  it('offers a swap only with Policy Trade in front of the player, or the drawn one played with both allowed', () => {
    expect(upOptions(pickCard(POLICY_TRADE), pending())).not.toContain('swap')
    expect(upOptions(pickCard(POLICY_TRADE), pending({ canSwap: true }))).toContain('swap')
    expect(upOptions(pickCard(POLICY_TRADE), pending({ canDoBoth: true }))).toContain('swap')
  })

  it('rejects a swap that is not available', () => {
    const choice = setUp(pickCard(COMB_OVERTURN), 'swap', false)
    expect(isLeverageChoiceValid(choice, pending())).toBe(false)
  })

  it('builds the decision the rules expect', () => {
    expect(toLeverageDecision(pickCard(COMB_OVERTURN))).toEqual({
      kind: 'leveragePick',
      cardId: COMB_OVERTURN,
      playEffect: true,
      up: null,
    })
    expect(toLeverageDecision(NO_LEVERAGE_CHOICE)).toBeNull()
  })
})

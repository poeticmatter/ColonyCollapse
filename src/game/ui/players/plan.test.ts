import { describe, expect, it } from 'vitest'
import { clearSlot, EMPTY_PLAN_DRAFT, placeInNextEmptySlot, toggleAction, toPlan } from './plan'

describe('plan drafting', () => {
  it('fills the next empty slot with a picked action', () => {
    const draft = placeInNextEmptySlot(placeInNextEmptySlot(EMPTY_PLAN_DRAFT, 'media'), 'dance')
    expect(draft).toEqual(['media', 'dance', null, null])
  })

  it('refills a slot that was cleared before moving on to later slots', () => {
    const cleared = clearSlot(['media', 'dance', 'invest', null], 1)
    expect(placeInNextEmptySlot(cleared, 'intern')).toEqual(['media', 'intern', 'invest', null])
  })

  it('ignores an action that is already in the draft', () => {
    const draft = ['media', null, null, null] as const
    expect(placeInNextEmptySlot(draft, 'media')).toBe(draft)
  })

  it('ignores a pick once every slot is filled', () => {
    const draft = ['media', 'dance', 'invest', 'intern'] as const
    expect(placeInNextEmptySlot(draft, 'address')).toBe(draft)
  })

  it('takes a placed action back out when it is picked again', () => {
    expect(toggleAction(['media', 'dance', null, null], 'media')).toEqual([null, 'dance', null, null])
  })

  it('gives a plan only when all four slots are filled', () => {
    expect(toPlan(['media', 'dance', 'invest', null])).toBeNull()
    expect(toPlan(['media', 'dance', 'invest', 'intern'])).toEqual(['media', 'dance', 'invest', 'intern'])
  })
})

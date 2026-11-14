import { describe, expect, it } from 'vitest'
import { previewInvest } from './investPreview'

describe('previewInvest', () => {
  it('moves the same amount down and up', () => {
    expect(previewInvest(2, 0, 2)).toEqual({ down: 2, up: 2, fromAfter: 0, toAfter: 2 })
  })

  it('stops the first track at the bottom and rises only as far as it fell', () => {
    expect(previewInvest(-1, 1, 3)).toEqual({ down: 1, up: 1, fromAfter: -2, toAfter: 2 })
  })

  it('stops the second track at the top', () => {
    expect(previewInvest(3, 3, 3)).toMatchObject({ down: 3, up: 1, toAfter: 4 })
  })
})

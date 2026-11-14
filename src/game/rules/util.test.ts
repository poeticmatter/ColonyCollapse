import { describe, expect, it } from 'vitest'
import { seatName, splitLogText } from './util'

describe('log text', () => {
  it('splits seat tokens from the text around them', () => {
    expect(splitLogText(`${seatName(2)} rallies ${seatName(0)}.`)).toEqual([
      { kind: 'seat', seat: 2 },
      { kind: 'text', text: ' rallies ' },
      { kind: 'seat', seat: 0 },
      { kind: 'text', text: '.' },
    ])
  })

  it('keeps text without seats whole', () => {
    expect(splitLogText('Round 2 begins.')).toEqual([{ kind: 'text', text: 'Round 2 begins.' }])
  })
})

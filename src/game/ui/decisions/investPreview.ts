import { clampToTrack, TRACK_MIN } from '../../board/track'

export interface InvestPreview {
  /** How far the first track really drops: it stops at the bottom. */
  down: number
  /** How far the second track rises: only as far as the first dropped, and it stops at the top. */
  up: number
  fromAfter: number
  toAfter: number
}

/** What an Invest of `amount` does from positions `fromPosition` and `toPosition`. */
export function previewInvest(fromPosition: number, toPosition: number, amount: number): InvestPreview {
  const fromAfter = Math.max(TRACK_MIN, fromPosition - amount)
  const down = fromPosition - fromAfter
  const toAfter = clampToTrack(toPosition + down)
  return { down, up: toAfter - toPosition, fromAfter, toAfter }
}

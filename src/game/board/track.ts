/** Issue track layout constants. Every issue has one track, shared by all players. */

export const TRACK_MIN = -2
export const TRACK_MAX = 4
export const TRACK_START = 0

/** Lowest to highest. */
export const TRACK_SPACES: readonly number[] = Array.from(
  { length: TRACK_MAX - TRACK_MIN + 1 },
  (_, index) => TRACK_MIN + index,
)

/** Spaces below the start sit in the red zone. */
export function isRedZoneSpace(space: number): boolean {
  return space < TRACK_START
}

export function clampToTrack(position: number): number {
  return Math.min(TRACK_MAX, Math.max(TRACK_MIN, position))
}

/** A true minus sign, not a hyphen, so negative numbers read clearly. */
export function formatTrackSpace(space: number): string {
  return space < 0 ? `−${Math.abs(space)}` : String(space)
}

/** Where a help popover goes: fixed coordinates next to its tile, kept inside the screen. */
export interface PopoverPlacement {
  left: number
  /** Set when the popover opens below the tile. */
  top?: number
  /** Set when it opens above, measured from the bottom of the screen. */
  bottom?: number
  maxHeight: number
}

interface Box {
  left: number
  top: number
  bottom: number
}

interface Viewport {
  width: number
  height: number
}

export const POPOVER_WIDTH_PX = 272
const GAP_PX = 6
const SCREEN_MARGIN_PX = 8

/**
 * Below the tile, unless there is more room above it; the popover scrolls if even the roomier
 * side is too short. Left-aligned with the tile, but never past either edge of the screen.
 */
export function placePopover(tile: Box, viewport: Viewport): PopoverPlacement {
  const width = Math.min(POPOVER_WIDTH_PX, viewport.width - 2 * SCREEN_MARGIN_PX)
  const left = Math.max(SCREEN_MARGIN_PX, Math.min(tile.left, viewport.width - width - SCREEN_MARGIN_PX))
  const roomBelow = viewport.height - tile.bottom - GAP_PX - SCREEN_MARGIN_PX
  const roomAbove = tile.top - GAP_PX - SCREEN_MARGIN_PX
  if (roomBelow >= roomAbove) return { left, top: tile.bottom + GAP_PX, maxHeight: roomBelow }
  return { left, bottom: viewport.height - tile.top + GAP_PX, maxHeight: roomAbove }
}

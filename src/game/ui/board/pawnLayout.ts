import type { Point } from '../../board/geometry'

const HUB_RING_RADIUS = 34
/** A pawn on a tile sits off-centre so the control disc stays visible. */
const PAWN_OFFSET_ON_TILE: Point = { x: 30, y: -26 }

/** Where each of `count` pawns sits within its cell, relative to the cell's centre. */
export function pawnOffsets(count: number, isHub: boolean): Point[] {
  if (!isHub) return Array.from({ length: count }, () => PAWN_OFFSET_ON_TILE)
  if (count === 1) return [{ x: 0, y: 0 }]
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2
    return { x: HUB_RING_RADIUS * Math.cos(angle), y: HUB_RING_RADIUS * Math.sin(angle) }
  })
}

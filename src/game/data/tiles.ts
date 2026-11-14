import { ISSUES, type Issue } from '../board/palette'

export interface TileBlueprint {
  /** Unique within the bag, 1..30. */
  id: number
  /** The two colour faces; the face up is the tile's issue. */
  faces: [Issue, Issue]
}

const COPIES_PER_PAIR = 2

/** The 30 hex tiles: two copies of each of the 15 colour pairs. */
export const TILE_BLUEPRINTS: readonly TileBlueprint[] = ISSUES.flatMap((first, firstIndex) =>
  ISSUES.slice(firstIndex + 1).flatMap((second) =>
    Array.from({ length: COPIES_PER_PAIR }, (): [Issue, Issue] => [first, second]),
  ),
).map((faces, index) => ({ id: index + 1, faces }))

import { HexTileFace } from '../../art/HexTileFace'
import type { HexTile } from '../../rules/types'

/** A tile showing its current colour, with the reverse colour as the small badge. */
export function TileFace({ tile, size }: { tile: HexTile; size: number }) {
  return <HexTileFace face={tile.faces[tile.side]} back={tile.faces[tile.side === 0 ? 1 : 0]} size={size} />
}

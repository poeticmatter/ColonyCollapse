import type { PlayerColor } from '../board/palette'
import { BeeMark } from './BeeMark'
import { CenteredGlyph, DISC_GLYPH_SIZE, DiscToken } from './DiscToken'

interface PlayerDiscProps {
  color: PlayerColor
  size?: number
}

/** A control disc: a player's marker on a tile, the bee mark in their colour. */
export function PlayerDisc({ color, size = 64 }: PlayerDiscProps) {
  return (
    <DiscToken fill={color.fill} deep={color.deep} size={size} label={`${color.name} control disc`}>
      <CenteredGlyph>
        {/* The stripes read as the player colour showing through the ink-coloured body. */}
        <BeeMark size={DISC_GLYPH_SIZE} bodyColor={color.ink} stripeColor={color.fill} />
      </CenteredGlyph>
    </DiscToken>
  )
}

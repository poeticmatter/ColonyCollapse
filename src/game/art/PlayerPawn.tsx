import type { PlayerColor } from '../board/palette'
import { BeeMark } from './BeeMark'
import { CenteredGlyph, DISC_GLYPH_SIZE, DiscToken } from './DiscToken'

const PAWN_HALO_COLOR = '#F8F4EA'

interface PlayerPawnProps {
  color: PlayerColor
  size?: number
}

/**
 * A player's pawn. The prototype reuses the bee disc for pawns; the chalk halo
 * is added here so a pawn standing on a control disc of the same colour still reads as a separate piece.
 */
export function PlayerPawn({ color, size = 56 }: PlayerPawnProps) {
  return (
    <DiscToken fill={color.fill} deep={color.deep} size={size} haloColor={PAWN_HALO_COLOR} label={`${color.name} pawn`}>
      <CenteredGlyph>
        <BeeMark size={DISC_GLYPH_SIZE} bodyColor={color.ink} stripeColor={color.fill} />
      </CenteredGlyph>
    </DiscToken>
  )
}

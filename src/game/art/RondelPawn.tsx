import { PEWTER_DEEP, PEWTER_FILL, PEWTER_INK } from '../board/palette'
import { BeeMark } from './BeeMark'
import { CenteredGlyph, DISC_GLYPH_SIZE, DiscToken } from './DiscToken'

interface RondelPawnProps {
  size?: number
}

/** The shared pawn that moves around the tile rondel: a bee in pewter, since it belongs to no player. */
export function RondelPawn({ size = 56 }: RondelPawnProps) {
  return (
    <DiscToken fill={PEWTER_FILL} deep={PEWTER_DEEP} size={size} label="Rondel pawn">
      <CenteredGlyph>
        <BeeMark size={DISC_GLYPH_SIZE} bodyColor={PEWTER_INK} stripeColor={PEWTER_FILL} />
      </CenteredGlyph>
    </DiscToken>
  )
}
